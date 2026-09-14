/**
 * MICRO-UNIVERSO v1.5 - Post-Processing Module (Bloom & Neon Glow)
 * Configures EffectComposer and UnrealBloomPass for cinematic rendering.
 */

let composer = null;
let bloomPass = null;
let postProcessingEnabled = true;

function initPostProcessing(renderer, scene, camera) {
    composer = new THREE.EffectComposer(renderer);
    
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.4,  // Strength
        0.4,  // Radius
        0.2   // Threshold
    );
    composer.addPass(bloomPass);

    return composer;
}

function setPostProcessingEnabled(enabled) {
    postProcessingEnabled = enabled;
}

function renderSceneMaster(renderer, scene, camera) {
    if (postProcessingEnabled && composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

function resizePostProcessing(width, height) {
    if (composer) {
        composer.setSize(width, height);
    }
}