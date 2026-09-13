// compute-engine.js - Adaptive Tier & Hybrid Budget
function detectHardwareTier() {
    return state.renderMode === 'cpu' ? false : (state.renderMode === 'gpgpu' ? true : false);
}

function updateAdaptiveBudget(renderer) {
    const isGPGPU = detectHardwareTier();
    // Cuota conservadora para notebook (15k cap), escala a 150k solo si fuerzas GPGPU
    state.maxBudgetParticles = isGPGPU ? 150000 : 15000;
    
    if (state.p2pEnabled) {
        state.count = Math.min(state.maxBudgetParticles, state.peerQuota * Math.max(1, state.remotePeers.size + 1));
    } else if (state.count > state.maxBudgetParticles) {
        state.count = state.maxBudgetParticles;
    }
}

window.updateAdaptiveBudget = updateAdaptiveBudget;
window.detectHardwareTier = detectHardwareTier;