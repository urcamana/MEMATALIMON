/**
 * OVILLO DE MANASSERO — Prototype 7 / 3D Soft-Bounce Yarn
 *
 * Geometría visual: una costura continua que recorre una envolvente esférica
 * y realiza pasadas suaves de extremo a extremo. Cada pasada cambia de plano
 * mediante una secuencia cuasi-periódica 3D, por lo que nunca vuelve exactamente
 * por el mismo lugar. La trayectoria entra hacia el núcleo y vuelve a salir por
 * otra zona, con curvatura suave en los extremos en lugar de rebotes secos.
 *
 * N es un parámetro matemático del modelo. El render se muestrea con las
 * partículas disponibles; no se crea un objeto por giro.
 */

const MANASSERO_COIL = Object.freeze({
    N_MIN: 1000001,
    DEFAULT_N: 1000001,
    DEFAULT_RMAX: 18.0,
    DEFAULT_RMIN_RATIO: 0.08,
    DEFAULT_COMPACTNESS: 0.82,
    DEFAULT_THICKNESS: 0.35,
    DEFAULT_PHASE: Math.PI / 4,
    DEFAULT_SAMPLES: 1500,
    DEFAULT_STRANDS: 512,
    // Separación angular entre pasadas. No es una torsión global fija:
    // interviene en la orientación de cada giro y se combina con otras fases.
    STEP_ANGLE: 33 * Math.PI / 180
});

const manasseroCoilState = {
    N: MANASSERO_COIL.DEFAULT_N,
    Rmax: MANASSERO_COIL.DEFAULT_RMAX,
    RminRatio: MANASSERO_COIL.DEFAULT_RMIN_RATIO,
    compactness: MANASSERO_COIL.DEFAULT_COMPACTNESS,
    thickness: MANASSERO_COIL.DEFAULT_THICKNESS,
    phase: MANASSERO_COIL.DEFAULT_PHASE,
    samples: MANASSERO_COIL.DEFAULT_SAMPLES,
    strands: MANASSERO_COIL.DEFAULT_STRANDS,
    uMax: 2 * Math.PI * MANASSERO_COIL.DEFAULT_N
};

function clampManasseroN(value) {
    const n = Math.floor(Number(value));
    return Number.isFinite(n) ? Math.max(MANASSERO_COIL.N_MIN, n) : MANASSERO_COIL.N_MIN;
}
function setManasseroCoilN(value) {
    manasseroCoilState.N = clampManasseroN(value);
    manasseroCoilState.uMax = 2 * Math.PI * manasseroCoilState.N;
    return manasseroCoilState.N;
}
function clamp01(x) { return Math.max(0, Math.min(1, x)); }

function smoothstep01(x) {
    x = clamp01(x);
    return x * x * (3 - 2 * x);
}

function normalize3(x, y, z) {
    const len = Math.hypot(x, y, z) || 1;
    return { x: x / len, y: y / len, z: z / len };
}

function cross3(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

function dot3(a, b) { return a.x * b.x + a.y * b.y + a.z * b.z; }

function mix3(a, b, t) {
    return normalize3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t
    );
}

// Dirección 3D determinista para una pasada. Las frecuencias no coinciden,
// evitando que el ovillo termine organizado alrededor de un único eje.
function manasseroDirection(turn, phaseOffset = 0) {
    const s = manasseroCoilState;
    const k = turn + phaseOffset;
    const a = s.phase + k * 0.017 + Math.sin(k * 0.000031) * 0.65;
    const b = k * 0.0137 + s.phase * 0.7 + Math.sin(k * 0.000021) * 0.48;
    const c = k * 0.0091 + s.phase * 1.3 + Math.cos(k * 0.000017) * 0.57;

    const raw = {
        x: Math.sin(a) * Math.cos(b) + 0.36 * Math.sin(c),
        y: Math.sin(b) * Math.sin(c) + 0.31 * Math.cos(a),
        z: Math.cos(a) * Math.cos(c) + 0.34 * Math.sin(b)
    };
    return normalize3(raw.x, raw.y, raw.z);
}

