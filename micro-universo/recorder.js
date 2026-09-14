/**
 * MICRO-UNIVERSO v1.5 - Video Recording Module
 */
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function initVideoRecorder(renderer) {
    const canvas = renderer.domElement;
    if (!canvas.captureStream) return;
    const stream = canvas.captureStream(60);

    try {
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm' };
        }

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `micro-universo-cinematic-${Date.now()}.webm`;
            link.click();
            recordedChunks = [];
        };
    } catch (e) {
        console.warn("MediaRecorder warning:", e);
    }
}

function toggleVideoRecording(renderer) {
    if (!mediaRecorder) {
        initVideoRecorder(renderer);
    }

    if (!mediaRecorder) {
        alert("La grabación de video no está soportada o canvas.captureStream no disponible en este navegador.");
        return false;
    }

    if (!isRecording) {
        recordedChunks = [];
        mediaRecorder.start();
        isRecording = true;
        return true;
    } else {
        mediaRecorder.stop();
        isRecording = false;
        return false;
    }
}

// Exposición global
window.toggleVideoRecording = toggleVideoRecording;