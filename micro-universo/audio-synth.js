// audio-synth.js - Bi-directional Granular A/V Synthesis
class GranularSynthAV {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        this.osc = null;
        this.gain = null;
        this.init();
    }
    init() {
        if (!this.ctx) return;
        try {
            this.osc = this.ctx.createOscillator();
            this.gain = this.ctx.createGain();
            this.osc.type = 'sine';
            this.osc.frequency.setValueAtTime(110, this.ctx.currentTime);
            this.gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
            this.osc.connect(this.gain);
            this.gain.connect(this.ctx.destination);
            this.osc.start();
        } catch(e) {
            console.warn("Synth warning:", e);
        }
    }
    modulateFromEntropy(entropyVal) {
        if (!this.ctx || !state.audioEnabled || !this.osc) return;
        const freq = 110 + (entropyVal * 25.0);
        this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    }
}
window.GranularSynthAV = GranularSynthAV;