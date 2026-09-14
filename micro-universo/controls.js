/**
 * MICRO-UNIVERSO v1.5 - Interactive Controls Module
 * Handles camera orbit, 3D mouse tracking, right-click panning, and zoom.
 */

window.mouse3D = { x: 0, y: 0, z: 0, active: false };

function updateMouse3DFromEvent(e, domElement, camera) {
    const rect = domElement.getBoundingClientRect();
    const mouseNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseNormY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    window.mouseScreen = { x: mouseNormX, y: mouseNormY, active: true };

    const targetCenter = camera.positionCenter || new THREE.Vector3(0, 0, 0);
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, targetCenter);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera);
    const hitPoint = new THREE.Vector3();

    // En Multiplayer primero intentamos localizar una partícula realmente visible
    // bajo el cursor. Esto evita que el poder se aplique en un plano 3D distinto
    // al que el usuario está viendo al hacer zoom.
    let particleHit = null;
    if (typeof state !== 'undefined' && state.p2pEnabled && window.particleSystem) {
        const particleRaycaster = new THREE.Raycaster();
        particleRaycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera);
        particleRaycaster.params.Points.threshold = Math.max(0.65, (window.particleVisualSize || 0.8) * 1.6);
        const hits = particleRaycaster.intersectObject(window.particleSystem, false);
        if (hits && hits.length) particleHit = hits[0];
    }

    if (particleHit && particleHit.point) {
        hitPoint.copy(particleHit.point);
    } else {
        const hit = raycaster.ray.intersectPlane(plane, hitPoint);
        if (!hit || !Number.isFinite(hitPoint.x)) {
            const dist = camera.position.distanceTo(targetCenter);
            raycaster.ray.at(Math.max(dist, 10), hitPoint);
        }
    }
    window.mouse3D.x = Number.isFinite(hitPoint.x) ? hitPoint.x : 0;
    window.mouse3D.y = Number.isFinite(hitPoint.y) ? hitPoint.y : 0;
    window.mouse3D.z = Number.isFinite(hitPoint.z) ? hitPoint.z : 0;
}

function setupControls(camera, domElement, onDoubleClickSupernova) {
    let isLeftDragging = false;
    let isMiddleDragging = false;
    let isRightDragging = false;
    let powerMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Center point that camera looks at (used for panning & orbit)
    if (!camera.positionCenter) {
        camera.positionCenter = new THREE.Vector3(0, 0, 0);
    }

    const mouseVector = new THREE.Vector2();

    // Prevent default right-click context menu to allow custom panning
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    domElement.addEventListener('mousedown', (e) => {
        previousMousePosition = { x: e.clientX, y: e.clientY };

        if (e.button === 0) {
            // En Multiplayer el click izquierdo es EXCLUSIVAMENTE el disparador del poder.
            // No rota la cámara ni mantiene el poder activo al pasar el cursor.
            if (typeof state !== 'undefined' && state.p2pEnabled) {
                isLeftDragging = false;
                powerMouseDown = true;
                updateMouse3DFromEvent(e, domElement, camera);
                window.mouse3D.active = true;
                if (window.SwarmAgents && typeof window.SwarmAgents.activatePower === 'function') {
                    window.SwarmAgents.activatePower();
                }
                return;
            }
            isLeftDragging = true;
        } else if (e.button === 1) { // Botón central -> rotar cámara
            isMiddleDragging = true;
        } else if (e.button === 2) { // Right click -> Pan (X/Y translation)
            isRightDragging = true;
        }
    });

domElement.addEventListener('mousemove', (e) => {
    updateMouse3DFromEvent(e, domElement, camera);
    // En Multiplayer active solo significa que el botón izquierdo está presionado.
    // En modo normal conservamos la interacción contextual existente.
    if (typeof state === 'undefined' || !state.p2pEnabled) {
        window.mouse3D.active = true;
    }

    // Manejar arrastre (orbit / pan). En Multiplayer: izquierdo=poder, central=cámara.
    if (typeof state !== 'undefined' && state.p2pEnabled) {
        if (!isMiddleDragging && !isRightDragging) return;
    } else if (!isLeftDragging && !isMiddleDragging && !isRightDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    if (isLeftDragging || isMiddleDragging) {
        const radius = camera.position.distanceTo(camera.positionCenter);
        let theta = Math.atan2(camera.position.x - camera.positionCenter.x, camera.position.z - camera.positionCenter.z);
        let phi = Math.acos(Math.max(-1, Math.min(1, (camera.position.y - camera.positionCenter.y) / radius)));

        theta -= deltaX * 0.005;
        phi -= deltaY * 0.005;
        phi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));

        camera.position.x = camera.positionCenter.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = camera.positionCenter.y + radius * Math.cos(phi);
        camera.position.z = camera.positionCenter.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(camera.positionCenter);
    } 
    else if (isRightDragging) {
        const panSpeed = 0.03 * (camera.position.distanceTo(camera.positionCenter) / 45);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        camera.positionCenter.addScaledVector(right, -deltaX * panSpeed);
        camera.positionCenter.addScaledVector(up, deltaY * panSpeed);

        camera.position.addScaledVector(right, -deltaX * panSpeed);
        camera.position.addScaledVector(up, deltaY * panSpeed);
        camera.lookAt(camera.positionCenter);
    }

    previousMousePosition = { x: e.clientX, y: e.clientY };
});

    window.addEventListener('mouseup', (e) => { 
        if (e.button === 0) {
            isLeftDragging = false;
            if (typeof state !== 'undefined' && state.p2pEnabled && powerMouseDown) {
                powerMouseDown = false;
                window.mouse3D.active = false;
                if (window.SwarmAgents && typeof window.SwarmAgents.deactivatePower === 'function') {
                    window.SwarmAgents.deactivatePower();
                }
            }
        }
        if (e.button === 1) isMiddleDragging = false;
        if (e.button === 2) isRightDragging = false;
    });

    domElement.addEventListener('mouseleave', () => { 
        isLeftDragging = false; 
        isRightDragging = false; 
        window.mouse3D.active = false;
    });

    domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.08 : 0.92;
        
        // Zoom towards cameraPositionCenter
        const dir = camera.position.clone().sub(camera.positionCenter);
        dir.multiplyScalar(zoomFactor);
        
        const dist = dir.length();
        if (dist >= 3 && dist <= 350) {
            camera.position.copy(camera.positionCenter).add(dir);
        }
    }, { passive: false });

    // Doble click ya no dispara explosión/supernova.
    // Se reserva para interacción futura del laboratorio multiplayer.

}