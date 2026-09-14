/**
 * MICRO-UNIVERSO v1.5 - Master Engine Controller (Full Suite Unified)
 */

const state = {
    mode: 'swarm',
    count: 6000,
    speed: 0.015,
    timeDilation: 1.0,
    particleSize: 0.2,
    seed: 133742,
    autoOptimize: true,
    attraction: 0.0,
    mouseAttractionEnabled: false,
    theme: 'cyan',
    autoRotate: true,
    audioEnabled: false,
    micEnabled: false,
    bloomEnabled: true,
    midiEnabled: false,
    webcamEnabled: false,
    webcamSensitivity: 1.8,
    audioBands: { bass: 0, mids: 0, highs: 0 },
    audioBeat: 0,
    audioEnergy: 0,
    midiMappings: {},
    entropyInputText: '',
    // Agregar dentro de const state en main.js:
renderMode: 'auto', // 'auto' | 'cpu' | 'gpgpu'
maxBudgetParticles: 15000, // Se adapta según GPU/CPU
xrEnabled: false,
p2pEnabled: false,
peerId: Math.random().toString(36).substring(2, 8),
peerQuota: 50,
remotePeers: new Map(), // peerId -> { color, cursor, seed, count }
remoteAgents: {},
glslCustomFragment: null,
seqExportActive: false,
forceMix: { mouse: 1.0, audio: 1.0, webcam: 1.0 }
};

let scene, camera, renderer, particleSystem, geometry, material;
let positions, targetPositions, originalPositions, colors;
let audioCtx, analyser, dataArray, micStream;
let rng = Math.random;
let telemetry = { frames: 0, lastTime: performance.now(), fps: 60, frameMs: 16.7, energy: 0, chaos: 0, quality: 1.0, samples: 0 };
let audioBeatCooldown = 0;
const midiLearnHandlers = new Map();
let autoQualityTimer = 0;
const colorScratch = new THREE.Color();
let particleSizeUserTouched = false;
const MULTIPLAYER_SPEED = 0.015;
const MULTIPLAYER_TIME_DILATION = 1.0;
const MULTIPLAYER_PARTICLE_COUNT = 12000;
const MULTIPLAYER_PARTICLE_BASE_SIZE = 0.55;
const MULTIPLAYER_PARTICLE_MIN_SIZE = 0.28;
const MULTIPLAYER_PARTICLE_MAX_SIZE = 1.80;
const MULTIPLAYER_REFERENCE_CAMERA_DISTANCE = 110;
const MULTIPLAYER_WORLD_RADIUS_MIN = 16;
const MULTIPLAYER_WORLD_RADIUS_MAX = 50;

function isSingularityMode(mode) {
    return ['singularity', 'vortex', 'blackHole'].includes(mode);
}

function applyMouseContextDefault() {
    const shouldEnable = !state.p2pEnabled && isSingularityMode(state.mode);
    state.mouseAttractionEnabled = shouldEnable;
    const toggle = document.getElementById('mouseAttractionToggle');
    if (toggle) toggle.checked = shouldEnable;
    if (typeof updateMouseInteractionLock === 'function') updateMouseInteractionLock();
}

function updateMultiplayerParticleVisualScale() {
    if (!state.p2pEnabled || !material || !camera) return;
    const center = camera.positionCenter || new THREE.Vector3(0, 0, 0);
    const distance = camera.position.distanceTo(center);
    const scale = Math.min(2.6, Math.max(0.7, distance / MULTIPLAYER_REFERENCE_CAMERA_DISTANCE));
    material.size = Math.min(MULTIPLAYER_PARTICLE_MAX_SIZE, Math.max(MULTIPLAYER_PARTICLE_MIN_SIZE, MULTIPLAYER_PARTICLE_BASE_SIZE * scale));
    window.particleVisualSize = material.size;
    window.multiplayerPowerScale = scale;
}

function setParticleSize(value, fromUser = false) {
    const n = Math.min(2, Math.max(0.01, Number(value) || 0.2));
    state.particleSize = n;
    const input = document.getElementById('particleSize');
    if (input) input.value = String(n);
    if (material) material.size = n;
    if (fromUser) particleSizeUserTouched = true;
}

