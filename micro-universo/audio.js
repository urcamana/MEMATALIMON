// audio.js - Reactive audio helper (classic script)
class AudioReactive {
    constructor() {
        this.analyser = null;
        this.dataArray = null;
    }
    async start() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
    getBassIntensity() {
        if (!this.analyser) return 0;
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < 4; i++) sum += this.dataArray[i];
        return (sum / 4) / 255.0;
    }
}
window.AudioReactive = AudioReactive;
