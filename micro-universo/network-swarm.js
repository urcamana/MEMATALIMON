// network-swarm.js - P2P Avanzado con Failover, Salas de 50 y Contador

let peer = null;
let connections = new Map(); // Para el Host: guarda conexiones de los clientes
let hostConnection = null;   // Para el Cliente: guarda la conexión con el Host
let isHost = false;
let currentRoomIndex = 1;
const MAX_USERS_PER_ROOM = 50;

const ROOM_PREFIX = "micro-universo-sala-";

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
        // Si está visible, evitamos que bloquee los clics del panel de la izquierda
        // haciendo que el fondo sea traslúcido y solo atrape eventos el cuadro central
    }
}

function initP2P() {
    if (!state.p2pEnabled) return;
    tryConnectToRoom(currentRoomIndex);
}

// Intenta crear la sala como Host; si falla porque ya está ocupada, entra como cliente
function tryConnectToRoom(roomIdx) {
    currentRoomIndex = roomIdx;
    const roomId = ROOM_PREFIX + roomIdx;
    
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    peer = new Peer(roomId, { debug: 0 });

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log(`[HOST] Me convertí en servidor de la ${roomId}`);
        showReconnectOverlay(false);
        updateUIStatus();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // La sala ya existe, intentemos unirnos como cliente o pasar a otra si está llena
            tryJoinAsClient(roomId);
        } else {
            console.warn('Error P2P:', err);
        }
    });

    peer.on('connection', (conn) => {
        if (connections.size >= MAX_USERS_PER_ROOM - 1) {
            // Sala llena, rechazar o mandar a otra sala (aquí simplificamos rechazando o buscando otra)
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

    peer = new Peer(clientId, { debug: 0 });

    peer.on('open', () => {
        console.log(`[CLIENTE] Conectándome al host de ${roomId}...`);
        const conn = peer.connect(roomId);
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error como cliente:', err);
        // Si hay error, intentamos buscar la siguiente sala
        setTimeout(() => tryConnectToRoom(currentRoomIndex + 1), 2000);
    });
}

// Configuración si somos Host
function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        updateUIStatus();
        broadcastPeersList();
        if (typeof buildParticles === 'function') buildParticles();
    });

    conn.on('data', (data) => {
        if (data.type === 'SYNC_STATE') {
            // Sincronizaciones si hicieran falta
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

// Configuración si somos Cliente
function setupClientConnection(conn) {
    hostConnection = conn;

    conn.on('open', () => {
        console.log('¡Conectado al servidor con éxito!');
        showReconnectOverlay(false);
        updateUIStatus();
    });

    conn.on('data', (data) => {
        if (data.type === 'ROOM_FULL') {
            // Si la sala está llena, probamos con la siguiente sala automáticamente
            showReconnectOverlay(true);
            tryConnectToRoom(currentRoomIndex + 1);
        } else if (data.type === 'PEERS_UPDATE') {
            // Actualizar lista de peers remotos que envía el host
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

    // 🚨 AQUÍ SUCEDE EL MAGICO FAILOVER SI SE CAE EL SERVIDOR
    conn.on('close', () => {
        console.warn('⚠️ El servidor se ha desconectado. Iniciando recuperación...');
        showReconnectOverlay(true);
        
        // Estrategia de Failover: Intentamos reclamar el trono de esta misma sala (convertirnos en el nuevo servidor)
        setTimeout(() => {
            tryConnectToRoom(currentRoomIndex);
        }, 1500);
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
    
    const peers = Array.from(peerMap.entries());
    const totalParties = peers.length + 1; 
    const chunkSize = Math.floor(totalCount / totalParties);
    
    peers.forEach(([peerId, data], index) => {
        const startIdx = (index + 1) * chunkSize;
        const endIdx = (index === peers.length - 1) ? totalCount : startIdx + chunkSize;
        const c = data.color;
        
        for (let i = startIdx; i < endIdx; i++) {
            colorsArray[i * 3]     = c.r;
            colorsArray[i * 3 + 1] = c.g;
            colorsArray[i * 3 + 2] = c.b;
        }
    });
}

// Exponer funciones globalmente
window.initP2P = initP2P;
window.applySwarmColorsToBuffer = applySwarmColorsToBuffer;
window.calculatePeerColor = calculatePeerColor;
