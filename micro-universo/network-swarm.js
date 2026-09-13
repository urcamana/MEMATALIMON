// network-swarm.js - P2P 100% Automático y Transparente (Sin IDs manuales)

let peer = null;
let connections = new Map();
let isHost = false;
const GLOBAL_ROOM_ID = "micro-universo-global-room-v1"; // ID único estandarizado para la app

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

function initP2P() {
    if (!state.p2pEnabled) return;
    
    console.log("Iniciando red P2P automática...");
    tryAutoConnect();
}

function tryAutoConnect() {
    // Intentamos registrar el ID global. Si nadie abrió la web antes, nos convertimos en el Host.
    peer = new Peer(GLOBAL_ROOM_ID, peerConfig);

    peer.on('open', (id) => {
        isHost = true;
        state.peerId = id;
        console.log('👑 Me he convertido en el SERVIDOR de la sala global:', id);
        updateUIStatus();
    });

    peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
            // El ID ya está ocupado por otro Host. Nos conectamos automáticamente como clientes.
            console.log('🌐 Sala global ocupada. Conectándome como cliente al servidor existente...');
            connectAsAutomaticClient();
        } else {
            console.warn('Aviso P2P:', err);
            // Reintentar en unos segundos si hubo un fallo de red transitorio
            setTimeout(tryAutoConnect, 4000);
        }
    });

    // Si somos host, esperamos las conexiones de los demás
    peer.on('connection', (conn) => {
        setupHostConnection(conn);
    });
}

function connectAsAutomaticClient() {
    // Destruimos la instancia anterior fallida y creamos un ID aleatorio de cliente
    if (peer) {
        try { peer.destroy(); } catch(e) {}
    }

    const clientId = 'client-' + Math.random().toString(36).substring(2, 8);
    state.peerId = clientId;

    peer = new Peer(clientId, peerConfig);

    peer.on('open', () => {
        console.log('Mi ID de cliente temporal es:', clientId);
        // Nos conectamos de forma transparente al Host global fijo
        const conn = peer.connect(GLOBAL_ROOM_ID, { reliable: true });
        setupClientConnection(conn);
    });

    peer.on('error', (err) => {
        console.warn('Error al conectar como cliente:', err);
        // Si el host se cayó justo, reintentamos todo el proceso para ver si nos toca ser host
        setTimeout(tryAutoConnect, 4000);
    });
}

function setupHostConnection(conn) {
    connections.set(conn.peer, conn);

    conn.on('open', () => {
        console.log('Nuevo usuario conectado al servidor:', conn.peer);
        state.remotePeers.set(conn.peer, { color: calculatePeerColor(conn.peer) });
        updateUIStatus();
        broadcastPeersList();
        if (typeof buildParticles === 'function') buildParticles();
    });

    conn.on('close', () => {
        console.log('Usuario desconectado:', conn.peer);
        connections.delete(conn.peer);
        state.remotePeers.delete(conn.peer);
        updateUIStatus();
        broadcastPeersList();
        if (typeof buildParticles === 'function') buildParticles();
    });
}

function setupClientConnection(conn) {
    conn.on('open', () => {
        console.log('¡Conectado exitosamente al servidor global!');
        updateUIStatus();
    });

    conn.on('data', (data) => {
        if (data.type === 'PEERS_UPDATE') {
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
        console.warn('⚠️ Se perdió la conexión con el servidor. Buscando nuevo servidor...');
        // Si el servidor se desconecta, intentamos reconectarnos automáticamente (podríamos convertirnos en host nosotros)
        setTimeout(tryAutoConnect, 2000);
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
