// network-swarm.js - P2P Robusto con STUN Servers y Failover Estable

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;
let currentRoomIndex = 1;
const MAX_USERS_PER_ROOM = 50;
const ROOM_PREFIX = "micro-universo-sala-";

// Configuración de servidores STUN públicos para atravesar firewalls y redes distintas
const peerConfig = {
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
    const counterEl = document.getElementById('swarm-counter');
    if (counterEl) {
        counterEl.innerText = `🟢 ${totalUsers} / ${MAX_USERS_PER_ROOM} usuarios conectados (Sala ${currentRoomIndex})`;
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
    tryConnectToRoom(currentRoomIndex);
}

function tryConnectToRoom(roomIdx) {
    currentRoomIndex = roomIdx;
    const roomId = ROOM_PREFIX + roomIdx;
    
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    // Intentamos ser Host de la sala con la config STUN
    peer = new Peer(roomId, peerConfig);

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log(`[HOST] Me convertí en servidor de la ${roomId}`);
        showReconnectOverlay(false);
        updateUIStatus();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // La sala ya existe, nos unimos como cliente
            tryJoinAsClient(roomId);
        } else {
            console.warn('Error P2P Host:', err);
            // Reintentar tras un breve lapso si hay error de red
            setTimeout(() => tryConnectToRoom(currentRoomIndex), 3000);
        }
    });

    peer.on('connection', (conn) => {
        if (connections.size >= MAX_USERS_PER_ROOM - 1) {
            conn.on('open', () => {
                conn.send({ type: 'ROOM_FULL' });
                setTimeout(() => conn.close(), 500);
            });
            return;
        }
        setupHostConnection(conn);
    });
}

function tryJoinAsClient(roomId) {
    isHost = false;
    const clientId = 'client-' + Math.random().toString(36).substring(2, 8);
    state.peerId = clientId;

    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        console.log(`[CLIENTE] Conectándome al host de ${roomId}...`);
        const conn = peer.connect(roomId, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error como cliente:', err);
        showReconnectOverlay(true);
        setTimeout(() => tryConnectToRoom(currentRoomIndex), 3000);
    });
}

function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        updateUIStatus();
        broadcastPeersList();
        if (typeof buildParticles === 'function') buildParticles();
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
        console.log('¡Conectado al servidor con éxito!');
        showReconnectOverlay(false);
        updateUIStatus();
    });

    conn.on('error', (err) => {
        console.warn('Error en la conexión con el host:', err);
        showReconnectOverlay(true);
    });

    conn.on('data', (data) => {
        if (data.type === 'ROOM_FULL') {
            showReconnectOverlay(true);
            tryConnectToRoom(currentRoomIndex + 1);
        } else if (data.type === 'PEERS_UPDATE') {
            state.remotePeers.clear();
            data.peers.forEach(pId => {
                if (pId !== state.peerId) {
                    state.remotePeers.set(pId, { color: calculatePeerColor(pId) });
                }
            });
            updateUIStatus();
            if (typeof buildParticles === 'function') buildParticles();
        }
    });

    conn.on('close', () => {
        console.warn('⚠️ Se perdió la conexión con el servidor. Reintentando...');
        showReconnectOverlay(true);
        
        // Intentar reclamar el puesto o reconectar tras 2 segundos
        setTimeout(() => {
            tryConnectToRoom(currentRoomIndex);
        }, 2000);
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
    peers.push(state.peerId);
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
