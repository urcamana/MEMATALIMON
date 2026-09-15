// compute-engine.js - Safe adaptive render budget
function detectHardwareTier() {
    return state.renderMode === 'gpgpu';
}

function updateAdaptiveBudget(renderer) {
    const isGPGPU = detectHardwareTier();
    state.maxBudgetParticles = isGPGPU ? 150000 : 15000;
    if (state.count > state.maxBudgetParticles) {
        state.count = state.maxBudgetParticles;
    }
    // P2P does NOT multiply particle count. The universe has one global particle count.
}
window.updateAdaptiveBudget = updateAdaptiveBudget;
window.detectHardwareTier = detectHardwareTier;
