/* Limón 🍋 — mascota del catálogo a pedido (pedidos.mematalimon.com.ar).
   Usa la misma lista de productos que carga index.html (window.productosDisponibles) y el mismo carrito. */
(() => {
'use strict';
const CFG = { W: 60, H: 72, mi: 64, md: 84, borde: 4, maxPromos: 12, ritmo: 1, lat: -26.4, lon: -54.63, calor: 30, frio: 12, viento: 30 };   // lat/lon: ubicación del local (para el clima; poné clima: false para desactivarlo). calor: grados a partir de los que se acalora // ritmo: 1 = normal, 0.5 = más charlatán, 2 = más callado
const gap = (a, b) => rnd(a, b) * 1e3 * CFG.ritmo;
const W = CFG.W, H = CFG.H;
const $q = (s, r = document) => r.querySelector(s), $a = (s, r = document) => [...r.querySelectorAll(s)];
const R = a => a[Math.random() * a.length | 0], rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LS = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v) } catch (e) {} };
const SS = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v) } catch (e) {} };
if (+LS('mm_off') > Date.now() || window.__mmPedidosOn) return;
window.__mmPedidosOn = true;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (s, k) => o[k] == null ? s : o[k]);

/* ---------- Frases ---------- */
const L = {
  hi: ['¡Hola! Soy Limón 🍋 Estoy en el catálogo a pedido. Tocame si querés ayuda.', '¡Bienvenido! Acá reservás con el 50% de seña. Tocame y te cuento 🍋', '¡Hola! Limón al servicio 🍋 ¿Te recomiendo algo del catálogo a pedido?'],
  primera: '¡Hola! Soy Limón 🍋 En este catálogo reservás productos a pedido con el 50% de seña.',
  rec: [(n, p) => `¿Ya viste ${n}? Está a ${p} (a pedido) 🍋`, (n, p) => `Te recomiendo ${n}: ${p}. Se reserva con el 50% de seña.`, (n, p) => `Mirá ${n}: ${p}. ¿Lo sumamos al carrito?`],
  peek: [() => '¿Este? 👀', () => '¿Qué tal este a pedido? 🍋', n => `Mmm… ¿y ${n}? 😏`, () => 'Este tiene buena pinta, ¿no?'],
  quip: ['🍋 Catálogo a pedido: reservás con el 50% de seña.', '¿Buscás algo? Usá el buscador de arriba 🔎', 'Originales, importados o combos: si cancelás antes del despacho, seña al 100%.', 'El pedido se confirma por WhatsApp. Después te pedimos que respondas ACEPTO 📲', 'Si la cancelación es por culpa nuestra, devolvemos el 100% de la seña 💛', 'Combos y revendedores: 72 hs desde la recepción para avisar si algo no anda.'],
  sena: ['La seña es el 50% del total para reservar tu pedido 🍋', 'Sin seña no se confirma el pedido. Así evitamos arrepentimientos de último momento.'],
  combo: ['Los combos son packs (varias unidades). Ideal si revendés o comprás por cantidad 📦', 'En combos, si cancelás antes del despacho se retiene el 100% de la seña.'],
  original: ['Los originales/importados tienen más costos de reserva e importación.', 'Si es original o importado y cancelás antes del despacho, la seña se retiene al 100%.'],
  carritoAviso: ['¿Lo terminamos? 🛒 Tenés {n} producto{s} en el pedido', 'Tu pedido está casi listo 🛍️ ¿Lo enviamos por WhatsApp?', '¿Sumamos algo más o confirmamos la reserva con la seña? 🍋'],
  cierre: ['Último momento para encargar: el catálogo cierra {cuando} ⏰ ¡Mandá tu pedido!', 'Ojo con la fecha de cierre: se puede pedir hasta {cuando} 🍋'],
  add: ['¡Buena elección! 🍋', '¡Al carrito! Después lo reservás por WhatsApp con la seña 📲', '¡Eso! A pedido 🛒', '¡Qué buen ojo!', '¡Uh, ese es de los buenos!'],
  poke: ['¡Cosquillas! 🤭', 'Ojo con voltear tu pantalla, ¡yo soy el patrón!😂', 'Cobro por cada tocada, aca nadie trabaja gratis... 😆', 'Soy muy ocupado, ¿sabés? 😎', 'Hola, hola, soy el jefe del catálogo a pedido 😎'],
  fall: ['¡Aaah! ¡Avisá antes de dar vuelta el celu! 😵', 'Uf… me mareé ⭐', 'Me parece que esto es algo personal 😒', 'Uy, todo gira... 😵‍💫🥴', '¡Cuidado, que soy frágil! 🍋'],
  desp: ['No me pagan horas extras… al menos armá un pedido a pedido 😤', 'Ya que me despertaste, sumá algo al carrito 🛒', '¡Eh! Estaba durmiendo… Si me despertás, mirá el catálogo 😠'],
  despCerrado: ['El catálogo puede estar cerrado, pero yo sigo acá 😤', '¿A esta hora? Dejá tu consulta por WhatsApp 😴'],
  cerrado: ['Si el catálogo está cerrado, volvé cuando se habilite de nuevo 🍋', 'Apenas haya novedades se avisa por WhatsApp 📦'],
  wake: ['¡Ah! Estaba soñando con pedidos 💤', '¿Alguien puede pensar en Limón?🥱', '¡Ay! ya te atiendo 🥱'],
  trip: ['Esto me trajo recuerdos de aquel día que me caí del árbol 🌳🍋', '¿Quién tiró esa piedra? 😤', 'Auch… eso dolió más que un exprimidor 🍋'],
  corrio: ['¡Uff! Si me hubiera chocado a esa velocidad me hacía limonada 🍋💨', '¡Qué carrera! 🏅'],
  musica: ['¡Qué buen tema! 🎧', '¿Escuchaste eso? 🎶'],
  trueno: ['¡¿Qué fue eso?! ⚡😱', '¡Qué trueno! ⚡'],
  wx: {
    frio: ['¡Brrr! 🥶 Con {T}° hasta los limones nos congelamos', 'Hace {T}°… ideal para armar el pedido desde casa 🍋'],
    tormenta: ['¡Hay tormenta! ⚡ Mejor pedir desde casa', 'Se viene tormenta… yo me quedo acá 😱'],
    viento: ['¡Qué viento! 💨 Casi se me vuela la hojita'],
    calor: ['¡Qué calor! 🥵 Con {T}°', '¡{T}° afuera! Me quedo en la sombra de tu pantalla 😎'],
    lluvia: ['¡Está lloviendo! ☔ Buen momento para armar el pedido a pedido', 'Llueve… ¿y tu reserva? 🍋'],
    nube: ['Está nublado… saqué el paraguas por las dudas ☂️']
  }
};