function manasseroPerpendicular(dir, phase) {
    // Elegimos un eje auxiliar que no sea casi paralelo a dir.
    const aux = Math.abs(dir.y) < 0.82 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
    let side = normalize3(
        aux.y * dir.z - aux.z * dir.y,
        aux.z * dir.x - aux.x * dir.z,
        aux.x * dir.y - aux.y * dir.x
    );
    const up = normalize3(
        dir.y * side.z - dir.z * side.y,
        dir.z * side.x - dir.x * side.z,
        dir.x * side.y - dir.y * side.x
    );
    const cp = Math.cos(phase), sp = Math.sin(phase);
    return normalize3(
        side.x * cp + up.x * sp,
        side.y * cp + up.y * sp,
        side.z * cp + up.z * sp
    );
}

function manasseroFigure8Point(u, strandPhase = 0, out = null) {
    const s = manasseroCoilState;
    const target = out || { x: 0, y: 0, z: 0, w: 0 };

    // Giro completo dentro del dominio N·2π.
    const turnFloat = u / (2 * Math.PI);
    const turn = Math.floor(turnFloat);
    const local = turnFloat - turn;
    const q = local * Math.PI * 2 + strandPhase * 0.001;

    // Tres puntos de salida/retorno sobre la envolvente. Cada pasada cambia
    // de orientación ~33° pero con una modulación 3D que evita repetir el plano.
    const d0 = manasseroDirection(turn, strandPhase * 0.17);
    const dMidBase = manasseroDirection(turn + 0.5, strandPhase * 0.31);
    const d1 = manasseroDirection(turn + 1.0, strandPhase * 0.53);

    // Forzamos que cada tramo tenga una dirección de salida distinta, sin
    // obligar a un eje privilegiado. La rotación STEP_ANGLE se aplica alrededor
    // de una normal variable para producir el "desplazamiento de 33°".
    const axis0 = manasseroPerpendicular(d0, turn * 0.37 + strandPhase);
    const axis1 = manasseroPerpendicular(d1, turn * 0.29 + strandPhase * 0.7);

    function rotateVec(v, axis, angle) {
        const c = Math.cos(angle), sn = Math.sin(angle);
        const d = dot3(v, axis);
        const cr = cross3(axis, v);
        return normalize3(
            v.x * c + cr.x * sn + axis.x * d * (1 - c),
            v.y * c + cr.y * sn + axis.y * d * (1 - c),
            v.z * c + cr.z * sn + axis.z * d * (1 - c)
        );
    }

    const d0r = rotateVec(d0, axis0, MANASSERO_COIL.STEP_ANGLE + 0.12 * Math.sin(turn * 0.071));
    const d1r = rotateVec(d1, axis1, -MANASSERO_COIL.STEP_ANGLE + 0.10 * Math.cos(turn * 0.053));
    const dm = mix3(dMidBase, rotateVec(d0r, axis1, 0.42 * MANASSERO_COIL.STEP_ANGLE), 0.48);

    // Dos lóbulos por pasada: radio máximo → mínimo → máximo → mínimo → máximo.
    // El mínimo nunca es cero, por lo que el centro es un volumen ocupado y no
    // un agujero. El sesgo hacia radios pequeños aumenta la densidad interna.
    const rMin = Math.max(0.35, s.Rmax * s.RminRatio);
    const compact = 0.55 + 0.45 * s.compactness;
    const radialWave = Math.pow(Math.cos(q * 2), 2);
    const radialBias = 0.82 + 0.18 * Math.pow(radialWave, compact);
    const r = rMin + (s.Rmax - rMin) * radialWave * radialBias;

    // Dirección de la costura: tres arcos Bézier suaves, con una desviación
    // transversal que hace que el paso por el interior tenga profundidad real.
    let dir;
    let bend;
    if (local < 0.5) {
        const t = smoothstep01(local * 2);
        dir = mix3(d0r, dm, t);
        bend = manasseroPerpendicular(dir, turn * 0.61 + strandPhase + t * 1.7);
    } else {
        const t = smoothstep01((local - 0.5) * 2);
        dir = mix3(dm, d1r, t);
        bend = manasseroPerpendicular(dir, turn * 0.61 + strandPhase + 1.7 + t * 1.9);
    }

    // Curvatura elíptica cerca de los extremos: la dirección cambia antes de
    // alcanzar la pared y vuelve al volumen de forma suave.
    const edgeCurve = Math.pow(Math.sin(Math.PI * local), 0.72);
    const lateral = Math.sin(Math.PI * local) * (0.28 + 0.10 * Math.sin(turn * 0.11));
    const depth = Math.sin(Math.PI * local * 2 + strandPhase) * 0.18;

    const baseX = dir.x * r + bend.x * s.Rmax * lateral * edgeCurve;
    const baseY = dir.y * r + bend.y * s.Rmax * lateral * edgeCurve;
    const baseZ = dir.z * r + bend.z * s.Rmax * lateral * edgeCurve;

    // Espesor de la brana/hilo. La sección también rota con la pasada, pero no
    // domina la geometría global.
    const sectionAngle = q * 0.5 + turn * 0.37 + strandPhase;
    const section = manasseroPerpendicular(dir, sectionAngle);
    const section2 = cross3(dir, section);
    const strandRadius = s.thickness * (0.45 + 0.55 * Math.sin(q * 0.5 + strandPhase) ** 2);
    const crossA = strandRadius * Math.cos(sectionAngle * 1.17);
    const crossB = strandRadius * Math.sin(sectionAngle * 1.17);

    target.x = baseX + section.x * crossA + section2.x * crossB + dir.x * depth;
    target.y = baseY + section.y * crossA + section2.y * crossB + dir.y * depth;
    target.z = baseZ + section.z * crossA + section2.z * crossB + dir.z * depth;

    // Coordenada 4D conservada para la API de proyección existente.
    target.w = crossB * Math.sin(sectionAngle + turn * 0.013);
    target.turn = turn;
    target.local = q;
    target.radius = r;
    return target;
}

