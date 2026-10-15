(() => {
  const $ = (s) => document.querySelector(s);
  const A4_W = 210, A4_H = 297; // mm

  const PRESETS = {
    tarjeta: [
      { label: '85×55 (clásica)', w: 85, h: 55 },
      { label: '90×50', w: 90, h: 50 },
      { label: '70×40', w: 70, h: 40 },
    ],
    sticker: [
      { label: '50×50', w: 50, h: 50 },
      { label: '40×40', w: 40, h: 40 },
      { label: '60×40', w: 60, h: 40 },
      { label: '30×30', w: 30, h: 30 },
    ],
    etiqueta: [
      { label: '70×30', w: 70, h: 30 },
      { label: '50×25', w: 50, h: 25 },
      { label: '100×40', w: 100, h: 40 },
    ],
  };

  let mode = 'tarjeta';
  let items = []; // { file, url, img, qty }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('.mode').forEach(btn => {
      const on = btn.dataset.mode === m;
      btn.classList.toggle('active', on);
      btn.classList.toggle('border-2', on);
      btn.classList.toggle('border-primary/30', on);
      btn.classList.toggle('border', !on);
      btn.classList.toggle('border-primary/15', !on);
      const t = btn.querySelector('.font-bold');
      if (t) t.classList.toggle('text-primary-dark', on);
    });
    const box = $('#presets');
    box.innerHTML = PRESETS[m].map((p, i) =>
      `<button type="button" class="preset text-[11px] px-2.5 py-1.5 rounded-full border border-primary/25 bg-white" data-w="${p.w}" data-h="${p.h}">${p.label}</button>`
    ).join('');
    box.querySelectorAll('.preset').forEach(b => {
      b.onclick = () => {
        $('#w-mm').value = b.dataset.w;
        $('#h-mm').value = b.dataset.h;
        updateFit();
      };
    });
    // default first preset
    const p0 = PRESETS[m][0];
    $('#w-mm').value = p0.w;
    $('#h-mm').value = p0.h;
    // stickers more gap by default
    $('#gap').value = m === 'sticker' ? 5 : 3;
    updateFit();
  }

  document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  function colsRows(pw, ph, margin, gap) {
    const usableW = A4_W - 2 * margin;
    const usableH = A4_H - 2 * margin;
    const cols = Math.max(1, Math.floor((usableW + gap) / (pw + gap)));
    const rows = Math.max(1, Math.floor((usableH + gap) / (ph + gap)));
    return { cols, rows, perPage: cols * rows };
  }

  function updateFit() {
    const pw = +$('#w-mm').value || 50;
    const ph = +$('#h-mm').value || 50;
    const margin = +$('#margin').value || 8;
    const gap = +$('#gap').value || 0;
    const { cols, rows, perPage } = colsRows(pw, ph, margin, gap);
    const totalQty = items.reduce((s, it) => s + (it.qty || 0), 0);
    const pages = totalQty ? Math.ceil(totalQty / perPage) : 0;
    $('#fit-info').textContent =
      `Entran ${cols}×${rows} = ${perPage} por hoja A4` +
      (totalQty ? ` · ${totalQty} piezas ≈ ${pages} hoja(s)` : '');
    $('#go').disabled = !items.length || !totalQty;
  }

  ['w-mm','h-mm','margin','gap'].forEach(id => {
    $(`#${id}`).addEventListener('input', updateFit);
  });

  const drop = $('#drop');
  const fileInput = $('#file');
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('drag'); addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', () => { addFiles(fileInput.files); fileInput.value = ''; });

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
      const url = URL.createObjectURL(file);
      const img = await loadImg(url);
      items.push({ file, url, img, qty: 1 });
      if ($('#lock-ratio').checked && items.length === 1) {
        const w = +$('#w-mm').value;
        const h = Math.round((w * img.naturalHeight / img.naturalWidth) * 10) / 10;
        if (h >= 10 && h <= 280) $('#h-mm').value = h;
      }
    }
    renderList();
    updateFit();
  }

  function renderList() {
    $('#list').innerHTML = items.map((it, i) => `
      <div class="flex gap-3 items-center p-3 rounded-xl bg-primary-soft/40 border border-primary/10">
        <img src="${it.url}" class="w-14 h-14 object-cover rounded-lg border border-white" alt="" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">${it.file.name}</p>
          <label class="text-[11px] text-gray-500">Cantidad en la hoja</label>
          <div class="flex items-center gap-2 mt-0.5">
            <button type="button" data-i="${i}" data-d="-1" class="qtybtn w-9 h-9 rounded-lg border border-primary/25 bg-white font-bold">−</button>
            <input type="number" data-i="${i}" class="qty min-w-0 w-16 text-center rounded-lg border border-gray-200 py-1.5 text-sm font-semibold" min="1" max="500" value="${it.qty}" />
            <button type="button" data-i="${i}" data-d="1" class="qtybtn w-9 h-9 rounded-lg border border-primary/25 bg-white font-bold">+</button>
          </div>
        </div>
        <button type="button" data-i="${i}" class="rm text-xs text-red-400 font-semibold">Quitar</button>
      </div>`).join('');
    $('#list').querySelectorAll('.qty').forEach(inp => {
      inp.oninput = () => {
        const i = +inp.dataset.i;
        items[i].qty = Math.max(1, parseInt(inp.value, 10) || 1);
        updateFit();
      };
    });
    $('#list').querySelectorAll('.qtybtn').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        items[i].qty = Math.max(1, items[i].qty + +b.dataset.d);
        renderList();
        updateFit();
      };
    });
    $('#list').querySelectorAll('.rm').forEach(b => {
      b.onclick = () => {
        const i = +b.dataset.i;
        URL.revokeObjectURL(items[i].url);
        items.splice(i, 1);
        renderList();
        updateFit();
      };
    });
  }

  async function imgToPngBytes(img, maxSide = 1200) {
    const r = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * r));
    c.height = Math.max(1, Math.round(img.naturalHeight * r));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  }

  $('#go').addEventListener('click', async () => {
    const go = $('#go');
    go.disabled = true;
    go.textContent = 'Generando…';
    $('#out').textContent = '';
    try {
      const { PDFDocument } = PDFLib;
      const pdf = await PDFDocument.create();
      const pw = +$('#w-mm').value;
      const ph = +$('#h-mm').value;
      const margin = +$('#margin').value;
      const gap = +$('#gap').value;
      const { cols, rows, perPage } = colsRows(pw, ph, margin, gap);

      // Expand queue: image embeds in order with qty
      const queue = [];
      for (const it of items) {
        const bytes = await imgToPngBytes(it.img);
        const embed = await pdf.embedPng(bytes);
        for (let q = 0; q < it.qty; q++) queue.push(embed);
      }

      let idx = 0;
      while (idx < queue.length) {
        const page = pdf.addPage([A4_W, A4_H]);
        for (let r = 0; r < rows && idx < queue.length; r++) {
          for (let c = 0; c < cols && idx < queue.length; c++) {
            const x = margin + c * (pw + gap);
            // PDF y from bottom
            const y = A4_H - margin - ph - r * (ph + gap);
            page.drawImage(queue[idx], { x, y, width: pw, height: ph });
            idx++;
          }
        }
      }

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mode}-a4.pdf`;
      a.click();
      $('#out').innerHTML = `<p class="text-green-700 bg-green-50 border border-green-100 rounded-xl p-3">Listo: PDF A4 con ${queue.length} pieza(s) en ${Math.ceil(queue.length / perPage)} hoja(s).</p>`;
    } catch (err) {
      console.error(err);
      $('#out').innerHTML = `<p class="text-red-600">${err.message || err}</p>`;
    } finally {
      go.disabled = false;
      go.textContent = 'Generar PDF A4';
      updateFit();
    }
  });

  setMode('tarjeta');
})();