/* ---------- Estructura (Shadow DOM: el CSS de la página no lo toca) ---------- */
const host = document.createElement('div');
host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1046';
const sh = host.attachShadow({ mode: 'open' });
sh.innerHTML = `<style>
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
#m{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 100%;pointer-events:auto;touch-action:none;cursor:grab;will-change:transform;transition:opacity .4s}
#m.dg{cursor:grabbing}#m.gone{opacity:0;pointer-events:none}
svg{width:100%;height:100%;overflow:visible;display:block}
#rk{position:absolute;left:0;top:0;width:26px;height:18px;border-radius:55% 55% 40% 40%;background:radial-gradient(circle at 35% 30%,#c4bfb3,#7c776b);box-shadow:inset -3px -3px 0 #0002,0 2px 3px #0003;display:none;will-change:transform}
#bub{position:absolute;left:0;top:0;max-width:min(230px,72vw);padding:9px 12px;border-radius:14px;background:#fff;color:#2b2140;font-size:13px;line-height:1.3;box-shadow:0 4px 16px #0003;pointer-events:auto;opacity:0;visibility:hidden;transition:opacity .25s}
#bub.on{opacity:1;visibility:visible}
#bub .a{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}
#bub>div:first-child{white-space:pre-line}
#bub button{border:0;border-radius:999px;padding:6px 10px;background:#f3ecfa;color:#4a2b7a;font-size:12px;font-weight:600;cursor:pointer}
#bub button:hover{background:#e4d6f5}
@media (prefers-reduced-motion:reduce){#bub{transition:none}}
</style>
<div id="m"><svg viewBox="0 0 80 96"><ellipse cx="40" cy="92" rx="20" ry="4" fill="#0003"/>
<g id="bd"><g id="fx">
<g id="l1"><path d="M32 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="33" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<g id="l2"><path d="M48 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="47" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<ellipse cx="40" cy="50" rx="27" ry="29" fill="#ffe14a" stroke="#c99a00" stroke-width="3"/>
<ellipse id="heat" cx="40" cy="50" rx="26" ry="28" fill="#ff5a36" opacity="0"/>
<g id="hp" style="display:none"><path d="M16 46Q40 -4 64 46" fill="none" stroke="#3a2a66" stroke-width="4" stroke-linecap="round"/><ellipse cx="15" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/><ellipse cx="65" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/></g>
<path id="leaf" d="M40 22Q42 8 58 8Q56 22 40 22Z" fill="#5bbf4a" stroke="#3c8c32" stroke-width="2" stroke-linejoin="round"/>
<g id="um" style="display:none"><path d="M6 0Q38 -32 70 0Q60 -6 52 0Q44 -6 38 0Q32 -6 24 0Q16 -6 6 0Z" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="2" stroke-linejoin="round"/><path d="M38 0 L22 54" stroke="#4a2b8a" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="54" r="2.5" fill="#4a2b8a"/></g>
<g id="a1"><ellipse cx="14" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/><g id="um2" style="display:none"><path d="M11 52 L11 78" stroke="#4a2b8a" stroke-width="2.2" stroke-linecap="round"/><path d="M11 52 Q6 48 8 42 Q11 38 14 42 Q16 48 11 52" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11" cy="78" r="1.8" fill="#4a2b8a"/></g></g>
<g id="a2"><g id="mate" style="display:none"><path d="M61 42Q59 58 66 58Q73 58 71 42Z" fill="#a9743a" stroke="#6b4420" stroke-width="1.6"/><path d="M60 42H72" stroke="#6b4420" stroke-width="2"/><path d="M68 42L74 26" stroke="#c0c0c0" stroke-width="2" stroke-linecap="round"/><circle cx="75" cy="25" r="1.8" fill="#c0c0c0"/></g>
<ellipse cx="66" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/></g>
<ellipse cx="24" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/><ellipse cx="56" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/>
<g id="e1"><ellipse cx="32" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p1" cx="32" cy="47" r="3" fill="#222"/></g>
<g id="e2"><ellipse cx="48" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p2" cx="48" cy="47" r="3" fill="#222"/></g>
<g id="cl" style="display:none" fill="none" stroke="#5a3d00" stroke-width="2.2" stroke-linecap="round"><path d="M27 46Q32 50 37 46"/><path d="M43 46Q48 50 53 46"/></g>
<g id="hat3" style="display:none"><path d="M24 24Q22 -6 41 -6Q60 -6 58 24Z" fill="#4a7fd1" stroke="#2f55a0" stroke-width="2"/><rect x="21" y="18" width="40" height="9" rx="3" fill="#2f55a0"/><circle cx="41" cy="-8" r="5" fill="#fff" stroke="#ddd"/></g>
<g id="hat4" style="display:none"><path d="M26 22Q40 2 56 22Z" fill="#ffb02e" stroke="#c97b00" stroke-width="2" stroke-linejoin="round"/><path d="M50 21Q68 19 72 26Q60 28 48 24Z" fill="#ffb02e" stroke="#c97b00" stroke-width="2" stroke-linejoin="round"/></g>
<g id="hat5" style="display:none"><path d="M26 22Q30 -4 54 2Q62 6 66 18Q62 14 58 22Z" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2" stroke-linejoin="round"/><rect x="24" y="18" width="36" height="7" rx="3" fill="#fff" stroke="#ddd"/><circle cx="66" cy="19" r="4.5" fill="#fff" stroke="#ddd"/></g>
<g id="gl" style="display:none"><path d="M24 44H56" stroke="#111" stroke-width="2.4"/><rect x="23" y="41" width="16" height="11" rx="4.5" fill="#15152a"/><rect x="41" y="41" width="16" height="11" rx="4.5" fill="#15152a"/><path d="M26 44L30 43M44 44L48 43" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/></g>
<g id="scarf" style="display:none"><path d="M14 66Q40 80 66 66L67 75Q40 90 13 75Z" fill="#e8574c" stroke="#b03a30" stroke-width="1.8" stroke-linejoin="round"/><path d="M52 78L58 96L48 94Z" fill="#e8574c" stroke="#b03a30" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 70Q40 82 60 70" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></g>
<path id="mo" d="M33 58Q40 65 47 58" stroke="#8a4b00" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<g id="br" style="display:none" stroke="#5a3d00" stroke-width="2.8" stroke-linecap="round"><path d="M24 37L38 42"/><path d="M56 37L42 42"/></g>
<g id="sw" style="display:none" fill="#6ec6ff" stroke="#2b8fd6" stroke-width=".8"><path id="sw1" d="M62 34q4 6 0 9q-4-3 0-9z"/><path id="sw2" d="M14 38q4 6 0 9q-4-3 0-9z"/></g>
</g>
<g id="st" style="display:none" fill="#ffb300" font-size="11"><text id="s1">★</text><text id="s2">★</text><text id="s3">★</text></g>
<g id="zz" style="display:none" fill="#fff" stroke="#6b4ca3" stroke-width=".7" font-weight="700"><text id="z1" x="58" y="22" font-size="11">z</text><text id="z2" x="64" y="12" font-size="14">Z</text></g>
<g id="nt" style="display:none" fill="#fff" stroke="#6b4ca3" stroke-width=".6" font-weight="700"><text id="n1" font-size="13">♪</text><text id="n2" font-size="11">♫</text></g>
</g></svg></div><div id="rk"></div><div id="bub"></div>`;
const m = sh.getElementById('m'), bub = sh.getElementById('bub'), g = id => sh.getElementById(id), rk = g('rk');

