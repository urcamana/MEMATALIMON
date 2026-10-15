(() => {
  const $ = (s) => document.querySelector(s);

  const HINTS = {
    collage: 'Subí entre 2 y 9 fotos. Se arman solas en grilla (2, 3, 4, 6 o 9).',
    carnet: 'Subí 1 foto. Se recorta al centro en cuadrado y se repite en una hoja (varias copias).',
    polaroid: 'Subí 1 a 6 fotos. Cada una con marco blanco y texto opcional debajo.',
    marco: 'Subí 1 foto. Se agrega un borde de color a tu gusto.',
    antes: 'Subí exactamente 2 fotos (antes y después).',
    tira: 'Subí de 2 a 4 fotos para una tira vertical tipo fotomatón.',
  };

  let mode = 'collage';
  let minF = 2, maxF = 9;
  let images = []; // { file, url, img }

  function setMode(m, btn) {
    mode = m;
    minF = +btn.dataset.min;
    maxF = +btn.dataset.max;
    document.querySelectorAll('.mode').forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.classList.toggle('border-2', on);
      b.classList.toggle('border-primary/30', on);
      b.classList.toggle('border', !on);
      b.classList.toggle('border-primary/15', !on);
      const t = b.querySelector('.font-bold');
      if (t) t.classList.toggle('text-primary-dark', on);
    });
    $('#mode-hint').textContent = HINTS[m];
    // trim excess images
    while (images.length > maxF) {
      const it = images.pop();
      URL.revokeObjectURL(it.url);
    }
    renderList();
    renderOptions();
    updateGo();
    $('#preview').classList.add('hidden');
  }

  document.querySelectorAll('.mode').forEach(b => {
    b.addEventListener('click', () => setMode(b.dataset.mode, b));
  });

  function renderOptions() {
    const box = $('#options');
    if (mode === 'collage') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Fondo del collage</label>
        <input type="color" id="bg" value="#ffffff" class="w-full h-10 rounded-lg" />
        <label class="text-sm text-gray-600">Espacio entre fotos (px)</label>
        <input type="range" id="gap" min="0" max="40" value="12" class="w-full accent-primary" />`;
    } else if (mode === 'carnet') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Copias en la hoja</label>
        <input type="number" id="copies" min="1" max="12" value="8" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <p class="text-[11px] text-gray-400">Se generan en grilla sobre fondo blanco (ideal para imprimir).</p>`;
    } else if (mode === 'polaroid') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Texto bajo la foto (opcional, misma frase en todas)</label>
        <input type="text" id="caption" maxlength="40" placeholder="Ej: Verano 2026" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <label class="text-sm text-gray-600">Color de fondo de hoja</label>
        <input type="color" id="bg" value="#f0eef5" class="w-full h-10 rounded-lg" />`;
    } else if (mode === 'marco') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Color del marco</label>
        <input type="color" id="frame" value="#a88cd7" class="w-full h-10 rounded-lg" />
        <label class="text-sm text-gray-600">Grosor del marco</label>
        <input type="range" id="thick" min="8" max="80" value="32" class="w-full accent-primary" />`;
    } else if (mode === 'antes') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Etiqueta izquierda</label>
        <input type="text" id="lab1" value="Antes" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <label class="text-sm text-gray-600">Etiqueta derecha</label>
        <input type="text" id="lab2" value="Después" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <label class="text-sm text-gray-600">Fondo</label>
        <input type="color" id="bg" value="#1a1a2e" class="w-full h-10 rounded-lg" />`;
    } else if (mode === 'tira') {
      box.innerHTML = `
        <label class="text-sm text-gray-600">Color de fondo</label>
        <input type="color" id="bg" value="#111111" class="w-full h-10 rounded-lg" />
        <label class="text-sm text-gray-600">Espacio entre fotos</label>
        <input type="range" id="gap" min="4" max="30" value="10" class="w-full accent-primary" />`;
    }
  }

  const drop = $('#drop');
  const fileInput = $('#file');
  drop.onclick = () => fileInput.click();
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('drag'); };
  drop.ondragleave = () => drop.classList.remove('drag');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('drag'); addFiles(e.dataTransfer.files); };
  fileInput.onchange = () => { addFiles(fileInput.files); fileInput.value = ''; };

  function loadImg(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = url;
    });
  }

  async function addFiles(list) {
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue;
      if (images.length >= maxF) break;
      const url = URL.createObjectURL(file);
      const img = await loadImg(url);
      images.push({ file, url, img });
    }
    renderList();
    updateGo();
    $('#preview').classList.add('hidden');
  }

  function renderList() {
    $('#list').innerHTML = images.map((it, i) => `
      <div class="relative">
        <img src="${it.url}" class="w-16 h-16 object-cover rounded-lg border border-primary/20" alt="" />
        <button type="button" data-i="${i}" class="rm absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs leading-5">×</button>
      </div>`).join('');
    $('#list').querySelectorAll('.rm').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        URL.revokeObjectURL(images[i].url);
        images.splice(i, 1);
        renderList();
        updateGo();
      };
    });
  }

  function updateGo() {
    $('#go').disabled = images.length < minF;
  }

  function coverDraw(ctx, img, x, y, w, h) {
    const ir = img.naturalWidth / img.naturalHeight;
    const tr = w / h;
    let sx, sy, sw, sh;
    if (ir > tr) {
      sh = img.naturalHeight;
      sw = sh * tr;
      sx = (img.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / tr;
      sx = 0;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function collageLayout(n) {
    if (n <= 2) return { cols: 2, rows: 1 };
    if (n === 3) return { cols: 3, rows: 1 };
    if (n === 4) return { cols: 2, rows: 2 };
    if (n <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: 3 };
  }

  async function generate() {
    const go = $('#go');
    go.disabled = true;
    $('#status').textContent = 'Generando…';
    try {
      let canvas;
      if (mode === 'collage') canvas = genCollage();
      else if (mode === 'carnet') canvas = genCarnet();
      else if (mode === 'polaroid') canvas = genPolaroid();
      else if (mode === 'marco') canvas = genMarco();
      else if (mode === 'antes') canvas = genAntes();
      else if (mode === 'tira') canvas = genTira();

      const url = canvas.toDataURL('image/png');
      $('#result-img').src = url;
      $('#dl').href = url;
      $('#dl').download = `fotos-${mode}.png`;
      $('#preview').classList.remove('hidden');
      $('#status').textContent = '';
    } catch (err) {
      console.error(err);
      $('#status').textContent = err.message || 'Error';
    } finally {
      go.disabled = false;
      updateGo();
    }
  }

  function genCollage() {
    const n = Math.min(images.length, 9);
    const { cols, rows } = collageLayout(n);
    const gap = +($('#gap')?.value || 12);
    const cell = 400;
    const W = cols * cell + (cols + 1) * gap;
    const H = rows * cell + (rows + 1) * gap;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = $('#bg')?.value || '#fff';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gap + col * (cell + gap);
      const y = gap + row * (cell + gap);
      coverDraw(ctx, images[i].img, x, y, cell, cell);
    }
    return c;
  }

  function genCarnet() {
    const img = images[0].img;
    const copies = Math.min(12, Math.max(1, +($('#copies')?.value || 8)));
    const size = 300;
    // crop square center first
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const cols = copies <= 4 ? 2 : copies <= 9 ? 3 : 4;
    const rows = Math.ceil(copies / cols);
    const gap = 20, margin = 40;
    const W = margin * 2 + cols * size + (cols - 1) * gap;
    const H = margin * 2 + rows * size + (rows - 1) * gap;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < copies; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (size + gap);
      const y = margin + row * (size + gap);
      ctx.drawImage(img, sx, sy, side, side, x, y, size, size);
    }
    return c;
  }

  function genPolaroid() {
    const caption = $('#caption')?.value || '';
    const n = images.length;
    const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const pw = 320, ph = 400, photo = 280, topPad = 20;
    const gap = 24, margin = 30;
    const W = margin * 2 + cols * pw + (cols - 1) * gap;
    const H = margin * 2 + rows * ph + (rows - 1) * gap;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = $('#bg')?.value || '#f0eef5';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = margin + col * (pw + gap);
      const y = margin + row * (ph + gap);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,.15)';
      ctx.shadowBlur = 12;
      ctx.fillRect(x, y, pw, ph);
      ctx.shadowBlur = 0;
      coverDraw(ctx, images[i].img, x + (pw - photo) / 2, y + topPad, photo, photo);
      if (caption) {
        ctx.fillStyle = '#333';
        ctx.font = '20px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(caption, x + pw / 2, y + topPad + photo + 36);
      }
    }
    return c;
  }

  function genMarco() {
    const img = images[0].img;
    const thick = +($('#thick')?.value || 32);
    const maxSide = 1000;
    const r = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const iw = Math.round(img.naturalWidth * r);
    const ih = Math.round(img.naturalHeight * r);
    const c = document.createElement('canvas');
    c.width = iw + thick * 2;
    c.height = ih + thick * 2;
    const ctx = c.getContext('2d');
    ctx.fillStyle = $('#frame')?.value || '#a88cd7';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, thick, thick, iw, ih);
    return c;
  }

  function genAntes() {
    const W = 1200, H = 700, gap = 16, labelH = 48;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = $('#bg')?.value || '#1a1a2e';
    ctx.fillRect(0, 0, W, H);
    const half = (W - gap * 3) / 2;
    const photoH = H - gap * 2 - labelH;
    coverDraw(ctx, images[0].img, gap, gap, half, photoH);
    coverDraw(ctx, images[1].img, gap * 2 + half, gap, half, photoH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText($('#lab1')?.value || 'Antes', gap + half / 2, H - 18);
    ctx.fillText($('#lab2')?.value || 'Después', gap * 2 + half + half / 2, H - 18);
    return c;
  }

  function genTira() {
    const n = images.length;
    const gap = +($('#gap')?.value || 10);
    const cellW = 400, cellH = 400;
    const pad = 20;
    const W = cellW + pad * 2;
    const H = pad * 2 + n * cellH + (n - 1) * gap;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = $('#bg')?.value || '#111';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      coverDraw(ctx, images[i].img, pad, pad + i * (cellH + gap), cellW, cellH);
    }
    return c;
  }

  $('#go').addEventListener('click', generate);

  setMode('collage', document.querySelector('.mode.active'));
})();
