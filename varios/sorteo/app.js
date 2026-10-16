(() => {
  const $ = (s) => document.querySelector(s);
  let mode = 'numeros';
  let rotation = 0;

  function items() {
    if (mode === 'numeros') {
      let a = parseInt($('#n-from').value, 10);
      let b = parseInt($('#n-to').value, 10);
      if (Number.isNaN(a)) a = 1;
      if (Number.isNaN(b)) b = 50;
      if (a > b) [a, b] = [b, a];
      const max = 500;
      if (b - a + 1 > max) b = a + max - 1;
      const list = [];
      for (let i = a; i <= b; i++) list.push(String(i));
      return list;
    }
    return ($('#names').value || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);
  }

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
    $('#cfg-num').classList.toggle('hidden', m !== 'numeros');
    $('#cfg-names').classList.toggle('hidden', m !== 'nombres');
    drawWheel();
  }

  document.querySelectorAll('.mode').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('#names').addEventListener('input', () => {
    const n = items().length;
    $('#name-count').textContent = n + ' nombre' + (n === 1 ? '' : 's');
    drawWheel();
  });
  ['n-from', 'n-to'].forEach(id => $(`#${id}`).addEventListener('input', drawWheel));

  function showWinner(w) {
    $('#result').classList.remove('hidden');
    $('#winner').textContent = w;
  }

  $('#btn-draw').onclick = () => {
    const list = items();
    if (!list.length) { alert('Agregá números o nombres.'); return; }
    const w = list[Math.floor(Math.random() * list.length)];
    showWinner(w);
  };

  const canvas = $('#wheel');
  const ctx = canvas.getContext('2d');
  const colors = ['#a88cd7', '#8e66cf', '#fa87f1', '#c4b0e8', '#7b5cb8', '#e8a0e0', '#9b7ed4', '#d4b8f0'];

  function drawWheel() {
    const list = items();
    const n = Math.max(list.length, 1);
    const cx = canvas.width / 2, cy = canvas.height / 2, r = canvas.width / 2 - 4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const slice = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, i * slice - Math.PI / 2, (i + 1) * slice - Math.PI / 2);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.stroke();
      // label
      const label = list[i] || '·';
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * slice + slice / 2 - Math.PI / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${n > 30 ? 10 : n > 16 ? 12 : 14}px Inter, system-ui, sans-serif`;
      const text = label.length > 12 ? label.slice(0, 11) + '…' : label;
      ctx.fillText(text, r - 10, 4);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#8e66cf';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  $('#btn-spin').onclick = () => {
    const list = items();
    if (!list.length) { alert('Agregá números o nombres.'); return; }
    const n = list.length;
    const winIndex = Math.floor(Math.random() * n);
    // pointer at top; segments start at -PI/2
    const slice = 360 / n;
    const targetCenter = winIndex * slice + slice / 2;
    const extra = 5 * 360;
    // we want targetCenter to land at top (0 in our CSS rotate sense)
    rotation = rotation + extra + (360 - (targetCenter % 360)) - (rotation % 360);
    canvas.style.transform = `rotate(${rotation}deg)`;
    setTimeout(() => showWinner(list[winIndex]), 4200);
  };

  $('#btn-pdf').onclick = async () => {
    const list = items();
    if (!list.length) { alert('Agregá números o nombres.'); return; }
    if (list.length > 400) { alert('Máximo 400 casilleros por PDF.'); return; }
    try {
      const { PDFDocument, rgb, StandardFonts } = PDFLib;
      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pageW = 210, pageH = 297, margin = 12;
      // cell size depends on count
      const cols = list.length <= 50 ? 5 : list.length <= 100 ? 5 : list.length <= 200 ? 8 : 10;
      const gap = 3;
      const usableW = pageW - 2 * margin;
      const cellW = (usableW - (cols - 1) * gap) / cols;
      const cellH = Math.min(cellW * 0.7, 18);
      let page = pdf.addPage([pageW, pageH]);
      let x = margin, y = pageH - margin - cellH;
      const title = mode === 'numeros' ? 'Rifa — números' : 'Rifa — participantes';
      page.drawText(title, { x: margin, y: pageH - 10, size: 10, font, color: rgb(0.4, 0.3, 0.55) });
      y = pageH - 16 - cellH;

      list.forEach((label, i) => {
        if (y < margin) {
          page = pdf.addPage([pageW, pageH]);
          x = margin;
          y = pageH - margin - cellH;
        }
        page.drawRectangle({
          x, y, width: cellW, height: cellH,
          borderColor: rgb(0.55, 0.4, 0.75),
          borderWidth: 0.6,
        });
        const t = String(label).slice(0, 18);
        const tw = font.widthOfTextAtSize(t, 8);
        page.drawText(t, {
          x: x + (cellW - tw) / 2,
          y: y + cellH / 2 - 3,
          size: 8,
          font,
          color: rgb(0.15, 0.12, 0.2),
        });
        // small blank for name if numbers
        if (mode === 'numeros') {
          page.drawLine({
            start: { x: x + 2, y: y + 3 },
            end: { x: x + cellW - 2, y: y + 3 },
            thickness: 0.3,
            color: rgb(0.7, 0.65, 0.8),
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
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rifa-grilla.pdf';
      a.click();
    } catch (err) {
      console.error(err);
      alert('No se pudo generar el PDF.');
    }
  };

  setMode('numeros');
  drawWheel();
})();
