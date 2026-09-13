/**
 * MICRO-UNIVERSO v1.5 - Interactive Controls Module
 * Handles camera orbit, 3D mouse tracking, right-click panning, and zoom.
 */

window.mouse3D = { x: 0, y: 0, z: 0, active: false };

function setupControls(camera, domElement, onDoubleClickSupernova) {
    let isLeftDragging = false;
    let isRightDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    // Center point that camera looks at (used for panning & orbit)
    if (!camera.positionCenter) {
        camera.positionCenter = new THREE.Vector3(0, 0, 0);
    }

    const mouseVector = new THREE.Vector2();

    // Prevent default right-click context menu to allow custom panning
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    domElement.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Left click -> Orbit rotation
            isLeftDragging = true;
        } else if (e.button === 2) { // Right click -> Pan (X/Y translation)
            isRightDragging = true;
        }
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

domElement.addEventListener('mousemove', (e) => {
    const rect = domElement.getBoundingClientRect();
    const mouseNormX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseNormY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    window.mouseScreen = { x: mouseNormX, y: mouseNormY, active: true };

    const targetCenter = camera.positionCenter || new THREE.Vector3(0, 0, 0);
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, targetCenter);
    const tempRaycaster = new THREE.Raycaster();
    tempRaycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera);
    
    const hitPoint = new THREE.Vector3();
    const hit = tempRaycaster.ray.intersectPlane(plane, hitPoint);
    
    if (hit && Number.isFinite(hitPoint.x)) {
        window.mouse3D.x = hitPoint.x;
        window.mouse3D.y = hitPoint.y;
        window.mouse3D.z = hitPoint.z;
    } else {
        const dist = camera.position.distanceTo(targetCenter);
        tempRaycaster.ray.at(Math.max(dist, 10), hitPoint);
        window.mouse3D.x = Number.isFinite(hitPoint.x) ? hitPoint.x : 0;
        window.mouse3D.y = Number.isFinite(hitPoint.y) ? hitPoint.y : 0;
        window.mouse3D.z = Number.isFinite(hitPoint.z) ? hitPoint.z : 0;
    }
    window.mouse3D.active = true;

    // Manejar arrastre (orbit / pan)
    if (!isLeftDragging && !isRightDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    if (isLeftDragging) {
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

    window.addEventListener('mouseup', () => { 
        isLeftDragging = false; 
        isRightDragging = false; 
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

    domElement.addEventListener('dblclick', () => {
        if (typeof onDoubleClickSupernova === 'function') {
            onDoubleClickSupernova();
        }
    });
}