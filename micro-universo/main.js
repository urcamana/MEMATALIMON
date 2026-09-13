/**
 * MICRO-UNIVERSO v1.5 - Master Engine Controller (Full Suite Unified)
 */

const state = {
    mode: 'swarm',
    count: 6000,
    speed: 0.015,
    timeDilation: 1.0,
    particleSize: 0.2,
    attraction: 0.0,
    mouseAttractionEnabled: true,
    theme: 'cyan',
    autoRotate: true,
    audioEnabled: false,
    micEnabled: false,
    bloomEnabled: true,
    midiEnabled: false,
    webcamEnabled: false,
    entropyInputText: '',
    // Agregar dentro de const state en main.js:
renderMode: 'auto', // 'auto' | 'cpu' | 'gpgpu'
maxBudgetParticles: 15000, // Se adapta según GPU/CPU
xrEnabled: false,
p2pEnabled: true,
peerId: Math.random().toString(36).substring(2, 8),
peerQuota: 50,
remotePeers: new Map(), // peerId -> { color, cursor, seed, count }
glslCustomFragment: null,
seqExportActive: false
};

let scene, camera, renderer, particleSystem, geometry, material;
let positions, targetPositions, originalPositions, colors;
let audioCtx, analyser, dataArray, micStream;

const themes = {
    cyan: [new THREE.Color(0x00ffff), new THREE.Color(0x0055ff), new THREE.Color(0x000033)],
    matrix: [new THREE.Color(0x00ff66), new THREE.Color(0x003311), new THREE.Color(0x000000)],
    fire: [new THREE.Color(0xffaa00), new THREE.Color(0xff2200), new THREE.Color(0x220000)],
    violet: [new THREE.Color(0xff00ff), new THREE.Color(0x7700ff), new THREE.Color(0x110022)],
    neutron: [new THREE.Color(0xffd700), new THREE.Color(0x0044ff), new THREE.Color(0x050515)],
    emerald: [new THREE.Color(0x50ffb1), new THREE.Color(0x00aa55), new THREE.Color(0x01150a)]
};

function createGlowingSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function initEngine() {
    const container = document.getElementById('canvas-container');
    container.innerHTML = '';

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010103, 0.012);

    

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 45);
    camera.positionCenter = new THREE.Vector3(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.appendChild(renderer.domElement);

if (typeof initPostProcessing === 'function') {
        initPostProcessing(renderer, scene, camera);
    }
    
    updateAdaptiveBudget(renderer); // Ajusta el límite antes de poblar
    buildParticles();
    setupUIEvents();
    initAudio();

    if (typeof setupControls === 'function') {
        setupControls(camera, renderer.domElement, triggerSupernova);
    }
    
    initXRSupport(renderer, scene, camera, particleSystem); // Ya tiene particleSystem listo

    if (state.p2pEnabled && typeof initP2P === 'function') {
        initP2P(); // Reemplaza esto por el nombre real de tu función en network-swarm.js
    }
    animate();
}