/* ---------- Estado ---------- */
let fl = 'b', u = -40, pos = { x: -40, y: 0 }, rot = 0, face = 1, mode = 'idle', sub = 'stand', tm = 1, tgt = 0, entering = true;
let T = 0, last = 0, J = null, P = null, D = null, squash = 0, stars = 0, happy = 0, blinkAt = 2, lastSay = 0, lastAct = Date.now(), lastScroll = 0;
let silent = SS('mm_sil') === '1', promos = +SS('mm_n') || 0, ptr = { x: innerWidth / 2, y: innerHeight / 2 }, sensor = false, want = 'b', wantSince = 0, lastFlip = 0;
let ART = [], bubUntil = 0, nextTour = Date.now() + 25e3, nextRec = Date.now() + 55e3, nextQuip = Date.now() + 40e3, nextPeek = Date.now() + 70e3;
let cartCount = 0, cartSince = 0, lastAdd = 0, lastRec = null, pidio = false, WX = null, umAnim = null, grump = 0, tripRot = 0, corre = false, rock = null, trip = null, lastEvt = Date.now() - 45e3;
let nightOv = null, cerradoOv = null, tipeando = false, visSig = '', nextSusto = 12, dead = false, schedId = 0, ocultoPorModal = false;
const ROT = { b: 0, t: 180, l: 90, r: -90 };
const night = () => nightOv !== null ? nightOv : (h => h >= 23 || h < 7)(new Date().getHours());
const cerrado = () => cerradoOv !== null ? cerradoOv : (($q('#vista-deshabilitada') || { style: {} }).style.display === 'block');   // catálogo cerrado: lo decide index.html con config.json
const MODALES = ['modal-carrito', 'modal-info'];
const modalAbierto = () => MODALES.some(id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none' });
const abrirCarrito = () => { if (typeof toggleCarrito === 'function' && !modalAbierto()) toggleCarrito(); };
const navBottom = () => { const n = $q('.main-header'); return n ? n.getBoundingClientRect().bottom : 0 };
const range = f => (f === 'b' || f === 't') ? [CFG.mi, innerWidth - CFG.md] : [navBottom() + H, innerHeight - H];
const edge = (f, uu) => { const b = CFG.borde; return f === 'b' ? { x: uu, y: innerHeight - b } : f === 't' ? { x: uu, y: b } : f === 'l' ? { x: b, y: uu } : { x: innerWidth - b, y: uu } };
const sgn = () => (fl === 'b' || fl === 'l') ? 1 : -1;

/* ---------- Burbuja ---------- */
function show(text, btns, ms) {
  bub.innerHTML = '';
  const s = document.createElement('div'); s.textContent = text; bub.append(s);
  if (btns && btns.length) {
    const a = document.createElement('div'); a.className = 'a';
    btns.forEach(([lab, fn]) => { const b = document.createElement('button'); b.textContent = lab; b.onclick = e => { e.stopPropagation(); hide(); fn() }; a.append(b) });
    bub.append(a);
  }
  bub.classList.add('on'); bubUntil = Date.now() + (ms || (btns && btns.length ? 10000 : clamp(2800 + text.length * 55, 3500, 8000))); lastSay = Date.now();
}
const hide = () => { bub.classList.remove('on'); bubUntil = 0 };
/* Modo charla: mientras conversan con él (chat con IA) se queda quieto y no suelta frases programadas */
let charla = 0; const hablando = () => Date.now() < charla;
function charlar(ms) {
  if (!(ms > 0)) { charla = 0; return }
  charla = Date.now() + ms;
  if (mode === 'walk' && !trip) { mode = 'idle'; sub = 'stand'; tm = 6; corre = false; rock = null; tgt = u }
  else if (mode === 'idle') { if (sub === 'sleep' || sub === 'music' || sub === 'fan') sub = 'stand'; tm = Math.max(tm, 6) }
}
const canSpeak = () => !silent && !hablando() && !tipeando && promos < CFG.maxPromos && Date.now() - lastSay > 16000 * CFG.ritmo && !bubUntil && !modalAbierto() && !document.hidden;
const promo = (t, b) => { promos++; SS('mm_n', promos); show(t, b) };
function placeBub() {
  if (!bubUntil) return;
  if (Date.now() > bubUntil) { hide(); return }
  const bw = bub.offsetWidth, bh = bub.offsetHeight; let x, y;
  if (fl === 'b') { x = pos.x - bw / 2; y = pos.y - H - bh - 8 } else if (fl === 't') { x = pos.x - bw / 2; y = pos.y + H + 8 } else if (fl === 'l') { x = pos.x + H + 8; y = pos.y - bh / 2 } else { x = pos.x - H - 8 - bw; y = pos.y - bh / 2 }
  bub.style.left = clamp(x, 6, innerWidth - bw - 6) + 'px'; bub.style.top = clamp(y, 6, innerHeight - bh - 6) + 'px';
}

/* ---------- Productos ---------- */
const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const corto = s => s.length > 42 ? s.slice(0, 40) + '…' : s;
/* El catálogo lo carga index.html (window.productosDisponibles): Limón usa esa misma lista, no pide nada más. */
function cargar() {
  const src = Array.isArray(window.productosDisponibles) ? window.productosDisponibles : [];
  ART = src.map(w => ({ id: String(w.id), n: String(w.nombre || '').trim(), c: String(w.categoriaUI || w.categoria || '').trim(), pr: Number(w.precio) || 0 })).filter(p => p.n);
}
function recomendar() {
  cargar(); if (!ART.length) return false;
  let dicho = (SS('mm_seen') || '').split(',').filter(Boolean), pool = ART.filter(p => !dicho.includes(p.id));
  if (!pool.length) { pool = ART; dicho = []; }   // ya los mostró todos: arranca de nuevo
  const p = R(pool); lastRec = p; SS('mm_seen', [...dicho, p.id].slice(-8).join(','));
  promo(R(L.rec)(corto(p.n), money(p.pr)), [['Verlo', () => verProducto(p.id)], ['Ahora no', () => {}]]); return true;
}
function recMenu() { if (!recomendar()) show(cerrado() ? R(L.cerrado) : 'Por ahora no veo productos en el catálogo 🍋', null, 4000) }

/* Clima del local (Open-Meteo, sin clave): calor → se acalora, lluvia → paraguas abierto en la mano, nublado → animación de abrir/mirar/cerrar */
async function clima() {
  try {
    let c = JSON.parse(SS('mm_wx') || 'null');
    if (!c || Date.now() - c.t > 30 * 60e3) {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CFG.lat}&longitude=${CFG.lon}&current=temperature_2m,weather_code,is_day,precipitation,wind_speed_10m&hourly=precipitation_probability&timezone=auto&forecast_hours=1`), j = await r.json();
      const pp = (j.hourly && j.hourly.precipitation_probability && j.hourly.precipitation_probability[0]) || 0;
      c = { t: Date.now(), T: j.current.temperature_2m, c: j.current.weather_code, d: j.current.is_day, p: j.current.precipitation || 0, w: j.current.wind_speed_10m || 0, pp }; SS('mm_wx', JSON.stringify(c));
    }
    const k = c.c, lluvia = (k >= 51 && k <= 67) || (k >= 80 && k <= 86) || k >= 95 || (c.p > 0.1);
    WX = { T: c.T, lluvia, nube: !lluvia && (k === 3 || k === 45 || k === 48 || (c.pp >= 40 && k <= 3)), calor: !lluvia && k <= 2 && c.d === 1 && c.T >= CFG.calor, frio: c.T < CFG.frio, tormenta: k >= 95, viento: (c.w || 0) >= CFG.viento, pp: c.pp };
  } catch (e) { WX = null }
}
function verProducto(id) {
  if (id == null || id === '') return;
  // Catálogo a pedido: ir a la página del producto y resaltarlo
  if (typeof window.verProductoPedidos === 'function') {
    if (window.verProductoPedidos(id)) return;
  }
  const btn = document.querySelector(`#catalogo-grid .product-card button[onclick*="'${id}'"]`);
  const c = btn && btn.closest('.product-card');
  if (c) {
    c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    try { c.animate([{ boxShadow: '0 0 0 0 #ffe14a' }, { boxShadow: '0 0 0 10px #ffe14a88' }, { boxShadow: '0 0 0 0 #ffe14a00' }], { duration: 1400, iterations: 2 }); } catch (e) {}
    return;
  }
  show('No pude ubicar ese producto en pantalla 🍋 Probá buscarlo arriba.', null, 4000);
}

/* ---------- Movimiento ---------- */
function go(b, o) { J = { a: { x: pos.x, y: pos.y }, b, t: 0, d: o.d, arc: o.arc || 0, ease: o.ease || 'io', done: o.done }; mode = 'jump'; corre = false; trip = null; tripRot = 0 }
function jump(dt) {
  J.t = Math.min(1, J.t + dt / J.d); const t = J.t, e = J.ease === 'in' ? t * t : t * t * (3 - 2 * t);
  pos.x = J.a.x + (J.b.x - J.a.x) * e; pos.y = J.a.y + (J.b.y - J.a.y) * e - 4 * J.arc * t * (1 - t);
  if (t >= 1) { const d = J.done; J = null; d && d() }
}
function land(fell) { squash = .35; stars = fell && Math.random() < .6 ? 2 : 0; mode = 'idle'; sub = 'stand'; tm = 2; if (stars) show(R(L.fall), null, 3500); else happy = .5 }
function flip(nf) {
  if (nf === fl || mode === 'cart' || mode === 'drag') return;
  lastFlip = Date.now(); const v = nf === 'b' || nf === 't'; fl = nf; u = v ? pos.x : pos.y; const [a, b] = range(fl); u = clamp(u, a, b); P = null; entering = false;
  const e = edge(fl, u); hide(); go(e, { d: .3 + Math.hypot(e.x - pos.x, e.y - pos.y) / 1500, ease: 'in', done: () => land(true) });
}
function evPiedra() {   // cae una piedra delante de él y se tropieza
  const [a, b] = range('b'), dir = u - a < b - u ? 1 : -1, ru = u + dir * rnd(100, Math.max(110, Math.min(200, (b - a) * .5)));
  if (fl !== 'b' || ru < a + 30 || ru > b - 30) return false;
  rock = { u: ru, f: 0 }; lastEvt = Date.now(); tgt = clamp(ru + dir * 150, a, b); mode = 'walk'; return true;
}
function evCorrer() {   // sale corriendo hasta la otra punta
  const [a, b] = range('b'), far = u - a > b - u ? a : b; if (fl !== 'b' || Math.abs(far - u) < (b - a) * .55) return false;
  corre = true; lastEvt = Date.now(); tgt = far; mode = 'walk'; hide(); return true;
}
function evMusica() { sub = 'music'; tm = 8; lastEvt = Date.now(); return true }   // se pone los auriculares
function nextAction() {
  if (sub === 'music') { sub = 'stand'; tm = 1.5; if (!silent && canSpeak()) promo(R(L.musica)); return }
  if (night() || (Date.now() - lastAct > 9e4)) { sub = 'sleep'; tm = 8; return }
  const r = Math.random();
  if (!reduce && fl === 'b' && Date.now() - lastEvt > 120e3) {   // animaciones especiales, de vez en cuando
    const e = Math.random();
    if (e < .06 && evPiedra()) return; if (e >= .06 && e < .11 && evCorrer()) return; if (e >= .11 && e < .16) return evMusica();
  }
  if (WX && WX.calor && r < .22) { sub = 'fan'; tm = 3; return }   // se abanica
  if (r < .5 && !reduce) { const [a, b] = range(fl); tgt = clamp(u + (Math.random() < .5 ? -1 : 1) * rnd(120, 340), a, b); if (Math.abs(tgt - u) < 40) tgt = (u - a > b - u) ? a + 20 : b - 20; mode = 'walk'; return }
  if (r < .72) { sub = 'sit'; tm = rnd(4, 8) } else if (r < .85) { sub = 'wave'; tm = 2.2 } else { sub = 'stand'; tm = rnd(2, 5) }
}
function walk(dt) {
  const d = Math.sign(tgt - u) || 1; u += d * (entering ? 120 : corre ? 260 : 55) * dt; face = d * sgn();
  if (!entering) { const [a, b] = range(fl); u = clamp(u, a - 30, b + 30) }
  if (rock && !rock.hit && rock.f >= 1 && Math.abs(u - rock.u) < 14) { rock.hit = true; trip = { t: 0, d }; mode = 'trip'; corre = false; pos = edge(fl, u); return }
  if (Math.abs(tgt - u) < 3) {
    mode = 'idle'; sub = 'stand'; tm = rnd(1, 3);
    if (corre) { corre = false; squash = .15; tm = 3; if (!silent && !hablando()) show(R(L.corrio), null, 4500) }
    entering = false;
  }
  pos = edge(fl, u);
}
function tropiezo(dt) {
  trip.t += dt; const t = trip.t;
  tripRot = trip.d * (t < .25 ? 80 * (t / .25) : t < 1.4 ? 80 : 80 * Math.max(0, 1 - (t - 1.4) / .4));
  if (t > .3 && !trip.s) { trip.s = 1; stars = 1.4; squash = .3 }
  if (t > 1.8) {
    tripRot = 0; mode = 'idle'; sub = 'stand'; tm = 3; trip = null; if (!silent && !hablando()) show(R(L.trip), null, 5200);
    const r0 = rock; setTimeout(() => { if (rock === r0) { rock = null; rk.style.display = 'none' } }, 2500);
  }
  pos = edge(fl, u);
}
function rockUpd(dt) {
  if (!rock) return; rk.style.display = ''; if (rock.f < 1) rock.f = Math.min(1, rock.f + dt * 2.2);
  rk.style.transform = `translate(${rock.u - 13}px,${innerHeight - CFG.borde - 17 - (rock.f < 1 ? (1 - rock.f * rock.f) * innerHeight * .7 : 0)}px)`;
}
function idle(dt) {
  if (!entering) { const [a, b] = range(fl); u = clamp(u, a, b) }
  pos = edge(fl, u); tm -= dt; if (tm <= 0 && !bubUntil && !hablando()) nextAction();
}

/* Tour por las tarjetas del catálogo que se ven en pantalla */
function tarjetasVisibles(todas) {
  const nb = navBottom(), vh = innerHeight, seen = new Set();
  const cards = $a('#catalogo-grid .product-card');
  return cards.map(c => {
    if (seen.has(c)) return null; seen.add(c);
    const r = c.getBoundingClientRect();
    if (r.width < 60 || r.top < nb + H + 6 || r.top > vh - 40) return null;
    if (!todas && (r.bottom < nb + H || r.top > vh - 80)) return null;
    const h = c.querySelector('h3');
    const name = (h && h.textContent || '').trim() || 'este producto';
    let id = null;
    const btn = c.querySelector('button[onclick*="agregarAlCarrito"]');
    if (btn) {
      const m = String(btn.getAttribute('onclick') || '').match(/agregarAlCarrito\('([^']+)'\)/);
      if (m) id = m[1];
    }
    return { c, name, id };
  }).filter(Boolean);
}

function tour(force, todas) {
  if (fl !== 'b' || mode !== 'idle') return false;
  let list = tarjetasVisibles(todas);
  if (!list.length) { if (force && !todas) show('No veo productos a la vista 🤔 Probá scrollear el catálogo.', [['Ok', () => {}]], 7000); return false }
  if (todas) list = [R(list)];
  P = { list, i: 0 }; visitar(); return true;
}
function visitar() {
  const it = P.list[P.i]; if (!it || !it.c.isConnected) return bajar();
  const r = it.c.getBoundingClientRect(); hide();
  go({ x: clamp(r.left + r.width * .5, CFG.mi, innerWidth - CFG.md), y: r.top + 2 }, { d: .7, arc: 55, done: () => { mode = 'perch'; P.t = 0; P.said = false } });
}
function perch(dt) {
  const it = P.list[P.i]; if (!it || !it.c.isConnected) return bajar();
  const r = it.c.getBoundingClientRect(), nb = navBottom();
  if (r.top < nb + H + 4 || r.top > innerHeight - 40) return bajar();
  pos.x = clamp(r.left + r.width * .5, CFG.mi, innerWidth - CFG.md); pos.y = r.top + 2; sub = 'stand'; P.t += dt;
  if (!P.said && P.t > .3) { P.said = true; promos++; SS('mm_n', promos); show(R(L.peek)(it.name || 'este producto'), [['Verlo', () => it.id != null && verProducto(it.id)]], 6500) }
  if (P.t > 7.5 && !bubUntil && !hablando()) { P.i++; P.i < P.list.length ? visitar() : bajar() }
}
function bajar() { hide(); u = clamp(pos.x, ...range('b')); P = null; fl = 'b'; go(edge('b', u), { d: .5, arc: 20, ease: 'in', done: () => land(false) }) }

/* Carrito o ventana de políticas/contacto abierta: Limón se esconde para no tapar nada */
function onModal() {
  const open = modalAbierto(); if (open === ocultoPorModal) return; ocultoPorModal = open;
  if (open) { hide(); P = null; J = null; trip = null; tripRot = 0; corre = false; fl = 'b'; m.classList.add('gone'); mode = 'cart' }
  else {
    m.classList.remove('gone');
    if (mode === 'cart') { mode = 'idle'; sub = 'stand'; tm = 2; face = 1; entering = false; u = clamp(pos.x, ...range('b')); pos = edge('b', u) }
  }
}

/* ---------- Dibujo ---------- */
const rt = (a, x, y) => `rotate(${a} ${x} ${y})`;
function extras(dt) {   // clima, auriculares, enojo, correr
  grump = Math.max(0, grump - dt);
  const wx = WX || {}, musica = sub === 'music' && mode === 'idle', fan = sub === 'fan' && mode === 'idle', run = corre && mode === 'walk', calma = mode === 'idle' || mode === 'walk';
  // --- Paraguas ---
  // lluvia: abierto en la mano (brazo izquierdo levantado)
  // nube: animación breve: saca, abre, mira arriba, cierra (sin dejarlo colgado)
  let holdOpen = !!wx.lluvia, holdClosed = false, lookUp = false, armUm = 0;
  if (umAnim) {
    umAnim.t += dt;
    const t = umAnim.t;
    if (t < 0.5) {           // saca cerrado y levanta el brazo
      holdClosed = true; armUm = -50 * (t / 0.5);
    } else if (t < 1.9) {     // abre, mira arriba (paraguas tapa a Limón)
      holdOpen = true; armUm = -60; lookUp = true;
    } else if (t < 2.6) {     // cierra y baja
      holdClosed = true; armUm = -50 * (1 - (t - 1.9) / 0.7);
    } else {
      umAnim = null;
    }
  }
  g('um').style.display = holdOpen ? '' : 'none';
  vestirAplicar();
  g('um2').style.display = holdClosed ? '' : 'none';
  g('sw').style.display = wx.calor ? '' : 'none'; g('heat').setAttribute('opacity', wx.calor ? .22 : 0);
  if (wx.calor) [1, 2].forEach(i => { const k = (T * .9 + i * .5) % 1, s = g('sw' + i); s.setAttribute('transform', `translate(0 ${k * 12})`); s.setAttribute('opacity', 1 - k) });
  if (musica) [1, 2].forEach(i => { const k = (T * .7 + i * .5) % 1, n = g('n' + i); n.setAttribute('x', (i === 1 ? 62 : 8) + Math.sin(T * 3 + i) * 3); n.setAttribute('y', 18 - k * 26); n.setAttribute('opacity', 1 - k) });
  g('br').style.display = grump > 0 ? '' : 'none';
  const lf = g('leaf'); if (lf) lf.setAttribute('transform', rt(wx.viento ? Math.sin(T * 9) * 14 : Math.sin(T * 1.6) * 2, 40, 22));
  if (wx.tormenta && mode === 'idle' && sub !== 'sleep' && T > nextSusto) { nextSusto = T + rnd(25, 45); happy = Math.max(happy, .7); if (!silent && !hablando() && !tipeando && !bubUntil && Math.random() < .5) show(R(L.trueno), null, 2600) }
  if (run) { const s = Math.sin(T * 26) * 42; g('l1').setAttribute('transform', rt(s, 32, 74)); g('l2').setAttribute('transform', rt(-s, 48, 74)); g('a1').setAttribute('transform', rt(s, 18, 48)); g('a2').setAttribute('transform', rt(s, 62, 48)) }
  if (fan) g('a2').setAttribute('transform', rt(-(105 + Math.sin(T * 18) * 12), 62, 48));
  if (musica) { g('cl').style.display = ''; g('e1').style.display = g('e2').style.display = 'none' }
  if (grump > 0) { g('mo').setAttribute('d', 'M34 61H46'); g('mo').setAttribute('fill', 'none') }
  else if (musica) { g('mo').setAttribute('d', 'M33 58Q40 66 47 58'); g('mo').setAttribute('fill', 'none') }
  else if (wx.calor && calma && sub !== 'sleep' && stars <= 0 && happy <= 0) { g('mo').setAttribute('d', 'M34 58Q40 68 46 58Z'); g('mo').setAttribute('fill', '#7a2f00') }
  // paraguas: override del brazo al final (prioridad sobre correr/abanico)
  // brazos ahora se dibujan encima del cuerpo → se ven siempre
  // -60° sube la mano cerca del mango del paraguas
  if (holdOpen || holdClosed) {
    g('a1').setAttribute('transform', rt(armUm || (holdOpen ? -60 : -45), 18, 48));
  }
  // mirar arriba durante la animación de nubes
  if (lookUp && calma) {
    [['p1', 32], ['p2', 48]].forEach(([id, cx]) => { const p = g(id); p.setAttribute('cy', 44); });
  }
}
function draw(dt) {
  const d = ((ROT[fl] + tripRot + (D ? clamp(D.vx * .06, -25, 25) : 0) - rot + 540) % 360) - 180; rot += d * Math.min(1, dt * 12);
  squash = Math.max(0, squash - dt * 1.4); stars = Math.max(0, stars - dt); happy = Math.max(0, happy - dt);
  const hop = happy > 0 ? Math.abs(Math.sin(T * 13)) * 9 : 0;
  const bob = sub === 'music' && mode === 'idle' ? Math.sin(T * 6) * 4 : 0, shake = grump > 0 ? Math.sin(T * 45) * 1.2 : (WX && WX.frio && mode === 'idle' && sub !== 'sleep') ? Math.sin(T * 38) * .9 : 0;
  m.style.transform = `translate(${pos.x - W / 2}px,${pos.y - H - hop}px) rotate(${rot}deg)`;
  const walking = mode === 'walk', scared = mode === 'drag' || (mode === 'jump' && J && J.ease === 'in'), asleep = sub === 'sleep' && mode === 'idle', sit = sub === 'sit' && mode === 'idle', watch = mode === 'cart';
  const lg = walking ? Math.sin(T * 14) * 30 : scared ? Math.sin(T * 18) * 25 : 0;
  g('l1').setAttribute('transform', rt(lg, 32, 74)); g('l2').setAttribute('transform', rt(-lg, 48, 74));
  g('l1').style.display = g('l2').style.display = sit || asleep ? 'none' : '';
  let A1 = 0, A2 = 0;
  if (walking) { A1 = Math.sin(T * 14) * 22; A2 = -A1 } else if (sub === 'wave' && mode === 'idle') { A2 = 120 + Math.sin(T * 12) * 22 } else if (happy > 0 || scared) { A1 = A2 = 140 + Math.sin(T * 16) * 12 }
  g('a1').setAttribute('transform', rt(A1, 18, 48)); g('a2').setAttribute('transform', rt(-A2, 62, 48));
  const br = 1 + Math.sin(T * (asleep ? 1.2 : 2.4)) * .02, sx = 1 + squash * .35, sy = 1 - squash * .4 + (br - 1);
  g('bd').setAttribute('transform', `rotate(${bob} 40 90) translate(${shake} ${(sit || asleep ? 9 : 0) - (walking ? Math.abs(Math.sin(T * 14)) * 2 : 0)}) translate(40 90) scale(${sx} ${sy}) translate(-40 -90)`);
  g('fx').setAttribute('transform', face < 0 ? 'translate(80 0) scale(-1 1)' : '');
  /* cara */
  if (T > blinkAt) { if (T > blinkAt + .13) blinkAt = T + rnd(2, 5) }
  const blink = T > blinkAt && T < blinkAt + .13;
  g('cl').style.display = asleep || blink ? '' : 'none'; g('e1').style.display = g('e2').style.display = asleep || blink ? 'none' : '';
  let lx, ly;
  if (watch) { lx = -1; ly = .3 } else { const dx = ptr.x - pos.x, dy = ptr.y - (pos.y - H / 2), a = -rot * Math.PI / 180, rx = dx * Math.cos(a) - dy * Math.sin(a), ry = dx * Math.sin(a) + dy * Math.cos(a), l = Math.hypot(rx, ry) || 1, k = Math.min(1, l / 120); lx = rx / l * k; ly = ry / l * k }
  const jit = stars > 0 ? Math.sin(T * 30) : 0, ps = scared ? 3.6 : 3;
  [['p1', 32], ['p2', 48]].forEach(([id, cx]) => { const p = g(id); p.setAttribute('cx', cx + lx * face * 2.2 + jit); p.setAttribute('cy', 47 + ly * 2.2); p.setAttribute('r', ps) });
  g('mo').setAttribute('d', scared || stars > 0 ? 'M36 57Q40 67 44 57Z' : asleep ? 'M36 59Q40 62 44 59' : (mode === 'idle' && sub === 'sit' && Math.random() < 0) ? '' : happy > 0 || sub === 'wave' ? 'M32 57Q40 68 48 57Z' : 'M33 58Q40 65 47 58');
  g('mo').setAttribute('fill', scared || stars > 0 || happy > 0 || sub === 'wave' ? '#7a2f00' : 'none');
  g('st').style.display = stars > 0 ? '' : 'none'; g('zz').style.display = asleep ? '' : 'none';
  if (stars > 0) [1, 2, 3].forEach(i => { const a = T * 6 + i * 2.1, s = g('s' + i); s.setAttribute('x', 40 + Math.cos(a) * 20 - 5); s.setAttribute('y', 8 + Math.sin(a) * 5) });
  if (asleep) { g('z1').setAttribute('opacity', .4 + .6 * Math.abs(Math.sin(T * 1.5))); g('z2').setAttribute('opacity', .4 + .6 * Math.abs(Math.sin(T * 1.5 + 1))) }
  extras(dt); placeBub();
}
function frame(now) {
  if (dead) return;
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
  if (mode === 'idle') idle(dt); else if (mode === 'walk') walk(dt); else if (mode === 'jump') jump(dt); else if (mode === 'perch') perch(dt); else if (mode === 'trip') tropiezo(dt);
  rockUpd(dt); draw(dt); requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */
function despertar() {   // lo despiertan de noche: se enoja un rato
  sub = 'stand'; tm = 7; happy = 0;
  if (!night()) return show(R(L.wake), null, 2500);
  grump = 6; show(R(cerrado() ? L.despCerrado : L.desp), [['🛒 Mi carrito', abrirCarrito], ['💡 Tip seña', () => promo(R(L.quip))]], 9000);
}
/* Fecha de cierre: «hoy a las 13:00», «mañana a las 13:00» o «en 3 días (15 de noviembre)» */
function cuandoCierra(ts) {
  const d = new Date(ts), a = new Date(), hh = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const dias = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / 864e5);
  return dias <= 0 ? `hoy a las ${hh}` : dias === 1 ? `mañana a las ${hh}` : `en ${dias} días (${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })})`;
}
function infoFechas() {   // datos que publica index.html en window.__pedidosInfo
  const I = window.__pedidosInfo, t = [];
  if (I && I.llegada) t.push('📦 Llegada estimada: ' + I.llegada);
  if (I && I.cierre > Date.now()) t.push('⏰ Se puede encargar hasta ' + cuandoCierra(I.cierre));
  show(t.length ? t.join('\n') : 'Las fechas se publican cuando abre el catálogo 🍋', null, 9000);
}
function chequearCierre() {   // aviso único por sesión cuando falta poco para el cierre (menos de 3 días)
  const I = window.__pedidosInfo; if (!I || !I.cierre) return false;
  const falta = I.cierre - Date.now(); if (falta <= 0 || falta > 3 * 864e5) return false;
  const k = 'mm_cierre_' + I.cierre; if (SS(k)) return false; SS(k, '1');
  promo(fill(R(L.cierre), { cuando: cuandoCierra(I.cierre) }), [['🛒 Mi carrito', abrirCarrito], ['Ok', () => {}]]); return true;
}
function comoComprar() {
  show('Así de fácil 🍋\n1) Elegís el producto y lo agregás al carrito.\n2) Ponés tu nombre y aceptás las políticas de seña.\n3) Enviás el pedido por WhatsApp (50% de seña).\n4) Te mandamos un mensaje para que respondas ACEPTO.', [['📜 Políticas', () => { if (typeof abrirModalInfo === 'function') abrirModalInfo('politicas'); }], ['Ok', () => {}]], 16000);
}
function menu() {
  const b = [
    ['❓ ¿Cómo reservo?', comoComprar],
    ['💰 Seña 50%', () => show(R(L.sena), null, 8000)],
    ['📦 Combos / originales', () => show(R(L.combo) + '\n\n' + R(L.original), null, 10000)],
    ['📅 Llegada y cierre', infoFechas],
    ['🛍️ Mostrame un producto', recMenu],
    ['📜 Políticas', () => { if (typeof abrirModalInfo === 'function') abrirModalInfo('politicas'); }]
  ];
  b.push([silent ? '🔔 Hablar' : '🤫 Silencio', () => { silent = !silent; SS('mm_sil', silent ? '1' : '0'); show(silent ? 'Ok, me quedo calladito 🤫' : '¡Vuelvo a charlar! 🍋', null, 2500) }]);
  b.push(['👋 Chau', () => { LS('mm_off', Date.now() + 7 * 864e5); show('¡Chau! Vuelvo en unos días 👋', null, 2200); setTimeout(() => { dead = true; clearInterval(schedId); host.remove(); window.__mmPedidosOn = false }, 2400) }]);
  b.unshift(['💬 Preguntame', () => window.__mmChat && window.__mmChat()]);
  show(R(L.poke), b, 14000);
}
m.addEventListener('pointerdown', e => { D = { sx: e.clientX, sy: e.clientY, moved: false, vx: 0, lx: e.clientX, id: e.pointerId }; m.setPointerCapture(e.pointerId); e.preventDefault() });
m.addEventListener('pointermove', e => {
  if (!D) return; D.vx = e.clientX - D.lx; D.lx = e.clientX;
  if (!D.moved && Math.hypot(e.clientX - D.sx, e.clientY - D.sy) > 8 && mode !== 'cart') { D.moved = true; mode = 'drag'; J = null; P = null; corre = false; trip = null; tripRot = 0; m.classList.add('dg'); hide() }
  if (D.moved) { pos.x = e.clientX; pos.y = e.clientY + H * .7 }
});
m.addEventListener('pointerup', e => {
  const d = D; D = null; m.classList.remove('dg'); pedirSensor(); if (!d) return;
  if (d.moved) { const f = fl; u = (f === 'b' || f === 't') ? pos.x : pos.y; const [a, b] = range(f); u = clamp(u, a, b); const t = edge(f, u), dist = Math.hypot(t.x - pos.x, t.y - pos.y); entering = false; go(t, { d: .25 + dist / 1600, ease: 'in', done: () => land(true) }) }
  else { happy = .6; if (sub === 'sleep') despertar(); else if (bubUntil) hide(); else menu() }
});
const act = () => {
  const ina = Date.now() - lastAct; lastAct = Date.now();
  if (sub === 'sleep' && mode === 'idle' && !night()) { sub = 'stand'; tm = 1.5; if (!silent && !hablando() && !bubUntil) show(R(L.wake), null, 2500) }
  else if (ina > 60e3 && !silent && !hablando() && !bubUntil && mode !== 'cart' && Math.random() < .4) { happy = .8; show('¡Volviste! Te estaba esperando 🍋', null, 2400) }
};
addEventListener('pointermove', e => { ptr = { x: e.clientX, y: e.clientY }; act() }, { passive: true });
addEventListener('scroll', () => { lastScroll = Date.now(); act() }, { passive: true });
addEventListener('keydown', act); addEventListener('touchstart', act, { passive: true });

/* Sensor de inclinación: si se da vuelta el celular, se cae hacia el borde que quedó abajo */
function onOri(e) {
  if (e.beta == null || e.gamma == null) return; sensor = true;
  const b = e.beta * Math.PI / 180, c = e.gamma * Math.PI / 180, an = ((screen.orientation && screen.orientation.angle) || ((window.orientation || 0) + 360) % 360 || 0) * Math.PI / 180;
  const gx = Math.cos(b) * Math.sin(c), gy = Math.sin(b), x = gx * Math.cos(an) + gy * Math.sin(an), y = -gx * Math.sin(an) + gy * Math.cos(an);
  let w = fl; if (Math.max(Math.abs(x), Math.abs(y)) > .72) w = Math.abs(y) >= Math.abs(x) ? (y > 0 ? 'b' : 't') : (x > 0 ? 'r' : 'l');
  if (w !== want) { want = w; wantSince = Date.now() } else if (w !== fl && Date.now() - wantSince > 500 && Date.now() - lastFlip > 2000 && !reduce && !hablando()) flip(w);
}
function escucharSensor() { addEventListener('deviceorientation', onOri) }
function pedirSensor() {   // iPhone: el permiso se pide con el primer toque a Limón, sin menús
  if (pidio || sensor || typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') return; pidio = true;
  try { DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') escucharSensor() }).catch(() => {}) } catch (e) {}
}
m.addEventListener('click', pedirSensor);
if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') escucharSensor();

/* Reacciones a la página: producto agregado, ventanas abiertas */
function vigilarTienda() {
  const cc = $q('#cart-count'); cartCount = parseInt(cc && cc.textContent) || 0; cartSince = cartCount > 0 ? Date.now() : 0;
  if (cc) new MutationObserver(() => {
    const n = parseInt(cc.textContent) || 0, up = n > cartCount; cartCount = n; cartSince = n > 0 ? Date.now() : 0; if (!n) SS('mm_ca', '');
    if (up && Date.now() - lastAdd > 8000 && mode !== 'cart') { lastAdd = Date.now(); happy = 1.2; if (!silent && !hablando() && !tipeando && Math.random() < .5) show(R(L.add), null, 2600) }
  }).observe(cc, { childList: true, characterData: true, subtree: true });
  MODALES.forEach(id => { const e = document.getElementById(id); if (e) new MutationObserver(onModal).observe(e, { attributes: true, attributeFilter: ['style', 'class'] }) });
}

/* Callarse mientras escriben (buscador, nombre del cliente) */
const campo = 'input,textarea,select,[contenteditable="true"]';
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches(campo)) { tipeando = true; if (bubUntil) hide() } });
document.addEventListener('focusout', () => setTimeout(() => { const a = document.activeElement; if (!a || !a.matches || !a.matches(campo)) tipeando = false }, 1200));

/* Primera visita */
function saludoInicial() {
  if (cerrado()) return [R(L.cerrado), [['Ok 🍋', () => {}]], 9000];
  const bt = [['❓ ¿Cómo reservo?', comoComprar], ['Ok 🍋', () => {}]];
  if (!LS('mm_vis_ped')) { LS('mm_vis_ped', '1'); return [L.primera, bt, 12000] }
  return [R(L.hi), bt, 9000];
}

/* ---------- Ropa y accesorios (clima, hora) ---------- */
const KIND = { lana: ['hat3', 'scarf'], gorra: ['hat4'], dormir: ['hat5'], sol: ['gl'], auriculares: ['hp', 'nt'], mate: ['mate'] };
const CABEZA = new Set(['hat3', 'hat4', 'hat5', 'hp']), TODOS = [...new Set(Object.values(KIND).flat())];
function vestirAplicar() {
  const vis = new Set(); let cab = false;
  const add = ks => ks.forEach(k => (KIND[k] || []).forEach(id => { if (CABEZA.has(id)) { if (cab) return; cab = true } vis.add(id) }));
  const wx = WX || {}, hr = new Date().getHours(), dorm = sub === 'sleep' && mode === 'idle';
  if (wx.frio) add(['lana']); if (wx.calor) add(dorm ? ['gorra'] : ['gorra', 'sol']);
  if (dorm) add(['dormir']);
  if (sub === 'music' && mode === 'idle') add(['auriculares']);
  if (hr >= 6 && hr < 12 && sub === 'sit' && mode === 'idle') add(['mate']);
  const sig = [...vis].join(); if (sig === visSig) return; visSig = sig;
  TODOS.forEach(id => { const e = g(id); if (e) e.style.display = vis.has(id) ? '' : 'none' });
}

/* ---------- Modo prueba: abrí la página con «?limon» al final (ej. index.html?limon) ---------- */
function panelPrueba() {
  const css = document.createElement('style');
  css.textContent = '#tp{position:absolute;left:8px;bottom:70px;width:232px;max-height:62vh;overflow:auto;padding:8px 10px;border-radius:12px;background:#000d;color:#fff;font:12px system-ui,sans-serif;pointer-events:auto;line-height:1.35}#tp label{display:block;margin:5px 0 2px}#tp input,#tp select{width:100%;font:12px system-ui;padding:3px;border-radius:6px;border:0}#tp input[type=checkbox]{width:auto}#tp .g{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:7px}#tp button{border:0;border-radius:8px;padding:6px 4px;background:#ffffff26;color:#fff;font:12px system-ui;cursor:pointer}#tp button:hover{background:#ffffff48}#tp .h{display:flex;justify-content:space-between;align-items:center}#tp #ts{margin-top:6px;opacity:.8;font-size:11px}';
  sh.appendChild(css);
  const pan = document.createElement('div'); pan.id = 'tp';
  pan.innerHTML = '<div class="h"><b>🍋 Modo prueba</b><button id="tx" style="width:26px">–</button></div><div id="tb"><label>Clima<select id="tw"><option value="">Real</option><option value="frio">Frío (7°)</option><option value="calor">Calor (35°)</option><option value="lluvia">Lluvia</option><option value="nube">Nublado</option><option value="tormenta">Tormenta</option><option value="viento">Viento</option><option value="nada">Sin clima</option></select></label><label><input id="tn" type="checkbox"> Noche</label><label><input id="tc" type="checkbox"> Catálogo cerrado</label><div class="g" id="bt"></div><div id="ts"></div></div>';
  sh.appendChild(pan);
  const q = id => pan.querySelector('#' + id);
  const CLIMAS = { frio: { T: 7, frio: true }, calor: { T: 35, calor: true }, lluvia: { T: 20, lluvia: true }, nube: { T: 22, nube: true }, tormenta: { T: 22, tormenta: true, lluvia: true }, viento: { T: 20, viento: true } };
  q('tw').onchange = () => { if (q('tw').value === '') clima(); else WX = CLIMAS[q('tw').value] || null };
  q('tn').onchange = () => { nightOv = q('tn').checked ? true : null };
  q('tc').onchange = () => { cerradoOv = q('tc').checked ? true : null };
  q('tx').onclick = () => { const b = q('tb'); b.style.display = b.style.display === 'none' ? '' : 'none'; q('tx').textContent = b.style.display === 'none' ? '+' : '–' };
  const reposo = () => { if (mode === 'cart') return; J = null; P = null; D = null; trip = null; tripRot = 0; corre = false; fl = 'b'; const [a, b] = range('b'); u = clamp(pos.x, a, b); pos = edge('b', u); mode = 'idle'; sub = 'stand'; tm = 20; grump = 0; hide() };
  const izq = () => { const [a] = range('b'); u = a + 10; pos = edge('b', u) };
  const acc = [
    ['🪨 Piedra', () => { reposo(); izq(); evPiedra() }], ['🏃 Correr', () => { reposo(); izq(); evCorrer() }], ['🎧 Música', () => { reposo(); evMusica() }], ['☂️ Paraguas', () => { reposo(); WX = { T: 22, nube: true }; umAnim = { t: 0 } }],
    ['🧉 Sentarse', () => { reposo(); sub = 'sit' }], ['😤 Despertar', () => { reposo(); nightOv = true; q('tn').checked = true; sub = 'sleep'; setTimeout(despertar, 1200) }],
    ['⏰ Aviso de cierre', () => { window.__pedidosInfo = Object.assign({}, window.__pedidosInfo, { cierre: Date.now() + 5 * 36e5 }); chequearCierre() }], ['📅 Llegada y cierre', infoFechas],
    ['🛍️ Recomendar', recMenu], ['🔥 Tour', () => { reposo(); tour(true) }],
    ['🔄 Restablecer', () => { nightOv = null; cerradoOv = null; q('tw').value = ''; q('tn').checked = q('tc').checked = false; clima(); reposo(); tm = 2 }]];
  acc.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; q('bt').append(b) });
  setInterval(() => { q('ts').textContent = 'puesto: ' + (visSig || 'nada') }, 700);
}