function updateForceMixerUI() {
    for (const key of ['mouse','audio','webcam']) {
        const el = document.getElementById(`force${key[0].toUpperCase()+key.slice(1)}`);
        const val = document.getElementById(`force${key[0].toUpperCase()+key.slice(1)}Val`);
        if (el) el.value = state.forceMix[key];
        if (val) val.textContent = `${Math.round(state.forceMix[key] * 100)}%`;
    }
}

function createSeededRandom(seed) {
    let t = (Number(seed) >>> 0) || 1;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function normalizeSeed(value) {
    const n = Number.parseInt(value, 10);
    if (Number.isFinite(n)) return Math.abs(n) >>> 0;
    let h = 2166136261;
    for (const ch of String(value || '133742')) {
        h ^= ch.charCodeAt(0);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function setSeed(value, rebuild = true) {
    state.seed = normalizeSeed(value);
    rng = createSeededRandom(state.seed);
    const el = document.getElementById('seedInput');
    if (el) el.value = String(state.seed);
    if (rebuild && geometry) {
        buildParticles();
        updateTelemetryUI();
    }
}

function calculateChaosMetric() {
    if (!geometry || !positions || state.count <= 0) return 0;
    const sampleCount = Math.min(state.count, 600);
    const stride = Math.max(1, Math.floor(state.count / sampleCount));
    let sum = 0;
    for (let i = 0, n = 0; i < state.count && n < sampleCount; i += stride, n++) {
        const idx = i * 3;
        const x = positions[idx], y = positions[idx + 1], z = positions[idx + 2];
        sum += Math.min(1, Math.sqrt(x*x + y*y + z*z) / 40);
    }
    return sum / sampleCount;
}

function updateTelemetryUI() {
    const fps = document.getElementById('fpsVal');
    const energy = document.getElementById('energyVal');
    const chaos = document.getElementById('chaosVal');
    const quality = document.getElementById('qualityVal');
    if (fps) fps.textContent = `${telemetry.fps.toFixed(0)} FPS`;
    if (energy) energy.textContent = telemetry.energy.toFixed(3);
    if (chaos) chaos.textContent = telemetry.chaos.toFixed(3);
    if (quality) quality.textContent = `${Math.round(telemetry.quality * 100)}%`;
    const ab = document.getElementById('audioBassVal');
    const amh = document.getElementById('audioMidHighVal');
    const beat = document.getElementById('audioBeatVal');
    if (ab) ab.textContent = state.audioBands.bass.toFixed(2);
    if (amh) amh.textContent = `${state.audioBands.mids.toFixed(2)} / ${state.audioBands.highs.toFixed(2)}`;
    if (beat) beat.textContent = `${Math.round(state.audioBeat * 100)}%`;
}

function updateAutoOptimization(now) {
    if (!state.autoOptimize || state.renderMode === 'cpu' || !renderer) return;
    if (now - autoQualityTimer < 2500) return;
    autoQualityTimer = now;
    const current = renderer.getPixelRatio();
    let next = current;
    if (telemetry.fps < 42 && current > 0.75) next = Math.max(0.75, current - 0.25);
    else if (telemetry.fps > 57 && current < Math.min(window.devicePixelRatio || 1, 2)) next = Math.min(Math.min(window.devicePixelRatio || 1, 2), current + 0.25);
    if (next !== current) {
        renderer.setPixelRatio(next);
        telemetry.quality = next / Math.min(window.devicePixelRatio || 1, 2);
    }
}

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


let multiplayerMarkers = new Map();
let multiplayerMarkerClock = 0;

function makePlayerMarkerTexture(label, colorCss, roleIcon) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 96;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorCss || '#00ffcc';
    ctx.beginPath(); ctx.arc(28, 48, 16, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial'; ctx.textBaseline = 'middle';
    ctx.fillText(`${roleIcon || '•'} ${label}`, 54, 48);
    return new THREE.CanvasTexture(canvas);
}

function getMultiplayerPlayerLabel(peerId, allIds) {
    const sorted = [...allIds].sort();
    const idx = Math.max(0, sorted.indexOf(peerId));
    return peerId === state.peerId ? 'Tú' : `Jugador ${idx + 1}`;
}

function getAgentRosterForVisuals() {
    if (typeof getAgentRoster === 'function') return getAgentRoster();
    const roster = {};
    if (state.peerId && window.SwarmAgents) roster[state.peerId] = window.SwarmAgents.getAgentState();
    if (state.remoteAgents) Object.assign(roster, state.remoteAgents);
    state.remotePeers?.forEach((info, id) => { if (info.agent) roster[id] = info.agent; });
    return roster;
}

function updateMultiplayerMarkers(now) {
    if (!scene || !state.p2pEnabled || !window.SwarmAgents) {
        multiplayerMarkers.forEach(m => { m.visible = false; });
        return;
    }
    const roster = getAgentRosterForVisuals();
    const ids = Object.keys(roster);
    const localId = state.peerId;
    const allIds = ids.length ? ids : [localId];
    const activeIds = new Set();

    ids.forEach(id => {
        if (id === localId) return;
        const agent = roster[id];
        if (!agent?.cursor?.active || !agent.role) return;
        activeIds.add(id);
        let marker = multiplayerMarkers.get(id);
        const peerInfo = state.remotePeers?.get(id);
        const colorObj = peerInfo?.color instanceof THREE.Color ? peerInfo.color : calculatePeerColor(id);
        const colorCss = colorObj.getStyle();
        const role = window.SwarmAgents.getRoleById(agent.role);
        if (!marker) {
            const spriteMat = new THREE.SpriteMaterial({
                map: makePlayerMarkerTexture(getMultiplayerPlayerLabel(id, allIds), colorCss, role.icon),
                transparent: true, depthTest: false, depthWrite: false,
                sizeAttenuation: true
            });
            marker = new THREE.Sprite(spriteMat);
            marker.scale.set(8, 3, 1);
            marker.renderOrder = 20;
            scene.add(marker);
            multiplayerMarkers.set(id, marker);
        }
        marker.position.set(Number(agent.cursor.x)||0, Number(agent.cursor.y)||0, Number(agent.cursor.z)||0);
        marker.visible = true;
        marker.userData.role = agent.role;
        marker.userData.energy = agent.energy;
    });
    multiplayerMarkers.forEach((marker, id) => { if (!activeIds.has(id)) marker.visible = false; });
}

function clearMultiplayerMarkers() {
    multiplayerMarkers.forEach(marker => {
        scene?.remove(marker);
        if (marker.material?.map) marker.material.map.dispose();
        marker.material?.dispose();
    });
    multiplayerMarkers.clear();
}

function initEngine() {
    const container = document.getElementById('canvas-container');
    container.innerHTML = '';

    rng = createSeededRandom(state.seed);
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x010103, state.p2pEnabled ? 0.0016 : 0.0045);

    

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, state.p2pEnabled ? 110 : 45);
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
    setParticleSize(state.p2pEnabled ? 0.24 : 0.2, false);
    applyMouseContextDefault();
    buildParticles();
    setupUIEvents();
    updateTelemetryUI();
    initAudio();
    if (typeof setWebcamSensitivity === 'function') setWebcamSensitivity(state.webcamSensitivity);

    if (typeof setupControls === 'function') {
        setupControls(camera, renderer.domElement, null);
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
        const radius = state.p2pEnabled ? (rng() * (MULTIPLAYER_WORLD_RADIUS_MAX - MULTIPLAYER_WORLD_RADIUS_MIN) + MULTIPLAYER_WORLD_RADIUS_MIN) : (rng() * 20 + 2);
        const theta = rng() * Math.PI * 2;
        const phi = Math.acos((rng() * 2) - 1);

        positions[idx] = radius * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = radius * Math.cos(phi);

        originalPositions[idx] = positions[idx];
        originalPositions[idx + 1] = positions[idx + 1];
        originalPositions[idx + 2] = positions[idx + 2];

        targetPositions[idx] = positions[idx];
        targetPositions[idx + 1] = positions[idx + 1];
        targetPositions[idx + 2] = positions[idx + 2];

        const mixRatio = rng();
        colorScratch.copy(activeTheme[0]).lerp(activeTheme[1], mixRatio);
        const color = colorScratch;
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
    window.particleSystem = particleSystem;
    window.particleVisualSize = material.size;
    scene.add(particleSystem);

    const pcVal = document.getElementById('particleCountVal');
    if (pcVal) pcVal.innerText = state.count.toLocaleString();
}

function resetCameraOnly() {
    camera.position.set(0, 0, state.p2pEnabled ? 110 : 45);
    if (!camera.positionCenter) camera.positionCenter = new THREE.Vector3();
    camera.positionCenter.set(0, 0, 0);
    camera.lookAt(camera.positionCenter);
}

function resetViewAndParticles() {
    // En Multiplayer las partículas son estado compartido: jamás se reinician desde este botón.
    if (state.p2pEnabled) {
        resetCameraOnly();
        return;
    }
    const posAttr = geometry.attributes.position;
    const p = posAttr.array;
    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        p[idx] = originalPositions[idx];
        p[idx + 1] = originalPositions[idx + 1];
        p[idx + 2] = originalPositions[idx + 2];
    }
    posAttr.needsUpdate = true;
    resetCameraOnly();
    if (particleSystem) particleSystem.rotation.set(0, 0, 0);
}

function updatePhysics(now = performance.now()) {
    const posAttr = geometry.attributes.position;
    const colAttr = geometry.attributes.color;
    const p = posAttr.array;
    const c = colAttr.array;

    const effectiveSpeed = state.p2pEnabled ? MULTIPLAYER_SPEED : state.speed;
    const effectiveTimeDilation = state.p2pEnabled ? MULTIPLAYER_TIME_DILATION : state.timeDilation;
    const dt = effectiveSpeed * effectiveTimeDilation;
    const attractionFactor = (!state.p2pEnabled && state.mouseAttractionEnabled) ? state.attraction * state.forceMix.mouse : 0;
    if (window.SwarmAgents && state.p2pEnabled) window.SwarmAgents.tick(1 / 60);
    const activeTheme = themes[state.theme] || themes.fire;

    // Obtener reactividad de audio nativa o externa modular
    let bass = 0, mids = 0, highs = 0;
    if (analyser && state.audioEnabled) {
        analyser.getByteFrequencyData(dataArray);
        const binCount = analyser.frequencyBinCount;
        const b1 = Math.max(1, Math.floor(binCount * 0.12));
        const b2 = Math.max(b1 + 1, Math.floor(binCount * 0.45));
        let bassSum = 0, midSum = 0, highSum = 0;
        for (let i = 0; i < b1; i++) bassSum += dataArray[i];
        for (let i = b1; i < b2; i++) midSum += dataArray[i];
        for (let i = b2; i < binCount; i++) highSum += dataArray[i];
        bass = (bassSum / b1) / 255.0;
        mids = (midSum / Math.max(1, b2 - b1)) / 255.0;
        highs = (highSum / Math.max(1, binCount - b2)) / 255.0;
        const energy = bass * 0.55 + mids * 0.30 + highs * 0.15;
        state.audioEnergy += (energy - state.audioEnergy) * 0.18;
        if (bass > 0.58 && state.audioEnergy > 0.28 && audioBeatCooldown <= 0) {
            state.audioBeat = 1;
            audioBeatCooldown = 10;
        } else {
            state.audioBeat *= 0.78;
        }
        if (audioBeatCooldown > 0) audioBeatCooldown--;
    } else if (window.audioReactiveInstance && typeof window.audioReactiveInstance.getBassIntensity === 'function') {
        bass = window.audioReactiveInstance.getBassIntensity();
        state.audioEnergy = bass;
        state.audioBeat *= 0.85;
    } else {
        state.audioBeat *= 0.8;
        state.audioEnergy *= 0.95;
    }
    state.audioBands.bass = bass;
    state.audioBands.mids = mids;
    state.audioBands.highs = highs;

    // Flujo óptico opcional
    let camFlow = { x: 0, y: 0 };
    if (!state.p2pEnabled && state.webcamEnabled && typeof getOpticalFlowVector === 'function') {
        camFlow = getOpticalFlowVector();
        camFlow.x *= state.webcamSensitivity * state.forceMix.webcam;
        camFlow.y *= state.webcamSensitivity * state.forceMix.webcam;
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

        if (window.SwarmAgents && state.p2pEnabled) {
            const agentForce = window.SwarmAgents.getAgentForce(x, y, z, now);
            dx += agentForce.dx;
            dy += agentForce.dy;
            dz += agentForce.dz;
            const remoteForce = window.SwarmAgents.getRemoteAgentForce(x, y, z, now, state.remoteAgents);
            dx += remoteForce.dx;
            dy += remoteForce.dy;
            dz += remoteForce.dz;
            const freezeFactor = window.SwarmAgents.getFreezeFactor(x, y, z, now, state.remoteAgents);
            dx *= freezeFactor;
            dy *= freezeFactor;
            dz *= freezeFactor;
        }

        if (!state.p2pEnabled && (bass > 0 || mids > 0)) {
            const audioMix = state.forceMix.audio;
            const bassPulse = 1.0 + bass * 3.0 * audioMix + state.audioBeat * 1.5 * audioMix;
            dx *= bassPulse;
            dy *= bassPulse;
            dz *= (1.0 + mids * 2.5 + highs * 0.5);
        }

        // Agudos: vibración fina; beat: pulso radial breve.
        if (!state.p2pEnabled && highs > 0.08) {
            const shimmer = Math.sin((i * 0.37) + now * 0.008) * highs * 0.012;
            dx += shimmer; dy -= shimmer * 0.7; dz += shimmer * 0.45;
        }
        if (!state.p2pEnabled && state.audioBeat > 0.02) {
            const invLen = 1 / Math.max(0.5, Math.sqrt(x*x + y*y + z*z));
            const pulse = state.audioBeat * 0.045;
            dx += x * invLen * pulse; dy += y * invLen * pulse; dz += z * invLen * pulse;
        }

        p[idx] += dx * dt;
        p[idx + 1] += dy * dt;
        p[idx + 2] += dz * dt;

        const distSq = p[idx] * p[idx] + p[idx + 1] * p[idx + 1] + p[idx + 2] * p[idx + 2];
        const normDist = Math.min(Math.sqrt(distSq) / 35.0, 1.0);

        colorScratch.copy(activeTheme[0]).lerp(activeTheme[1], normDist);
        const mixedColor = colorScratch;
        const visualBoost = state.p2pEnabled ? 1.32 : 1.0;
        c[idx] = mixedColor.r * visualBoost * (1.0 + highs * 1.5);
        c[idx + 1] = mixedColor.g * visualBoost * (1.0 + highs * 1.5);
        c[idx + 2] = mixedColor.b * visualBoost * (1.0 + highs * 1.5);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
}

function triggerSupernova() {
    const posAttr = geometry.attributes.position;
    const p = posAttr.array;
    for (let i = 0; i < state.count; i++) {
        const idx = i * 3;
        p[idx] += (rng() - 0.5) * 35;
        p[idx + 1] += (rng() - 0.5) * 35;
        p[idx + 2] += (rng() - 0.5) * 35;
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

function updateMIDILearnUI() {
    const out = document.getElementById('midiMappingList');
    if (!out) return;
    const entries = Object.entries(state.midiMappings);
    out.innerHTML = entries.length ? entries.map(([target, cc]) => `CC ${cc} → ${target}`).join(' · ') : 'Sin mappings aprendidos';
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
    const seedInput = document.getElementById('seedInput');
    const seedRandomBtn = document.getElementById('seedRandomBtn');
    const autoOptimizeToggle = document.getElementById('autoOptimizeToggle');

    seedInput?.addEventListener('change', (e) => { if (!state.p2pEnabled) setSeed(e.target.value, true); });
    seedRandomBtn?.addEventListener('click', () => { if (!state.p2pEnabled) setSeed(Math.floor(Math.random() * 0xFFFFFFFF), true); });
    autoOptimizeToggle?.addEventListener('change', (e) => { state.autoOptimize = e.target.checked; });
    const mathSandboxContainer = document.getElementById('mathSandboxContainer');

    modeSelect?.addEventListener('change', (e) => {
        state.mode = e.target.value;
        applyMouseContextDefault();
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
    document.getElementById('speed')?.addEventListener('input', (e) => { if (!state.p2pEnabled) state.speed = parseFloat(e.target.value); else e.target.value = MULTIPLAYER_SPEED; });
    document.getElementById('timeDilation')?.addEventListener('input', (e) => { if (!state.p2pEnabled) state.timeDilation = parseFloat(e.target.value); else e.target.value = MULTIPLAYER_TIME_DILATION; });
    document.getElementById('particleSize')?.addEventListener('input', (e) => {
        setParticleSize(e.target.value, true);
    });
    document.getElementById('attraction')?.addEventListener('input', (e) => state.attraction = parseFloat(e.target.value));
    
    document.getElementById('mouseAttractionToggle')?.addEventListener('change', (e) => {
        if (state.p2pEnabled) { e.target.checked = false; state.mouseAttractionEnabled = false; return; }
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
        if (state.p2pEnabled) { e.target.checked = false; state.midiEnabled = false; return; }
        state.midiEnabled = e.target.checked;
        if (state.midiEnabled && typeof initMIDI === 'function') {
            initMIDI((param, val) => {
                if (param === 'speed') state.speed = val;
                else if (param === 'attraction') state.attraction = val;
                else if (param === 'particleSize') setParticleSize(val, true);
                else if (param === 'timeDilation') state.timeDilation = val;
                const input = document.getElementById(param);
                if (input) input.value = val;
            });
        }
    });

    document.getElementById('midiLearnBtn')?.addEventListener('click', () => {
        const target = document.getElementById('midiLearnTarget')?.value || 'speed';
        if (typeof startMIDILearn !== 'function') return;
        startMIDILearn(target, (cc, learnedTarget) => {
            state.midiMappings[learnedTarget] = cc;
            updateMIDILearnUI();
        });
    });

    document.getElementById('webcamToggle')?.addEventListener('change', async (e) => {
        if (state.p2pEnabled) { e.target.checked = false; state.webcamEnabled = false; return; }
        state.webcamEnabled = e.target.checked;
        if (state.webcamEnabled && typeof initWebcamTracking === 'function') {
            await initWebcamTracking();
        } else {
            const camStat = document.getElementById('camStatusVal');
            if (camStat) camStat.innerText = 'Inactiva';
        }
    });

    // P2P is opt-in. Multiplayer HUD is completely hidden while disabled.
    const p2pToggle = document.getElementById('p2pToggle');
    const setMultiplayerUIVisible = (visible) => {
        ['swarm-counter', 'p2p-panel', 'reconnect-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = visible ? (id === 'reconnect-overlay' ? 'none' : '') : 'none';
        });
    };
    window.setMultiplayerUIVisible = setMultiplayerUIVisible;

    function setControlDisabled(id, disabled) {
        const el = document.getElementById(id);
        if (!el) return;
        el.disabled = disabled;
        el.style.opacity = disabled ? '0.45' : '1';
        el.style.cursor = disabled ? 'not-allowed' : '';
    }

    window.updateMultiplayerLocks = function() {
        const locked = !!state.p2pEnabled;
        ['speed','timeDilation','midiToggle','midiLearnTarget','midiLearnBtn','webcamToggle','webcamSensitivity','entropyInput','btnBin','btnHash','btnExportJSON','btnImportJSON','seedInput','seedRandomBtn','forceMouse','forceAudio','forceWebcam'].forEach(id => setControlDisabled(id, locked));
        const mode = document.getElementById('mode');
        if (mode) { mode.disabled = locked; mode.style.opacity = locked ? '0.55' : '1'; }
        const density = document.getElementById('particleDensity');
        if (density) { density.disabled = locked; density.style.opacity = locked ? '0.5' : '1'; }
        const reset = document.getElementById('btnResetView');
        if (reset) {
            reset.textContent = locked ? '📷 Reiniciar Cámara' : '🔄 Reiniciar Posiciones & Cámara';
            reset.title = locked ? 'En Multiplayer solo reinicia la cámara.' : '';
        }
        const audio = document.getElementById('audioToggle');
        if (audio) { audio.disabled = locked; audio.style.opacity = locked ? '0.45' : '1'; }
        const forceMouse = document.getElementById('forceMouse');
        const forceAudio = document.getElementById('forceAudio');
        const forceWebcam = document.getElementById('forceWebcam');
        [forceMouse, forceAudio, forceWebcam].forEach(el => { if (el) { el.disabled = locked; el.style.opacity = locked ? '0.45' : '1'; } });
        const usePower = document.getElementById('usePowerBtn');
        if (usePower) { usePower.disabled = true; usePower.style.display = 'none'; }
    };
    window.updateMouseInteractionLock = window.updateMultiplayerLocks;

    p2pToggle?.addEventListener('change', (e) => {
        state.p2pEnabled = !!e.target.checked;
        if (state.p2pEnabled) {
            state.mode = 'swarm';
            state.count = MULTIPLAYER_PARTICLE_COUNT;
            setSeed(Math.floor(Math.random() * 0xFFFFFFFF), false);
            rng = createSeededRandom(state.seed);
            state.speed = MULTIPLAYER_SPEED;
            state.timeDilation = MULTIPLAYER_TIME_DILATION;
            state.midiEnabled = false;
            state.webcamEnabled = false;
            state.audioEnabled = false;
            state.audioEnergy = 0;
            state.audioBeat = 0;
            state.forceMix.mouse = 0;
            state.forceMix.audio = 0;
            state.forceMix.webcam = 0;
            if (scene && scene.fog) scene.fog.density = 0.0016;
            const mode = document.getElementById('mode'); if (mode) mode.value = 'swarm';
            const speed = document.getElementById('speed'); if (speed) speed.value = MULTIPLAYER_SPEED;
            const dilation = document.getElementById('timeDilation'); if (dilation) dilation.value = MULTIPLAYER_TIME_DILATION;
            const midi = document.getElementById('midiToggle'); if (midi) midi.checked = false;
            const webcam = document.getElementById('webcamToggle'); if (webcam) webcam.checked = false;
            buildParticles();
            camera.position.set(0, 0, 110);
            camera.positionCenter.set(0, 0, 0);
            camera.lookAt(camera.positionCenter);
            setParticleSize(MULTIPLAYER_PARTICLE_BASE_SIZE, false);
            updateMultiplayerParticleVisualScale();
            if (window.SwarmAgents) window.SwarmAgents.ensureLocalRole(true);
            applyMouseContextDefault();
            setMultiplayerUIVisible(true);
            updateMultiplayerLocks();
            if (typeof initP2P === 'function') initP2P();
        } else {
            clearMultiplayerMarkers();
            if (typeof stopP2P === 'function') stopP2P();
            state.forceMix.mouse = 1;
            state.forceMix.audio = 1;
            state.forceMix.webcam = 1;
            const audio = document.getElementById('audioToggle'); if (audio) audio.checked = false;
            const webcam = document.getElementById('webcamToggle'); if (webcam) webcam.checked = false;
            if (scene && scene.fog) scene.fog.density = 0.0045;
            if (state.count === MULTIPLAYER_PARTICLE_COUNT) {
                state.count = parseInt(document.getElementById('particleDensity')?.value || '6000', 10);
                buildParticles();
            }
            setParticleSize(0.2, false);
            applyMouseContextDefault();
            setMultiplayerUIVisible(false);
            updateMultiplayerLocks();
        }
    });
    setMultiplayerUIVisible(!!state.p2pEnabled);
    updateMultiplayerLocks();

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
        if (state.p2pEnabled) { e.target.value = ''; return; }
        state.entropyInputText = e.target.value;
        if (typeof applyCryptoEntropyInjection === 'function') {
            const res = await applyCryptoEntropyInjection(state.entropyInputText, state.count, targetPositions);
            const entVal = document.getElementById('entropyVal');
            if (entVal) entVal.innerText = `${res.entropy.toFixed(2)} bit`;
        }
    });

    document.getElementById('btnBin')?.addEventListener('click', async () => {
        if (state.p2pEnabled || !state.entropyInputText) return;
        const binStr = Array.from(state.entropyInputText).map(c => c.charCodeAt(0).toString(2)).join('');
        if (typeof applyCryptoEntropyInjection === 'function') {
            const res = await applyCryptoEntropyInjection(binStr, state.count, targetPositions);
            const entVal = document.getElementById('entropyVal');
            if (entVal) entVal.innerText = `${res.entropy.toFixed(2)} bit`;
        }
    });

    document.getElementById('btnHash')?.addEventListener('click', async () => {
        if (state.p2pEnabled || !state.entropyInputText) return;
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
        link.download = `micro-universo-preset-v1.6.json`;
        link.href = url;
        link.click();
    });

    const fileInput = document.getElementById('jsonFileInput');
    document.getElementById('btnImportJSON')?.addEventListener('click', () => { if (!state.p2pEnabled) fileInput?.click(); });
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
                setParticleSize(state.particleSize, false);
                if (document.getElementById('attraction')) document.getElementById('attraction').value = state.attraction;
                if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = state.theme;
                if (document.getElementById('autoRotate')) document.getElementById('autoRotate').checked = state.autoRotate;
                if (document.getElementById('seedInput')) document.getElementById('seedInput').value = state.seed;
                if (document.getElementById('autoOptimizeToggle')) document.getElementById('autoOptimizeToggle').checked = state.autoOptimize;
                if (document.getElementById('webcamSensitivity')) document.getElementById('webcamSensitivity').value = state.webcamSensitivity;
                rng = createSeededRandom(state.seed);
                buildParticles();
            } catch (err) {
                alert("Error al cargar el preset JSON.");
            }
        };
        reader.readAsText(file);
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

    updateMIDILearnUI();
    updateForceMixerUI();

    ['Mouse','Audio','Webcam'].forEach((label) => {
        const key = label.toLowerCase();
        const el = document.getElementById(`force${label}`);
        el?.addEventListener('input', (e) => {
            state.forceMix[key] = Math.min(1, Math.max(0, parseFloat(e.target.value)));
            updateForceMixerUI();
        });
    });

    document.getElementById('renderTierSelect')?.addEventListener('change', (e) => {
    state.renderMode = e.target.value;
    updateAdaptiveBudget(renderer);
    buildParticles();
    });
}

function animate(now = performance.now()) {
    requestAnimationFrame(animate);

    const delta = now - telemetry.lastTime;
    telemetry.lastTime = now;
    if (delta > 0 && delta < 1000) {
        const instantFps = 1000 / delta;
        telemetry.fps += (instantFps - telemetry.fps) * 0.08;
        telemetry.frameMs += (delta - telemetry.frameMs) * 0.08;
    }

    if (state.autoRotate && !state.p2pEnabled && particleSystem) {
        particleSystem.rotation.y += 0.002;
    }

    updatePhysics(now);
    updateMultiplayerParticleVisualScale();
    updateMultiplayerMarkers(now);

    // Métricas ligeras: se calculan pocas veces por segundo para no añadir carga visible.
    if ((telemetry.frames++ % 20) === 0) {
        telemetry.chaos = calculateChaosMetric();
        telemetry.energy = Math.min(99.999, Math.abs(state.speed) * (1 + telemetry.chaos * 10));
        telemetry.quality = renderer ? renderer.getPixelRatio() / Math.min(window.devicePixelRatio || 1, 2) : 1;
        updateTelemetryUI();
    }
    updateAutoOptimization(now);

    if (typeof renderSceneMaster === 'function') {
        renderSceneMaster(renderer, scene, camera);
    } else {
        renderer.render(scene, camera);
    }
}

window.addEventListener('DOMContentLoaded', initEngine);