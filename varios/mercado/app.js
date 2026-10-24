(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = 'mml-mercado-v3';
  let items = [];

  try {
    const raw = JSON.parse(
      localStorage.getItem(KEY) ||
      localStorage.getItem('mml-mercado-v2') ||
      localStorage.getItem('mml-mercado-v1') ||
      '[]'
    );
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

  /** Subtotal visual (también sin check, para ir completando). */
  function subtotalCalc(it) {
    const c = Number(it.cant);
    const p = Number(it.precio);
    if (!c || c <= 0 || Number.isNaN(c)) return null;
    if (p == null || Number.isNaN(p) || p < 0) return null;
    return c * p;
  }

  /** Solo suma al total del carrito si está marcado. */
  function subtotalCarrito(it) {
    if (!it.done) return null;
    return subtotalCalc(it);
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

  function pendingList() {
    return items
      .map((it, i) => ({ it, i }))
      .filter(x => !x.it.done)
      .sort((a, b) => (a.it.addedAt || 0) - (b.it.addedAt || 0));
  }

  function doneList() {
    return items
      .map((it, i) => ({ it, i }))
      .filter(x => x.it.done)
      .sort((a, b) => (b.it.checkedAt || 0) - (a.it.checkedAt || 0));
  }

  function updateVisor() {
    const done = items.filter(it => it.done);
    let total = 0;
    let conPrecio = 0;
    done.forEach(it => {
      const s = subtotalCarrito(it);
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
        warn.textContent = pending.length + ' por agarrar';
        warn.classList.remove('hidden');
      } else {
        warn.classList.add('hidden');
      }
    }

    const box = $('#avisos');
    if (!box) return;
    const notes = [];
    if (pending.length) {
      notes.push('<p class="text-amber-800"><strong>' + pending.length + '</strong> en la lista <strong>sin marcar</strong> (completá cantidad/precio y marcá cuando lo agarres).</p>');
    }
    if (noQty.length) {
      notes.push('<p class="text-amber-800"><strong>' + noQty.length + '</strong> en el carrito <strong>sin cantidad</strong>.</p>');
    }
    if (noPrice.length) {
      notes.push('<p class="text-amber-800"><strong>' + noPrice.length + '</strong> en el carrito <strong>sin precio</strong> (no suman al total).</p>');
    }
    if (notes.length) {
      box.className = 'rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] leading-snug space-y-1';
      box.innerHTML = notes.join('');
      box.classList.remove('hidden');
    } else if (done.length) {
      box.className = 'rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[12px] leading-snug text-emerald-900';
      box.innerHTML = '<p>Carrito completo con cantidad y precio. Total al día.</p>';
      box.classList.remove('hidden');
    } else {
      box.classList.add('hidden');
      box.innerHTML = '';
    }
  }

  function updateRowSubtotal(row, it) {
    const el = row.querySelector('.subtotal-line');
    if (!el) return;
    const st = subtotalCalc(it);
    el.innerHTML = st != null
      ? money(st)
      : '<span class="text-gray-400 font-medium">—</span>';
  }

  function bindRow(row, i) {
    const it = items[i];
    if (!it) return;

    const chk = row.querySelector('.chk');
    if (chk) {
      chk.onchange = () => {
        it.done = chk.checked;
        if (chk.checked) {
          it.checkedAt = Date.now();
          if (it.cant == null || it.cant === '' || Number(it.cant) <= 0) it.cant = 1;
        } else {
          it.checkedAt = null;
        }
        save();
        render(); // solo reordena al marcar/desmarcar
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

  function rowHtml(it, i, enCarrito) {
    const st = subtotalCalc(it);
    const cantVal = it.cant != null && !Number.isNaN(Number(it.cant)) ? it.cant : '';
    const precioVal = it.precio != null && !Number.isNaN(Number(it.precio)) ? it.precio : '';
    const bg = enCarrito ? 'is-cart' : '';
    const checked = enCarrito ? 'checked' : '';

    return `
      <div class="item-row ${bg}" data-i="${i}">
        <div class="item-top">
          <p class="item-name" title="${escapeHtml(it.nombre)}">${escapeHtml(it.nombre)}</p>
          <button type="button" class="rm" title="Quitar">✕</button>
        </div>
        <div class="item-bottom">
          <label class="chk-wrap" title="${enCarrito ? 'Quitar del carrito' : 'Marcar como agarrado'}">
            <input type="checkbox" class="chk" ${checked} />
            <span class="chk-label">${enCarrito ? 'Listo' : 'Agarrar'}</span>
          </label>
          <div class="field">
            <span class="field-label">Cant</span>
            <input type="number" class="qty" step="any" min="0" value="${cantVal}" placeholder="0" inputmode="decimal" />
          </div>
          <div class="field">
            <span class="field-label">Precio</span>
            <input type="number" class="precio" step="any" min="0" value="${precioVal}" placeholder="0" inputmode="decimal" />
          </div>
          <div class="field sub">
            <span class="field-label">Subt.</span>
            <p class="subtotal-line">${st != null ? money(st) : '—'}</p>
          </div>
        </div>
      </div>`;
  }

  function render() {
    const list = $('#list');
    if (!list) return;

    const pending = pendingList();
    const done = doneList();

    const tot = $('#total');
    if (tot) {
      tot.textContent = items.length
        ? (pending.length + ' por agarrar · ' + done.length + ' en carrito')
        : '0';
    }
    const btnPdf = $('#btn-pdf');
    const btnCopy = $('#btn-copy');
    if (btnPdf) btnPdf.disabled = !items.length;
    if (btnCopy) btnCopy.disabled = !items.length;
    updateVisor();

    if (!items.length) {
      list.innerHTML = '<p class="p-4 text-sm text-gray-400 text-center">La lista está vacía. Anotá lo que hace falta comprar.</p>';
      return;
    }

    let html = '';

    if (pending.length) {
      html += `
        <div class="list-section-head">
          <span class="sec-title">Para comprar</span>
        </div>`;
      pending.forEach(({ it, i }) => { html += rowHtml(it, i, false); });
    }

    if (done.length) {
      html += `
        <div class="list-section-head cart">
          <span class="sec-title">Ya en el carrito</span>
        </div>`;
      done.forEach(({ it, i }) => { html += rowHtml(it, i, true); });
    }

    list.innerHTML = html;
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
      if (!n) { flash('No hay ítems en el carrito.'); return; }
      items = items.filter(it => !it.done);
      save();
      render();
    };
  }

  if ($('#btn-copy')) {
    $('#btn-copy').onclick = async () => {
      if (!items.length) return;
      const lines = [];
      const pend = pendingList().map(x => x.it);
      const don = doneList().map(x => x.it);
      if (pend.length) {
        lines.push('Para comprar:');
        pend.forEach(it => {
          const q = qtyLabel(it);
          const st = subtotalCalc(it);
          let line = '• ' + it.nombre;
          if (q) line += ' — ' + q;
          if (it.precio != null) line += ' · $' + fmtNum(it.precio);
          if (st != null) line += ' → ' + money(st);
          lines.push(line);
        });
        lines.push('');
      }
      if (don.length) {
        lines.push('En el carrito:');
        don.forEach(it => {
          const q = qtyLabel(it);
          const st = subtotalCalc(it);
          let line = '✓ ' + it.nombre;
          if (q) line += ' — ' + q;
          if (it.precio != null) line += ' · $' + fmtNum(it.precio);
          if (st != null) line += ' → ' + money(st);
          lines.push(line);
        });
      }
      let total = 0;
      items.forEach(it => { const s = subtotalCarrito(it); if (s != null) total += s; });
      const text = 'Lista del super\n' + lines.join('\n') + '\n\nTotal carrito: ' + money(total);
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
      if (!items.length || typeof PDFLib === 'undefined') {
        if (typeof PDFLib === 'undefined') alert('No se cargó la librería PDF.');
        return;
      }
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

        function drawSection(title, list) {
          if (!list.length) return;
          if (y < margin + 24) {
            page = pdf.addPage([pageW, pageH]);
            y = pageH - margin;
          }
          page.drawText(title, { x: margin, y, size: 9, font: fontBold, color: rgb(0.42, 0.32, 0.58) });
          y -= rowH;
          list.forEach((it, idx) => {
            if (y < margin + 18) {
              page = pdf.addPage([pageW, pageH]);
              y = pageH - margin;
            }
            const st = subtotalCalc(it);
            const q = qtyLabel(it);
            let det = q || '—';
            if (it.precio != null) det += ' x $' + fmtNum(it.precio);
            if (st != null) det += ' = $' + fmtNum(st);
            const mark = it.done ? '✓ ' : '○ ';
            const nombre = fitText(mark + it.nombre, font, 9, nameMaxW);
            const detFit = fitText(det, font, 8, colRight);
            page.drawText(String(idx + 1), { x: xNum, y, size: 9, font, color: rgb(0.4, 0.4, 0.45) });
            page.drawText(nombre, { x: xName, y, size: 9, font, color: rgb(0.15, 0.12, 0.2) });
            page.drawText(detFit, {
              x: pageW - margin - font.widthOfTextAtSize(detFit, 8),
              y, size: 8, font, color: rgb(0.42, 0.32, 0.58),
            });
            y -= 3;
            page.drawLine({ start: { x: margin, y }, end: { x: pageW - margin, y }, thickness: 0.25, color: rgb(0.85, 0.82, 0.9) });
            y -= rowH;
          });
          y -= 4;
        }

        drawSection('Para comprar', pendingList().map(x => x.it));
        drawSection('En el carrito', doneList().map(x => x.it));

        let total = 0;
        items.forEach(it => { const s = subtotalCarrito(it); if (s != null) total += s; });
        if (y < margin + 16) {
          page = pdf.addPage([pageW, pageH]);
          y = pageH - margin;
        }
        page.drawText('Total carrito: ' + money(total), {
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