/* ---------- Planificador (cada segundo) ---------- */
function sched() {
  const now = Date.now();
  if (document.hidden || mode === 'cart' || mode === 'drag' || hablando()) return;
  const ina = (now - lastAct) / 1e3, car = cartSince ? (now - cartSince) / 6e4 : 0;
  const libre = mode === 'idle' && sub !== 'sleep' && !silent && !tipeando && !bubUntil && !modalAbierto();

  // Carrito armado y sin enviar
  if (libre && cartCount > 0 && car >= 3 && ina >= 12 && !SS('mm_ca')) {
    SS('mm_ca', '1');
    promo(fill(R(L.carritoAviso), { n: cartCount, s: cartCount > 1 ? 's' : '' }), [['🛒 Abrir carrito', abrirCarrito]]);
    return;
  }

  if (mode === 'idle' && sub !== 'sleep' && canSpeak() && now - lastScroll > 1500) {
    if (chequearCierre()) return;
    if (!cerrado()) {
      if (now >= nextTour) { if (tour(false)) { nextTour = now + gap(40, 70); return } nextTour = now + 15e3 }
      if (now >= nextPeek) { if (tour(false, true)) { nextPeek = now + gap(100, 170); return } nextPeek = now + 20e3 }
      if (now >= nextRec) { nextRec = now + gap(50, 90); recomendar(); return }
    }
    if (now >= nextQuip) { nextQuip = now + gap(45, 75); promo(R(cerrado() ? L.cerrado : L.quip)) }
  }
}

