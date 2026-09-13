// network-swarm.js - P2P Autónomo con Servidor de Respaldo y Cero Bloqueos

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;

// Usamos el servidor público oficial pero con un identificador de sala dinámico limpio
const ROOM_NAME = "micro-universo-swarm-2026";

const peerConfig = {
    // Configuramos servidores STUN robustos para redes distintas
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
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
    } else {
        // Fallback por si el elemento HTML tiene otro ID
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
    // Intentamos registrar el ID maestro de la sala
    peer = new Peer(ROOM_NAME, peerConfig);

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log('👑 [HOST] Servidor maestro iniciado con éxito:', id);
        showReconnectOverlay(false);
        updateUIStatus();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // El ID maestro ya está tomado. Eso significa que la PC 1 ya es el host.
            // Nos conectamos inmediatamente como clientes puros.
            console.log('🌐 Sala ocupada por otro Host. Conectando como cliente...');
            connectAsClientNow();
        } else {
            console.warn('Aviso P2P Host:', err);
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

    // Creamos un peer con ID aleatorio propio
    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        console.log('🌐 [CLIENTE] Conectando al Host maestro...');
        // Nos conectamos directamente al ID maestro fijo
        const conn = peer.connect(ROOM_NAME, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error al conectar como cliente:', err);
        showReconnectOverlay(true);
        // Si el host maestro se cayó, reintentamos todo para ver si nos toca ser host a nosotros
        setTimeout(tryAutoConnect, 3000);
    });
}

function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        console.log('👤 [HOST] Nuevo usuario vinculado:', conn.peer);
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
        console.log('🚀 [CLIENTE] ¡Conexión establecida con el servidor!');
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
        console.warn('⚠️ Se perdió la conexión con el servidor. Reintentando enlace...');
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