function buildParticles() {
    if (particleSystem) scene.remove(particleSystem);

    geometry = new THREE.BufferGeometry();
    positions = new Float32Array(state.count * 3);
    targetPositions = new Float32Array(state.count * 3);
    originalPositions = new Float32Array(state.count * 3);
    colors = new Float32Array(state.count * 3);

    const activeTheme = themes[state.theme] || themes.fire;

    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        const radius = Math.random() * 20 + 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = radius * Math.cos(phi);

        originalPositions[idx] = positions[idx];
        originalPositions[idx + 1] = positions[idx + 1];
        originalPositions[idx + 2] = positions[idx + 2];

        targetPositions[idx] = positions[idx];
        targetPositions[idx + 1] = positions[idx + 1];
        targetPositions[idx + 2] = positions[idx + 2];

        const mixRatio = Math.random();
        const color = activeTheme[0].clone().lerp(activeTheme, mixRatio);
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;
    }

    // --- NUEVO: Sobrescribe / colorea en bloques si estamos en modo swarm ---
    if (state.mode === 'swarm') {
        applySwarmColorsToBuffer(colors, state.count, state.remotePeers);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    material = new THREE.PointsMaterial({
        size: state.particleSize,
        map: createGlowingSprite(),
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const pcVal = document.getElementById('particleCountVal');
    if (pcVal) pcVal.innerText = state.count.toLocaleString();
}

function resetViewAndParticles() {
    const posAttr = geometry.attributes.position;
    const p = posAttr.array;
    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        p[idx] = originalPositions[idx];
        p[idx + 1] = originalPositions[idx + 1];
        p[idx + 2] = originalPositions[idx + 2];
    }
    posAttr.needsUpdate = true;

    camera.position.set(0, 0, 45);
    camera.positionCenter.set(0, 0, 0);
    camera.lookAt(camera.positionCenter);
    if (particleSystem) particleSystem.rotation.set(0, 0, 0);
}

function updatePhysics() {
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;
    const p = posAttr.array;
    const c = colAttr.array;

    const dt = state.speed * state.timeDilation;
    const attractionFactor = state.attraction;
    const activeTheme = themes[state.theme] || themes.fire;

    // Obtener reactividad de audio nativa o externa modular
    let bass = 0, mids = 0, highs = 0;
    if (analyser && state.audioEnabled) {
        analyser.getByteFrequencyData(dataArray);
        const binCount = analyser.frequencyBinCount;
        let bassSum = 0, midSum = 0, highSum = 0;
        const third = Math.floor(binCount / 3);

        for (let i = 0; i < third; i++) bassSum += dataArray[i];
        for (let i = third; i < third * 2; i++) midSum += dataArray[i];
        for (let i = third * 2; i < binCount; i++) highSum += dataArray[i];

        bass = (bassSum / third) / 255.0;
        mids = (midSum / third) / 255.0;
        highs = (highSum / (binCount - third * 2)) / 255.0;
    } else if (window.audioReactiveInstance && typeof window.audioReactiveInstance.getBassIntensity === 'function') {
        bass = window.audioReactiveInstance.getBassIntensity();
    }

    // Flujo óptico opcional
    let camFlow = { x: 0, y: 0 };
    if (state.webcamEnabled && typeof getOpticalFlowVector === 'function') {
        camFlow = getOpticalFlowVector();
    }

    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        const x = p[idx];
        const y = p[idx + 1];
        const z = p[idx + 2];

        const origPos = { x: originalPositions[idx], y: originalPositions[idx+1], z: originalPositions[idx+2] };
        const targPos = { x: targetPositions[idx], y: targetPositions[idx+1], z: targetPositions[idx+2] };

let vector = { dx: 0, dy: 0, dz: 0 };
if (typeof calculateAttractorVector === 'function') {
    vector = calculateAttractorVector(x, y, z, state.mode, origPos, attractionFactor, targPos);
}

let dx = vector.dx + camFlow.x;
        let dy = vector.dy + camFlow.y;
        let dz = vector.dz;

        if (bass > 0 || mids > 0) {
            dx *= (1.0 + bass * 3.0);
            dy *= (1.0 + bass * 3.0);
            dz *= (1.0 + mids * 2.5);
        }

        p[idx] += dx * dt;
        p[idx + 1] += dy * dt;
        p[idx + 2] += dz * dt;

        const distSq = p[idx] * p[idx] + p[idx + 1] * p[idx + 1] + p[idx + 2] * p[idx + 2];
        const normDist = Math.min(Math.sqrt(distSq) / 35.0, 1.0);

        const mixedColor = activeTheme[0].clone().lerp(activeTheme[1], normDist);
        c[idx] = mixedColor.r * (1.0 + highs * 1.5);
        c[idx + 1] = mixedColor.g * (1.0 + highs * 1.5);
        c[idx + 2] = mixedColor.b * (1.0 + highs * 1.5);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
}

function triggerSupernova() {
    const posAttr = geometry.attributes.position;
    const p = posAttr.array;
    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        p[idx] += (Math.random() - 0.5) * 35;
        p[idx + 1] += (Math.random() - 0.5) * 35;
        p[idx + 2] += (Math.random() - 0.5) * 35;
    }
    posAttr.needsUpdate = true;
}

function initAudio() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
        console.warn("Audio Context init warning:", e);
    }
}

