(function () {
  const KEY_BIZ = 'mml_presupuesto_biz_v1';
  const $ = (s) => document.querySelector(s);
  const itemsEl = $('#items');

  function fmt(n) {
    return '$' + (Math.round(n * 100) / 100).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function emptyItem() {
    return { desc: '', cant: 1, precio: 0 };
  }

  function stateFromDom() {
    const items = [];
    itemsEl.querySelectorAll('.item-row').forEach((row) => {
      items.push({
        desc: row.querySelector('.i-desc').value.trim(),
        cant: parseFloat(row.querySelector('.i-cant').value) || 0,
        precio: parseFloat(row.querySelector('.i-precio').value) || 0,
      });
    });
    return {
      bizName: $('#biz-name').value,
      bizExtra: $('#biz-extra').value,
      fecha: $('#fecha').value,
      numero: $('#numero').value,
      cliente: $('#cliente').value,
      validez: $('#validez').value,
      descuento: parseFloat($('#descuento').value) || 0,
      nota: $('#nota').value,
      items,
    };
  }

  function saveBiz() {
    try {
      localStorage.setItem(
        KEY_BIZ,
        JSON.stringify({
          bizName: $('#biz-name').value,
          bizExtra: $('#biz-extra').value,
          validez: $('#validez').value,
          numero: $('#numero').value,
        })
      );
    } catch (e) {}
  }

  function loadBiz() {
    try {
      return JSON.parse(localStorage.getItem(KEY_BIZ) || 'null');
    } catch (e) {
      return null;
    }
  }

  function renderItems(list) {
    itemsEl.innerHTML = '';
    (list.length ? list : [emptyItem()]).forEach((it) => {
      const row = document.createElement('div');
      row.className = 'item-row grid grid-cols-12 gap-1.5 items-center';
      row.innerHTML =
        '<input class="i-desc col-span-12 sm:col-span-5 rounded-lg border border-gray-200 px-2 py-1.5" placeholder="Descripción" value="' +
        (it.desc || '').replace(/"/g, '&quot;') +
        '" />' +
        '<input class="i-cant col-span-3 sm:col-span-2 rounded-lg border border-gray-200 px-2 py-1.5 text-center" type="number" min="0" step="1" value="' +
        (it.cant || 1) +
        '" />' +
        '<input class="i-precio col-span-6 sm:col-span-3 rounded-lg border border-gray-200 px-2 py-1.5 text-right" type="number" min="0" step="0.01" value="' +
        (it.precio || '') +
        '" placeholder="Precio" />' +
        '<button type="button" class="i-del col-span-3 sm:col-span-2 text-xs text-red-500 py-1">Quitar</button>';
      row.querySelector('.i-del').onclick = () => {
        row.remove();
        if (!itemsEl.children.length) renderItems([emptyItem()]);
        preview();
      };
      row.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', preview);
      });
      itemsEl.appendChild(row);
    });
  }

  function preview() {
    const st = stateFromDom();
    let sub = 0;
    st.items.forEach((it) => {
      sub += (it.cant || 0) * (it.precio || 0);
    });
    const total = sub * (1 - (st.descuento || 0) / 100);

    $('#pv-biz').textContent = st.bizName || 'Tu negocio';
    $('#pv-extra').textContent = st.bizExtra || '';
    $('#pv-meta').textContent =
      'Nº ' +
      (st.numero || '—') +
      '  ·  Fecha: ' +
      (st.fecha || '—') +
      '  ·  Validez: ' +
      (st.validez || '—') +
      ' días';
    $('#pv-cliente').textContent = st.cliente ? 'Cliente: ' + st.cliente : '';

    const box = $('#pv-items');
    box.innerHTML = '';
    const usable = st.items.filter((it) => it.desc || it.precio);
    if (!usable.length) {
      box.innerHTML = '<p class="text-gray-400 text-xs">Agregá ítems arriba…</p>';
    } else {
      usable.forEach((it) => {
        const line = document.createElement('div');
        line.className = 'flex justify-between gap-2';
        line.innerHTML =
          '<span class="truncate">' +
          (it.cant || 0) +
          ' × ' +
          (it.desc || 'Ítem') +
          '</span><span class="shrink-0 font-medium">' +
          fmt((it.cant || 0) * (it.precio || 0)) +
          '</span>';
        box.appendChild(line);
      });
    }

    $('#pv-sub').textContent = fmt(sub);
    if (st.descuento > 0) {
      $('#pv-desc-row').classList.remove('hidden');
      $('#pv-desc').textContent = st.descuento + '%';
    } else {
      $('#pv-desc-row').classList.add('hidden');
    }
    $('#pv-total').textContent = fmt(total);
    $('#pv-nota').textContent = st.nota ? 'Nota: ' + st.nota : '';

    saveBiz();
    return { sub, total, st };
  }

  function clearPedido() {
    $('#cliente').value = '';
    $('#descuento').value = 0;
    $('#nota').value = '';
    const today = new Date();
    $('#fecha').value = today.toISOString().slice(0, 10);
    // auto-increment número if numeric
    const num = ($('#numero').value || '').trim();
    if (/^\d+$/.test(num)) {
      const next = String(parseInt(num, 10) + 1).padStart(num.length, '0');
      $('#numero').value = next;
    }
    renderItems([emptyItem()]);
    preview();
  }

  $('#btn-add').onclick = () => {
    const st = stateFromDom();
    st.items.push(emptyItem());
    renderItems(st.items);
    preview();
  };

  ['biz-name', 'biz-extra', 'fecha', 'numero', 'cliente', 'validez', 'descuento', 'nota'].forEach((id) => {
    $('#' + id).addEventListener('input', preview);
  });

  $('#btn-pdf').onclick = async () => {
    const { sub, total, st } = preview();
    if (!st.items.some((it) => it.desc || it.precio)) {
      alert('Agregá al menos un ítem.');
      return;
    }
    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const page = pdf.addPage([210, 297]);
      const m = 18;
      let y = 280;
      const draw = (t, size, f, color) => {
        page.drawText(String(t).slice(0, 90), {
          x: m,
          y,
          size,
          font: f || font,
          color: color || rgb(0.15, 0.12, 0.2),
        });
        y -= size + 4;
      };
      draw(st.bizName || 'Presupuesto', 14, bold, rgb(0.4, 0.3, 0.55));
      if (st.bizExtra) draw(st.bizExtra, 8, font, rgb(0.4, 0.4, 0.45));
      y -= 2;
      draw('PRESUPUESTO (no válido como factura)', 9, bold, rgb(0.55, 0.35, 0.15));
      draw(
        'Nº ' +
          (st.numero || '—') +
          '  ·  Fecha: ' +
          (st.fecha || '—') +
          '  ·  Validez: ' +
          (st.validez || '—') +
          ' días',
        8
      );
      if (st.cliente) draw('Cliente: ' + st.cliente, 9, bold);
      y -= 4;
      page.drawLine({
        start: { x: m, y: y + 6 },
        end: { x: 192, y: y + 6 },
        thickness: 0.5,
        color: rgb(0.7, 0.65, 0.8),
      });
      st.items.forEach((it) => {
        if (!it.desc && !it.precio) return;
        if (y < 40) return;
        draw(
          (it.cant || 0) + ' x  ' + (it.desc || 'Ítem') + '  ·  ' + fmt((it.cant || 0) * (it.precio || 0)),
          8
        );
      });
      y -= 4;
      page.drawLine({
        start: { x: m, y: y + 6 },
        end: { x: 192, y: y + 6 },
        thickness: 0.5,
        color: rgb(0.7, 0.65, 0.8),
      });
      draw('Subtotal: ' + fmt(sub), 9);
      if (st.descuento) draw('Descuento: ' + st.descuento + '%', 9);
      draw('TOTAL: ' + fmt(total), 12, bold, rgb(0.4, 0.3, 0.55));
      if (st.nota) {
        y -= 2;
        draw('Nota: ' + st.nota, 8, font, rgb(0.4, 0.4, 0.45));
      }
      page.drawText('Documento orientativo · no es factura ni comprobante fiscal', {
        x: m,
        y: 18,
        size: 7,
        font,
        color: rgb(0.5, 0.45, 0.55),
      });
      const bytes = await pdf.save();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      a.download = 'presupuesto-' + (st.numero || 'mml') + '.pdf';
      a.click();
      // limpiar pedido; conservar negocio
      clearPedido();
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF.');
    }
  };

  // init
  const biz = loadBiz();
  if (biz) {
    $('#biz-name').value = biz.bizName || '';
    $('#biz-extra').value = biz.bizExtra || '';
    if (biz.validez) $('#validez').value = biz.validez;
    if (biz.numero) $('#numero').value = biz.numero;
  }
  const today = new Date();
  $('#fecha').value = today.toISOString().slice(0, 10);
  renderItems([emptyItem()]);
  preview();
})();
