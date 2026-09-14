// network-swarm.js - Enjambre Colectivo con Control de UI y Densidad Bloqueada en P2P

let peer = null;
let connections = new Map(); // Para el Host
let hostConnection = null;   // Para el Cliente
let isHost = false;

const ROOM_NAME = "micro-universo-swarm-2026";
const MAX_USERS = 50; // Límite de usuarios; la cantidad de partículas es global.

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
    const totalUsers = isHost ? (connections.size + 1) : Math.max(1, state.remotePeers.size + 1);
    
    if (counterEl) {
        counterEl.style.display = 'block'; // O 'flex' según tu diseño original
        counterEl.innerText = `🟢 ${totalUsers} / 50 usuarios conectados`;
        const top = document.getElementById('connectedUsersVal');
        if (top) top.innerText = `${totalUsers} / 50`;
        const topPower = document.getElementById('topPowerVal');
        if (topPower && window.SwarmAgents) { const r = window.SwarmAgents.getRoleById(window.SwarmAgents.getAgentState().role); topPower.innerText = `${r.icon} ${r.name}`; }
    }

    // Lista compacta de jugadores/poderes. Se actualiza con el roster sincronizado.
    const rosterEl = document.getElementById('p2pRoster');
    if (rosterEl && window.SwarmAgents) {
        const roster = getAgentRoster();
        const ids = Object.keys(roster).sort();
        rosterEl.innerHTML = ids.map((id) => {
            const agent = roster[id] || {};
            const role = window.SwarmAgents.getRoleById(agent.role);
            const label = id === state.peerId ? 'Tú' : `Jugador ${Math.max(1, ids.indexOf(id) + 1)}`;
            const active = agent.cursor?.active ? '●' : '○';
            const energy = Math.round(Number(agent.energy) || 0);
            return `<div style="display:flex;justify-content:space-between;gap:6px;line-height:1.45;"><span>${active} ${label}</span><span>${role.icon} ${role.name} · ${energy}%</span></div>`;
        }).join('');
    }

    // Bloqueamos la densidad manual para que la mande el P2P
    setDensitySelectDisabled(true);
}

// Bloquea o desbloquea el selector de densidad de partículas en el menú lateral
function setDensitySelectDisabled(disabled) {
    // Buscamos el selector de densidad por ID o por su etiqueta/clase común en tu app
    const densitySelect = document.getElementById('particleDensity') || 
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
    if (window.SwarmAgents) window.SwarmAgents.ensureLocalRole(false);
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
    if (connections.size >= MAX_USERS - 1) { try { conn.close(); } catch (e) {} return; }
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
        } else if (data.type === 'AGENT_STATE') {
            const info = state.remotePeers.get(conn.peer) || { color: calculatePeerColor(conn.peer) };
            info.agent = data.agent;
            state.remotePeers.set(conn.peer, info);
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
            if (data.agents) { state.remoteAgents = data.agents || {}; }
            data.peers.forEach(pId => {
                if (pId !== state.peerId) {
                    const info = state.remotePeers.get(pId) || { color: calculatePeerColor(pId) };
                    if (state.remoteAgents && state.remoteAgents[pId]) info.agent = state.remoteAgents[pId];
                    state.remotePeers.set(pId, info);
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

function getAgentRoster() {
    const roster = {};
    if (state.peerId && window.SwarmAgents) roster[state.peerId] = window.SwarmAgents.getAgentState();
    state.remotePeers.forEach((peerInfo, id) => { if (peerInfo.agent) roster[id] = peerInfo.agent; });
    return roster;
}

function broadcastPeersList() {
    if (!isHost) return;
    const peerIds = Array.from(connections.keys());
    peerIds.push(state.peerId);
    
    connections.forEach((conn) => {
        if (conn.open) {
            conn.send({ type: 'PEERS_UPDATE', peers: peerIds, agents: getAgentRoster() });
        }
    });
}

// Ajusta el total de partículas automáticamente según los usuarios conectados en P2P
function updateParticleCountBasedOnPeers() {
    // Intentionally empty: P2P shares ONE fixed-size universe.
    // Never rebuild or multiply the particle count because users joined.
}

function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    // Keep the universe's normal palette. Per-user coloring belongs to the
    // future agent layer and must not change particle density or core rendering.
}


function broadcastAgentState() {
    if (!state.p2pEnabled || !window.SwarmAgents) return;
    const agent = window.SwarmAgents.getAgentState();
    if (isHost) {
        if (state.peerId) { const me = state.remotePeers.get(state.peerId) || {}; me.agent = agent; state.remotePeers.set(state.peerId, me); }
        broadcastPeersList();
    } else if (hostConnection && hostConnection.open) {
        hostConnection.send({ type: 'AGENT_STATE', agent });
    }
}

function stopP2P() {
    if (peer) {
        try { peer.destroy(); } catch (e) {}
    }
    peer = null;
    hostConnection = null;
    connections.clear();
    isHost = false;
    if (typeof state !== 'undefined' && state.remotePeers) state.remotePeers.clear();
    if (typeof state !== 'undefined') state.remoteAgents = {};
    showReconnectOverlay(false);
    updateUIStatus();
}

window.stopP2P = stopP2P;

window.initP2P = initP2P;
window.applySwarmColorsToBuffer = applySwarmColorsToBuffer;
window.calculatePeerColor = calculatePeerColor;
setInterval(() => { if (typeof state !== 'undefined' && state.p2pEnabled) broadcastAgentState(); }, 100);
setInterval(() => { if (typeof state !== 'undefined' && state.p2pEnabled && isHost) broadcastPeersList(); }, 100);
window.broadcastAgentState = broadcastAgentState;
