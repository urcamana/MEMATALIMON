(() => {
  const $ = (s) => document.querySelector(s);

  let mode = 'merge';
  let items = []; // { file, bytes }

  const MODES = {
    merge: {
      hint: 'Subí 2 o más PDFs. Se unen en el orden de la lista.',
      accept: 'application/pdf',
      acceptHint: 'Solo PDF · varios archivos',
      multiple: true,
      minFiles: 2,
      needsOptions: false,
    },
    split: {
      hint: 'Subí 1 PDF. Cada página se descarga como un PDF aparte.',
      accept: 'application/pdf',
      acceptHint: 'Un solo PDF',
      multiple: false,
      minFiles: 1,
      needsOptions: false,
    },
    extract: {
      hint: 'Subí 1 PDF e indicá qué páginas querés (ej: 1-3, 5).',
      accept: 'application/pdf',
      acceptHint: 'Un solo PDF',
      multiple: false,
      minFiles: 1,
      needsOptions: true,
    },
    rotate: {
      hint: 'Subí 1 PDF y elegí cuánto girar todas las páginas.',
      accept: 'application/pdf',
      acceptHint: 'Un solo PDF',
      multiple: false,
      minFiles: 1,
      needsOptions: true,
    },
    pdf2img: {
      hint: 'Subí 1 PDF. Cada hoja se convierte en una imagen JPG.',
      accept: 'application/pdf',
      acceptHint: 'Un solo PDF',
      multiple: false,
      minFiles: 1,
      needsOptions: true,
    },
    img2pdf: {
      hint: 'Subí una o más imágenes (JPG, PNG…). Se arman como páginas de un PDF.',
      accept: 'image/*',
      acceptHint: 'JPG, PNG, WebP… · una o más',
      multiple: true,
      minFiles: 1,
      needsOptions: false,
    },
  };

  const drop = $('#drop');
  const fileInput = $('#file');
  const fileList = $('#file-list');
  const options = $('#options');
  const step3 = $('#step3');
  const go = $('#go');
  const out = $('#out');

  function setMode(m) {
    mode = m;
    items = [];
    fileList.innerHTML = '';
    out.innerHTML = '';
    const cfg = MODES[m];
    $('#file-hint').textContent = cfg.hint;
    fileInput.accept = cfg.accept;
    fileInput.multiple = cfg.multiple;
    $('#accept-hint').textContent = cfg.acceptHint;

    document.querySelectorAll('.task').forEach(btn => {
      const on = btn.dataset.mode === m;
      btn.classList.toggle('active', on);
      btn.classList.toggle('border-2', on);
      btn.classList.toggle('border-primary/30', on);
      btn.classList.toggle('border', !on);
      btn.classList.toggle('border-primary/15', !on);
      const title = btn.querySelector('.font-bold');
      if (title) title.classList.toggle('text-primary-dark', on);
    });

    renderOptions();
    updateGo();
  }

  document.querySelectorAll('.task').forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  function renderOptions() {
    const cfg = MODES[mode];
    if (!cfg.needsOptions) {
      step3.classList.add('hidden');
      options.innerHTML = '';
      return;
    }
    step3.classList.remove('hidden');
    if (mode === 'extract') {
      options.innerHTML = `
        <label class="text-sm font-medium text-gray-700">Páginas a extraer</label>
        <input id="opt-pages" type="text" placeholder="Ej: 1-3, 5, 8-10"
          class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
        <p class="text-[11px] text-gray-400">Numeración desde 1. Podés usar rangos y comas.</p>`;
    } else if (mode === 'rotate') {
      options.innerHTML = `
        <label class="text-sm font-medium text-gray-700">Girar todas las páginas</label>
        <select id="opt-angle" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm">
          <option value="90">90° a la derecha</option>
          <option value="180">180°</option>
          <option value="270">90° a la izquierda</option>
        </select>`;
    } else if (mode === 'pdf2img') {
      options.innerHTML = `
        <label class="text-sm font-medium text-gray-700">Calidad / escala: <span id="sc-val">1.5</span></label>
        <input id="opt-scale" type="range" min="1" max="2.5" step="0.25" value="1.5" class="w-full accent-primary" />
        <p class="text-[11px] text-gray-400">Más escala = más nítido y archivos más pesados.</p>`;
      $('#opt-scale').oninput = e => { $('#sc-val').textContent = e.target.value; };
    }
  }

  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag');
    addFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  async function addFiles(list) {
    const cfg = MODES[mode];
    for (const f of list) {
      const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
      const isImg = f.type.startsWith('image/');
      if (mode === 'img2pdf') {
        if (!isImg) continue;
      } else if (!isPdf) continue;

      if (!cfg.multiple) {
        items = [];
      }
      const bytes = new Uint8Array(await f.arrayBuffer());
      items.push({ file: f, bytes });
      if (!cfg.multiple) break;
    }
    renderList();
    updateGo();
  }

  function renderList() {
    fileList.innerHTML = items.map((it, i) => `
      <div class="flex items-center gap-2 bg-primary-soft/40 rounded-xl border border-primary/10 px-3 py-2 text-sm">
        <span class="text-gray-400 text-xs w-5">${i + 1}.</span>
        <span class="flex-1 truncate font-medium">${it.file.name}</span>
        <span class="text-xs text-gray-400">${(it.file.size / 1024).toFixed(0)} KB</span>
        <button type="button" data-i="${i}" class="rm text-red-400 text-xs font-semibold hover:underline">Quitar</button>
      </div>`).join('');
    fileList.querySelectorAll('.rm').forEach(b => {
      b.onclick = () => {
        items.splice(+b.dataset.i, 1);
        renderList();
        updateGo();
      };
    });
  }

  function updateGo() {
    const cfg = MODES[mode];
    const ok = items.length >= cfg.minFiles;
    go.disabled = !ok;
  }

  function parsePages(str, max) {
    const set = new Set();
    str.split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(n => parseInt(n, 10));
        if (!a || !b) return;
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (i >= 1 && i <= max) set.add(i);
        }
      } else {
        const n = parseInt(part, 10);
        if (n >= 1 && n <= max) set.add(n);
      }
    });
    return [...set].sort((a, b) => a - b);
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function downloadBytes(bytes, name, type) {
    const blob = new Blob([bytes], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  go.addEventListener('click', async () => {
    if (go.disabled) return;
    go.disabled = true;
    go.textContent = 'Generando…';
    out.innerHTML = '';
    try {
      if (mode === 'merge') await doMerge();
      else if (mode === 'split') await doSplit();
      else if (mode === 'extract') await doExtract();
      else if (mode === 'rotate') await doRotate();
      else if (mode === 'pdf2img') await doPdf2Img();
      else if (mode === 'img2pdf') await doImg2Pdf();
    } catch (err) {
      console.error(err);
      out.innerHTML = `<p class="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">${err.message || err}</p>`;
    } finally {
      go.textContent = 'Generar';
      updateGo();
    }
  });

  async function doMerge() {
    if (items.length < 2) throw new Error('Necesitás al menos 2 PDFs para unir.');
    const { PDFDocument } = PDFLib;
    const merged = await PDFDocument.create();
    for (const it of items) {
      const doc = await PDFDocument.load(it.bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    }
    downloadBytes(await merged.save(), 'unido.pdf', 'application/pdf');
    out.innerHTML = `<p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">Listo: se descargó <strong>unido.pdf</strong> (${items.length} archivos).</p>`;
  }

  async function doSplit() {
    if (typeof JSZip === 'undefined') throw new Error('No se pudo cargar JSZip. Probá en Chrome o Edge.');
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(items[0].bytes);
    const n = doc.getPageCount();
    const zip = new JSZip();
    const base = (items[0].file.name || 'documento').replace(/\.pdf$/i, '');
    go.textContent = `Generando 0/${n}…`;
    for (let i = 0; i < n; i++) {
      const one = await PDFDocument.create();
      const [page] = await one.copyPages(doc, [i]);
      one.addPage(page);
      const bytes = await one.save();
      zip.file(`pagina-${i + 1}.pdf`, bytes);
      if (i % 5 === 0 || i === n - 1) go.textContent = `Generando ${i + 1}/${n}…`;
    }
    go.textContent = 'Comprimiendo ZIP…';
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const zipUrl = URL.createObjectURL(blob);
    out.innerHTML = `
      <p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">
        Listo: <strong>${n} páginas</strong> generadas en un ZIP (Descargar y descomprimir).
      </p>
      <a href="${zipUrl}" download="${base}-paginas.zip"
        class="inline-flex w-full justify-center py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold">
        Descargar ZIP
      </a>`;
  }

  async function doExtract() {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.load(items[0].bytes);
    const max = doc.getPageCount();
    const pages = parsePages($('#opt-pages')?.value || '', max);
    if (!pages.length) throw new Error('Indicá al menos una página válida (ej: 1-3, 5).');
    const one = await PDFDocument.create();
    const copied = await one.copyPages(doc, pages.map(p => p - 1));
    copied.forEach(p => one.addPage(p));
    downloadBytes(await one.save(), 'extraido.pdf', 'application/pdf');
    out.innerHTML = `<p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">Listo: páginas ${pages.join(', ')} → <strong>extraido.pdf</strong>.</p>`;
  }

  async function doRotate() {
    const { PDFDocument, degrees } = PDFLib;
    const angle = +($('#opt-angle')?.value || 90);
    const doc = await PDFDocument.load(items[0].bytes);
    doc.getPages().forEach(p => p.setRotation(degrees(angle)));
    downloadBytes(await doc.save(), 'rotado.pdf', 'application/pdf');
    out.innerHTML = `<p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">Listo: todas las páginas giradas ${angle}°.</p>`;
  }

  async function doPdf2Img() {
    if (typeof JSZip === 'undefined') throw new Error('No se pudo cargar JSZip. Probá en Chrome o Edge.');
    const scale = +($('#opt-scale')?.value || 1.5);
    const pdf = await pdfjsLib.getDocument({ data: items[0].bytes }).promise;
    const n = pdf.numPages;
    const zip = new JSZip();
    const base = (items[0].file.name || 'documento').replace(/\.pdf$/i, '');
    const previews = [];
    go.textContent = `Generando 0/${n}…`;
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      zip.file(`pagina-${i}.jpg`, blob);
      if (i <= 6) previews.push(URL.createObjectURL(blob));
      if (i % 3 === 0 || i === n) go.textContent = `Generando ${i}/${n}…`;
    }
    go.textContent = 'Comprimiendo ZIP…';
    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const prevHtml = previews.length
      ? `<p class="text-xs text-gray-500 mt-2 mb-1">Vista previa (primeras páginas):</p>
         <div class="grid grid-cols-3 gap-2">${previews.map(u => `<img src="${u}" class="rounded-lg border border-gray-100" alt="" />`).join('')}</div>`
      : '';
    out.innerHTML = `
      <p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">
        Listo: <strong>${n} imágenes JPG</strong> en un solo ZIP.
      </p>
      <a href="${zipUrl}" download="${base}-imagenes.zip"
        class="inline-flex w-full justify-center py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold">
        Descargar ZIP
      </a>
      ${prevHtml}`;
  }

  async function doImg2Pdf() {
    const { PDFDocument } = PDFLib;
    const doc = await PDFDocument.create();
    for (const it of items) {
      let img;
      if (it.file.type === 'image/png') img = await doc.embedPng(it.bytes);
      else {
        // jpeg / webp: try jpg embed; webp may fail → draw via canvas
        try {
          img = await doc.embedJpg(it.bytes);
        } catch {
          const url = URL.createObjectURL(new Blob([it.bytes], { type: it.file.type }));
          const bitmap = await createImageBitmap(await fetch(url).then(r => r.blob()));
          URL.revokeObjectURL(url);
          const c = document.createElement('canvas');
          c.width = bitmap.width;
          c.height = bitmap.height;
          c.getContext('2d').drawImage(bitmap, 0, 0);
          const jpgBlob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.92));
          const jpgBytes = new Uint8Array(await jpgBlob.arrayBuffer());
          img = await doc.embedJpg(jpgBytes);
        }
      }
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    downloadBytes(await doc.save(), 'imagenes.pdf', 'application/pdf');
    out.innerHTML = `<p class="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">Listo: <strong>imagenes.pdf</strong> con ${items.length} página(s).</p>`;
  }

  setMode('merge');
})();
