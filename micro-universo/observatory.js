/* Micro-Universo Observatory v1.9.9
 * Herramienta aislada de inspección de cámara/campo.
 * No modifica la generación ni la integración de partículas.
 */
(function () {
  'use strict';

  let panel, fieldGroup = null;
  let fieldVisible = false;
  let selectedIndex = -1;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const tmp = new THREE.Vector3();
  const target = new THREE.Vector3();

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'observatoryPanel';
    panel.innerHTML = `
      <div class="observatory-title">OBSERVATORY</div>
      <div class="obs-grid">
        <span>CAM X</span><b id="obsCamX">0.0</b><span>Y</span><b id="obsCamY">0.0</b><span>Z</span><b id="obsCamZ">0.0</b>
        <span>Dist.</span><b id="obsDist">0.0</b><span>FOV</span><b id="obsFov">60°</b>
        <span>RX</span><b id="obsRX">0°</b><span>RY</span><b id="obsRY">0°</b><span>RZ</span><b id="obsRZ">0°</b>
      </div>
      <div class="obs-target" id="obsTarget">TARGET 0.0 / 0.0 / 0.0</div>
      <div class="obs-target" id="obsMode">MODE — · WEBXR —</div>
      <div class="obs-actions">
        <button id="obsFieldBtn" type="button">◎ Campo</button>
        <button id="obsSelectBtn" type="button">✦ Selección</button>
      </div>
      <div class="obs-selected" id="obsSelected">Partícula: ninguna</div>
      <div class="obs-note">Shift + clic sobre una partícula para inspeccionarla.</div>
    `;
    document.body.appendChild(panel);

    document.getElementById('obsFieldBtn').addEventListener('click', () => {
      fieldVisible = !fieldVisible;
      setFieldVisible(fieldVisible);
    });
    document.getElementById('obsSelectBtn').addEventListener('click', () => {
      panel.classList.toggle('expanded');
    });
    return panel;
  }

  function setFieldVisible(visible) {
    if (!fieldGroup) createFieldGroup();
    fieldVisible = visible;
    if (fieldGroup) fieldGroup.visible = visible;
    const b = document.getElementById('obsFieldBtn');
    if (b) b.textContent = visible ? '◎ Campo ON' : '◎ Campo';
  }

  function createFieldGroup() {
    if (!window.scene || fieldGroup) return;
    fieldGroup = new THREE.Group();
    fieldGroup.name = 'ObservatoryForceField';
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.32 });
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.38 });
    for (let ring = 0; ring < 3; ring++) {
      const r = 6 + ring * 5;
      for (let j = 0; j < 24; j++) {
        const a = (j / 24) * Math.PI * 2;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const h = 1.2 + ring * 0.25;
        const geom = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, 0, z),
          new THREE.Vector3(x * 0.92 + (-z / r) * h, 0, z * 0.92 + (x / r) * h)
        ]);
        fieldGroup.add(new THREE.Line(geom, lineMat));
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.5, 6), arrowMat);
        cone.position.set(x * 0.92 + (-z / r) * h, 0, z * 0.92 + (x / r) * h);
        cone.rotation.x = Math.PI * 0.5;
        cone.rotation.z = -a;
        fieldGroup.add(cone);
      }
    }
    fieldGroup.visible = false;
    window.scene.add(fieldGroup);
  }

  function update() {
    if (!window.camera || !window.scene) return;
    ensurePanel();
    const cam = window.camera;
    const p = cam.position;
    const c = cam.positionCenter || target.set(0,0,0);
    const dist = p.distanceTo(c);
    const e = cam.rotation;
    const set = (id, value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
    set('obsCamX', p.x.toFixed(1)); set('obsCamY', p.y.toFixed(1)); set('obsCamZ', p.z.toFixed(1));
    set('obsDist', dist.toFixed(1)); set('obsFov', `${cam.fov.toFixed(0)}°`);
    set('obsRX', `${THREE.MathUtils.radToDeg(e.x).toFixed(0)}°`); set('obsRY', `${THREE.MathUtils.radToDeg(e.y).toFixed(0)}°`); set('obsRZ', `${THREE.MathUtils.radToDeg(e.z).toFixed(0)}°`);
    set('obsTarget', `TARGET ${c.x.toFixed(1)} / ${c.y.toFixed(1)} / ${c.z.toFixed(1)}`);
    const xr = window.renderer && window.renderer.xr && window.renderer.xr.enabled ? 'READY' : '—';
    set('obsMode', `MODE ${window.state ? window.state.mode : '—'} · WEBXR ${xr}`);
    if (fieldGroup) fieldGroup.rotation.y += 0.0018;
  }

  function inspectParticle(e) {
    if (!e.shiftKey || !window.particleSystem || !window.camera) return;
    const rect = window.renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, window.camera);
    raycaster.params.Points.threshold = Math.max(0.55, Number(window.particleVisualSize || 0.55) * 1.8);
    const hits = raycaster.intersectObject(window.particleSystem, false);
    if (!hits.length) return;
    selectedIndex = hits[0].index;
    const idx = selectedIndex * 3;
    const arr = window.particleSystem.geometry.attributes.position.array;
    const x=arr[idx], y=arr[idx+1], z=arr[idx+2];
    const el=document.getElementById('obsSelected');
    if(el) el.textContent=`Partícula #${selectedIndex} · X ${x.toFixed(2)} · Y ${y.toFixed(2)} · Z ${z.toFixed(2)}`;
  }

  window.updateObservatoryMode = function (mode) {
    const el = document.getElementById('obsMode');
    if (el) el.textContent = `MODE ${mode || '—'} · WEBXR ${window.renderer && window.renderer.xr && window.renderer.xr.enabled ? 'READY' : '—'}`;
  };

  function boot() {
    ensurePanel();
    createFieldGroup();
    const canvas = document.querySelector('#canvas-container canvas');
    if (canvas) canvas.addEventListener('click', inspectParticle, true);
    function loop(){ update(); requestAnimationFrame(loop); }
    loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
