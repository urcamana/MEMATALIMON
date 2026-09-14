/**
 * MICRO-UNIVERSO v1.5 - Webcam Optical Tracking Module
 * High-sensitivity motion tracking to deflect particles using user movement.
 */

let videoElement = null;
let webcamCanvas = null, webcamCtx = null;
let webcamActive = false;
let opticalVector = { x: 0, y: 0 };
let webcamSensitivity = 1.8;

async function initWebcamTracking() {
    if (!videoElement) {
        videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;

        webcamCanvas = document.createElement('canvas');
        webcamCanvas.width = 160;
        webcamCanvas.height = 120;
        webcamCtx = webcamCanvas.getContext('2d', { willReadFrequently: true });
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 160, height: 120 } });
        videoElement.srcObject = stream;
        await videoElement.play();
        webcamActive = true;
        document.getElementById('camStatusVal').innerText = 'Activa (Alta Sensibilidad)';
        requestAnimationFrame(analyzeWebcamMotion);
    } catch (err) {
        document.getElementById('camStatusVal').innerText = 'Bloqueada/Error';
        webcamActive = false;
    }
}

let lastImageData = null;

function analyzeWebcamMotion() {
    if (!webcamActive) return;

    webcamCtx.drawImage(videoElement, 0, 0, 160, 120);
    const currentData = webcamCtx.getImageData(0, 0, 160, 120);

    if (lastImageData) {
        let diffX = 0, diffY = 0, count = 0;
        const dataCurr = currentData.data;
        const dataLast = lastImageData.data;

        for (let i = 0; i < dataCurr.length; i += 16) {
            const rDiff = Math.abs(dataCurr[i] - dataLast[i]);
            if (rDiff > 25) { // Lower threshold for higher sensitivity
                const pixelIndex = i / 4;
                const px = pixelIndex % 160;
                const py = Math.floor(pixelIndex / 160);
                diffX += px - 80;
                diffY += py - 60;
                count++;
            }
        }

        if (count > 10) {
            // High amplification factor (1.8) so movement is clearly visible on screen
            opticalVector.x = (diffX / count) * webcamSensitivity;
            opticalVector.y = -(diffY / count) * webcamSensitivity;
        } else {
            opticalVector.x *= 0.85;
            opticalVector.y *= 0.85;
        }
    }

    lastImageData = currentData;
    requestAnimationFrame(analyzeWebcamMotion);
}

function getOpticalFlowVector() {
    return opticalVector;
}
function setWebcamSensitivity(value) { webcamSensitivity = Math.max(0, Number(value) || 0); }
window.setWebcamSensitivity = setWebcamSensitivity;
