// network-swarm.js - P2P Swarm, Quotas & Unique Peer Hues
function calculatePeerColor(peerId) {
    let hash = 0;
    for (let i = 0; i < peerId.length; i++) hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return new THREE.Color(`hsl(${hue}, 85%, 60%)`);
}

function updateSwarmQuotas(totalPeersCount) {
    const activePeers = Math.max(1, totalPeersCount + 1);
    const globalCap = state.maxBudgetParticles || 15000;
    // Cuota dinámica: ej. 10-100 por usuario según capacidad global y peers activos
    state.peerQuota = Math.min(100, Math.floor(globalCap / activePeers));
}

function simulatePeerJoinMock(peerId) {
    state.remotePeers.set(peerId, { color: calculatePeerColor(peerId), quota: 30 });
    updateSwarmQuotas(state.remotePeers.size);
    buildParticles();
}
function applySwarmColorsToBuffer(colorsArray, totalCount, peerMap) {
    if (!state.p2pEnabled && state.mode !== 'swarm') return;
    
    const peers = Array.from(peerMap.entries());
    const totalParties = peers.length + 1; // yo + remotos
    const chunkSize = Math.floor(totalCount / totalParties);
    
    // Mis partículas (primer bloque) usan color base o propio
    // Bloques siguientes tiñen con el color hash de cada peer remoto
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

window.applySwarmColorsToBuffer = applySwarmColorsToBuffer;
window.calculatePeerColor = calculatePeerColor;
window.updateSwarmQuotas = updateSwarmQuotas;
window.simulatePeerJoinMock = simulatePeerJoinMock;