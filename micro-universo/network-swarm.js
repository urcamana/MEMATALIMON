// network-swarm.js - Enjambre Colectivo con Control de UI y Densidad Bloqueada en P2P

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

// Control inteligente de la interfaz gráfica (UI)
function updateUIStatus() {
    const counterEl = document.getElementById('p2p-status-text') || document.getElementById('swarm-counter');
    
    if (!state.p2pEnabled) {
        // Si el P2P está apagado, ocultamos por completo el cartel de usuarios
        if (counterEl) {
            counterEl.style.display = 'none';
        }
        setDensitySelectDisabled(false);
        return;
    }

    // Si el P2P está activo, mostramos el contador y calculamos el total
    const totalUsers = isHost ? (connections.size + 1) : (state.remotePeers.size + 1);
    
    if (counterEl) {
        counterEl.style.display = 'block'; // O 'flex' según tu diseño original
        counterEl.innerText = `🟢 ${totalUsers} / 50 usuarios conectados`;
    }

    // Bloqueamos la densidad manual para que la mande el P2P
    setDensitySelectDisabled(true);
}

// Bloquea o desbloquea el selector de densidad de partículas en el menú lateral
function setDensitySelectDisabled(disabled) {
    // Buscamos el selector de densidad por ID o por su etiqueta/clase común en tu app
    const densitySelect = document.getElementById('particle-density') || 
                          document.querySelector('select[name="density"]') ||
                          document.querySelector('.density-select'); // Ajusta el selector si difiere en tu HTML
                          
    if (densitySelect) {
        densitySelect.disabled = disabled;
        densitySelect.style.opacity = disabled ? '0.5' : '1.0';
        densitySelect.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
}

function showReconnectOverlay(show) {
    const overlay = document.getElementById('reconnect-overlay');
    if (overlay) {
        overlay.style.display = (show && state.p2pEnabled) ? 'flex' : 'none';
    }
}

function initP2P() {
    if (!state.p2pEnabled) {
        updateUIStatus();
        if (peer) { try { peer.destroy(); } catch(e) {} }
        return;
    }
    
    updateUIStatus();
    showReconnectOverlay(false);
    tryAutoConnect();
}

function tryAutoConnect() {
    if (!state.p2pEnabled) return;
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    isHost = false;
    peer = new Peer(ROOM_NAME, peerConfig);

    peer.on('open', (id) => {
        if (!state.p2pEnabled) return;
        isHost = true;
        state.peerId = id;
        console.log('👑 [HOST] Servidor maestro activo:', id);
        showReconnectOverlay(false);
        updateUIStatus();
        updateParticleCountBasedOnPeers();
    });

    peer.on('error', (err) => {
        if (!state.p2pEnabled) return;
        if (err.type === 'unavailable-id') {
            connectAsClientNow();
        } else {
            showReconnectOverlay(true);
            setTimeout(tryAutoConnect, 3000);
        }
    });

    peer.on('connection', (conn) => {
        if (!state.p2pEnabled) return;
        setupHostConnection(conn);
    });
}

function connectAsClientNow() {
    if (!state.p2pEnabled) return;
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    const clientId = 'client-' + Math.random().toString(36).substring(2, 8);
    state.peerId = clientId;

    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        if (!state.p2pEnabled) return;
        console.log('🌐 [CLIENTE] Conectado con ID temporal:', clientId);
        const conn = peer.connect(ROOM_NAME, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        if (!state.p2pEnabled) return;
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

// Ajusta el total de partículas automáticamente según los usuarios conectados en P2P
function updateParticleCountBasedOnPeers() {
    if (!state.p2pEnabled) return;
    const totalUsers = isHost ? (connections.size + 1) : (state.remotePeers.size + 1);
    const targetCount = totalUsers * PARTICLES_PER_USER;
    
    if (state.count !== targetCount) {
        state.count = targetCount;
        if (typeof buildParticles === 'function') {
            buildParticles();
            console.log(`✨ [SWARM P2P] Total usuarios: ${totalUsers} | Partículas automáticas: ${state.count}`);
        }
    }
}

// Asigna las cuotas de color a cada bloque de 120 partículas por usuario
function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled || state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.keys());
    if (!peers.includes(state.peerId)) {
        peers.push(state.peerId);
    }
    peers.sort();

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