/* ---------- Arranque ---------- */
function iniciar() {
  document.body.appendChild(host); vigilarTienda(); if (CFG.clima !== false) clima(); if (/[?&]limon(=|&|$)/.test(location.search)) panelPrueba();
  nextTour = Date.now() + 12e3 * CFG.ritmo; nextRec = Date.now() + 30e3 * CFG.ritmo; nextQuip = Date.now() + 22e3 * CFG.ritmo; nextPeek = Date.now() + 70e3 * CFG.ritmo;
  pos = edge('b', -40); tgt = CFG.mi + 70; mode = 'walk'; last = performance.now(); requestAnimationFrame(frame); schedId = setInterval(sched, 1000);
  if (SS('mm_hi') !== '1' && !silent) { SS('mm_hi', '1'); setTimeout(() => { if (mode !== 'cart' && !dead) { const [t, b, ms] = saludoInicial(); show(t, b, ms) } }, 1800) }
}
setTimeout(iniciar, 300);
window.__mm = { show, charlar, tour, recomendar, despertar, comoComprar, infoFechas, chequearCierre, piedra: evPiedra, correr: evCorrer, musica: evMusica, setWX: w => { WX = w }, noche: v => { nightOv = v }, flip, last: () => lastRec, state: () => ({ fl, mode, sub, pos, promos, sensor, tgt, WX, umAnim, grump, corre, rock: !!rock, cerrado: cerrado() }) };
})();
