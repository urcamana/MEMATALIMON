// xr-support.js - WebXR Immersive Support
function initXRSupport(renderer, scene, camera, particleSystem) {
    if (!navigator.xr) return;
    renderer.xr.enabled = true;
    
    let vrButtonContainer = document.getElementById('xr-button-container');
    if (!vrButtonContainer) {
        vrButtonContainer = document.createElement('div');
        vrButtonContainer.id = 'xr-button-container';
        vrButtonContainer.style.position = 'absolute';
        vrButtonContainer.style.bottom = '20px';
        vrButtonContainer.style.left = '20px';
        document.body.appendChild(vrButtonContainer);
    }
    
    if (typeof THREE.VRButton !== 'undefined' && !vrButtonContainer.hasChildNodes()) {
        vrButtonContainer.appendChild(THREE.VRButton.createButton(renderer));
    }
}
window.initXRSupport = initXRSupport;