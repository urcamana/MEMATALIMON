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
    if (window.mouse3D && window.mouse3D.active) {
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
    const activePeers = (typeof state !== 'undefined' && state.remotePeers) ? state.remotePeers.size + 1 : 1;
    const clusterIndex = (typeof particleIndex !== 'undefined' ? particleIndex : 0) % Math.max(1, activePeers);
    const angleOffset = clusterIndex * ((Math.PI * 2) / Math.max(1, activePeers));
    const orbitRadius = 4.0;
    
    const cx = Math.cos(time * 0.6 + angleOffset) * orbitRadius;
    const cz = Math.sin(time * 0.6 + angleOffset) * orbitRadius;
    const cy = Math.sin(time * 1.2 + clusterIndex) * 1.5;
    
    dx = (cx - x) * 0.03;
    dy = (cy - y) * 0.03;
    dz = (cz - z) * 0.03;
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