/* Limón 💬 (pedidos) — chat con IA para pedidos.mematalimon.com.ar
   Cargar DESPUÉS de mascota-pedidos.js:
   <script src="mascota-pedidos.js" defer></script>
   <script src="limon_chat_pedidos.js" defer></script>                      */
(() => {
'use strict';
const CFG = {
  api: 'https://mematalimon.com.ar/api/limon',   // Worker de la tienda (acepta el origen pedidos.)
  maxHist: 6,
  arriba: false,                                  // true = barra de escritura arriba
  fallback: 'Limón se tomó un descansito 😴 Escribinos por WhatsApp y te ayudamos enseguida.'
};
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const corto = s => s.length > 24 ? s.slice(0, 22) + '…' : s;
const STOP = new Set('el la los las un una unos unas de del al y o en con para por que es hay tenes tienen tiene quiero busco necesito me te se lo como cuanto cuesta sale precio alguna algun esta estas hola buen dias tardes noche gracias favor podes puedo ver mostrame stock disponible'.split(' '));
let hist = [], busy = false, bar = null, inp = null;

/* Productos del catálogo a pedido que ya publica index.html */
const productos = () => Array.isArray(window.productosDisponibles) ? window.productosDisponibles : [];
const info = () => window.__pedidosInfo || {};
const cierreTxt = () => { const c = info().cierre; return c ? new Date(c).toLocaleString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) + ' hs' : '' };

/* La IA solo recibe los 5 productos más parecidos (ahorra límite) */
function buscar(q) {
  const ts = norm(q).split(/[^a-z0-9]+/).map(t => t.replace(/(es|s)$/, '')).filter(t => t.length > 2 && !STOP.has(t));
  if (!ts.length) return [];
  return productos().map(p => {
    const k = norm(p.nombre + ' ' + (p.categoriaUI || '') + ' ' + (p.descripcion || '') + ' ' + p.id), ws = k.split(' ');
    let s = 0; for (const t of ts) { if (k.includes(t)) s += 2; if (ws.some(w => w.startsWith(t))) s += 1 }
    return { p, s };
  }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 5).map(x => x.p);
}

/* Respuestas que no necesitan IA (gratis y siempre correctas) */
function local(q) {
  const n = norm(q), I = info();
  if (/llega|llegada|cuando (viene|vienen|trae)|cierr|ultimo dia|hasta cuando/.test(n) && (I.llegada || I.cierre))
    return '📅 ' + (I.llegada ? 'Llegada estimada: ' + I.llegada + '. ' : '') + (I.cierre ? 'Último día para encargar: ' + cierreTxt() + '.' : '');
  if (/sena|reserv|cancel|devol|reembols/.test(n))
    return 'La seña es el 50% del total y reserva tu pedido 🍋. Si cancelás antes del despacho: en línea general se retiene el 50% de la seña; en originales, importados o combos, el 100%. Si cancelamos nosotros, te devolvemos el 100%. Más detalle en 📜 Políticas.';
  return null;
}

function ver(id) {
  if (typeof window.verProductoPedidos === 'function') window.verProductoPedidos(id);
  else { const im = document.querySelector('[data-id="' + id + '"]'); if (im) im.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
}
const charlar = ms => { if (window.__mm && window.__mm.charlar) window.__mm.charlar(ms) };   // mantiene quieto a Limón mientras conversan
function hablar(t, btns, ms) { if (window.__mm) { charlar((ms || 0) + 45000); window.__mm.show(t, btns, ms) } }
function responder(texto, prods) {
  const b = (prods || []).slice(0, 2).map(p => ['👀 ' + corto(p.nombre), () => ver(p.id)]);
  b.push(['💬 Otra pregunta', abrir]);
  hablar(texto, b, Math.min(25000, 7000 + texto.length * 60));
}

async function enviar() {
  const q = inp.value.trim(); if (!q || busy) return;
  inp.value = ''; busy = true; hablar('🍋 Pensando…', null, 30000);
  let texto = CFG.fallback, prods = [];
  try {
    prods = buscar(q);
    const loc = local(q);
    if (loc) texto = loc;
    else {
      const r = await fetch(CFG.api, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modo: 'pedidos', q, hist: hist.slice(-CFG.maxHist),
          prods: prods.map(p => ({ id: p.id, n: p.nombre, c: p.categoriaUI || p.categoria || '', pr: Math.round(p.precio), desc: String(p.descripcion || '').slice(0, 160) })),
          llegada: info().llegada || '', cierre: cierreTxt()
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
function abrir() {
  if (!bar) crear(); bar.style.display = 'flex'; charlar(120000);
  setTimeout(() => inp.focus(), 80);   // al enfocar, la mascota se calla sola mientras escribís
}
window.__mmChat = abrir;
})();
