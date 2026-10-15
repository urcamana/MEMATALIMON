(() => {
  const FONT_BASE = '/simulacion/fonts/';

  const FRASES = [
    'Hoy también cuenta.', 'Un paso a la vez.', 'Hecho es mejor que perfecto.',
    'Respirá. Seguís pudiendo.', 'Lo bueno tarda, pero llega.',
    'No tenés que poder con todo hoy.', 'Pequeños avances, grandes cambios.',
    'Modo enfoque: activado.', 'Si nadie lo intenta, no pasa nada.',
    'Tu ritmo también es válido.', 'Menos scroll, más vos.',
    'La constancia le gana al ánimo.', 'Hoy elijo no rendirme.',
    'Todo grande empezó chico.',
  ];

  const PRESET_BGS = [
    { id: 'p1', label: 'Lila', a: '#a88cd7', b: '#8e66cf' },
    { id: 'p2', label: 'Rosa', a: '#fa87f1', b: '#c44ec4' },
    { id: 'p3', label: 'Noche', a: '#1a1a2e', b: '#16213e' },
    { id: 'p4', label: 'Atardecer', a: '#f953c6', b: '#b91d73' },
    { id: 'p5', label: 'Mar', a: '#2193b0', b: '#6dd5ed' },
    { id: 'p6', label: 'Menta', a: '#11998e', b: '#38ef7d' },
    { id: 'p7', label: 'Fuego', a: '#f12711', b: '#f5af19' },
    { id: 'p8', label: 'Negro', a: '#111111', b: '#333333' },
    { id: 'p9', label: 'Blanco', a: '#f5f5f5', b: '#e0e0e0' },
    { id: 'p10', label: 'Oro', a: '#f7971e', b: '#ffd200' },
    { id: 'p11', label: 'Uva', a: '#4a00e0', b: '#8e2de2' },
    { id: 'p12', label: 'Cielo', a: '#2980b9', b: '#6dd5fa' },
    { id: 'p13', label: 'Sandía', a: '#ff416c', b: '#ff4b2b' },
    { id: 'p14', label: 'Bosque', a: '#134e5e', b: '#71b280' },
    { id: 'p15', label: 'Lavanda', a: '#c471f5', b: '#fa71cd' },
  ];

  const fonts = Array.isArray(window.ESTADOS_FONTS) ? window.ESTADOS_FONTS : [];
  const loaded = new Set();

  let font1 = fonts[0] || { name: 'Inter', file: '' };
  let font2 = fonts[1] || fonts[0] || { name: 'Inter', file: '' };
  let bold1 = false, italic1 = false;
  let bold2 = false, italic2 = false;
  let bgA = PRESET_BGS[0].a;
  let bgB = PRESET_BGS[0].b;
  let activePreset = PRESET_BGS[0].id;

  const $ = (s) => document.querySelector(s);
  const canvas = $('#cv');
  const ctx = canvas.getContext('2d');

  function familyId(name) {
    return 'ef-' + String(name).replace(/[^a-zA-Z0-9]+/g, '-');
  }

  function ensureFontFace(font) {
    if (!font?.file || loaded.has(font.file)) return Promise.resolve();
    const id = familyId(font.name);
    const safeUrl = FONT_BASE + font.file.split('/').map(encodeURIComponent).join('/');
    const face = new FontFace(id, `url("${safeUrl}")`);
    return face.load().then(f => {
      document.fonts.add(f);
      loaded.add(font.file);
    }).catch(err => console.warn('Fuente:', font.file, err));
  }

  async function useFont(font) {
    await ensureFontFace(font);
    return familyId(font.name);
  }

  const PRELOAD = 16;
  function preloadBatch(start, count) {
    fonts.slice(start, start + count).forEach(f => ensureFontFace(f));
  }
  preloadBatch(0, PRELOAD);

  function fontSpec(weightBold, isItalic, size, fam) {
    const style = isItalic ? 'italic' : 'normal';
    const weight = weightBold ? '700' : '400';
    return `${style} ${weight} ${size}px "${fam}", system-ui, sans-serif`;
  }

  // ---- Font lists ----
  function renderFontList(container, searchId, which) {
    const q = ($(searchId)?.value || '').trim().toLowerCase();
    const list = q ? fonts.filter(f => f.name.toLowerCase().includes(q)) : fonts;
    const current = which === 1 ? font1 : font2;
    container.innerHTML = list.map(f => {
      const active = current?.file === f.file;
      return `<button type="button" data-file="${f.file}" data-name="${f.name.replace(/"/g, '&quot;')}" data-which="${which}"
        class="font-btn px-2 py-2 rounded-xl border text-xs sm:text-sm truncate ${active ? 'active' : 'border-primary/15 bg-white'}"
        title="${f.name}">${f.name}</button>`;
    }).join('');
    container.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const f = { name: btn.dataset.name, file: btn.dataset.file };
        if (btn.dataset.which === '1') font1 = f; else font2 = f;
        await useFont(f);
        renderFontList($('#fonts1'), '#font-search1', 1);
        if ($('#sec-on').checked) renderFontList($('#fonts2'), '#font-search2', 2);
        draw();
      });
    });
    if (!container._scrollHook) {
      container._scrollHook = true;
      let next = PRELOAD;
      container.addEventListener('scroll', () => {
        if (container.scrollTop + container.clientHeight > container.scrollHeight - 80) {
          preloadBatch(next, 20);
          next += 20;
        }
      }, { passive: true });
    }
  }

  if ($('#font-count')) $('#font-count').textContent = fonts.length ? `${fonts.length} fuentes` : '';
  renderFontList($('#fonts1'), '#font-search1', 1);
  $('#font-search1').addEventListener('input', () => renderFontList($('#fonts1'), '#font-search1', 1));
  $('#font-search2').addEventListener('input', () => renderFontList($('#fonts2'), '#font-search2', 2));

  // ---- Texto 2 on/off ----
  $('#sec-on').addEventListener('change', () => {
    const on = $('#sec-on').checked;
    $('#sec-panel').classList.toggle('opacity-40', !on);
    $('#sec-panel').classList.toggle('pointer-events-none', !on);
    if (on) renderFontList($('#fonts2'), '#font-search2', 2);
    draw();
  });

  // ---- Bold / Italic ----
  function bindStyle(btnId, getter, setter) {
    const btn = $(btnId);
    btn.addEventListener('click', () => {
      setter(!getter());
      btn.classList.toggle('active', getter());
      draw();
    });
  }
  bindStyle('#bold1', () => bold1, v => { bold1 = v; });
  bindStyle('#italic1', () => italic1, v => { italic1 = v; });
  bindStyle('#bold2', () => bold2, v => { bold2 = v; });
  bindStyle('#italic2', () => italic2, v => { italic2 = v; });

  // ---- Size ----
  function clamp(n, min, max) {
    n = parseInt(n, 10);
    if (Number.isNaN(n)) n = min;
    return Math.min(max, Math.max(min, n));
  }
  function bindSize(numId, rangeId, minusId, plusId, min, max) {
    const num = $(numId);
    const range = $(rangeId);
    const sync = (v) => {
      v = clamp(v, min, max);
      num.value = v;
      range.value = v;
      draw();
    };
    num.addEventListener('input', () => sync(num.value));
    num.addEventListener('change', () => sync(num.value));
    range.addEventListener('input', () => sync(range.value));
    $(minusId).addEventListener('click', () => sync(+num.value - 4));
    $(plusId).addEventListener('click', () => sync(+num.value + 4));
  }
  bindSize('#size1', '#size1-range', '#size1-minus', '#size1-plus', 20, 220);
  bindSize('#size2', '#size2-range', '#size2-minus', '#size2-plus', 14, 160);

  // ---- Fondos ----
  const bgsBox = $('#bgs');
  bgsBox.innerHTML = PRESET_BGS.map(g => `
    <button type="button" data-id="${g.id}" title="${g.label}"
      class="bg-swatch w-9 h-9 rounded-full border-2 border-white shadow ${g.id === activePreset ? 'active' : ''}"
      style="background:linear-gradient(135deg,${g.a},${g.b})"></button>`).join('');
  bgsBox.querySelectorAll('.bg-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      const g = PRESET_BGS.find(x => x.id === btn.dataset.id);
      if (!g) return;
      bgA = g.a; bgB = g.b; activePreset = g.id;
      $('#bg-a').value = g.a;
      $('#bg-b').value = g.b;
      bgsBox.querySelectorAll('.bg-swatch').forEach(x => x.classList.toggle('active', x === btn));
      if (g.id === 'p9') {
        if ($('#color1').value === '#ffffff') $('#color1').value = '#222222';
        if ($('#color2').value === '#ffffff') $('#color2').value = '#333333';
      }
      draw();
    });
  });
  function customBg() {
    bgA = $('#bg-a').value;
    bgB = $('#bg-b').value;
    activePreset = null;
    bgsBox.querySelectorAll('.bg-swatch').forEach(x => x.classList.remove('active'));
    draw();
  }
  $('#bg-a').addEventListener('input', customBg);
  $('#bg-b').addEventListener('input', customBg);

  $('#btn-frase').addEventListener('click', () => {
    $('#text1').value = FRASES[Math.floor(Math.random() * FRASES.length)];
    draw();
  });
  ['text1', 'text2', 'color1', 'color2'].forEach(id => {
    $(`#${id}`).addEventListener('input', draw);
  });

  // ---- Canvas ----
  function wrapText(text, maxWidth, fontStr) {
    ctx.font = fontStr;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    });
    if (line) lines.push(line);
    const out = [];
    lines.forEach(ln => {
      if (ctx.measureText(ln).width <= maxWidth) out.push(ln);
      else {
        let chunk = '';
        for (const ch of ln) {
          if (ctx.measureText(chunk + ch).width > maxWidth) {
            out.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        if (chunk) out.push(chunk);
      }
    });
    return out;
  }

  async function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const fam1 = await useFont(font1);
    const secOn = $('#sec-on').checked;
    let fam2 = fam1;
    if (secOn) fam2 = await useFont(font2);

    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, bgA);
    grd.addColorStop(1, bgB);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const t1 = ($('#text1').value || 'Tu texto acá').trim();
    const size1 = +$('#size1').value;
    const spec1 = fontSpec(bold1, italic1, size1, fam1);
    const lines1 = wrapText(t1, w * 0.82, spec1);
    const lineH1 = size1 * 1.25;

    let lines2 = [];
    let lineH2 = 0;
    const size2 = +$('#size2').value;
    let spec2 = '';
    if (secOn) {
      const t2 = ($('#text2').value || '').trim();
      if (t2) {
        spec2 = fontSpec(bold2, italic2, size2, fam2);
        lines2 = wrapText(t2, w * 0.84, spec2);
        lineH2 = size2 * 1.3;
      }
    }

    const gap = lines2.length ? size1 * 0.45 : 0;
    const totalH = lines1.length * lineH1 + gap + lines2.length * lineH2;
    let y = (h - totalH) / 2 + size1 * 0.8;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = $('#color1').value;
    ctx.font = spec1;
    lines1.forEach(ln => {
      ctx.fillText(ln, w / 2, y);
      y += lineH1;
    });

    if (lines2.length) {
      y += gap;
      ctx.fillStyle = $('#color2').value;
      ctx.font = spec2;
      lines2.forEach(ln => {
        ctx.fillText(ln, w / 2, y);
        y += lineH2;
      });
    }
  }

  $('#download').addEventListener('click', async () => {
    await draw();
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'estado-mematalimon.png';
    a.click();
  });

  if (fonts[0]) useFont(fonts[0]).then(draw);
  else draw();
})();
