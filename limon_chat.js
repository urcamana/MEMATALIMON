/* Limón 💬 — chat con IA para la mascota. Cargar DESPUÉS de mascota.js:
   <script src="mascota.js" defer></script>
   <script src="limon_chat.js" defer></script>                                  */
(() => {
'use strict';
const CFG = {
  api: '/api/limon',          // ruta del Worker (misma web, sin CORS)
  json: 'articulos.json',
  items: 'items_limon.json',
  maxHist: 6,                 // mensajes anteriores que se envían (cuida el límite gratis)
  arriba: false,              // true = barra de escritura arriba en vez de abajo
  fallback: 'Limón se tomó un descansito 😴 Escribinos por WhatsApp y te ayudamos enseguida.'
};
const $ = id => document.getElementById(id);
const num = v => Number(String(v == null ? '' : v).replace(/,/g, '.')) || 0;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const corto = s => s.length > 24 ? s.slice(0, 22) + '…' : s;
const STOP = new Set('el la los las un una unos unas de del al y o en con para por que es hay tenes tienen tiene quiero busco necesito me te se lo como cuanto cuesta sale precio alguna algun esta estas hola buen dias tardes noche gracias favor podes puedo ver mostrame stock hay tiene tienen disponible'.split(' '));
let ART = null, ENVIO = null, hist = [], busy = false, bar = null, inp = null, modo = null;   // modo: lo usa el Antagonista para reutilizar esta barra

/* Lee un JSON (si está en Base64 lo decodifica, igual que mascota.js) */
async function leer(url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return null; let t = (await r.text()).trim();
    if (t[0] !== '{' && t[0] !== '[') t = new TextDecoder().decode(Uint8Array.from(atob(t.replace(/\s/g, '')), c => c.charCodeAt(0)));
    return JSON.parse(t);
  } catch (e) { return null }
}
async function cargar() {
  if (ART) return;
  try {
    const d = await (await fetch(CFG.json, { cache: 'force-cache' })).json();
    ART = d.map(p => {
      let ds = num(p.Descuento); if (ds > 0 && ds < 1) ds *= 100; ds = Math.round(ds);
      const inv = num(p.Inventario);
      return {
        id: p['Artículo'],
        n: String(p['Descripción'] || '').trim(),
        c: String(p.Categoria || ''),
        d: ds,
        pr: num(p.Venta) * (num(p.DOLAR) || 1) * (1 - ds / 100),
        inv,
        st: inv >= 1 && num(p.Venta) > 0
      };
    }).filter(p => p.n);
    ART.forEach(p => { p.k = norm(p.n + ' ' + p.c + ' ' + (p.id || '')) });
  } catch (e) { ART = [] }
  const it = await leer(CFG.items); ENVIO = (it && it.envio) || null;
}

/* Búsqueda local mejorada: tokens más cortos, incluye sin stock si preguntan por stock */
function buscar(q) {
  if (!ART || !ART.length) return [];
  const nq = norm(q);
  const quiereStock = /stock|hay|disponible|queda|quedan|tienen|tiene|inventario/.test(nq);
  const ts = nq.split(/[^a-z0-9]+/)
    .map(t => t.replace(/(es|s)$/, ''))
    .filter(t => t.length > 2 && !STOP.has(t));
  if (!ts.length) return [];

  const scored = ART.map(p => {
    let s = 0;
    for (const t of ts) {
      if (p.k.includes(t)) s += 2;
      // bonus si el token está al inicio de una palabra del nombre
      if (p.k.split(' ').some(w => w.startsWith(t))) s += 1;
    }
    return { p, s };
  }).filter(x => x.s > 0);

  // Si preguntan stock, no filtramos los sin stock; si no, preferimos los que tienen
  const lista = quiereStock
    ? scored
    : scored.filter(x => x.p.st).concat(scored.filter(x => !x.p.st));

  return lista
    .sort((a, b) => b.s - a.s || (b.p.st - a.p.st) || b.p.d - a.p.d)
    .slice(0, 5)
    .map(x => x.p);
}

/* Respuestas que no necesitan IA (gratis y siempre correctas) */
const abierto = () => (($('badgeAbierto') || {}).textContent || '').trim();
const horario = () => (($('horarioHoy') || {}).textContent || '').trim();
function local(q) {
  const n = norm(q);
  if (/horario|abiert|cerrad|a que hora|hasta que hora/.test(n)) {
    const a = abierto(), h = horario(); if (a || h) return (a ? a + '. ' : '') + (h ? 'Hoy: ' + h : '') + ' 🕒';
  }
  if (/envio|moto|delivery|retir/.test(n) && ENVIO) {
    const t = (ENVIO.tabla || []).map(r => r[0] + ': ' + r[1]).join('\n');
    return '🛵 Envío por moto (aprox.)\n' + t + (ENVIO.nota ? '\n' + ENVIO.nota : '') + (ENVIO.retiro ? '\n' + ENVIO.retiro : '');
  }
  return null;
}

function ver(id) {   // igual que verProducto() de mascota.js
  const im = $('img' + id), c = im && (im.closest('.tarjetas2') || im.closest('.card-group') || im);
  if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); else location.href = location.pathname + '?p=' + id;
}
const charlar = ms => { if (window.__mm && window.__mm.charlar) window.__mm.charlar(ms) };   // mantiene quieto a Limón mientras conversan
function hablar(t, btns, ms) { if (window.__mm) { charlar((ms || 0) + 45000); window.__mm.show(t, btns, ms) } }
function responder(texto, prods) {
  const b = modo && modo.botones ? modo.botones() : (prods || []).slice(0, 2).map(p => ['👀 ' + corto(p.n), () => ver(p.id)]);
  if (!(modo && modo.botones)) b.push(['💬 Otra pregunta', () => abrir()]);
  hablar(texto, b, Math.min(25000, 7000 + texto.length * 60));
}

