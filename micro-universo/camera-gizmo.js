/* Camera Lab v1.9.9 — visual gizmo only.
 * Intentionally isolated: it does not touch particles, physics or render setup.
 */
(function () {
  'use strict';

  function boot() {
    if (document.getElementById('cameraLabGizmo')) return;

    const panel = document.createElement('div');
    panel.id = 'cameraLabGizmo';
    panel.innerHTML = `
      <div class="camera-lab-title">CAMERA LAB</div>
      <canvas id="cameraLabCanvas" width="150" height="150"></canvas>
      <div class="camera-lab-readout" id="cameraLabReadout">CAM: esperando…</div>
      <div class="camera-lab-actions"><button id="cameraLabReset" type="button">↺ Reset</button><button id="cameraLabSave" type="button">＋ Vista</button></div>
      <select id="cameraLabViews" aria-label="Vistas guardadas"><option value="">Vistas guardadas…</option></select>
    `;
    document.body.appendChild(panel);

    const canvas = document.getElementById('cameraLabCanvas');
    const ctx = canvas.getContext('2d');
    const readout = document.getElementById('cameraLabReadout');
    const reset = document.getElementById('cameraLabReset');
    const save = document.getElementById('cameraLabSave');
    const views = document.getElementById('cameraLabViews');
    const savedViews = [];

    save.addEventListener('click', function () {
      const cam = window.camera;
      if (!cam) return;
      const idx = savedViews.length + 1;
      if (idx > 8) savedViews.shift();
      savedViews.push({ position: cam.position.clone(), quaternion: cam.quaternion.clone(), target: (cam.positionCenter || new THREE.Vector3()).clone(), fov: cam.fov });
      while (views.options.length > 1) views.remove(1);
      savedViews.forEach((v, i) => { const o=document.createElement('option'); o.value=String(i); o.textContent=`Vista ${i+1}`; views.appendChild(o); });
      views.value = String(savedViews.length - 1);
    });

    views.addEventListener('change', function () {
      const cam = window.camera;
      const v = savedViews[Number(views.value)];
      if (!cam || !v) return;
      cam.position.copy(v.position);
      if (!cam.positionCenter) cam.positionCenter = new THREE.Vector3();
      cam.positionCenter.copy(v.target);
      cam.quaternion.copy(v.quaternion);
      cam.fov = v.fov;
      cam.updateProjectionMatrix();
    });

    reset.addEventListener('click', function () {
      const cam = window.camera;
      if (!cam) return;
      cam.position.set(0, 0, window.state && window.state.p2pEnabled ? 110 : 45);
      if (!cam.positionCenter) cam.positionCenter = new THREE.Vector3(0, 0, 0);
      cam.positionCenter.set(0, 0, 0);
      cam.lookAt(cam.positionCenter);
    });

    function draw() {
      requestAnimationFrame(draw);
      const cam = window.camera;
      if (!cam || !window.THREE) return;

      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);

      // Grid/circle: purely visual.
      ctx.strokeStyle = 'rgba(0,255,204,.16)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 54, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-62, 0); ctx.lineTo(62, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(0, 62); ctx.stroke();

      const q = cam.quaternion;
      const axes = [
        { v: new THREE.Vector3(1,0,0), label:'X' },
        { v: new THREE.Vector3(0,1,0), label:'Y' },
        { v: new THREE.Vector3(0,0,1), label:'Z' }
      ];
      axes.forEach(function (a) {
        // Camera-space projection of world axes.
        const v = a.v.clone().applyQuaternion(q.clone().invert());
        const len = 48;
        const x = v.x * len;
        const y = -v.y * len;
        ctx.strokeStyle = a.label === 'X' ? '#ff5577' : (a.label === 'Y' ? '#66ff99' : '#55aaff');
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(x,y); ctx.stroke();
        ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
        ctx.font = 'bold 11px monospace';
        ctx.fillText(a.label, x + 5, y - 4);
      });
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
      ctx.restore();

      const p = cam.position;
      readout.textContent = `CAM X ${p.x.toFixed(1)}  Y ${p.y.toFixed(1)}  Z ${p.z.toFixed(1)}`;
    }

    draw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
