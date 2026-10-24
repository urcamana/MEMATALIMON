(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = 'mml-mercado-v2';
  let items = [];

  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('mml-mercado-v1') || '[]');
    items = Array.isArray(raw) ? raw.map(normalize) : [];
  } catch (_) { items = []; }

  function normalize(it) {
    return {
      id: it.id || Date.now() + Math.random(),
      nombre: String(it.nombre || '').trim(),
      cant: it.cant != null && it.cant !== '' ? Number(it.cant) : null,
      unidad: it.unidad || '',
      done: !!it.done,
      precio: it.precio != null && it.precio !== '' ? Number(it.precio) : null,
      // orden estable: cuándo se agregó / cuándo se marcó
      addedAt: it.addedAt != null ? Number(it.addedAt) : Date.now(),
      checkedAt: it.checkedAt != null ? Number(it.checkedAt) : (it.done ? Date.now() : null),
    };
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (_) {}
  }

  function fmtNum(n) {
    if (n == null || n === '' || Number.isNaN(Number(n))) return '';
    const x = Number(n);
    if (Number.isInteger(x)) return String(x);
    return String(Math.round(x * 100) / 100);
  }

  function money(n) {
    const x = Number(n) || 0;
    return x.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 });
  }

  function qtyLabel(it) {
    const c = fmtNum(it.cant);
    const u = (it.unidad || '').trim();
    if (!c && !u) return '';
    if (c && u) return c + ' ' + u;
    return c || u;
  }

  function subtotal(it) {
    if (!it.done) return null;
    const c = Number(it.cant);
    const p = Number(it.precio);
    if (!c || c <= 0 || Number.isNaN(c)) return null;
    if (p == null || Number.isNaN(p) || p < 0) return null;
    return c * p;
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
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1600);
  }

  /** Pendientes por orden de agregado; marcados por último check primero. */
  function displayOrder() {
    const pending = items
      .map((it, i) => ({ it, i }))
      .filter(x => !x.it.done)
      .sort((a, b) => (a.it.addedAt || 0) - (b.it.addedAt || 0));

    const done = items
      .map((it, i) => ({ it, i }))
      .filter(x => x.it.done)
      .sort((a, b) => (b.it.checkedAt || 0) - (a.it.checkedAt || 0));

    return [...pending, ...done];
  }

  function updateVisor() {
    const done = items.filter(it => it.done);
    let total = 0;
    let conPrecio = 0;
    done.forEach(it => {
      const s = subtotal(it);
      if (s != null) { total += s; conPrecio++; }
    });
    const vt = $('#visor-total');
    if (vt) vt.textContent = money(total);
    const vm = $('#visor-meta');
    if (vm) {
      vm.textContent = done.length
        ? (done.length + ' en carrito' + (conPrecio < done.length ? ' · algunos sin precio' : ''))
        : 'Nada marcado todavía';
    }

    const pending = items.filter(it => !it.done);
    const noQty = done.filter(it => !it.cant || Number(it.cant) <= 0);
    const noPrice = done.filter(it => it.precio == null || Number.isNaN(Number(it.precio)));

    const warn = $('#visor-warn');
    if (warn) {
      if (pending.length) {
        warn.textContent = pending.length + ' sin agarrar';
        warn.classList.remove('hidden');
      } else {
        warn.classList.add('hidden');
      }
    }

    const box = $('#avisos');
    if (!box) return;
    const notes = [];
    if (pending.length) {
      notes.push('<p class="text-amber-800"><strong>' + pending.length + '</strong> producto(s) todavía <strong>sin marcar</strong> (no olvides revisarlos).</p>');
    }
    if (noQty.length) {
      notes.push('<p class="text-amber-800"><strong>' + noQty.length + '</strong> marcado(s) <strong>sin cantidad</strong>: el total no los suma bien hasta que indiques cuántos agarraste.</p>');
    }
    if (noPrice.length) {
      notes.push('<p class="text-amber-800"><strong>' + noPrice.length + '</strong> marcado(s) <strong>sin precio de góndola</strong>: opcional, pero sin precio no entran en el total.</p>');
    }
    if (notes.length) {
      box.className = 'rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-snug space-y-1';
      box.innerHTML = notes.join('');
      box.classList.remove('hidden');
    } else if (done.length) {
      box.className = 'rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] leading-snug text-emerald-900';
      box.innerHTML = '<p>Todo lo marcado tiene cantidad y precio. Total al día.</p>';
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
      box.innerHTML = '';
    }
  }

  function updateRowSubtotal(row, it) {
    const el = row.querySelector('.subtotal-line');
    if (!el) return;
    const st = subtotal(it);
    el.innerHTML = 'Subtotal: ' + (st != null
      ? money(st)
      : '<span class="text-gray-400 font-medium">— (falta cantidad o precio)</span>');
  }

  function bindRow(row, i) {
    const it = items[i];
    if (!it) return;

    const chk = row.querySelector('.chk');
    if (chk) {
      chk.onchange = () => {
        const wasDone = it.done;
        it.done = chk.checked;
        if (chk.checked) {
          it.checkedAt = Date.now();
          if (it.cant == null || it.cant === '' || Number(it.cant) <= 0) it.cant = 1;
        } else {
          it.checkedAt = null;
        }
        save();
        // Solo reordenar al marcar/desmarcar (no al editar precio/cant)
        render();
      };
    }

    const rm = row.querySelector('.rm');
    if (rm) {
      rm.onclick = () => {
        items.splice(i, 1);
        save();
        render();
      };
    }

    row.querySelectorAll('.adj').forEach(btn => {
      btn.onclick = () => {
        let n = Number(it.cant);
        if (Number.isNaN(n) || n < 0) n = 0;
        n = Math.max(0, n + (+btn.dataset.d));
        it.cant = n;
        const qtyInp = row.querySelector('.qty');
        if (qtyInp) qtyInp.value = n;
        save();
        updateRowSubtotal(row, it);
        updateVisor();
        // NO render() → no salta de lugar
      };
    });

    const qty = row.querySelector('.qty');
    if (qty) {
      qty.onchange = () => {
        let n = parseFloat(qty.value);
        if (Number.isNaN(n) || n < 0) n = 0;
        it.cant = n;
        qty.value = n;
        save();
        updateRowSubtotal(row, it);
        updateVisor();
      };
    }

    const precio = row.querySelector('.precio');
    if (precio) {
      precio.onchange = () => {
        const v = (precio.value || '').trim();
        if (v === '') {
          it.precio = null;
        } else {
          let n = parseFloat(v);
          if (Number.isNaN(n) || n < 0) n = 0;
          it.precio = n;
        }
        save();
        updateRowSubtotal(row, it);
        updateVisor();
      };
    }
  }

  function render() {
    const list = $('#list');
    if (!list) return;

    const pending = items.filter(it => !it.done).length;
    const done = items.filter(it => it.done).length;
    const tot = $('#total');
    if (tot) {
      tot.textContent = items.length
        ? (pending + ' por agarrar · ' + done + ' en carrito')
        : '0';
    }
    const btnPdf = $('#btn-pdf');
    const btnCopy = $('#btn-copy');
    if (btnPdf) btnPdf.disabled = !items.length;
    if (btnCopy) btnCopy.disabled = !items.length;
    updateVisor();

    if (!items.length) {
      list.innerHTML = '<p id="empty" class="p-4 text-sm text-gray-400 text-center">La lista está vacía. Anotá lo que hace falta comprar.</p>';
      return;
    }

    const order = displayOrder();

    list.innerHTML = order.map(({ it, i }) => {
      const q = qtyLabel(it);
      if (!it.done) {
        return `
          <div class="item-row px-3 py-3 border-b border-primary/10 last:border-0" data-i="${i}">
            <div class="flex items-center gap-3">
              <input type="checkbox" class="chk w-5 h-5 accent-primary shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="item-name text-sm font-medium text-ink">${escapeHtml(it.nombre)}</p>
              </div>
              <span class="text-xs text-gray-500 shrink-0 max-w-[40%] text-right">${q ? escapeHtml(q) : '<span class="text-gray-300">—</span>'}</span>
              <button type="button" class="rm text-red-400 text-xs font-semibold shrink-0">✕</button>
            </div>
          </div>`;
      }

      const st = subtotal(it);
      const cantVal = it.cant != null && !Number.isNaN(Number(it.cant)) ? it.cant : '';
      const precioVal = it.precio != null && !Number.isNaN(Number(it.precio)) ? it.precio : '';

      return `
        <div class="item-row item-done px-3 py-3 border-b border-primary/10 last:border-0 bg-primary-soft/25" data-i="${i}">
          <div class="flex items-start gap-3">
            <input type="checkbox" class="chk mt-1 w-5 h-5 accent-primary shrink-0" checked />
            <div class="flex-1 min-w-0 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <p class="item-name text-sm font-semibold text-ink">${escapeHtml(it.nombre)}</p>
                <button type="button" class="rm text-red-400 text-xs font-semibold shrink-0">✕</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-[10px] text-gray-500">Unidades agarradas</label>
                  <div class="flex items-center gap-1 mt-0.5">
                    <button type="button" data-d="-1" class="adj w-8 h-8 rounded-lg border border-primary/25 bg-white font-bold text-primary-dark text-sm">−</button>
                    <input type="number" class="qty flex-1 min-w-0 text-center rounded-lg border border-gray-200 py-1.5 text-sm font-semibold" step="any" min="0" value="${cantVal}" inputmode="decimal" />
                    <button type="button" data-d="1" class="adj w-8 h-8 rounded-lg border border-primary/25 bg-white font-bold text-primary-dark text-sm">+</button>
                  </div>
                  ${it.unidad ? `<p class="text-[10px] text-gray-400 mt-0.5">Medida: ${escapeHtml(it.unidad)}</p>` : ''}
                </div>
                <div>
                  <label class="text-[10px] text-gray-500">Precio góndola (c/u)</label>
                  <div class="relative mt-0.5">
                    <span class="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                    <input type="number" class="precio w-full rounded-lg border border-gray-200 py-1.5 pl-6 pr-2 text-sm font-semibold" step="any" min="0" placeholder="opcional" value="${precioVal}" inputmode="decimal" />
                  </div>
                </div>
              </div>
              <p class="subtotal-line text-xs text-primary-dark font-semibold">
                Subtotal: ${st != null ? money(st) : '<span class="text-gray-400 font-medium">— (falta cantidad o precio)</span>'}
              </p>
            </div>
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.item-row').forEach(row => {
      bindRow(row, +row.dataset.i);
    });
  }

  function addItem() {
    const nombre = ($('#nombre').value || '').trim();
    if (!nombre) {
      flash('Escribí qué querés comprar.');
      $('#nombre').focus();
      return;
    }
    let cantNum = null;
    const cantRaw = ($('#cant').value || '').trim();
    if (cantRaw !== '') {
      cantNum = parseFloat(cantRaw);
      if (Number.isNaN(cantNum) || cantNum < 0) {
        flash('Cantidad inválida.');
        $('#cant').focus();
        return;
      }
    }
    items.push({
      id: Date.now() + Math.random(),
      nombre,
      cant: cantNum,
      unidad: ($('#unidad') && $('#unidad').value) || '',
      done: false,
      precio: null,
      addedAt: Date.now(),
      checkedAt: null,
    });
    save();
    render();
    $('#nombre').value = '';
    if ($('#cant')) $('#cant').value = '';
    $('#nombre').focus();
    flash('Agregado ✓');
  }

  if ($('#btn-add')) $('#btn-add').onclick = addItem;
  if ($('#nombre')) {
    $('#nombre').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    });
  }
  if ($('#cant')) {
    $('#cant').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); addItem(); }
    });
  }

  if ($('#btn-clear')) {
    $('#btn-clear').onclick = () => {
      if (!items.length) return;
      if (!confirm('¿Vaciar toda la lista?')) return;
      items = [];
      save();
      render();
    };
  }

  if ($('#btn-clear-done')) {
    $('#btn-clear-done').onclick = () => {
      const n = items.filter(it => it.done).length;
      if (!n) { flash('No hay ítems marcados.'); return; }
      items = items.filter(it => !it.done);
      save();
      render();
    };
  }

  if ($('#btn-copy')) {
    $('#btn-copy').onclick = async () => {
      if (!items.length) return;
      const ordered = displayOrder().map(x => x.it);
      const lines = ordered.map(it => {
        const q = qtyLabel(it);
        const st = subtotal(it);
        let line = (it.done ? '✓ ' : '• ') + it.nombre;
        if (q) line += ' — ' + q;
        if (it.done && it.precio != null) line += ' · $' + fmtNum(it.precio) + ' c/u';
        if (st != null) line += ' → ' + money(st);
        return line;
      });
      let total = 0;
      items.forEach(it => { const s = subtotal(it); if (s != null) total += s; });
      const text = 'Lista del super\n' + lines.join('\n') + '\n\nTotal agarrado: ' + money(total);
      try {
        await navigator.clipboard.writeText(text);
        flash('Lista copiada');
      } catch {
        prompt('Copiá la lista:', text);
      }
    };
  }

  function fitText(text, font, size, maxW) {
    const t = String(text || '');
    if (font.widthOfTextAtSize(t, size) <= maxW) return t;
    let out = t;
    while (out.length > 1 && font.widthOfTextAtSize(out + '…', size) > maxW) out = out.slice(0, -1);
    return out + '…';
  }

  if ($('#btn-pdf')) {
    $('#btn-pdf').onclick = async () => {
      if (!items.length) return;
      try {
        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdf = await PDFDocument.create();
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
        const pageW = 210, pageH = 297, margin = 16, rowH = 11;
        const xNum = margin, colNumW = 12, gap = 3;
        const xName = margin + colNumW + gap;
        const colRight = 55;
        const nameMaxW = pageW - margin - xName - colRight - gap;

        let page = pdf.addPage([pageW, pageH]);
        let y = pageH - margin;
        const titulo = (($('#titulo') && $('#titulo').value) || '').trim() || 'Lista del super';
        page.drawText(fitText(titulo, fontBold, 13, pageW - 2 * margin), {
          x: margin, y: y - 4, size: 13, font: fontBold, color: rgb(0.42, 0.32, 0.58),
        });
        y -= 12;
        page.drawText(new Date().toLocaleString('es-AR'), {
          x: margin, y, size: 8, font, color: rgb(0.45, 0.45, 0.5),
        });
        y -= 8;
        page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.8, color: rgb(0.66, 0.55, 0.84) });
        y -= 10;

        page.drawText('#', { x: xNum, y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45) });
        page.drawText('Producto', { x: xName, y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45) });
        page.drawText('Detalle', {
          x: pageW - margin - fontBold.widthOfTextAtSize('Detalle', 8),
          y, size: 8, font: fontBold, color: rgb(0.35, 0.3, 0.45),
        });
        y -= 4;
        page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.4, color: rgb(0.75, 0.7, 0.85) });
        y -= rowH;

        const ordered = displayOrder().map(x => x.it);
        let total = 0;
        ordered.forEach((it, i) => {
          if (y < margin + 18) {
            page = pdf.addPage([pageW, pageH]);
            y = pageH - margin;
          }
          const st = subtotal(it);
          if (st != null) total += st;
          const q = qtyLabel(it);
          let det = '';
          if (it.done) {
            det = (q || '—');
            if (it.precio != null) det += ' x $' + fmtNum(it.precio);
            if (st != null) det += ' = $' + fmtNum(st);
          } else {
            det = q || 'pendiente';
          }
          const nombre = fitText((it.done ? '✓ ' : '○ ') + it.nombre, font, 9, nameMaxW);
          const detFit = fitText(det, font, 8, colRight);
          page.drawText(String(i + 1), { x: xNum, y, size: 9, font, color: rgb(0.4, 0.4, 0.45) });
          page.drawText(nombre, { x: xName, y, size: 9, font, color: rgb(0.15, 0.12, 0.2) });
          page.drawText(detFit, {
            x: pageW - margin - font.widthOfTextAtSize(detFit, 8),
            y, size: 8, font, color: rgb(0.42, 0.32, 0.58),
          });
          y -= 3;
          page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.25, color: rgb(0.85, 0.82, 0.9) });
          y -= rowH;
        });

        y -= 6;
        if (y < margin + 16) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        page.drawText('Total agarrado: ' + money(total), {
          x: margin, y, size: 11, font: fontBold, color: rgb(0.42, 0.32, 0.58),
        });

        const bytes = await pdf.save();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        a.download = 'lista-super.pdf';
        a.click();
      } catch (err) {
        console.error(err);
        alert('No se pudo generar el PDF.');
      }
    };
  }

  render();
})();
