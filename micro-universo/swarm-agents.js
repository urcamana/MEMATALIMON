/* Micro-Universo v1.9 - Multiplayer Chaos Laboratory: poderes globales */
(function () {
    const ROLES = [
        { id:'gravity', name:'Gravedad', icon:'🪐', color:0x66ccff },
        { id:'repulsion', name:'Repulsión', icon:'↔️', color:0xff6699 },
        { id:'vortex', name:'Vórtice', icon:'🌀', color:0xcc66ff },
        { id:'suction', name:'Succión', icon:'🕳️', color:0x9966ff },
        { id:'explosion', name:'Explosión', icon:'💥', color:0xffaa33 },
        { id:'turbulence', name:'Turbulencia', icon:'🌪️', color:0x66ffcc },
        { id:'magnet', name:'Magnetismo', icon:'🧲', color:0x66aaff },
        { id:'freeze', name:'Freeze', icon:'🧊', color:0x99eeff },
        { id:'accelerator', name:'Acelerador', icon:'⚡', color:0xffff66 },
        { id:'stabilizer', name:'Estabilizador', icon:'🛡️', color:0x66ff99 },
        { id:'chaos', name:'Chaos Amplifier', icon:'☢️', color:0xff3366 },
        { id:'shockwave', name:'Shockwave', icon:'🔊', color:0xffcc66 }
    ];
    const MAX_ENERGY = 100;
    const RECHARGE = 8.0;
    const ACTIVE_DRAIN_BY_ROLE = { gravity:4, repulsion:4, vortex:5, suction:6, turbulence:7, magnet:5, freeze:7, accelerator:6, stabilizer:4, chaos:8 };
    const BURST_COST = { explosion: 25, shockwave: 20 };
    let localRole = null;
    let localEnergy = MAX_ENERGY;
    let lastUse = 0;
    let pulse = 0;
    let powerActive = false;
    let pulseTimer = 0;

    function chooseRole() {
        return ROLES[Math.floor(Math.random() * ROLES.length)];
    }

    function ensureLocalRole(forceNew) {
        if (!forceNew && localRole) return localRole;
        localRole = chooseRole();
        localEnergy = MAX_ENERGY;
        lastUse = 0;
        pulse = 0;
        updateUI();
        return localRole;
    }

    function getRoleById(id) { return ROLES.find(r => r.id === id) || ROLES[0]; }

    function activatePower() {
        if (!state.p2pEnabled || !localRole || localEnergy <= 0) return false;
        const burstCost = BURST_COST[localRole.id] || 0;
        if (burstCost && localEnergy < burstCost) return false;
        if (burstCost) localEnergy = Math.max(0, localEnergy - burstCost);
        powerActive = true;
        pulse = 1;
        pulseTimer = localRole.id === 'shockwave' ? 1.15 : (localRole.id === 'explosion' ? 0.68 : 0.42);
        lastUse = performance.now();
        updateUI();
        return true;
    }

    function deactivatePower() {
        powerActive = false;
    }

    // Compatibilidad con versiones anteriores. Ahora el disparo real es click izquierdo.
    function usePower() {
        return activatePower();
    }

    function tick(dt) {
        if (!state.p2pEnabled) return;
        const cursorActive = powerActive && !!(window.mouse3D && window.mouse3D.active);
        if (cursorActive && localEnergy > 0) {
            localEnergy = Math.max(0, localEnergy - (ACTIVE_DRAIN_BY_ROLE[localRole?.id] || 12) * dt);
        } else {
            localEnergy = Math.min(MAX_ENERGY, localEnergy + RECHARGE * dt);
        }
        if (pulseTimer > 0) {
            pulseTimer = Math.max(0, pulseTimer - dt);
            pulse = Math.min(1, pulseTimer / 0.42);
        } else {
            pulse = 0;
        }
        if (localEnergy <= 0) powerActive = false;
        updateUI();
    }

    function getAgentState() {
        ensureLocalRole(false);
        const m = window.mouse3D || { x:0, y:0, z:0, active:false };
        const active = powerActive && !!m.active && localEnergy > 0;
        return {
            role: localRole.id,
            energy: Math.round(localEnergy * 10) / 10,
            pulse: Math.round(pulse * 100) / 100,
            cursor: { x: Number(m.x)||0, y:Number(m.y)||0, z:Number(m.z)||0, active }
        };
    }

    // Fuerzas aditivas sobre EL MISMO universo global. No se crean partículas por usuario.
    function forceForAgent(x, y, z, now, agent, strengthScale = 1) {
        if (!agent || !agent.cursor || !agent.cursor.active || (Number(agent.energy) || 0) <= 0) {
            return {dx:0,dy:0,dz:0};
        }
        const mx = Number(agent.cursor.x) || 0;
        const my = Number(agent.cursor.y) || 0;
        const mz = Number(agent.cursor.z) || 0;
        const rx = mx - x, ry = my - y, rz = mz - z;
        const r2 = rx*rx + ry*ry + rz*rz + 1.0;
        const r = Math.sqrt(r2);
        const inv = 1 / Math.max(r, 1);
        const t = now * 0.001;
        const energyScale = 0.45 + (Math.min(100, Math.max(0, Number(agent.energy)||0)) / 100) * 0.55;
        const viewScale = Math.min(2.6, Math.max(0.7, Number(window.multiplayerPowerScale) || 1));
        const strength = 2.15 * energyScale * strengthScale * (0.95 + viewScale * 0.55);
        const pulseNow = Math.min(1, Math.max(0, Number(agent.pulse)||0));
        let dx=0, dy=0, dz=0;

        switch(agent.role) {
            case 'gravity': { const q=strength*4.2/r2; dx=rx*q; dy=ry*q; dz=rz*q; break; }
            case 'repulsion': { const q=strength*4.8/r2; dx=-rx*q; dy=-ry*q; dz=-rz*q; break; }
            case 'vortex': { const q=strength*3.2/Math.max(r,1); dx=(-ry*inv+rx*0.055)*q; dy=(rx*inv+ry*0.055)*q; dz=Math.sin(t+r*0.18)*strength*0.75; break; }
            case 'suction': { const q=strength*6.2/(r+0.7); dx=rx*q; dy=ry*q; dz=rz*q; break; }
            case 'explosion': { const q=strength*55/(r2+1.0)*(0.55+pulseNow*3.2); dx=-rx*q; dy=-ry*q; dz=-rz*q; break; }
            case 'turbulence': {
                const radius = 24 * viewScale;
                const falloff = Math.max(0, 1 - r / radius);
                const q = strength * 6.2 * falloff * falloff;
                dx=Math.sin(ry*0.32+t*2.1)*q; dy=Math.cos(rz*0.28-t*1.7)*q; dz=Math.sin(rx*0.25+t*1.3)*q;
                break;
            }
            case 'magnet': { const q=strength*4.0/(r+1); dx=rx*q; dy=(ry+Math.sin(t)*1.5)*q; dz=rz*q; break; }
            case 'freeze': {
                // Freeze no atrae: devuelve un factor especial que el motor usa para anular
                // el desplazamiento dentro de un radio pequeño alrededor del cursor.
                break;
            }
            case 'accelerator': {
                // Expulsa partículas hacia afuera desde el cursor. Campo corto y potente.
                const radius = 16 * viewScale;
                const falloff = Math.max(0, 1 - r / radius);
                const q = strength * 68 * falloff * falloff;
                dx = -rx * inv * q; dy = -ry * inv * q; dz = -rz * inv * q;
                break;
            }
            case 'stabilizer': { const q=strength*2.4/(r+1); dx=-x*q; dy=-y*q; dz=-z*q; break; }
            case 'chaos': {
                const radius = 26 * viewScale;
                const falloff = Math.max(0, 1 - r / radius);
                const q = strength * 6.8 * falloff * falloff;
                dx=Math.sin(ry*0.55+t*3)*q; dy=Math.sin(rz*0.47-t*2.2)*q; dz=Math.cos(rx*0.43+t*2.6)*q;
                break;
            }
            case 'shockwave': {
                // Una onda expansiva única recorre el espacio desde el punto del click.
                const elapsed = Math.max(0, 1.15 - pulseTimer);
                const waveRadius = elapsed * 46 * viewScale;
                const shellWidth = 3.8 * Math.sqrt(viewScale);
                const shell = Math.exp(-Math.pow((r - waveRadius) / shellWidth, 2));
                const q = strength * 125 * shell;
                dx = rx * inv * q; dy = ry * inv * q; dz = rz * inv * q;
                break;
            }
        }
        return {dx,dy,dz};
    }

    function getAgentForce(x, y, z, now) {
        if (!state.p2pEnabled || !localRole) return {dx:0,dy:0,dz:0};
        return forceForAgent(x, y, z, now, getAgentState());
    }


    function getFreezeFactor(x, y, z, now, remoteAgents) {
        if (!state.p2pEnabled) return 1;
        const check = (agent) => {
            if (!agent || agent.role !== 'freeze' || !agent.cursor || !agent.cursor.active || (Number(agent.energy)||0) <= 0) return 1;
            const dx = (Number(agent.cursor.x)||0) - x;
            const dy = (Number(agent.cursor.y)||0) - y;
            const dz = (Number(agent.cursor.z)||0) - z;
            const r = Math.sqrt(dx*dx + dy*dy + dz*dz);
            const viewScale = Math.min(2.6, Math.max(0.7, Number(window.multiplayerPowerScale) || 1));
            const radius = 10 * viewScale;
            return r <= radius ? 0 : 1;
        };
        let factor = check(getAgentState());
        if (factor === 0) return 0;
        if (remoteAgents) {
            for (const id of Object.keys(remoteAgents)) {
                if (id === state.peerId) continue;
                if (check(remoteAgents[id]) === 0) return 0;
            }
        }
        return factor;
    }

    function getRemoteAgentForce(x, y, z, now, remoteAgents) {
        if (!state.p2pEnabled || !remoteAgents) return {dx:0,dy:0,dz:0};
        let dx=0, dy=0, dz=0;
        Object.keys(remoteAgents).forEach(id => {
            if (id === state.peerId) return;
            const f = forceForAgent(x, y, z, now, remoteAgents[id], 0.70);
            dx += f.dx; dy += f.dy; dz += f.dz;
        });
        return {dx,dy,dz};
    }

    function updateUI() {
        const roleEl = document.getElementById('myPowerVal');
        const energyEl = document.getElementById('myPowerEnergy');
        if (roleEl) roleEl.textContent = localRole ? `${localRole.icon} ${localRole.name}` : '—';
        if (energyEl) energyEl.textContent = `${Math.round(localEnergy)}%`;
        const bar = document.getElementById('myPowerEnergyBar');
        if (bar) bar.style.width = `${Math.max(0, Math.min(100, localEnergy))}%`;
    }

    window.SwarmAgents = { ROLES, chooseRole, ensureLocalRole, getRoleById, usePower, activatePower, deactivatePower, tick, getAgentState, getAgentForce, getRemoteAgentForce, getFreezeFactor, updateUI, ACTIVE_DRAIN_BY_ROLE, BURST_COST };
})();
