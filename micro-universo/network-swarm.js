// network-swarm.js - P2P con Sincronización Gráfica Forzada

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;

const ROOM_NAME = "micro-universo-swarm-2026";

const peerConfig = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    },
    debug: 0
};

function calculatePeerColor(peerId) {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return new THREE.Color(`hsl(${hue}, 90%, 65%)`); // Colores más vivos y distinguibles
}

function updateUIStatus() {
    const totalUsers = isHost ? (connections.size + 1) : (state.remotePeers.size + 1);
    const statusText = document.getElementById('p2p-status-text');
    if (statusText) {
        statusText.innerText = `🟢 ${totalUsers} / 50 usuarios conectados`;
    } else {
        const counterEl = document.getElementById('swarm-counter');
        if (counterEl) counterEl.innerText = `🟢 ${totalUsers} / 50 usuarios conectados`;
    }
}

function showReconnectOverlay(show) {
    const overlay = document.getElementById('reconnect-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function initP2P() {
    if (!state.p2pEnabled) return;
    showReconnectOverlay(false);
    tryAutoConnect();
}

function tryAutoConnect() {
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    isHost = false;
    peer = new Peer(ROOM_NAME, peerConfig);

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log('👑 [HOST] Soy el servidor maestro:', id);
        showReconnectOverlay(false);
        updateUIStatus();
        triggerVisualUpdate();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            console.log('🌐 Sala ocupada. Conectando como cliente...');
            connectAsClientNow();
        } else {
            showReconnectOverlay(true);
            setTimeout(tryAutoConnect, 3000);
        }
    });

    peer.on('connection', (conn) => {
        setupHostConnection(conn);
    });
}

function connectAsClientNow() {
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    const clientId = 'client-' + Math.random().toString(36).substring(2, 8);
    state.peerId = clientId;

    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        console.log('🌐 [CLIENTE] Mi ID temporal:', clientId);
        const conn = peer.connect(ROOM_NAME, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        showReconnectOverlay(true);
        setTimeout(tryAutoConnect, 3000);
    });
}

function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        console.log('👤 [HOST] Cliente conectado:', conn.peer);
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        showReconnectOverlay(false);
        updateUIStatus();
        broadcastPeersList();
        triggerVisualUpdate();
    });

    conn.on('data', (data) => {
        if (data.type === 'REQUEST_SYNC') {
            broadcastPeersList();
        }
    });

    conn.on('close', () => {
        connections.delete(conn.peer);
        state.remotePeers.delete(conn.peer);
        updateUIStatus();
        broadcastPeersList();
        triggerVisualUpdate();
    });
}

function setupClientConnection(conn) {
    hostConnection = conn;

    conn.on('open', () => {
        console.log('🚀 [CLIENTE] Conectado al Host con éxito!');
        showReconnectOverlay(false);
        updateUIStatus();
        conn.send({ type: 'REQUEST_SYNC' });
    });

    conn.on('data', (data) => {
        if (data.type === 'PEERS_UPDATE') {
            console.log('📥 [CLIENTE] Lista de peers recibida:', data.peers);
            state.remotePeers.clear();
            data.peers.forEach(pId => {
                if (pId !== state.peerId) {
                    state.remotePeers.set(pId, { color: calculatePeerColor(pId) });
                }
            });
            showReconnectOverlay(false);
            updateUIStatus();
            triggerVisualUpdate();
        }
    });

    conn.on('close', () => {
        console.warn('⚠️ Conexión perdida con el servidor. Reconectando...');
        state.remotePeers.clear();
        showReconnectOverlay(true);
        updateUIStatus();
        setTimeout(tryAutoConnect, 3000);
    });
}

function broadcastPeersList() {
    if (!isHost) return;
    const peerIds = Array.from(connections.keys());
    peerIds.push(state.peerId);
    console.log('📤 [HOST] Difundiendo lista de peers:', peerIds);
    
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send({ type: 'PEERS_UPDATE', peers: peerIds });
        }
    });
}

// Función clave que fuerza al motor gráfico a redibujar los colores divididos
function triggerVisualUpdate() {
    if (typeof buildParticles === 'function') {
        buildParticles(); // Reconstruye o actualiza los buffers de Three.js
    } else if (typeof updateParticleColors === 'function') {
        updateParticleColors();
    }
}

// Función encargada de pintar el buffer de partículas en partes iguales según los peers
function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled || state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.keys());
    if (!peers.includes(state.peerId)) {
        peers.push(state.peerId);
    }
    peers.sort(); // Orden alfabético idéntico en todas las PCs

    const totalParties = peers.length;
    const chunkSize = Math.floor(totalCount / totalParties);

    peers.forEach((pId, index) => {
        const startIdx = index * chunkSize;
        const endIdx = (index === totalParties - 1) ? totalCount : startIdx + chunkSize;
        
        const c = (pId === state.peerId) 
            ? calculatePeerColor(state.peerId) 
            : (peerMap.get(pId)?.color || calculatePeerColor(pId));
        
        for (let i = startIdx; i < endIdx; i++) {
            colorsArray[i * 3]     = c.r;
            colorsArray[i * 3 + 1] = c.g;
            colorsArray[i * 3 + 2] = c.b;
        }
    });
}

window.initP2P = initP2P;
window.applySwarmColorsToBuffer = applySwarmColorsToBuffer;
window.calculatePeerColor = calculatePeerColor;
