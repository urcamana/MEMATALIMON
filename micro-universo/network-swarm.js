// network-swarm.js - P2P Swarm Real con PeerJS

let peer = null;
let connections = new Map(); // peerId -> DataConnection

function calculatePeerColor(peerId) {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return new THREE.Color(`hsl(${hue}, 85%, 60%)`);
}

function updateSwarmQuotas(totalPeersCount) {
    const activePeers = Math.max(1, totalPeersCount + 1);
    const globalCap = state.maxBudgetParticles || 15000;
    state.peerQuota = Math.min(100, Math.floor(globalCap / activePeers));
}

// Inicializar la red P2P real
function initP2P() {
    if (!state.p2pEnabled) return;

    // Creamos el nodo peer con un ID aleatorio o prefijado
    peer = new Peer(state.peerId, {
        debug: 1
    });

    peer.on('open', (id) => {
        console.log('Mi ID de Peer P2P es:', id);
        // Si quieres conectar a otra compu automáticamente, puedes pedir su ID o unirse a una sala común.
        // Para pruebas rápidas, mostraremos un prompt opcional o un sistema de unión por hash en URL.
        checkForRoomInvite();
    });

    // Cuando otro usuario se conecta a nosotros
    peer.on('connection', (conn) => {
        setupConnectionEvents(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error en red P2P:', err);
    });
}

function setupConnectionEvents(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        console.log('Conectado con peer:', conn.peer);
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer), quota: 30 });
        updateSwarmQuotas(state.remotePeers.size);
        if (typeof buildParticles === 'function') buildParticles();
        
        // Sincronizar nuestro estado básico con el nuevo peer
        conn.send({ type: 'SYNC_STATE', peerId: state.peerId });
    });

    conn.on('data', (data) => {
        handlePeerData(conn.peer, data);
    });

    conn.on('close', () => {
        console.log('Peer desconectado:', conn.peer);
        connections.delete(conn.peer);
        state.remotePeers.delete(conn.peer);
        updateSwarmQuotas(state.remotePeers.size);
        if (typeof buildParticles === 'function') buildParticles();
    });
}

function handlePeerData(peerId, data) {
    if (data.type === 'SYNC_STATE') {
        // Recibimos señal de vida de un peer
        if (!state.remotePeers.has(peerId)) {
            state.remotePeers.set(peerId, { color: calculatePeerColor(peerId), quota: 30 });
            updateSwarmQuotas(state.remotePeers.size);
            if (typeof buildParticles === 'function') buildParticles();
        }
    }
}

// Función para unirse manualmente a otra PC pegando su ID
function connectToPeer(targetPeerId) {
    if (!peer || !targetPeerId) return;
    const conn = peer.connect(targetPeerId);
    setupConnectionEvents(conn);
}

// Sistema simple por URL: ej. mematalimon.com.ar/micro-universo/?connect=MI_OTRO_ID
function checkForRoomInvite() {
    const urlParams = new URLSearchParams(window.location.search);
    const target = urlParams.get('connect');
    if (target && target !== state.peerId) {
        setTimeout(() => connectToPeer(target), 1000);
    }
}

function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled && state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.entries());
    const totalParties = peers.length + 1; // yo + remotos
    const chunkSize = Math.floor(totalCount / totalParties);
    
    peers.forEach(([peerId, data], index) => {
        const startIdx = (index + 1) * chunkSize;
        const endIdx = (index === peers.length - 1) ? totalCount : startIdx + chunkSize;
        const c = data.color; // THREE.Color
        
        for (let i = startIdx; i < endIdx; i++) {
            colorsArray[i * 3]     = c.r;
            colorsArray[i * 3 + 1] = c.g;
            colorsArray[i * 3 + 2] = c.b;
        }
    });
}

// Exponer funciones globalmente
window.initP2P = initP2P;
window.connectToPeer = connectToPeer;
window.applySwarmColorsToBuffer = applySwarmColorsToBuffer;
window.calculatePeerColor = calculatePeerColor;
window.updateSwarmQuotas = updateSwarmQuotas;
