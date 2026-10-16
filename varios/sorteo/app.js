(function () {
  const KEY = 'mml_rifa_v2';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  let mode = 'numeros';
  let cells = []; // { id, label, name, contact, sold }
  let wheelAngle = 0;

  function save() {
    const data = {
      mode,
      titulo: $('#titulo').value,
      premios: $('#premios').value,
      extra: $('#extra').value,
      nFrom: $('#n-from').value,
      nTo: $('#n-to').value,
      names: $('#names').value,
      cells,
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function setMode(m) {
    mode = m;
    $$('.mode').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
    $('#cfg-num').classList.toggle('hidden', m !== 'numeros');
    $('#cfg-names').classList.toggle('hidden', m !== 'nombres');
    save();
  }

  $$('.mode').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  function stats() {
    const sold = cells.filter((c) => c.sold).length;
    $('#stats').textContent = cells.length
      ? cells.length + ' casilleros · ' + sold + ' vendidos · ' + (cells.length - sold) + ' libres'
      : '';
  }

  function renderGrid() {
    const grid = $('#grid');
    const empty = $('#grid-empty');
    grid.innerHTML = '';
    empty.classList.toggle('hidden', cells.length > 0);
    cells.forEach((c, idx) => {
      const div = document.createElement('div');
      div.className = 'rounded-xl border border-primary/20 bg-white p-2 space-y-1 ' + (c.sold ? 'cell-sold' : '');
      div.innerHTML =
        '<div class="flex items-center justify-between gap-1">' +
        '<span class="font-bold text-primary-dark text-sm">' + escapeHtml(c.label) + '</span>' +
        '<span class="badge-sold text-[9px] font-semibold uppercase tracking-wide text-primary-dark bg-primary/20 px-1.5 py-0.5 rounded">Vendido</span>' +
        '</div>' +
        '<input type="text" class="c-name w-full rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Nombre" value="' + escapeAttr(c.name || '') + '" />' +
        '<input type="text" class="c-contact w-full rounded-lg border border-gray-200 px-2 py-1 text-xs" placeholder="Tel / contacto" value="' + escapeAttr(c.contact || '') + '" />' +
        '<label class="flex items-center gap-1.5 text-[11px] text-gray-600 pt-0.5">' +
        '<input type="checkbox" class="c-sold accent-primary-dark" ' + (c.sold ? 'checked' : '') + ' /> Vendida' +
        '</label>';
      const nameInp = div.querySelector('.c-name');
      const contactInp = div.querySelector('.c-contact');
      const soldInp = div.querySelector('.c-sold');
      nameInp.addEventListener('input', () => { cells[idx].name = nameInp.value; save(); });
      contactInp.addEventListener('input', () => { cells[idx].contact = contactInp.value; save(); });
      soldInp.addEventListener('change', () => {
        cells[idx].sold = soldInp.checked;
        div.classList.toggle('cell-sold', soldInp.checked);
        stats();
        save();
        drawWheel();
      });
      grid.appendChild(div);
    });
    stats();
    drawWheel();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  function genNumbers(force) {
    const from = parseInt($('#n-from').value, 10);
    const to = parseInt($('#n-to').value, 10);
    if (isNaN(from) || isNaN(to) || to < from) {
      alert('Revisá el rango desde / hasta.');
      return;
    }
    if (to - from + 1 > 400) {
      alert('Máximo 400 números.');
      return;
    }
    if (!force && cells.length && cells.some((c) => c.name || c.contact || c.sold)) {
      if (!confirm('Ya hay datos en la grilla. ¿Regenerar y perder esos datos?')) return;
    }
    cells = [];
    for (let n = from; n <= to; n++) {
      cells.push({ id: 'n' + n, label: String(n), name: '', contact: '', sold: false });
    }
    save();
    renderGrid();
  }

  function genNames(force) {
    const lines = ($('#names').value || '')
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!lines.length) {
      alert('Escribí al menos un nombre.');
      return;
    }
    if (lines.length > 400) {
      alert('Máximo 400 nombres.');
      return;
    }
    if (!force && cells.length && cells.some((c) => c.name || c.contact || c.sold)) {
      if (!confirm('Ya hay datos en la grilla. ¿Regenerar?')) return;
    }
    cells = lines.map((name, i) => ({
      id: 'p' + i,
      label: String(i + 1),
      name,
      contact: '',
      sold: true,
    }));
    save();
    renderGrid();
  }

  $('#btn-gen').onclick = () => genNumbers(false);
  $('#btn-gen-names').onclick = () => genNames(false);

  ['titulo', 'premios', 'extra', 'n-from', 'n-to', 'names'].forEach((id) => {
    $('#' + id).addEventListener('input', save);
  });

  function pool(onlySold) {
    if (onlySold) {
      const sold = cells.filter((c) => c.sold);
      return sold.length ? sold : [];
    }
    return cells.slice();
  }

  function pick(onlySold) {
    const list = pool(onlySold);
    if (!list.length) {
      alert(onlySold ? 'No hay números marcados como vendidos.' : 'No hay casilleros.');
      return null;
    }
    return list[Math.floor(Math.random() * list.length)];
  }

  function showWinner(c) {
    if (!c) return;
    $('#result').classList.remove('hidden');
    const extra = [c.name, c.contact].filter(Boolean).join(' · ');
    $('#winner').textContent = c.label + (extra ? ' — ' + extra : '');
  }

  $('#btn-draw').onclick = () => showWinner(pick(true));
  $('#btn-draw-all').onclick = () => showWinner(pick(false));

  function drawWheel() {
    const canvas = $('#wheel');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const list = pool(true);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = canvas.width / 2 - 4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const n = Math.max(list.length, 1);
    const colors = ['#a88cd7', '#8e66cf', '#c4b0e8', '#7a5bb5', '#d4c4f0', '#9b7fd4'];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = list.length ? colors[i % colors.length] : '#e8e0f2';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (list.length) {
        const mid = (a0 + a1) / 2;
        ctx.save();
        ctx.translate(cx + Math.cos(mid) * r * 0.65, cy + Math.sin(mid) * r * 0.65);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(list[i].label).slice(0, 6), 0, 0);
        ctx.restore();
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  $('#btn-spin').onclick = () => {
    const list = pool(true);
    if (!list.length) {
      alert('No hay números vendidos para la ruleta.');
      return;
    }
    const idx = Math.floor(Math.random() * list.length);
    const n = list.length;
    const slice = 360 / n;
    const target = 360 - (idx * slice + slice / 2);
    wheelAngle = wheelAngle + 1800 + target - (wheelAngle % 360);
    const canvas = $('#wheel');
    canvas.style.transition = 'transform 4.2s cubic-bezier(0.12, 0.75, 0.05, 1)';
    canvas.style.transform = 'rotate(' + wheelAngle + 'deg)';
    setTimeout(() => showWinner(list[idx]), 4300);
  };

  $('#btn-pdf').onclick = async () => {
    if (!cells.length) {
      alert('Generá la grilla primero.');
      return;
    }
    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const pageW = 210, pageH = 297, margin = 12;
      const cols = cells.length <= 40 ? 4 : cells.length <= 80 ? 5 : cells.length <= 150 ? 6 : 8;
      const gap = 2.5;
      const usableW = pageW - 2 * margin;
      const cellW = (usableW - (cols - 1) * gap) / cols;
      const cellH = Math.min(cellW * 0.85, 22);
      let page = pdf.addPage([pageW, pageH]);
      let yTop = pageH - margin;
      const titulo = ($('#titulo').value || 'Rifa').slice(0, 60);
      page.drawText(titulo, { x: margin, y: yTop - 8, size: 11, font: bold, color: rgb(0.4, 0.3, 0.55) });
      yTop -= 14;
      const premios = ($('#premios').value || '').replace(/\n/g, ' · ').slice(0, 100);
      if (premios) {
        page.drawText(premios, { x: margin, y: yTop - 6, size: 7, font, color: rgb(0.35, 0.35, 0.4) });
        yTop -= 10;
      }
      const extra = ($('#extra').value || '').slice(0, 90);
      if (extra) {
        page.drawText(extra, { x: margin, y: yTop - 6, size: 7, font, color: rgb(0.4, 0.4, 0.45) });
        yTop -= 10;
      }
      let x = margin;
      let y = yTop - cellH - 2;

      cells.forEach((c, i) => {
        if (y < margin + 4) {
          page = pdf.addPage([pageW, pageH]);
          x = margin;
          y = pageH - margin - cellH;
        }
        page.drawRectangle({
          x, y, width: cellW, height: cellH,
          borderColor: rgb(0.55, 0.4, 0.75),
          borderWidth: 0.5,
          color: c.sold ? rgb(0.92, 0.88, 0.96) : rgb(1, 1, 1),
        });
        page.drawText(String(c.label).slice(0, 8), {
          x: x + 2, y: y + cellH - 7, size: 7, font: bold, color: rgb(0.35, 0.25, 0.5),
        });
        const nm = (c.name || '').slice(0, 16);
        if (nm) {
          page.drawText(nm, { x: x + 2, y: y + cellH / 2 - 2, size: 6, font, color: rgb(0.2, 0.2, 0.25) });
        } else {
          page.drawLine({
            start: { x: x + 2, y: y + 8 },
            end: { x: x + cellW - 2, y: y + 8 },
            thickness: 0.3,
            color: rgb(0.75, 0.7, 0.85),
          });
        }
        if (c.contact) {
          page.drawText(String(c.contact).slice(0, 14), {
            x: x + 2, y: y + 3, size: 5, font, color: rgb(0.4, 0.4, 0.45),
          });
        }
        if (c.sold) {
          page.drawText('V', {
            x: x + cellW - 6, y: y + cellH - 7, size: 6, font: bold, color: rgb(0.45, 0.3, 0.6),
          });
        }
        if ((i + 1) % cols === 0) {
          x = margin;
          y -= cellH + gap;
        } else {
          x += cellW + gap;
        }
      });

      const bytes = await pdf.save();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      a.download = 'rifa-' + (titulo.replace(/\s+/g, '-').slice(0, 30) || 'grilla') + '.pdf';
      a.click();
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF.');
    }
  };

  $('#btn-reset').onclick = () => {
    if (!confirm('¿Borrar toda la rifa guardada en este dispositivo?')) return;
    localStorage.removeItem(KEY);
    cells = [];
    $('#titulo').value = '';
    $('#premios').value = '';
    $('#extra').value = '';
    $('#names').value = '';
    renderGrid();
  };

  // restore
  const saved = load();
  if (saved) {
    mode = saved.mode || 'numeros';
    setMode(mode);
    $('#titulo').value = saved.titulo || '';
    $('#premios').value = saved.premios || '';
    $('#extra').value = saved.extra || '';
    if (saved.nFrom != null) $('#n-from').value = saved.nFrom;
    if (saved.nTo != null) $('#n-to').value = saved.nTo;
    $('#names').value = saved.names || '';
    cells = Array.isArray(saved.cells) ? saved.cells : [];
    renderGrid();
  } else {
    setMode('numeros');
    drawWheel();
  }
})();