function setupUIEvents() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        if (typeof resizePostProcessing === 'function') {
            resizePostProcessing(window.innerWidth, window.innerHeight);
        }
    });

    const modeSelect = document.getElementById('mode');
    const mathSandboxContainer = document.getElementById('mathSandboxContainer');

    modeSelect?.addEventListener('change', (e) => {
        state.mode = e.target.value;
        if (state.mode === 'customMath') {
            if (mathSandboxContainer) mathSandboxContainer.style.display = 'flex';
            const expr = document.getElementById('customMathExpr')?.value;
            if (expr && typeof updateCustomMathExpression === 'function') {
                updateCustomMathExpression(expr);
            }
        } else {
            if (mathSandboxContainer) mathSandboxContainer.style.display = 'none';
        }
    });

    const mathPresetSelect = document.getElementById('mathPresetSelect');
    const customMathExprInput = document.getElementById('customMathExpr');
    if (mathPresetSelect && customMathExprInput) {
        mathPresetSelect.addEventListener('change', (e) => {
            customMathExprInput.value = e.target.value;
            if (typeof updateCustomMathExpression === 'function') {
                updateCustomMathExpression(e.target.value);
            }
        });
        customMathExprInput.addEventListener('input', (e) => {
            if (typeof updateCustomMathExpression === 'function') {
                updateCustomMathExpression(e.target.value);
            }
        });
    }

    document.getElementById('btnResetView')?.addEventListener('click', () => resetViewAndParticles());

    document.getElementById('particleDensity')?.addEventListener('change', (e) => {
        state.count = parseInt(e.target.value);
        buildParticles();
    });
    document.getElementById('speed')?.addEventListener('input', (e) => state.speed = parseFloat(e.target.value));
    document.getElementById('timeDilation')?.addEventListener('input', (e) => state.timeDilation = parseFloat(e.target.value));
    document.getElementById('particleSize')?.addEventListener('input', (e) => {
        state.particleSize = parseFloat(e.target.value);
        if (material) material.size = state.particleSize;
    });
    document.getElementById('attraction')?.addEventListener('input', (e) => state.attraction = parseFloat(e.target.value));
    
    document.getElementById('mouseAttractionToggle')?.addEventListener('change', (e) => {
        state.mouseAttractionEnabled = e.target.checked;
    });

    document.getElementById('themeSelect')?.addEventListener('change', (e) => state.theme = e.target.value);
    document.getElementById('autoRotate')?.addEventListener('change', (e) => state.autoRotate = e.target.checked);

    document.getElementById('bloomToggle')?.addEventListener('change', (e) => {
        state.bloomEnabled = e.target.checked;
        if (typeof setPostProcessingEnabled === 'function') {
            setPostProcessingEnabled(state.bloomEnabled);
        }
    });

    document.getElementById('midiToggle')?.addEventListener('change', (e) => {
        state.midiEnabled = e.target.checked;
        if (state.midiEnabled && typeof initMIDI === 'function') {
            initMIDI((param, val) => {
                state[param] = val;
                const el = document.getElementById(param);
                if (el) el.value = val;
                if (param === 'particleSize' && material) material.size = val;
            });
        }
    });

    document.getElementById('webcamToggle')?.addEventListener('change', async (e) => {
        state.webcamEnabled = e.target.checked;
        if (state.webcamEnabled && typeof initWebcamTracking === 'function') {
            await initWebcamTracking();
        } else {
            const camStat = document.getElementById('camStatusVal');
            if (camStat) camStat.innerText = 'Inactiva';
        }
    });

    document.getElementById('audioToggle')?.addEventListener('change', async (e) => {
        state.audioEnabled = e.target.checked;
        if (state.audioEnabled && audioCtx) {
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                const source = audioCtx.createMediaStreamSource(micStream);
                if (analyser) source.connect(analyser);
            } catch (err) {
                alert("No se pudo acceder al micrófono.");
                e.target.checked = false;
            }
        }
    });

    const entropyInput = document.getElementById('entropyInput');
    entropyInput?.addEventListener('input', async (e) => {
        state.entropyInputText = e.target.value;
        if (typeof applyCryptoEntropyInjection === 'function') {
            const res = await applyCryptoEntropyInjection(state.entropyInputText, state.count, targetPositions);
            const entVal = document.getElementById('entropyVal');
            if (entVal) entVal.innerText = `${res.entropy.toFixed(2)} bit`;
        }
    });

    document.getElementById('btnBin')?.addEventListener('click', async () => {
        if (!state.entropyInputText) return;
        const binStr = Array.from(state.entropyInputText).map(c => c.charCodeAt(0).toString(2)).join('');
        if (typeof applyCryptoEntropyInjection === 'function') {
            const res = await applyCryptoEntropyInjection(binStr, state.count, targetPositions);
            const entVal = document.getElementById('entropyVal');
            if (entVal) entVal.innerText = `${res.entropy.toFixed(2)} bit`;
        }
    });

    document.getElementById('btnHash')?.addEventListener('click', async () => {
        if (!state.entropyInputText) return;
        if (typeof computeSHA256 === 'function' && typeof applyCryptoEntropyInjection === 'function') {
            const hashBytes = await computeSHA256(state.entropyInputText);
            const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            const res = await applyCryptoEntropyInjection(hashHex, state.count, targetPositions);
            const entVal = document.getElementById('entropyVal');
            if (entVal) entVal.innerText = `${res.entropy.toFixed(2)} bit`;
        }
    });

    document.getElementById('btnSnap')?.addEventListener('click', () => {
        if (typeof renderSceneMaster === 'function') {
            renderSceneMaster(renderer, scene, camera);
        }
        const dataURL = renderer.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `micro-universo-full-${state.mode}-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    });

    const btnRecord = document.getElementById('btnRecord');
    btnRecord?.addEventListener('click', () => {
        if (typeof toggleVideoRecording === 'function') {
            const active = toggleVideoRecording(renderer);
            if (active) {
                btnRecord.innerText = '⏹️ Detener Grabación';
                btnRecord.style.borderColor = '#ff0000';
                btnRecord.style.color = '#ff0000';
            } else {
                btnRecord.innerText = '🔴 Grabar Clip';
                btnRecord.style.borderColor = '#00ffcc';
                btnRecord.style.color = '#00ffcc';
            }
        }
    });

    document.getElementById('btnExportJSON')?.addEventListener('click', () => {
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `micro-universo-preset-v1.5.json`;
        link.href = url;
        link.click();
    });

    const fileInput = document.getElementById('jsonFileInput');
    document.getElementById('btnImportJSON')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const loadedState = JSON.parse(evt.target.result);
                Object.assign(state, loadedState);
                if (document.getElementById('mode')) document.getElementById('mode').value = state.mode;
                if (document.getElementById('particleDensity')) document.getElementById('particleDensity').value = state.count;
                if (document.getElementById('speed')) document.getElementById('speed').value = state.speed;
                if (document.getElementById('timeDilation')) document.getElementById('timeDilation').value = state.timeDilation;
                if (document.getElementById('particleSize')) document.getElementById('particleSize').value = state.particleSize;
                if (document.getElementById('attraction')) document.getElementById('attraction').value = state.attraction;
                if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = state.theme;
                if (document.getElementById('autoRotate')) document.getElementById('autoRotate').checked = state.autoRotate;
                buildParticles();
            } catch (err) {
                alert("Error al cargar el preset JSON.");
            }
        };
        reader.readAsText(file);
    });

document.getElementById('webcamToggle')?.addEventListener('change', async (e) => {
        state.webcamEnabled = e.target.checked;
        if (state.webcamEnabled && typeof initWebcamTracking === 'function') {
            await initWebcamTracking();
        } else {
            const camStat = document.getElementById('camStatusVal');
            if (camStat) camStat.innerText = 'Inactiva';
        }
    });

    document.getElementById('audioToggle')?.addEventListener('change', async (e) => {
        state.audioEnabled = e.target.checked;
        if (state.audioEnabled && audioCtx) {
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            try {
                micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                const source = audioCtx.createMediaStreamSource(micStream);
                if (analyser) source.connect(analyser);
            } catch (err) {
                alert("No se pudo acceder al micrófono.");
                e.target.checked = false;
            }
        }
    });

    // Unificación de botones externos con los toggles lógicos
    document.getElementById('btnAudio')?.addEventListener('click', () => {
        const audioCheckbox = document.getElementById('audioToggle');
        if (audioCheckbox) {
            audioCheckbox.checked = !audioCheckbox.checked;
            audioCheckbox.dispatchEvent(new Event('change'));
        }
    });
    
    document.getElementById('btnVision')?.addEventListener('click', () => {
        const webcamCheckbox = document.getElementById('webcamToggle');
        if (webcamCheckbox) {
            webcamCheckbox.checked = !webcamCheckbox.checked;
            webcamCheckbox.dispatchEvent(new Event('change'));
        }
    });

    document.getElementById('renderTierSelect')?.addEventListener('change', (e) => {
    state.renderMode = e.target.value;
    updateAdaptiveBudget(renderer);
    buildParticles();
    });
document.getElementById('mode')?.addEventListener('change', (e) => {
        state.mode = e.target.value;
        buildParticles(); // Reconstruye y aplica colores de colmena si pasa a 'swarm'
    });

}

function animate() {
    requestAnimationFrame(animate);

    if (state.autoRotate && particleSystem) {
        particleSystem.rotation.y += 0.002;
    }

    updatePhysics();

    if (typeof renderSceneMaster === 'function') {
        renderSceneMaster(renderer, scene, camera);
    } else {
        renderer.render(scene, camera);
    }
}

window.addEventListener('DOMContentLoaded', initEngine);
