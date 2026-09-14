// export-seq.js - Sequence & Frame Dump
let seqFrameCounter = 0;

function exportFrameSequenceSnapshot(renderer, scene, camera) {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sequence-frame-${String(seqFrameCounter++).padStart(4, '0')}.png`;
    link.href = dataURL;
    link.click();
}

window.exportFrameSequenceSnapshot = exportFrameSequenceSnapshot;