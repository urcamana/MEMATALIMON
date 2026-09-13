// network-swarm.js - P2P Robusto con Auto-Recuperación y Control de Overlay

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;
const GLOBAL_ROOM_ID = "micro-universo-global-room-v2"; // Versión actualizada para evitar caché vieja del servidor

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
    return new THREE.Color(`hsl(${hue}, 85%, 60%)`);
}

function updateUIStatus() {
    const totalUsers = isHost ? (connections.size + 1) : (state.remotePeers.size + 1);
    const statusText = document.getElementById('p2p-status-text');
    if (statusText) {
        statusText.innerText = `🟢 ${totalUsers} / 50 usuarios conectados`;
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

    // Intentamos ser el Host de la sala global
    peer = new Peer(GLOBAL_ROOM_ID, peerConfig);

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log('👑 [HOST] Servidor activo:', id);
        showReconnectOverlay(false);
        updateUIStatus();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // Si el ID está ocupado, nos conectamos como clientes
            console.log('🌐 Sala ocupada. Conectando como cliente...');
            connectAsAutomaticClient();
        } else {
            console.warn('Aviso P2P Host:', err);
            showReconnectOverlay(true);
            setTimeout(tryAutoConnect, 4000);
        }
    });

    peer.on('connection', (conn) => {
        setupHostConnection(conn);
    });
}

function connectAsAutomaticClient() {
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    const clientId = 'client-' + Math.random().toString(36).substring(2, 8);
    state.peerId = clientId;

    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        console.log('🌐 [CLIENTE] Conectando al host global...');
        const conn = peer.connect(GLOBAL_ROOM_ID, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error como cliente:', err);
        showReconnectOverlay(true);
        setTimeout(tryAutoConnect, 4000);
    });
}

function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        console.log('👤 [HOST] Nuevo peer conectado:', conn.peer);
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        showReconnectOverlay(false);
        updateUIStatus();
        broadcastPeersList();
        if (typeof buildParticles === 'function') buildParticles();
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
        if (typeof buildParticles === 'function') buildParticles();
    });
}

function setupClientConnection(conn) {
    hostConnection = conn;

    conn.on('open', () => {
        console.log('🚀 [CLIENTE] ¡Conectado al servidor con éxito!');
        showReconnectOverlay(false);
        updateUIStatus();
        conn.send({ type: 'REQUEST_SYNC' });
    });

    conn.on('data', (data) => {
        if (data.type === 'PEERS_UPDATE') {
            state.remotePeers.clear();
            data.peers.forEach(pId => {
                if (pId !== state.peerId) {
                    state.remotePeers.set(pId, { color: calculatePeerColor(pId) });
                }
            });
            showReconnectOverlay(false);
            updateUIStatus();
            if (typeof buildParticles === 'function') buildParticles();
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
    
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send({ type: 'PEERS_UPDATE', peers: peerIds });
        }
    });
}

function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled || state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.keys());
    if (!peers.includes(state.peerId)) {
        peers.push(state.peerId);
    }
    peers.sort();

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
