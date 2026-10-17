(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = 'mml-inventario-v1';
  let items = [];

  try {
    items = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(items)) items = [];
  } catch (_) { items = []; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {}
  }

  function fmtCant(n) {
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 1000) / 1000);
  }

  function render() {
    const list = $('#list');
    $('#total').textContent = items.length + (items.length === 1 ? ' ítem' : ' ítems');
    $('#btn-pdf').disabled = !items.length;
    if (!items.length) {
      list.innerHTML = '<p id="empty" class="p-4 text-sm text-gray-400 text-center">Todavía no hay productos. Completá el formulario y tocá Agregar.</p>';
      return;
    }
    list.innerHTML = items.map((it, i) => `
      <div class="border-b border-primary/10 last:border-0 px-3 py-3">
        <div class="flex items-start gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-ink truncate">${escapeHtml(it.nombre)}</p>
            <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(it.unidad)}</p>
          </div>
          <button type="button" data-i="${i}" class="rm text-red-400 text-xs font-semibold shrink-0">Quitar</button>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <button type="button" data-i="${i}" data-d="-1" class="adj w-9 h-9 rounded-lg border border-primary/25 bg-white font-bold text-primary-dark">−</button>
          <input type="number" data-i="${i}" class="qty flex-1 min-w-0 text-center rounded-lg border border-gray-200 py-1.5 text-sm font-semibold" step="any" min="0" value="${it.cant}" />
          <button type="button" data-i="${i}" data-d="1" class="adj w-9 h-9 rounded-lg border border-primary/25 bg-white font-bold text-primary-dark">+</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('.rm').forEach(btn => {
      btn.onclick = () => {
        items.splice(+btn.dataset.i, 1);
        save();
        render();
      };
    });
    list.querySelectorAll('.adj').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i;
        const d = +btn.dataset.d;
        let n = items[i].cant + d;
        if (n < 0) n = 0;
        items[i].cant = n;
        save();
        render();
      };
    });
    list.querySelectorAll('.qty').forEach(inp => {
      inp.onchange = () => {
        const i = +inp.dataset.i;
        let n = parseFloat(inp.value);
        if (Number.isNaN(n) || n < 0) n = 0;
        items[i].cant = n;
        save();
        render();
      };
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function flash(msg) {
    const el = $('#msg');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1800);
  }

  function addItem() {
    const nombre = ($('#nombre').value || '').trim();
    let cant = parseFloat($('#cant').value);
    const unidad = $('#unidad').value || 'unidad';
    if (!nombre) {
      flash('Escribí el nombre del producto.');
      $('#nombre').focus();
      return;
    }
    if (Number.isNaN(cant) || cant < 0) {
      flash('Cantidad inválida.');
      $('#cant').focus();
      return;
    }
    items.push({
      id: Date.now() + Math.random(),
      nombre,
      cant,
      unidad,
    });
    save();
    render();
    $('#nombre').value = '';
    $('#cant').value = '1';
    // keep unidad as user left it
    $('#nombre').focus();
    flash('Agregado ✓');
  }

  $('#btn-add').onclick = addItem;
  $('#nombre').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  });
  $('#cant').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addItem(); }
  });

  $('#btn-clear').onclick = () => {
    if (!items.length) return;
    if (!confirm('¿Vaciar toda la lista?')) return;
    items = [];
    save();
    render();
  };

  $('#btn-pdf').onclick = async () => {
    if (!items.length) return;
    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pageW = 210, pageH = 297;
      const margin = 18;
      const lineH = 9;
      const rowH = 11;
      let page = pdf.addPage([pageW, pageH]);
      let y = pageH - margin;

      const titulo = ($('#titulo').value || '').trim() || 'Inventario';
      page.drawText(titulo.slice(0, 60), {
        x: margin, y: y - 4, size: 13, font: fontBold, color: rgb(0.42, 0.32, 0.58),
      });
      y -= 12;
      const fecha = new Date().toLocaleString('es-AR');
      page.drawText(fecha, {
        x: margin, y, size: 8, font, color: rgb(0.45, 0.45, 0.5),
      });
      y -= 8;
      page.drawLine({
        start: { x: margin, y }, end: { x: pageW - margin, y },
        thickness: 0.8, color: rgb(0.66, 0.55, 0.84),
      });
      y -= 10;

      // header
      page.drawText('#', { x: margin, y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45) });
      page.drawText('Producto', { x: margin + 12, y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45) });
      page.drawText('Cantidad', { x: pageW - margin - 45, y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45) });
      y -= 4;
      page.drawLine({
        start: { x: margin, y }, end: { x: pageW - margin, y },
        thickness: 0.4, color: rgb(0.75, 0.7, 0.85),
      });
      y -= rowH;

      items.forEach((it, i) => {
        if (y < margin + 20) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        const num = String(i + 1);
        const nombre = it.nombre.length > 48 ? it.nombre.slice(0, 47) + '…' : it.nombre;
        const cantStr = `${fmtCant(it.cant)} ${it.unidad}`;

        // zebra line background alternate via light line under each row
        page.drawText(num, { x: margin, y, size: 9, font, color: rgb(0.4, 0.4, 0.45) });
        page.drawText(nombre, { x: margin + 12, y, size: 9, font, color: rgb(0.15, 0.12, 0.2) });
        const tw = font.widthOfTextAtSize(cantStr, 9);
        page.drawText(cantStr, {
          x: pageW - margin - tw, y, size: 9, font: fontBold, color: rgb(0.42, 0.32, 0.58),
        });
        y -= 3;
        page.drawLine({
          start: { x: margin, y }, end: { x: pageW - margin, y },
          thickness: 0.25, color: rgb(0.85, 0.82, 0.9),
        });
        y -= rowH;
      });

      y -= 4;
      if (y < margin + 12) {
        page = pdf.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      page.drawText(`Total: ${items.length} ítem(s)`, {
        x: margin, y, size: 9, font: fontBold, color: rgb(0.42, 0.32, 0.58),
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'inventario.pdf';
      a.click();
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF.');
    }
  };

  render();
})();
