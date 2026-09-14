// vision.js - Lightweight vision tracker helper
class VisionTracker {
    constructor() {
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.active = false;
    }
    async start() {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
        this.video.srcObject = stream;
        await this.video.play();
        this.active = true;
    }
    updateMouse3D(target3D) {
        if (!this.active || this.video.readyState < 2) return;
        this.canvas.width = 160;
        this.canvas.height = 120;
        this.ctx.drawImage(this.video, 0, 0, 160, 120);
        const frame = this.ctx.getImageData(0, 0, 160, 120).data;
        let sumX = 0, sumY = 0, count = 0;
        for (let i = 0; i < frame.length; i += 16) {
            const bright = (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
            if (bright > 210) {
                const idx = i / 4;
                sumX += idx % 160;
                sumY += Math.floor(idx / 160);
                count++;
            }
        }
        if (count > 4) {
            target3D.x = ((sumX / count) / 80 - 1) * 35;
            target3D.y = -((sumY / count) / 60 - 1) * 25;
            target3D.active = true;
        }
    }
}
window.VisionTracker = VisionTracker;