function manasseroVolumetricPoint(u, v = 0, strandPhase = 0, out = null) {
    const p = manasseroFigure8Point(u, strandPhase, out);
    if (v) {
        const turn = u / (2 * Math.PI);
        const local = turn - Math.floor(turn);
        const dir = manasseroDirection(Math.floor(turn), strandPhase * 0.17);
        const side = manasseroPerpendicular(dir, local * Math.PI * 2 + strandPhase);
        const side2 = cross3(dir, side);
        p.x += side.x * v * 0.75 + side2.x * v * 0.35;
        p.y += side.y * v * 0.75 + side2.y * v * 0.35;
        p.z += side.z * v * 0.75 + side2.z * v * 0.35;
    }
    return p;
}

function manasseroParticlePoint(u, v = 0, strandPhase = 0, out = null) {
    return projectManassero5D(manasseroVolumetricPoint(u, v, strandPhase, out), out);
}

function manasseroParticleTarget(u, v = 0, strandIndex = 0, strandCount = MANASSERO_COIL.DEFAULT_STRANDS, out = null) {
    const count = Math.max(1, strandCount | 0);
    const phase = (strandIndex / count) * Math.PI * 2;
    return manasseroParticlePoint(u, v, phase, out);
}

function manasseroCoilPoint(u, v = 0, out = null) {
    return manasseroVolumetricPoint(u, v, 0, out);
}

function projectManassero5D(point, out = null) {
    const t = out || { x: 0, y: 0, z: 0 };
    const a = manasseroCoilState.phase;
    const w = point.w || 0;
    t.x = point.x + 0.045 * w * Math.cos(a);
    t.y = point.y + 0.045 * w * Math.sin(a);
    t.z = point.z + 0.065 * w;
    return t;
}

function manasseroCoilVisiblePoint(index, count, v = 0, out = null) {
    const safeCount = Math.max(1, count | 0);
    const t = safeCount === 1 ? 0 : index / (safeCount - 1);
    return projectManassero5D(manasseroCoilPoint(t * manasseroCoilState.uMax, v), out);
}

