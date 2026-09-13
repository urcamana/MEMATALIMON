// network-swarm.js - Enjambre Colectivo con Cuotas Fijas por Usuario

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;

const ROOM_NAME = "micro-universo-swarm-2026";
const PARTICLES_PER_USER = 120; // Cada usuario aporta exactamente 120 partículas

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
    return new THREE.Color(`hsl(${hue}, 90%, 65%)`);
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
        console.log('👑 [HOST] Servidor maestro activo:', id);
        showReconnectOverlay(false);
        updateUIStatus();
        updateParticleCountBasedOnPeers();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
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
        console.log('🌐 [CLIENTE] Conectado con ID temporal:', clientId);
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
        console.log('👤 [HOST] Peer conectado:', conn.peer);
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        showReconnectOverlay(false);
        updateUIStatus();
        broadcastPeersList();
        updateParticleCountBasedOnPeers();
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
        updateParticleCountBasedOnPeers();
    });
}

function setupClientConnection(conn) {
    hostConnection = conn;

    conn.on('open', () => {
        console.log('🚀 [CLIENTE] Conectado al Host!');
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
            updateParticleCountBasedOnPeers();
        }
    });

    conn.on('close', () => {
        console.warn('⚠️ Conexión perdida. Reconectando...');
        state.remotePeers.clear();
        showReconnectOverlay(true);
        updateUIStatus();
        updateParticleCountBasedOnPeers();
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

// Ajusta el total de partículas dinámicamente según la cantidad de usuarios conectados
function updateParticleCountBasedOnPeers() {
    const totalUsers = isHost ? (connections.size + 1) : (state.remotePeers.size + 1);
    const targetCount = totalUsers * PARTICLES_PER_USER;
    
    if (state.count !== targetCount) {
        state.count = targetCount;
        if (typeof buildParticles === 'function') {
            buildParticles();
            console.log(`✨ [SWARM] Total de usuarios: ${totalUsers}. Partículas ajustadas a: ${state.count}`);
        }
    }
}

// Asigna a cada usuario sus 120 partículas dedicadas con su color correspondiente
function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled || state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.keys());
    if (!peers.includes(state.peerId)) {
        peers.push(state.peerId);
    }
    peers.sort(); // Orden alfabético idéntico en todas las PCs

    peers.forEach((pId, index) => {
        const startIdx = index * PARTICLES_PER_USER;
        const endIdx = Math.min(startIdx + PARTICLES_PER_USER, totalCount);
        
        if (startIdx >= totalCount) return;

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
