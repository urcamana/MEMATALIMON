(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  let source = null;
  let outMime = 'image/jpeg';
  let outExt = 'jpg';
  let rotation = 0;
  let resultUrl = null;
  let canProcess = false;

  const drop = $('#drop');
  const fileInput = $('#file');

  function setStepActive(n) {
    for (let i = 1; i <= 4; i++) {
      const num = $(`#n${i}`);
      const numB = $(`#n${i}b`);
      if (num) {
        num.classList.toggle('on', i <= n);
        num.classList.toggle('off', i > n);
      }
      if (numB) {
        numB.classList.toggle('on', i <= n);
        numB.classList.toggle('off', i > n);
      }
    }
    const unlock = (id, titleId) => {
      const sec = $(id);
      if (!sec) return;
      sec.classList.remove('opacity-50', 'pointer-events-none');
      const h = $(titleId);
      if (h) {
        h.classList.remove('text-gray-500');
        h.classList.add('text-primary-dark');
      }
    };
    const lock = (id, titleId) => {
      const sec = $(id);
      if (!sec) return;
      sec.classList.add('opacity-50', 'pointer-events-none');
      const h = $(titleId);
      if (h) {
        h.classList.add('text-gray-500');
        h.classList.remove('text-primary-dark');
      }
    };
    if (n >= 2) unlock('#step2', '#t2'); else lock('#step2', '#t2');
    if (n >= 3) unlock('#step3', '#t3'); else lock('#step3', '#t3');
    if (n >= 4) unlock('#step4', '#t4'); else lock('#step4', '#t4');
  }

  function isHeicFile(file) {
    const n = (file.name || '').toLowerCase();
    return n.endsWith('.heic') || n.endsWith('.heif') ||
      file.type === 'image/heic' || file.type === 'image/heif';
  }

  function formatLabel(file, animated) {
    if (isHeicFile(file)) return 'HEIC (foto iPhone)';
    const t = file.type || '';
    let base = 'Imagen';
    if (t.includes('jpeg') || /\.jpe?g$/i.test(file.name)) base = 'JPG';
    else if (t.includes('png') || /\.png$/i.test(file.name)) base = 'PNG';
    else if (t.includes('webp') || /\.webp$/i.test(file.name)) base = 'WebP';
    else if (t.includes('gif') || /\.gif$/i.test(file.name)) base = 'GIF';
    else if (t.includes('bmp') || /\.bmp$/i.test(file.name)) base = 'BMP';
    else {
      const ext = (file.name.split('.').pop() || '').toUpperCase();
      if (ext) base = ext;
    }
    return animated ? base + ' animado' : base;
  }

  /** Detecta GIF animado: más de un bloque de imagen (0x2C) */
  function detectAnimatedGif(bytes) {
    if (bytes.length < 6) return false;
    if (!(bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46)) return false;
    let frames = 0;
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0x2c) frames++;
      if (frames > 1) return true;
    }
    return false;
  }

  /** Detecta WebP animado: chunk ANIM */
  function detectAnimatedWebp(bytes) {
    if (bytes.length < 16) return false;
    // RIFF....WEBP
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    if (!isRiff || !isWebp) return false;
    for (let i = 12; i < bytes.length - 4; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x4e && bytes[i + 2] === 0x49 && bytes[i + 3] === 0x4d) {
        return true; // ANIM
      }
    }
    return false;
  }

  async function analyzeFile(file) {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const name = (file.name || '').toLowerCase();
    const type = file.type || '';

    let kind = 'static';
    let animated = false;

    if (isHeicFile(file)) {
      kind = 'heic';
    } else if (type === 'image/gif' || name.endsWith('.gif') || detectAnimatedGif(bytes)) {
      animated = detectAnimatedGif(bytes);
      kind = animated ? 'gif-animated' : 'gif';
    } else if (type === 'image/webp' || name.endsWith('.webp')) {
      animated = detectAnimatedWebp(bytes);
      kind = animated ? 'webp-animated' : 'webp';
    } else if (type.includes('png') || name.endsWith('.png')) {
      kind = 'png';
    } else if (type.includes('jpeg') || type.includes('jpg') || /\.jpe?g$/i.test(name)) {
      kind = 'jpg';
    } else if (type.includes('bmp') || name.endsWith('.bmp')) {
      kind = 'bmp';
    }

    return { kind, animated, bytes };
  }

  function loadImg(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('No se pudo leer la imagen'));
      img.src = url;
    });
  }

  async function fileToDisplayUrl(file) {
    if (isHeicFile(file)) {
      if (typeof heic2any === 'undefined') {
        throw new Error('No se pudo cargar el convertidor HEIC. Probá en Chrome o Edge.');
      }
      const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
      const out = Array.isArray(blob) ? blob[0] : blob;
      return URL.createObjectURL(out);
    }
    return URL.createObjectURL(file);
  }

  function setFmtEnabled(id, enabled) {
    const btn = $(`.fmt[data-id="${id}"]`);
    if (!btn) return;
    btn.disabled = !enabled;
    btn.classList.toggle('is-disabled', !enabled);
    if (!enabled) {
      btn.classList.remove('active', 'border-2', 'border-primary/30');
      btn.classList.add('border', 'border-primary/15');
    }
  }

  function applyCapabilities() {
    const box = $('#unsupported');
    box.classList.add('hidden');
    box.innerHTML = '';

    if (!source) {
      canProcess = false;
      setStepActive(1);
      return;
    }

    // WebP animado: sin opciones de edición/conversión en el navegador
    if (source.kind === 'webp-animated') {
      canProcess = false;
      setStepActive(1);
      ['#step2', '#step3', '#step4'].forEach(id => {
        $(id).classList.add('opacity-50', 'pointer-events-none');
      });
      box.classList.remove('hidden');
      box.innerHTML = `
        <p class="font-semibold">WebP animado</p>
        <p class="mt-1 text-amber-800/90">Este archivo tiene movimiento. En el navegador no se puede convertir ni editar sin perder la animación.</p>
        <p class="mt-2 text-amber-800/90">No hay opciones disponibles para este formato.</p>
        <a id="dl-original" class="inline-flex mt-3 px-4 py-2 rounded-full bg-white border border-amber-300 text-amber-900 text-xs font-semibold" download="${source.file.name}">Descargar original</a>`;
      const a = $('#dl-original');
      if (a) {
        a.href = source.originalUrl || source.url;
      }
      return;
    }

    canProcess = true;

    // Formatos de salida
    setFmtEnabled('jpg', true);
    setFmtEnabled('png', true);
    setFmtEnabled('webp', true);
    setFmtEnabled('heic', source.kind === 'heic');

    if (source.kind === 'heic') {
      selectFormat($('.fmt[data-id="heic"]'));
    } else {
      // Preferir JPG si HEIC estaba activo
      const active = $('.fmt.active');
      if (!active || active.disabled || active.dataset.id === 'heic') {
        selectFormat($('.fmt[data-id="jpg"]'));
      }
    }

    setStepActive(4);
    updateQualityVisibility();
  }

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag');
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (f) handleFile(f);
  });

  $('#btn-clear').addEventListener('click', () => {
    resetSource();
    fileInput.value = '';
  });

  function resetSource() {
    if (source?.url) URL.revokeObjectURL(source.url);
    if (source?.originalUrl && source.originalUrl !== source.url) {
      try { URL.revokeObjectURL(source.originalUrl); } catch (_) {}
    }
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    source = null;
    resultUrl = null;
    rotation = 0;
    canProcess = false;
    $('#source-card').classList.add('hidden');
    $('#unsupported').classList.add('hidden');
    drop.classList.remove('hidden');
    $('#result').classList.add('hidden');
    $('#gen-status').classList.add('hidden');
    const uw = $('#upscale-warn');
    if (uw) uw.classList.add('hidden');
    setFmtEnabled('heic', false);
    setStepActive(1);
    $$('.rot').forEach(b => {
      b.classList.toggle('bg-primary-soft', b.dataset.r === '0');
      b.classList.toggle('border-primary', b.dataset.r === '0');
      b.classList.toggle('font-semibold', b.dataset.r === '0');
    });
  }

  async function handleFile(file) {
    const okType = file.type.startsWith('image/') || isHeicFile(file) ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!okType) {
      alert('Elegí una imagen (JPG, PNG, WebP, GIF, BMP o HEIC).');
      return;
    }

    $('#gen-status').classList.remove('hidden');
    $('#gen-status').textContent = isHeicFile(file) ? 'Leyendo foto HEIC…' : 'Analizando imagen…';

    try {
      if (source?.url) URL.revokeObjectURL(source.url);
      if (resultUrl) { URL.revokeObjectURL(resultUrl); resultUrl = null; }

      const info = await analyzeFile(file);
      const displayUrl = await fileToDisplayUrl(file);
      const originalUrl = URL.createObjectURL(file);
      let img = null;
      try {
        img = await loadImg(displayUrl);
      } catch (e) {
        // animados a veces fallan en Image; igual podemos marcar unsupported
        if (info.kind !== 'webp-animated') throw e;
      }

      source = {
        file,
        url: displayUrl,
        originalUrl,
        img,
        width: img ? img.naturalWidth : 0,
        height: img ? img.naturalHeight : 0,
        kind: info.kind,
        animated: info.animated,
        label: formatLabel(file, info.animated),
      };

      drop.classList.add('hidden');
      $('#source-card').classList.remove('hidden');
      if (img) $('#source-thumb').src = displayUrl;
      else $('#source-thumb').removeAttribute('src');
      $('#source-name').textContent = file.name;
      const dim = img ? `${source.width}×${source.height} px · ` : '';
      $('#source-meta').textContent =
        `${source.label} · ${dim}${(file.size / 1024).toFixed(0)} KB`;

      $('#result').classList.add('hidden');
      $('#gen-status').classList.add('hidden');
      applyCapabilities();
      updateUpscaleWarn();
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo abrir la imagen.');
      $('#gen-status').classList.add('hidden');
    }
  }

  function selectFormat(btn) {
    if (!btn || btn.disabled || btn.classList.contains('is-disabled')) return;
    $$('.fmt').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.classList.toggle('border-2', on);
      b.classList.toggle('border-primary/30', on);
      b.classList.toggle('border', !on);
      b.classList.toggle('border-primary/15', !on);
      const title = b.querySelector('.font-bold');
      if (title) title.classList.toggle('text-primary-dark', on);
    });
    outMime = btn.dataset.mime;
    outExt = btn.dataset.ext;
    updateQualityVisibility();
    $('#result').classList.add('hidden');
  }

  $$('.fmt').forEach(btn => btn.addEventListener('click', () => selectFormat(btn)));

  function updateQualityVisibility() {
    const box = $('#quality-box');
    if (outMime === 'image/png') {
      box.style.opacity = '0.45';
      box.style.pointerEvents = 'none';
    } else {
      box.style.opacity = '1';
      box.style.pointerEvents = '';
    }
  }

  const qLabels = [
    [0.5, 'Muy liviana'],
    [0.7, 'Liviana'],
    [0.85, 'Equilibrada'],
    [0.92, 'Alta'],
    [0.98, 'Máxima'],
  ];
  $('#quality').addEventListener('input', e => {
    const v = +e.target.value;
    let label = 'Alta';
    for (const [th, name] of qLabels) {
      if (v <= th + 0.05) { label = name; break; }
    }
    $('#q-label').textContent = `${label} (${v.toFixed(2)})`;
    $('#result').classList.add('hidden');
  });

  ['max-w', 'max-h', 'keep-ratio'].forEach(id => {
    const el = $('#' + id);
    if (el) {
      el.addEventListener('input', () => {
        $('#result').classList.add('hidden');
        updateUpscaleWarn();
      });
      el.addEventListener('change', () => {
        $('#result').classList.add('hidden');
        updateUpscaleWarn();
      });
    }
  });

  $$('.preset').forEach(b => {
    b.addEventListener('click', () => {
      $('#max-w').value = b.dataset.w || '';
      $('#max-h').value = b.dataset.h || '';
      $('#result').classList.add('hidden');
      updateUpscaleWarn();
    });
  });

  $$('.rot').forEach(b => {
    b.addEventListener('click', () => {
      rotation = +b.dataset.r;
      $$('.rot').forEach(x => {
        const on = x === b;
        x.classList.toggle('bg-primary-soft', on);
        x.classList.toggle('border-primary', on);
        x.classList.toggle('font-semibold', on);
      });
      $('#result').classList.add('hidden');
    });
  });

  function computeSize(sw, sh) {
    let maxW = parseInt($('#max-w').value, 10);
    let maxH = parseInt($('#max-h').value, 10);
    if (!maxW || maxW < 1) maxW = Infinity;
    if (!maxH || maxH < 1) maxH = Infinity;
    const keep = $('#keep-ratio').checked;
    let w = sw;
    let h = sh;
    if (keep) {
      // Permite agrandar (r puede ser > 1). Si no hay límite, r = 1.
      let r = 1;
      if (maxW === Infinity && maxH === Infinity) r = 1;
      else if (maxW === Infinity) r = maxH / h;
      else if (maxH === Infinity) r = maxW / w;
      else r = Math.min(maxW / w, maxH / h);
      return { w: Math.max(1, Math.round(w * r)), h: Math.max(1, Math.round(h * r)) };
    }
    return {
      w: maxW === Infinity ? w : Math.max(1, maxW),
      h: maxH === Infinity ? h : Math.max(1, maxH),
    };
  }

  function updateUpscaleWarn() {
    const el = $('#upscale-warn');
    if (!el || !source || !source.width) {
      if (el) el.classList.add('hidden');
      return;
    }
    const maxW = parseInt($('#max-w').value, 10);
    const maxH = parseInt($('#max-h').value, 10);
    const bigger =
      (maxW > 0 && maxW > source.width) ||
      (maxH > 0 && maxH > source.height);
    el.classList.toggle('hidden', !bigger);
  }

  async function generate() {
    if (!source || !canProcess) {
      alert('No hay opciones disponibles para este archivo.');
      return;
    }
    if (!source.img) {
      alert('No se pudo procesar esta imagen.');
      return;
    }
    const btn = $('#btn-generate');
    const status = $('#gen-status');
    btn.disabled = true;
    status.classList.remove('hidden');
    status.textContent = 'Generando…';

    try {
      const img = source.img;
      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const { w, h } = computeSize(sw, sh);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const rad = (rotation * Math.PI) / 180;

      if (rotation % 180 === 0) {
        canvas.width = w;
        canvas.height = h;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      } else {
        canvas.width = h;
        canvas.height = w;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }

      const quality = outMime === 'image/png' ? undefined : +$('#quality').value;
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('No se pudo exportar ese formato. Probá JPG.'))),
          outMime,
          quality
        );
      });

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(blob);
      const base = source.file.name.replace(/\.[^.]+$/, '') || 'imagen';
      const dlName = `${base}.${outExt}`;

      $('#result').classList.remove('hidden');
      $('#result-thumb').src = resultUrl;
      $('#result-meta').textContent =
        `${canvas.width}×${canvas.height} px · ${(blob.size / 1024).toFixed(0)} KB · .${outExt}` +
        (source.file.size ? ` (antes ${(source.file.size / 1024).toFixed(0)} KB)` : '');
      const a = $('#result-dl');
      a.href = resultUrl;
      a.download = dlName;

      status.textContent = 'Listo. Podés descargar abajo.';
      setTimeout(() => status.classList.add('hidden'), 2500);
    } catch (err) {
      console.error(err);
      status.textContent = '';
      alert(err.message || 'No se pudo generar.');
    } finally {
      btn.disabled = false;
    }
  }

  $('#btn-generate').addEventListener('click', generate);

  setStepActive(1);
  setFmtEnabled('heic', false);
  updateQualityVisibility();
})();