function manasseroCoilTangent(u, v = 0, out = null) {
    const target = out || { x: 0, y: 0, z: 0 };
    const s = manasseroCoilState;
    const eps = Math.max(1e-5, Math.min(0.01, 2 * Math.PI * 1e-4));
    const a = projectManassero5D(manasseroCoilPoint(Math.max(0, u - eps), v));
    const b = projectManassero5D(manasseroCoilPoint(Math.min(s.uMax, u + eps), v));
    target.x = b.x - a.x; target.y = b.y - a.y; target.z = b.z - a.z;
    const len = Math.hypot(target.x, target.y, target.z) || 1;
    target.x /= len; target.y /= len; target.z /= len;
    return target;
}

function updateManasseroCoilFromUI() {
    const nEl = document.getElementById('ovilloN');
    const rEl = document.getElementById('ovilloRmax');
    const minEl = document.getElementById('ovilloRmin');
    const dEl = document.getElementById('ovilloDrop');
    const tEl = document.getElementById('ovilloThickness');
    const pEl = document.getElementById('ovilloPhase');
    if (nEl) { const n = setManasseroCoilN(nEl.value); nEl.value = String(n); }
    if (rEl) manasseroCoilState.Rmax = Number(rEl.value);
    if (minEl) manasseroCoilState.RminRatio = clamp01(Number(minEl.value));
    if (dEl) manasseroCoilState.compactness = Math.max(0.55, clamp01(Number(dEl.value) / 12));
    if (tEl) manasseroCoilState.thickness = Number(tEl.value);
    if (pEl) manasseroCoilState.phase = Number(pEl.value);

    const status = document.getElementById('ovilloStatus');
    if (status) status.textContent = `N=${manasseroCoilState.N.toLocaleString('es-AR')} · trayectoria 3D de rebote suave · Rmin/Rmax · giro ${Math.round(MANASSERO_COIL.STEP_ANGLE * 180 / Math.PI)}° variable · entradas/salidas X/Y/Z · centro denso`;
    const minVal = document.getElementById('ovilloRminVal');
    if (minVal) minVal.textContent = `${Math.round(manasseroCoilState.RminRatio * 100)}% Rmax`;
}

function initManasseroCoilUI() {
    ['ovilloN','ovilloRmax','ovilloRmin','ovilloDrop','ovilloThickness','ovilloPhase'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            updateManasseroCoilFromUI();
            if (typeof updateManasseroCoilVisual === 'function' && state.mode === 'manasseroCoil') updateManasseroCoilVisual();
        });
    });
    updateManasseroCoilFromUI();
}

let manasseroCoilVisual = null;
function buildManasseroCoilVisual(scene, options = {}) {
    removeManasseroCoilVisual(scene);
    return null;
}
function removeManasseroCoilVisual(scene) {
    if (!manasseroCoilVisual) return;
    scene?.remove(manasseroCoilVisual);
    manasseroCoilVisual.traverse(obj => { obj.geometry?.dispose(); obj.material?.dispose(); });
    manasseroCoilVisual = null;
    window.__manasseroCoilVisual = null;
}

window.manasseroCoilState = manasseroCoilState;
window.manasseroCoilPoint = manasseroCoilPoint;
window.manasseroParticlePoint = manasseroParticlePoint;
window.manasseroParticleTarget = manasseroParticleTarget;
window.manasseroVolumetricPoint = manasseroVolumetricPoint;
window.projectManassero5D = projectManassero5D;
window.manasseroCoilVisiblePoint = manasseroCoilVisiblePoint;
window.manasseroCoilTangent = manasseroCoilTangent;
window.initManasseroCoilUI = initManasseroCoilUI;
window.updateManasseroCoilFromUI = updateManasseroCoilFromUI;
window.setManasseroCoilN = setManasseroCoilN;
window.buildManasseroCoilVisual = buildManasseroCoilVisual;
window.removeManasseroCoilVisual = removeManasseroCoilVisual;