async function enviar() {
  const q = inp.value.trim(); if (!q || busy) return;
  inp.value = ''; busy = true; hablar('🍋 Pensando…', null, 30000);
  let texto = CFG.fallback, prods = [];
  try {
    if (modo) { const t = await modo.manejar(q); if (t) texto = t }   // modo externo: no usa búsqueda de productos
    else { await cargar(); prods = buscar(q); }
    const loc = modo ? null : local(q);
    if (modo) { }
    else if (loc) texto = loc;
    else {
      const r = await fetch(CFG.api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q,
          hist: hist.slice(-CFG.maxHist),
          prods: prods.map(p => ({
            id: p.id,
            n: p.n,
            c: p.c,
            pr: Math.round(p.pr),
            d: p.d,
            inv: p.inv,
            st: p.st
          })),
          abierto: abierto(),
          horario: horario(),
          envio: ENVIO
        })
      });
      const j = await r.json(); if (j && j.text) texto = j.text;
    }
  } catch (e) {}
  hist.push({ r: 'user', c: q }, { r: 'assistant', c: texto }); busy = false;
  responder(texto, prods);
}

function crear() {
  bar = document.createElement('div'); bar.id = 'limonChat';
  bar.style.cssText = 'position:fixed;left:8px;right:8px;' + (CFG.arriba ? 'top:70px' : 'bottom:8px') + ';max-width:420px;margin:0 auto;z-index:1047;display:none;gap:6px;padding:8px;border-radius:14px;background:#fff;box-shadow:0 4px 20px #0004;font-family:system-ui,sans-serif';
  bar.innerHTML = '<input type="text" maxlength="200" placeholder="Preguntale a Limón 🍋" enterkeyhint="send" autocomplete="off" style="flex:1;min-width:0;font-size:16px;padding:8px 10px;border:1px solid #d9c9ee;border-radius:10px;outline:0;color:#2b2140;background:#fff">'
    + '<button type="button" data-a="s" style="border:0;border-radius:10px;padding:0 14px;background:#6b4ca3;color:#fff;font-size:16px;cursor:pointer">➤</button>'
    + '<button type="button" data-a="x" style="border:0;border-radius:10px;padding:0 12px;background:#f3ecfa;color:#4a2b7a;font-size:16px;cursor:pointer">✕</button>';
  document.body.appendChild(bar); inp = bar.querySelector('input');
  inp.addEventListener('input', () => charlar(120000));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); enviar() } });
  bar.addEventListener('click', e => { const a = e.target.dataset && e.target.dataset.a; if (a === 's') enviar(); else if (a === 'x') { bar.style.display = 'none'; inp.blur(); charlar(0) } });
}
function abrir(opts) {
  modo = opts && opts.manejar ? opts : null;
  if (!bar) crear(); bar.style.display = 'flex'; charlar(120000); if (!modo) cargar();
  inp.placeholder = (modo && modo.placeholder) || 'Preguntale a Limón 🍋';
  setTimeout(() => inp.focus(), 80);   // al enfocar, mascota.js se calla sola mientras escribís
}
window.__mmChat = abrir;
})();
