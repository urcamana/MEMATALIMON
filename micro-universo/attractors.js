/**
 * MICRO-UNIVERSO v1.5 - Attractors & Custom Math Sandbox Module
 * Enhanced attraction forces, stable fluid models, and math presets.
 */

let customMathCompiled = {
    dx: (x, y, z) => Math.sin(y) * z,
    dy: (x, y, z) => Math.cos(x) * z,
    dz: (x, y, z) => Math.sin(x) * y
};

function updateCustomMathExpression(exprStr) {
    try {
        const parts = exprStr.split(',');
        if (parts.length === 3) {
            customMathCompiled.dx = new Function('x', 'y', 'z', `try { return ${parts[0]}; } catch(e) { return 0; }`);
            customMathCompiled.dy = new Function('x', 'y', 'z', `try { return ${parts[1]}; } catch(e) { return 0; }`);
            customMathCompiled.dz = new Function('x', 'y', 'z', `try { return ${parts[2]}; } catch(e) { return 0; }`);
        }
    } catch (e) {
        console.warn("Error parsing custom math expression:", e);
    }
}

function calculateAttractorVector(x, y, z, mode, originalPos, attractionFactor, targetPos) {
    // Normalizar por si el selector manda el texto completo o ID
    if (typeof mode === 'string' && (mode.includes('Singularidad') || mode === 'singularity')) {
        mode = 'singularity';
    }

    let dx = 0, dy = 0, dz = 0;

    // Amplified mouse interaction influence (multiplied range for intense push/pull)
    let mouseDx = 0, mouseDy = 0, mouseDz = 0;
    if (window.mouse3D && window.mouse3D.active && typeof state !== 'undefined' && state.mouseAttractionEnabled !== false) {
        const mDistX = window.mouse3D.x - x;
        const mDistY = window.mouse3D.y - y;
        const mDistZ = window.mouse3D.z - z;
        const distSq = mDistX * mDistX + mDistY * mDistY + mDistZ * mDistZ + 0.5;
        const mouseForce = (attractionFactor * 450.0) / distSq;
        mouseDx = mDistX * mouseForce;
        mouseDy = mDistY * mouseForce;
        mouseDz = mDistZ * mouseForce;
    }

    switch (mode) {
        case 'singularity': {
            // Núcleo denso volumétrico equilibrado (evita colapso a un punto ciego)
            const rSq = x * x + y * y + z * z + 1.5;
            const r = Math.sqrt(rSq);
            const strength = 3.5 * Math.abs(attractionFactor || 1.0);
            const spin = 1.4 / (r * 0.2 + 1.0);
            dx = (-x / r) * strength - y * spin;
            dy = (-y / r) * strength + x * spin;
            dz = (-z / r) * strength * 0.7;
            break;
        }
        // Añadir al switch(state.mode) en attractors.js
// Reemplaza tu case 'swarm' actual en attractors.js por este:
case 'swarm': {
    const time = performance.now() * 0.001;
    // En Multiplayer no hay fuerza de retorno al centro: el universo queda abierto.
    // Se conserva únicamente un campo orbital suave para que las partículas no queden estáticas.
    if (typeof state !== 'undefined' && state.p2pEnabled) {
        const tangential = 0.018;
        const vertical = 0.0025;
        dx = -y * tangential + Math.sin(z * 0.06 + time * 0.8) * vertical;
        dy =  x * tangential + Math.cos(z * 0.05 - time * 0.6) * vertical;
        dz = Math.sin((x + y) * 0.035 + time) * vertical;
    } else {
        const orbitRadius = 4.0;
        let cx = Math.cos(time * 0.6) * orbitRadius;
        let cz = Math.sin(time * 0.6) * orbitRadius;
        let cy = Math.sin(time * 1.2) * 1.5;
        if (window.mouse3D && window.mouse3D.active && typeof state !== 'undefined' && state.mouseAttractionEnabled !== false) {
            const pull = 0.15 * Math.max(0.5, attractionFactor || 1.0);
            cx += (window.mouse3D.x - cx) * pull;
            cy += (window.mouse3D.y - cy) * pull;
            cz += (window.mouse3D.z - cz) * pull;
        }
        dx = (cx - x) * 0.08;
        dy = (cy - y) * 0.08;
        dz = (cz - z) * 0.08;
    }
    break;
}
        case 'lorenz': {
            const sigma = 10, rho = 28, beta = 8 / 3;
            dx = sigma * (y - x);
            dy = x * (rho - z) - y;
            dz = x * y - beta * z;
            break;
        }
        case 'aizawa': {
            const a = 0.95, b = 0.7, c_val = 0.6, d = 3.5, e = 0.25, f = 0.1;
            dx = (z - b) * x - d * y;
            dy = d * x + (z - b) * y;
            dz = c_val + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * (x * x * x);
            break;
        }
        case 'thomas': {
            const b = 0.208186;
            dx = Math.sin(y) - b * x;
            dy = Math.sin(z) - b * y;
            dz = Math.sin(x) - b * z;
            break;
        }
        case 'chen': {
            const a = 35, b = 3, c_val = 28;
            dx = a * (y - x);
            dy = (c_val - a) * x - x * z + c_val * y;
            dz = x * y - b * z;
            break;
        }
        case 'halvorsen': {
            const a = 1.89;
            dx = -a * x - 4 * y - 4 * z - y * y;
            dy = -a * y - 4 * z - 4 * x - z * z;
            dz = -a * z - 4 * x - 4 * y - x * x;
            break;
        }
        case 'dadras': {
            const p1 = 3, q = 2.7, r = 1.7, s = 2, e = 9;
            dx = y - p1 * x + q * y * z;
            dy = r * y - x * z + z;
            dz = s * x * y - e * z;
            break;
        }
        case 'blackHole': {
            // Agujero negro: espiral de acreción estable.
            // La fuerza combina caída radial + velocidad tangencial alrededor del eje Y.
            // Se mantiene suficiente tiempo en el disco para que la espiral sea visible.
            const rawR2 = x*x + y*y + z*z;
            const r = Math.sqrt(rawR2) + 0.0001;
            const softR = r + 2.6;

            // Caída hacia el horizonte: más intensa al acercarse, pero suave a distancia.
            const radial = 5.6 / softR;

            // Rotación orbital: genera la trayectoria helicoidal/espiral.
            // El eje de giro es Y; el disco de acreción vive principalmente en XZ.
            const tangential = 8.8 / (r + 3.0);

            // Compresión vertical suave hacia el plano ecuatorial del disco.
            const vertical = 0.055 + 0.12 / (r + 2.0);

            // Vector radial horizontal (plano XZ) y tangente horizontal.
            const hR = Math.sqrt(x*x + z*z) + 0.0001;
            const rx = x / hR;
            const rz = z / hR;
            const tx = -z / hR;
            const tz = x / hR;

            dx = -rx * radial + tx * tangential;
            dz = -rz * radial + tz * tangential;
            dy = -y * vertical;

            // Cerca del horizonte, la caída aumenta progresivamente.
            if (r < 3.2) {
                const capture = (3.2 - r) * 0.95;
                dx += -rx * capture;
                dz += -rz * capture;
                dy += -y * capture * 0.45;
            }
            break;
        }
        case 'doubleVortex': {
            const c = x >= 0 ? 5.0 : -5.0;
            const lx = x - c;
            const r2 = lx*lx + y*y + z*z + 1.2;
            dx = -lx * 1.2 - y * (2.0 / r2);
            dy = -y * 1.2 + lx * (2.0 / r2);
            dz = -z * 0.7 + Math.sin(x * 0.35) * 0.5;
            break;
        }
        case 'harmonic': {
            dx = -0.9 * x + Math.sin(y * 1.4) * 1.4;
            dy = -0.9 * y + Math.sin(z * 1.2) * 1.4;
            dz = -0.9 * z + Math.sin(x * 1.1) * 1.4;
            break;
        }
        case 'plasma': {
            const r = Math.sqrt(x*x + y*y + z*z) + 0.001;
            dx = Math.sin(y * 0.65 + z * 0.25) * 2.2 - x * 0.055;
            dy = Math.cos(z * 0.55 + x * 0.22) * 2.2 - y * 0.055;
            dz = Math.sin(x * 0.45 + y * 0.3) * 2.2 - z * 0.045 + Math.sin(r) * 0.35;
            break;
        }
        case 'strange': {
            dx = Math.sin(y) * 1.8 - x * 0.12;
            dy = Math.sin(z) * 1.8 - y * 0.12;
            dz = Math.sin(x) * 1.8 - z * 0.12 + Math.sin(x*y*0.12) * 0.8;
            break;
        }
        case 'navierStokes': { // Stable simplified pseudo-fluid vortex
            const speedScale = 0.05;
            dx = -Math.sin(y * speedScale) * 3.0 - (x * 0.05);
            dy = Math.sin(x * speedScale) * 3.0 - (y * 0.05);
            dz = Math.cos(z * speedScale) * 2.0 - (z * 0.05);
            break;
        }
        case 'cryptoPhase': {
            dx = (targetPos.x - x) * 2.5;
            dy = (targetPos.y - y) * 2.5;
            dz = (targetPos.z - z) * 2.5;
            dx += Math.sin(y * 0.1) * 0.2;
            dy += Math.cos(z * 0.1) * 0.2;
            dz += Math.sin(x * 0.1) * 0.2;
            break;
        }
        case 'vectorField': {
            dx = Math.sin(y * 0.1) + Math.cos(z * 0.1);
            dy = Math.sin(z * 0.1) + Math.cos(x * 0.1);
            dz = Math.sin(x * 0.1) + Math.cos(y * 0.1);
            break;
        }
        case 'waves': {
            dx = Math.sin(y * 0.2) * 1.5;
            dy = Math.cos(x * 0.2) * 1.5;
            dz = Math.sin(x * 0.1 + y * 0.1) * 1.5;
            break;
        }
        case 'customMath': {
            dx = customMathCompiled.dx(x, y, z);
            dy = customMathCompiled.dy(x, y, z);
            dz = customMathCompiled.dz(x, y, z);
            break;
        }
        default: { // Galactic Vortex clásico
            const r = Math.sqrt(x * x + y * y + z * z) + 0.001;
            dx = -y / r + (originalPos.x - x) * Math.abs(attractionFactor);
            dy = x / r + (originalPos.y - y) * Math.abs(attractionFactor);
            dz = -z * 0.02 + (originalPos.z - z) * Math.abs(attractionFactor);
            break;
        }
    }

    dx += mouseDx;
    dy += mouseDy;
    dz += mouseDz;

    return { dx, dy, dz };
}