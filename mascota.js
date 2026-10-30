/* Limón 🍋 — mascota vendedora para la tienda.
   Un solo archivo, sin librerías. No modifica ni lee tu código: solo mira la página
   (tarjetas con etiqueta "% OFF", el carrito #offcanvasDark y el contador #cantCarrito)
   y lee articulos.json para recomendar. Se instala con una línea en index.html:
   <script src="mascota.js" defer></script> */
(() => {
'use strict';
const CFG = { json: 'articulos.json', items: 'items_limon.json', desc: 'desc_limon.json', W: 60, H: 72, mi: 64, md: 84, borde: 4, maxPromos: 20, ritmo: 1, lat: -26.4, lon: -54.63, calor: 30 };   // lat/lon: ubicación del local (para el clima). calor: grados a partir de los que se acalora   // ritmo: 1 = normal, 0.5 = más charlatán, 2 = más callado
const gap = (a, b) => rnd(a, b) * 1e3 * CFG.ritmo;
const W = CFG.W, H = CFG.H;
const $q = (s, r = document) => r.querySelector(s), $a = (s, r = document) => [...r.querySelectorAll(s)];
const R = a => a[Math.random() * a.length | 0], rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const LS = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v) } catch (e) {} };
const SS = (k, v) => { try { return v === undefined ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v) } catch (e) {} };
if (+LS('mm_off') > Date.now() || window.__mmOn) return;
window.__mmOn = true;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- Frases ---------- */
const L = {
  hi: ['¡Hola! Soy Limón 🍋 Tocame si querés ver ofertas o que te recomiende algo.', '¡Bienvenido a la tienda! Soy Limón 🍋 Si necesitás ayuda, tocame.', '¡Hola! Limón al servicio 🍋 ¿Te muestro las ofertas?'],
  oferta: [(p, n) => `¿Este te sirve? ¡Comprálo, está en oferta! ${p} OFF 🍋`, (p, n) => `Psst… ${n} tiene ${p} de descuento. ¡No te lo pierdas!`, (p, n) => `¡Ofertón! ${n}, ${p} OFF. Yo en tu lugar lo llevaba 😉`],
  rec: [(n, p) => `No te distraigas conmigo 😅 ¿Ya viste ${n}? Está a ${p}.`, (n, p) => `¡Ojo con ${n}! ${p} y es genial 🍋`, (n, p) => `¿Buscás algo? Mirá ${n}: ${p}.`],
  recOf: [(n, p, d) => `¡${n} está en oferta! ${d}% OFF, ahora ${p} 🔥`],
  quip: ['🍋 Si la vida te da limones… ¡mirá las ofertas!', '¿Buscás algo en particular? Probá el buscador de arriba 🔎', 'Estoy de turno vigilando las ofertas 👀', '¿Sabías que podés mandar tu carrito por WhatsApp? Es re fácil 📲'],
  nudge: ['Tu carrito te está esperando 🛒 ¿Lo terminamos?', '¿Te falta algo o ya cerramos la compra? 🍋'],
  add: ['¡Buena elección! 🍋', '¡Eso! Al carrito 🛒', '¡Qué buen ojo!', '¡Uh, ese es de los buenos!'],
  poke: ['¡Cosquillas! 🤭', '¿Me necesitabas?', 'Soy muy ocupado, ¿sabés? 😎'],
  fall: ['¡Aaah! ¡Avisá antes de dar vuelta el celu! 😵', 'Uf… me mareé ⭐', '¡Cuidado, que soy frágil! 🍋'],
  peek: [() => '¿Este? 👀', () => '¿Qué tal este? 🍋', n => `Mmm… ¿y ${n}? 😏`, () => 'Este tiene buena pinta, ¿no?'],
  retoInv: ['Si me agarrás y me tirás desde lo alto {veces} veces, te doy un código de descuento 😈', 'Reto: revoleame por tu pantalla {veces} veces y te regalo un descuento 🍋', '¿Te animás? Agarrame y tirame desde arriba {veces} veces… y te doy un código 🎁'],
  retoProg: ['¡Van {n} de {veces}! Seguí, que me estoy mareando 😵', '{n} de {veces}… ¡qué brazo! 💪', '¡{n} de {veces}! No pares ahora 😈'],
  retoPremio: ['¡Está bien, ganaste! 🏆 Tomá {descuento} de descuento con la clave: {clave}', '¡Me rindo! 😵 Tu premio: {descuento} de descuento con la clave: {clave}'],
  desp: ['No me pagan horas extras… al menos haceme un pedido 😤', 'Ya que me despertaste, sumá cosas al carrito 🛒', '¡Eh! Estaba durmiendo… Si me despertás, comprá algo 😠', 'Tenés suerte de que soy simpático… ¿qué vas a llevar?', 'Me despertaste. Ahora me debés un pedido 😤🍋'],
  despCerrado: ['Estamos cerrados y encima me despertás 😤 Dejá tu pedido y mis empleados lo ven apenas abran', '¿A esta hora? Hasta los jefes dormimos… Dejá tu pedido y mañana te atienden 😴', 'Soy el jefe y estoy durmiendo. Dejá tu pedido, que mis empleados se encargan 😤'],
  cerrado: ['Ahora estamos cerrados, pero dejanos tu pedido que mis empleados te atenderán pronto. Yo soy el jefe, pero estoy de paso… 🍋', 'Estamos cerrados, pero mis empleados ven los pedidos apenas abren. ¡Yo soy el jefe, ojo! 😎', 'Cerrado por ahora. Armá tu carrito y mis empleados se encargan cuando vuelvan 🛒', 'Mis empleados están descansando (yo no, soy el jefe 😤). Dejá tu pedido y te atienden pronto.'],
  addCerrado: ['¡Buena elección! Mis empleados lo preparan apenas abramos 🍋', '¡Eso! Dejá el pedido y ellos se encargan cuando vuelvan 🛒'],
  trip: ['Esto me trajo recuerdos de aquel día que me caí del árbol 🌳🍋', '¿Quién tiró esa piedra? ¡Fue a propósito! 😤', 'Auch… eso dolió más que un exprimidor 🍋'],
  corrio: ['¡Uff! Si me hubiera chocado a esa velocidad me hacía limonada 🍋💨', '¡Uf! Corrí tan rápido que casi me exprimo 😅', '¡Qué carrera! Nuevo récord personal 🏅'],
  musica: ['¡Qué buen tema! 🎧 Por cierto, acá vendemos auriculares re buenos…', '¿Escuchaste eso? 🎶 Tenemos auriculares geniales 😉'],
  wx: {
    calor: ['¡Qué calor! 🥵 Con {T}° hasta un limón se exprime solo', 'Con {T}° hasta los limones sudamos 🥵', '¡{T}° afuera! Me quedo en la sombra de tu pantalla 😎'],
    lluvia: ['¡Está lloviendo! ☔ Buen momento para comprar sin mojarte', 'Llueve… yo ya saqué el paraguas ☔ ¿Y tu pedido?', '¡Día de lluvia! Ideal para elegir cositas desde casa 🍋'],
    nube: ['Está nublado… por las dudas ando con el paraguas ☂️', 'Se viene nublado, ya tengo el paraguas a mano ☂️']
  },
  wake: '¡Ah! Estaba soñando con ofertas 💤'
};

/* ---------- Estructura (Shadow DOM: el CSS de la tienda no lo toca) ---------- */
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
#bub button{border:0;border-radius:999px;padding:6px 10px;background:#f3ecfa;color:#4a2b7a;font-size:12px;font-weight:600;cursor:pointer}
#bub button:hover{background:#e4d6f5}
@media (prefers-reduced-motion:reduce){#bub{transition:none}}
</style>
<div id="m"><svg viewBox="0 0 80 96"><ellipse cx="40" cy="92" rx="20" ry="4" fill="#0003"/>
<g id="bd"><g id="fx">
<g id="l1"><path d="M32 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="33" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<g id="l2"><path d="M48 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="47" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<g id="a1"><ellipse cx="14" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/><g id="um2" style="display:none"><path d="M12 56Q7 49 14 49" fill="none" stroke="#4a2b8a" stroke-width="2.2" stroke-linecap="round"/><path d="M13 58L8 84L17 84Z" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="1.6" stroke-linejoin="round"/></g></g>
<g id="a2"><ellipse cx="66" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/></g>
<ellipse cx="40" cy="50" rx="27" ry="29" fill="#ffe14a" stroke="#c99a00" stroke-width="3"/>
<ellipse id="heat" cx="40" cy="50" rx="26" ry="28" fill="#ff5a36" opacity="0"/>
<g id="hp" style="display:none"><path d="M16 46Q40 -4 64 46" fill="none" stroke="#3a2a66" stroke-width="4" stroke-linecap="round"/><ellipse cx="15" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/><ellipse cx="65" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/></g>
<path d="M40 22Q42 8 58 8Q56 22 40 22Z" fill="#5bbf4a" stroke="#3c8c32" stroke-width="2" stroke-linejoin="round"/>
<g id="um" style="display:none"><path d="M6 6Q40 -32 74 6Q64 0 56 6Q48 0 40 6Q32 0 24 6Q16 0 6 6Z" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="2" stroke-linejoin="round"/><path d="M40 6V22" stroke="#4a2b8a" stroke-width="2.5" stroke-linecap="round"/></g>
<ellipse cx="24" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/><ellipse cx="56" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/>
<g id="e1"><ellipse cx="32" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p1" cx="32" cy="47" r="3" fill="#222"/></g>
<g id="e2"><ellipse cx="48" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p2" cx="48" cy="47" r="3" fill="#222"/></g>
<g id="cl" style="display:none" fill="none" stroke="#5a3d00" stroke-width="2.2" stroke-linecap="round"><path d="M27 46Q32 50 37 46"/><path d="M43 46Q48 50 53 46"/></g>
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
let ART = null, bubUntil = 0, nextTour = Date.now() + 25e3, nextRec = Date.now() + 55e3, nextQuip = Date.now() + 40e3, nextNudge = Date.now() + 100e3, cartCount = 0, lastAdd = 0, nudged = false;
let ITEMS = null, DESC = null, ALL = new Map(), tStart = Date.now(), cartSince = 0, lastRec = null, nextPeek = Date.now() + 70e3, nextReto = Date.now() + 100e3, wantCart = false, toCart = false, lastFav = 0, pidio = false, WX = null, grump = 0, tripRot = 0, corre = false, rock = null, trip = null, lastEvt = Date.now() - 45e3, nextCerrado = Date.now() + 40e3, cerrados = 0, nightOv = null;
const ROT = { b: 0, t: 180, l: 90, r: -90 };
const night = () => nightOv !== null ? nightOv : (h => h >= 23 || h < 7)(new Date().getHours());
const cerrado = () => /cerrado/i.test((document.getElementById('badgeAbierto') || {}).textContent || '');   // lee el cartel «Abierto/Cerrado ahora» de tu página
const abrirCarrito = () => { const b = $q('#listaInteres'); b && b.click() };
const navBottom = () => { const n = $q('#nav1'); return n ? n.getBoundingClientRect().bottom : 0 };
const range = f => (f === 'b' || f === 't') ? [CFG.mi, innerWidth - CFG.md] : [navBottom() + H, innerHeight - H];
const edge = (f, uu) => { const b = CFG.borde; return f === 'b' ? { x: uu, y: innerHeight - b } : f === 't' ? { x: uu, y: b } : f === 'l' ? { x: b, y: uu } : { x: innerWidth - b, y: uu } };
const sgn = () => (fl === 'b' || fl === 'l') ? 1 : -1;
const cartEl = () => $q('#offcanvasDark');
const cartOpen = () => { const o = cartEl(); return !!o && o.classList.contains('show') };

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
const canSpeak = () => !silent && promos < CFG.maxPromos && Date.now() - lastSay > 16000 * CFG.ritmo && !bubUntil && !cartOpen() && !document.hidden;
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
const num = v => Number(String(v == null ? '' : v).replace(/,/g, '.')) || 0;
/* Lee un JSON; si el archivo está en Base64 (para que no se lea a simple vista) lo decodifica. */
async function leer(url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return null; let t = (await r.text()).trim();
    if (t[0] !== '{' && t[0] !== '[') t = new TextDecoder().decode(Uint8Array.from(atob(t.replace(/\s/g, '')), c => c.charCodeAt(0)));
    return JSON.parse(t);
  } catch (e) { return null }
}
let cargando = null;
function cargar() {
  return cargando || (cargando = (async () => {
    try {
      const r = await fetch(CFG.json, { cache: 'force-cache' }), d = await r.json();
      const it = d.map(p => { let ds = num(p.Descuento); if (ds > 0 && ds < 1) ds *= 100; ds = Math.round(ds); return { id: p['Artículo'], n: String(p['Descripción'] || '').trim(), c: String(p.Categoria || ''), d: ds, pr: num(p.Venta) * (num(p.DOLAR) || 1) * (1 - ds / 100), st: num(p.Inventario) >= 1 && num(p.Venta) > 0 } });
      ALL = new Map(it.map(p => [p.id, p])); ART = it.filter(p => p.st && p.n);
    } catch (e) { ART = [] }
    ITEMS = await leer(CFG.items) || {}; DESC = await leer(CFG.desc);
  })());
}
const corto = s => s.length > 42 ? s.slice(0, 40) + '…' : s;
/* items_limon.json: qué puede recomendar Limón */
const permitido = p => {
  const I = ITEMS || {}; if ((I.excluirIds || []).includes(p.id)) return false;
  if ((I.excluirCategorias || []).map(s => String(s).toLowerCase()).includes(p.c.toLowerCase())) return false;
  if ((I.destacados || []).includes(p.id)) return true;
  const cs = (I.categorias || []).map(s => String(s).toLowerCase());
  if (cs.length && !cs.includes(p.c.toLowerCase())) return false;
  return !(I.soloConDescuento && !(p.d > 0));
};
L.recCat = [(c, n, p) => `Vi que te interesan los productos de ${c}. Quizás te guste ${n}: ${p} 🍋`, (c, n, p) => `Por lo que veo, lo tuyo es ${c} 😏 Mirá ${n}, está a ${p}.`, (c, n, p) => `Como te gusta ${c}, te muestro ${n}: ${p}.`];
async function recomendar() {
  await cargar(); const I = ITEMS || {}; if (I.activo === false || !ART.length) return false;
  let vistos = []; try { vistos = JSON.parse(LS('vistos_limon') || '[]').map(Number) } catch (e) {}
  const dicho = (SS('mm_seen') || '').split(',').map(Number).filter(Boolean), base = ART.filter(p => permitido(p) && !dicho.includes(p.id));
  let pool = base, cat = null;
  if (I.usarUltimoVisto !== false) {   // elige una categoría de lo que miró o guardó, rotando entre ellas
    const cats = [...new Set(vistos.slice(0, 8).map(id => (ALL.get(id) || {}).c).filter(Boolean))].filter(c => base.some(p => p.c === c && !vistos.includes(p.id)));
    if (cats.length) { const ant = SS('mm_cat'); cat = R(cats.length > 1 ? cats.filter(c => c !== ant) : cats); pool = base.filter(p => p.c === cat && !vistos.includes(p.id)) }
  }
  const dest = I.destacados || []; pool = pool.flatMap(p => Array((p.d > 0 ? 3 : 1) * (dest.includes(p.id) ? 3 : 1)).fill(p));
  if (!pool.length) return false;
  const p = R(pool); lastRec = p; SS('mm_seen', [...dicho, p.id].slice(-8).join(','));
  const pers = cat && SS('mm_pers') !== '1'; SS('mm_pers', pers ? '1' : '0'); if (pers) SS('mm_cat', cat);   // la frase "vi que te gusta…" solo una de cada dos veces
  const n = corto(p.n), t = pers ? R(L.recCat)(cat, n, money(p.pr)) : p.d > 0 ? R(L.recOf)(n, money(p.pr), p.d) : R(L.rec)(n, money(p.pr));
  promo(t, [['Verlo', () => verProducto(p.id)], ['Ahora no', () => {}]]); return true;
}
async function recMenu() { if (!(await recomendar())) show('Por ahora no tengo nada para recomendarte 🤷', null, 3500) }

/* desc_limon.json: códigos de descuento con humor */
L.dto = ['¿No te decidís? Tomá un descuento de {descuento} con la clave: {clave} 🍋', 'Soy muy ácido, pero también sé dar descuentos: {descuento} usando la clave: {clave}', 'Veo que no comprás nada… tomá un descuento de {descuento} usando la clave: {clave}', 'Me tenés cansado de tanta indecisión 😤 Tomá {descuento} de descuento con la clave: {clave}'];
function codigoElegible() {
  const D = DESC; if (!D || D.activo !== true) return null;
  if ((+SS('mm_dn') || 0) >= (D.maxPorVisita ?? 1)) return null;
  if (!+SS('mm_dn') && Date.now() - (+LS('mm_dto') || 0) < (D.pausaDias ?? 3) * 864e5) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  const ok = (D.codigos || []).filter(c => c.activo !== false && c.uso !== 'reto' && c.clave && num(c.descuento) > 0 && (!c.vence || String(c.vence) >= hoy));
  return ok.length ? R(ok.flatMap(c => Array(Math.max(1, (c.peso | 0) || 1)).fill(c))) : null;
}
function darCodigo() {
  const c = codigoElegible(); if (!c) return false;
  const fr = DESC.frases && DESC.frases.length ? DESC.frases : L.dto, min = num(c.minimo) > 0 ? ` (en compras desde ${money(num(c.minimo))})` : '';
  const t = R(fr).replace(/\{descuento\}/g, num(c.descuento) + '%').replace(/\{clave\}/g, c.clave) + min + (DESC.aviso ? ' ' + DESC.aviso : '');
  SS('mm_dn', (+SS('mm_dn') || 0) + 1); LS('mm_dto', Date.now()); happy = 1.2; promos++;
  show(t, [['📋 Copiar clave', () => copiar(c.clave)], ['🛒 Ponerla en mi carrito', () => aplicar(c.clave)]], 15000); return true;
}
const retoCfg = () => { const c = DESC && DESC.reto; return c && c.activo === true && DESC.activo === true && !LS('mm_reto_ok') && (DESC.codigos || []).some(x => x.uso === 'reto' && x.activo !== false && x.clave) ? c : null };
const fill = (t, o) => t.replace(/\{(\w+)\}/g, (s, k) => o[k] == null ? s : o[k]);
function contarTiro(dist) {   // cuenta solo los tiros desde bien arriba
  const c = retoCfg(); if (!c || dist < innerHeight * .4) return;
  const n = (+LS('mm_reto') || 0) + 1, total = c.veces || 10; LS('mm_reto', n);
  if (n >= total) return premioReto(c);
  stars = Math.max(stars, 1.5); show(fill(R(c.progreso && c.progreso.length ? c.progreso : L.retoProg), { n, veces: total }), null, 2200);
}
function premioReto(c) {
  const k = (DESC.codigos || []).find(x => x.uso === 'reto' && x.activo !== false && x.clave && (!x.vence || String(x.vence) >= new Date().toISOString().slice(0, 10))); if (!k) return;
  LS('mm_reto_ok', Date.now()); happy = 2; promos++;
  const min = num(k.minimo) > 0 ? ` (en compras desde ${money(num(k.minimo))})` : '';
  show(fill(R(c.premio && c.premio.length ? c.premio : L.retoPremio), { descuento: num(k.descuento) + '%', clave: k.clave }) + min + (DESC.aviso ? ' ' + DESC.aviso : ''), [['📋 Copiar clave', () => copiar(k.clave)], ['🛒 Ponerla en mi carrito', () => aplicar(k.clave)]], 20000);
}
function copiar(k) { (navigator.clipboard ? navigator.clipboard.writeText(k) : Promise.reject()).then(() => show('¡Copiada! Pegala en el carrito 🛒', null, 3000)).catch(() => show('Tu clave es ' + k + ' 😉', null, 6000)) }
function aplicar(k) {
  const i = document.getElementById('codigoPromocional'); if (!i) return copiar(k);
  i.value = k; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true }));
  show('¡Listo! Ya la puse en tu carrito 🛒', [['Abrir carrito', () => { const b = $q('#listaInteres'); b && b.click() }]], 6000);
}
function irCategoria(nombre, luego) {
  const b = $a('.categoria-btn').find(x => x.textContent.trim().toLowerCase() === nombre.toLowerCase()), c = $q('#contenedorCatalogo');
  if (!b) return show(`Buscá «${nombre}» entre las categorías 😉`, null, 4000);
  b.click();
  setTimeout(() => { if (c) scrollTo({ top: c.getBoundingClientRect().top + scrollY - navBottom() - 10, behavior: reduce ? 'auto' : 'smooth' }); if (luego) setTimeout(luego, 1500) }, 400);
}
function verOfertas() { irCategoria('CON DESCUENTOS', () => tour(true)) }
/* Clima del local (Open-Meteo, sin clave): calor → se acalora, lluvia → paraguas, nublado → paraguas colgado */
async function clima() {
  try {
    let c = JSON.parse(SS('mm_wx') || 'null');
    if (!c || Date.now() - c.t > 30 * 60e3) {
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CFG.lat}&longitude=${CFG.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`), j = await r.json();
      c = { t: Date.now(), T: j.current.temperature_2m, c: j.current.weather_code, d: j.current.is_day }; SS('mm_wx', JSON.stringify(c));
    }
    const k = c.c, lluvia = (k >= 51 && k <= 67) || (k >= 80 && k <= 86) || k >= 95;
    WX = { T: c.T, lluvia, nube: !lluvia && (k === 3 || k === 45 || k === 48), calor: !lluvia && k <= 2 && c.d === 1 && c.T >= CFG.calor };
  } catch (e) { WX = null }
}
const climaFrase = () => { const k = WX && (WX.calor ? 'calor' : WX.lluvia ? 'lluvia' : WX.nube ? 'nube' : null); return k && fill(R(L.wx[k]), { T: Math.round(WX.T) }) };
function verProducto(id) {
  const im = document.getElementById('img' + id), c = im && (im.closest('.tarjetas2') || im.closest('.card-group') || im);
  if (c) { c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); c.animate([{ boxShadow: '0 0 0 0 #ffe14a' }, { boxShadow: '0 0 0 10px #ffe14a88' }, { boxShadow: '0 0 0 0 #ffe14a00' }], { duration: 1400, iterations: 2 }) }
  else location.href = location.pathname + '?p=' + id;
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
  if (sub === 'music') { sub = 'stand'; tm = 1.5; if (!silent && canSpeak()) promo(R(L.musica), [['🎧 Ver auriculares', () => irCategoria('Auriculares')]]); return }
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
  const d = Math.sign(tgt - u) || 1; u += d * (entering ? 120 : toCart ? 75 : corre ? 260 : 55) * dt; face = d * sgn();
  if (!entering && !toCart) { const [a, b] = range(fl); u = clamp(u, a - 30, b + 30) }
  if (rock && !rock.hit && rock.f >= 1 && !toCart && Math.abs(u - rock.u) < 14) { rock.hit = true; trip = { t: 0, d }; mode = 'trip'; corre = false; pos = edge(fl, u); return }
  if (Math.abs(tgt - u) < 3) {
    if (toCart) { toCart = false; mode = 'cart' }
    else { mode = 'idle'; sub = 'stand'; tm = rnd(1, 3); if (corre) { corre = false; squash = .15; tm = 3; if (!silent) show(R(L.corrio), null, 4500) } }
    entering = false;
  }
  pos = edge(fl, u);
}
function tropiezo(dt) {
  trip.t += dt; const t = trip.t;
  tripRot = trip.d * (t < .25 ? 80 * (t / .25) : t < 1.4 ? 80 : 80 * Math.max(0, 1 - (t - 1.4) / .4));
  if (t > .3 && !trip.s) { trip.s = 1; stars = 1.4; squash = .3 }
  if (t > 1.8) {
    tripRot = 0; mode = 'idle'; sub = 'stand'; tm = 3; trip = null; if (!silent) show(R(L.trip), null, 5200);
    const r0 = rock; setTimeout(() => { if (rock === r0) { rock = null; rk.style.display = 'none' } }, 2500);
  }
  pos = edge(fl, u);
}
function rockUpd(dt) {
  if (!rock) return; rk.style.display = ''; if (rock.f < 1) rock.f = Math.min(1, rock.f + dt * 2.2);
  rk.style.transform = `translate(${rock.u - 13}px,${innerHeight - CFG.borde - 17 - (rock.f < 1 ? (1 - rock.f * rock.f) * innerHeight * .7 : 0)}px)`;
}
function idle(dt) {
  if (wantCart && cartOpen() && fl === 'b') { irAlCarrito(); return }
  if (!entering) { const [a, b] = range(fl); u = clamp(u, a, b) }
  pos = edge(fl, u); tm -= dt; if (tm <= 0 && !bubUntil) nextAction();
}

/* Tour por las tarjetas con etiqueta de oferta */
function tarjetasOferta(todas) {
  const nb = navBottom(), vh = innerHeight, seen = new Set();
  return (todas ? $a('#contenedorCatalogo .tarjetas2').map(c => ({ c })) : $a('#contenedorCatalogo .text-overlay').map(o => ({ o, c: o.closest('.tarjetas2') || o.closest('.card-group') }))).map(({ o, c }) => {
    if (!c || seen.has(c)) return null; seen.add(c);
    const r = c.getBoundingClientRect(); if (r.width < 80 || r.top < nb + H + 6 || r.top > vh - 90) return null;
    const im = c.querySelector('[id^="img"]'), t = ((c.querySelector('.card-title') || {}).textContent || 'este producto').trim();
    const pp = ALL.get(im ? parseInt(im.id.slice(3)) : 0); if (pp && !permitido(pp)) return null;
    return { c, pct: o ? (o.textContent.match(/\d+%/) || ['oferta'])[0] : null, name: t.length > 38 ? t.slice(0, 36) + '…' : t, id: im ? parseInt(im.id.slice(3)) : 0 };
  }).filter(Boolean).sort((a, b) => Math.abs(a.c.getBoundingClientRect().left - pos.x) - Math.abs(b.c.getBoundingClientRect().left - pos.x)).slice(0, 3);
}
function tour(force, todas) {
  if (fl !== 'b' || mode !== 'idle') return false;
  let list = tarjetasOferta(todas);
  if (!list.length) { if (force && !todas) show('No veo ofertas a la vista 🤔 ¿Querés que te lleve a las que están en descuento?', [['🔥 Ver ofertas', verOfertas], ['Ahora no', () => {}]], 9000); return false }
  if (todas) list = [R(list)];
  P = { list, i: 0 }; visitar(); return true;
}
function visitar() {
  const it = P.list[P.i]; if (!it || !it.c.isConnected) return bajar();
  const r = it.c.getBoundingClientRect(); hide();
  go({ x: clamp(r.left + r.width * .5, CFG.mi, innerWidth - CFG.md), y: r.top + 2 }, { d: .7, arc: 55, done: () => { mode = 'perch'; P.t = 0; P.said = false } });
}
function perch(dt) {
  if (wantCart) return bajar();   // se abrió el carrito mientras saltaba: baja y va hacia él
  const it = P.list[P.i]; if (!it || !it.c.isConnected) return bajar();
  const r = it.c.getBoundingClientRect(), nb = navBottom();
  if (r.top < nb + H + 4 || r.top > innerHeight - 40) return bajar();
  pos.x = clamp(r.left + r.width * .5, CFG.mi, innerWidth - CFG.md); pos.y = r.top + 2; sub = 'stand'; P.t += dt;
  if (!P.said && P.t > .3) { P.said = true; promos++; SS('mm_n', promos); show(it.pct ? R(L.oferta)(it.pct, it.name) : R(L.peek)(it.name), [['Verlo', () => verProducto(it.id)]], 6500) }
  if (P.t > 7.5 && !bubUntil) { P.i++; P.i < P.list.length ? visitar() : bajar() }
}
function bajar() { hide(); u = clamp(pos.x, ...range('b')); P = null; fl = 'b'; go(edge('b', u), { d: .5, arc: 20, ease: 'in', done: () => land(false) }) }

/* Carrito abierto: se queda mirándolo, sin hablar */
let lastCart = false;
function cartMode() {
  const o = cartEl(); if (!o) return; const pw = o.offsetWidth;
  pos = { x: Math.min(pw + W / 2 + 14, innerWidth - W / 2 - 8), y: innerHeight - CFG.borde }; face = -1; sub = 'watch';
}
const cartX = () => Math.min((cartEl().offsetWidth || 0) + W / 2 + 14, innerWidth - W / 2 - 8);
function irAlCarrito() {   // camina hasta el costado del carrito
  wantCart = false; corre = false; u = pos.x; tgt = cartX(); sub = 'stand'; entering = false;
  if (Math.abs(tgt - u) < 3) { mode = 'cart'; return } toCart = true; mode = 'walk';
}
function onCart() {
  const open = cartOpen(); if (open === lastCart) return; lastCart = open;
  if (open) {
    hide(); const room = innerWidth - (cartEl().offsetWidth || 0) >= W + 30;
    if (!room) { m.classList.add('gone'); mode = 'cart'; P = null; J = null; fl = 'b'; return }
    m.classList.remove('gone'); wantCart = true;
    if (mode === 'idle' || mode === 'walk') irAlCarrito(); else if (mode === 'perch') bajar();
  } else {
    wantCart = false; toCart = false; m.classList.remove('gone');
    if (mode === 'cart' || mode === 'walk') { mode = 'idle'; sub = 'stand'; tm = 2; face = 1; u = clamp(pos.x, ...range('b')); entering = false }
    if (cartCount > 0) nextNudge = Date.now() + 90e3;
  }
}

/* ---------- Dibujo ---------- */
const rt = (a, x, y) => `rotate(${a} ${x} ${y})`;
function extras(dt) {   // clima, auriculares, enojo, correr
  grump = Math.max(0, grump - dt);
  const wx = WX || {}, musica = sub === 'music' && mode === 'idle', fan = sub === 'fan' && mode === 'idle', run = corre && mode === 'walk', calma = mode === 'idle' || mode === 'walk';
  g('um').style.display = wx.lluvia ? '' : 'none'; g('um2').style.display = wx.nube ? '' : 'none';
  g('sw').style.display = wx.calor ? '' : 'none'; g('heat').setAttribute('opacity', wx.calor ? .22 : 0);
  if (wx.calor) [1, 2].forEach(i => { const k = (T * .9 + i * .5) % 1, s = g('sw' + i); s.setAttribute('transform', `translate(0 ${k * 12})`); s.setAttribute('opacity', 1 - k) });
  g('hp').style.display = g('nt').style.display = musica ? '' : 'none';
  if (musica) [1, 2].forEach(i => { const k = (T * .7 + i * .5) % 1, n = g('n' + i); n.setAttribute('x', (i === 1 ? 62 : 8) + Math.sin(T * 3 + i) * 3); n.setAttribute('y', 18 - k * 26); n.setAttribute('opacity', 1 - k) });
  g('br').style.display = grump > 0 ? '' : 'none';
  if (run) { const s = Math.sin(T * 26) * 42; g('l1').setAttribute('transform', rt(s, 32, 74)); g('l2').setAttribute('transform', rt(-s, 48, 74)); g('a1').setAttribute('transform', rt(s, 18, 48)); g('a2').setAttribute('transform', rt(s, 62, 48)) }
  if (fan) g('a2').setAttribute('transform', rt(-(105 + Math.sin(T * 18) * 12), 62, 48));
  if (musica) { g('cl').style.display = ''; g('e1').style.display = g('e2').style.display = 'none' }
  if (grump > 0) { g('mo').setAttribute('d', 'M34 61H46'); g('mo').setAttribute('fill', 'none') }
  else if (musica) { g('mo').setAttribute('d', 'M33 58Q40 66 47 58'); g('mo').setAttribute('fill', 'none') }
  else if (wx.calor && calma && sub !== 'sleep' && stars <= 0 && happy <= 0) { g('mo').setAttribute('d', 'M34 58Q40 68 46 58Z'); g('mo').setAttribute('fill', '#7a2f00') }
}
function draw(dt) {
  const d = ((ROT[fl] + tripRot + (D ? clamp(D.vx * .06, -25, 25) : 0) - rot + 540) % 360) - 180; rot += d * Math.min(1, dt * 12);
  squash = Math.max(0, squash - dt * 1.4); stars = Math.max(0, stars - dt); happy = Math.max(0, happy - dt);
  const hop = happy > 0 ? Math.abs(Math.sin(T * 13)) * 9 : 0;
  const bob = sub === 'music' && mode === 'idle' ? Math.sin(T * 6) * 4 : 0, shake = grump > 0 ? Math.sin(T * 45) * 1.2 : 0;
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
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
  if (mode === 'idle') idle(dt); else if (mode === 'walk') walk(dt); else if (mode === 'jump') jump(dt); else if (mode === 'perch') perch(dt); else if (mode === 'cart') cartMode(); else if (mode === 'trip') tropiezo(dt);
  rockUpd(dt); draw(dt); requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */
function despertar() {   // lo despiertan de noche: se enoja un rato y los incentiva a comprar
  sub = 'stand'; tm = 7; happy = 0;
  if (!night()) return show(L.wake, null, 2500);
  grump = 6; show(R(cerrado() ? L.despCerrado : L.desp), [['🛒 Mi carrito', abrirCarrito], ['🔥 Ver ofertas', verOfertas]], 9000);
}
function menu() {
  const b = [['🛍️ Recomendame', recMenu], ['🔥 Ofertas', () => tour(true)]];
  b.push([silent ? '🔔 Hablar' : '🤫 Silencio', () => { silent = !silent; SS('mm_sil', silent ? '1' : '0'); show(silent ? 'Ok, me quedo calladito 🤫' : '¡Vuelvo a charlar! 🍋', null, 2500) }]);
  b.push(['👋 Chau', () => { LS('mm_off', Date.now() + 7 * 864e5); show('¡Chau! Vuelvo en unos días 👋', null, 2200); setTimeout(() => { host.remove(); window.__mmOn = false }, 2400) }]);
  show(R(L.poke), b, 12000);
}
m.addEventListener('pointerdown', e => { D = { sx: e.clientX, sy: e.clientY, moved: false, vx: 0, lx: e.clientX, id: e.pointerId }; m.setPointerCapture(e.pointerId); e.preventDefault() });
m.addEventListener('pointermove', e => {
  if (!D) return; D.vx = e.clientX - D.lx; D.lx = e.clientX;
  if (!D.moved && Math.hypot(e.clientX - D.sx, e.clientY - D.sy) > 8 && mode !== 'cart') { D.moved = true; mode = 'drag'; J = null; P = null; corre = false; trip = null; tripRot = 0; m.classList.add('dg'); hide() }
  if (D.moved) { pos.x = e.clientX; pos.y = e.clientY + H * .7 }
});
m.addEventListener('pointerup', e => {
  const d = D; D = null; m.classList.remove('dg'); pedirSensor(); if (!d) return;
  if (d.moved) { const f = fl; u = (f === 'b' || f === 't') ? pos.x : pos.y; const [a, b] = range(f); u = clamp(u, a, b); const t = edge(f, u), dist = Math.hypot(t.x - pos.x, t.y - pos.y); entering = false; go(t, { d: .25 + dist / 1600, ease: 'in', done: () => { land(true); contarTiro(dist) } }) }
  else { happy = .6; if (sub === 'sleep') despertar(); else if (bubUntil) hide(); else if (DESC && Date.now() - tStart > 60e3 && Math.random() < (DESC.alTocar ?? .15) && darCodigo()) { } else menu() }
});
const act = () => {
  const ina = Date.now() - lastAct; lastAct = Date.now();
  if (sub === 'sleep' && mode === 'idle' && !night()) { sub = 'stand'; tm = 1.5; if (!silent && !bubUntil) show(L.wake, null, 2500) }
  else if (ina > 60e3 && !silent && !bubUntil && mode !== 'cart' && Math.random() < .4) { happy = .8; show('¡Volviste! Te estaba esperando 🍋', null, 2400) }
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
  if (w !== want) { want = w; wantSince = Date.now() } else if (w !== fl && Date.now() - wantSince > 500 && Date.now() - lastFlip > 2000 && !reduce) flip(w);
}
function escucharSensor() { addEventListener('deviceorientation', onOri) }
function pedirSensor() {   // iPhone: el permiso se pide con el primer toque a Limón, sin menús
  if (pidio || sensor || typeof DeviceOrientationEvent === 'undefined' || typeof DeviceOrientationEvent.requestPermission !== 'function') return; pidio = true;
  try { DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') escucharSensor() }).catch(() => {}) } catch (e) {}
}
m.addEventListener('click', pedirSensor);
if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function') escucharSensor();

/* Reacciones a la tienda: producto agregado, carrito abierto */
function vigilarTienda() {
  const cc = $q('#cantCarrito'); cartCount = parseInt(cc && cc.textContent) || 0; cartSince = cartCount > 0 ? Date.now() : 0;
  if (cc) new MutationObserver(() => {
    const n = parseInt(cc.textContent) || 0, up = n > cartCount; cartCount = n; cartSince = n > 0 ? Date.now() : 0;
    if (up && Date.now() - lastAdd > 8000 && mode !== 'cart') { lastAdd = Date.now(); happy = 1.2; if (!silent && Math.random() < .5) show(R(cerrado() ? L.addCerrado : L.add), null, 2600) }
  }).observe(cc, { childList: true, characterData: true, subtree: true });
  const o = cartEl(); if (o) new MutationObserver(onCart).observe(o, { attributes: true, attributeFilter: ['class'] });
}

L.fav = ['¿En favoritos? ¿Y si mañana ya no está disponible? 😬', 'Guardarlo está bien… pero comprarlo es mejor 😏', 'Los favoritos son los primeros en agotarse 🍋', 'Ojo, lo que se deja para después a veces ya no vuelve 👀'];
L.favPocas = ['¡Quedan pocas unidades de ese! No lo dejes solo en favoritos 😱', '¡Está por agotarse! Si te gusta, no lo pienses tanto 🏃', 'Ese se termina pronto… ¿lo llevamos ahora? 🛒'];
document.addEventListener('click', e => {
  const bf = e.target.closest && e.target.closest('.btn-favorito-card'); if (!bf) return;
  setTimeout(() => {
    if (silent || cartOpen() || !/❤/.test(bf.textContent) || Date.now() - lastFav < 15000) return;   // solo al agregar, no al quitar
    lastFav = Date.now(); const c = bf.closest('.tarjetas2') || bf.closest('.card-group') || document, poco = !!c.querySelector('.badge-ultimas-unidades:not(.d-none)');
    happy = .8; show(R(poco ? L.favPocas : L.fav), null, 5200);
  }, 60);
});

/* ---------- Planificador (cada segundo) ---------- */
function sched() {
  const now = Date.now(); if (document.hidden || mode === 'cart' || mode === 'drag') return;
  if (DESC && DESC.activo === true && mode === 'idle' && sub !== 'sleep' && !silent && !bubUntil && now - lastSay > 8000 && !cartOpen()) {
    const min = (now - tStart) / 6e4, ina = (now - lastAct) / 1e3, car = cartSince ? (now - cartSince) / 6e4 : 0;
    if (((car >= (DESC.minutosCarritoParado ?? 3) && ina >= 15) || (min >= (DESC.minutosSinComprar ?? 5) && ina >= (DESC.inactivoSeg ?? 40))) && darCodigo()) return;
  }
  if (mode === 'idle' && sub !== 'sleep') {
    if (canSpeak() && now - lastScroll > 1500) {
      if (now >= nextTour) { if (tour(false)) { nextTour = now + gap(35, 60); return } nextTour = now + 12e3 }
      if (now >= nextPeek) { if (tour(false, true)) { nextPeek = now + gap(100, 170); return } nextPeek = now + 15e3 }
      if (now >= nextRec) { nextRec = now + gap(45, 80); recomendar(); return }
      if (cerrado() && now >= nextCerrado && cerrados < 3) { nextCerrado = now + gap(90, 150); cerrados++; promo(R(L.cerrado), [['🛒 Mi carrito', abrirCarrito]]); return }
      if (WX && !SS('mm_wxd') && now - tStart > 15e3) { const t = climaFrase(); if (t) { SS('mm_wxd', '1'); promo(t); return } }
      if (now >= nextQuip) { nextQuip = now + gap(40, 70); promo(R(L.quip)); return }
      if (now >= nextReto) { nextReto = now + gap(180, 300); const c = retoCfg(); if (c && (+SS('mm_ri') || 0) < 2) { SS('mm_ri', (+SS('mm_ri') || 0) + 1); promo(fill(R(c.invitar && c.invitar.length ? c.invitar : L.retoInv), { veces: c.veces || 10 })); return } }
      if (cartCount > 0 && !nudged && now >= nextNudge && !cartOpen()) { nudged = true; promo(R(L.nudge), [['Ver carrito', () => { const b = $q('#listaInteres'); b && b.click() }]]) }
    }
  }
}

/* ---------- Arranque: espera a que termine la pantalla de inicio de la tienda ---------- */
function listo() {
  const f = document.getElementById('fondo'); if (!f) return true;
  const cs = getComputedStyle(f); return cs.display === 'none' || parseInt(cs.zIndex) < 0;   // el logo de inicio ya pasó al fondo
}
function iniciar() {
  document.body.appendChild(host); vigilarTienda(); cargar(); if (CFG.clima !== false) clima();
  nextTour = Date.now() + 12e3 * CFG.ritmo; nextRec = Date.now() + 30e3 * CFG.ritmo; nextQuip = Date.now() + 22e3 * CFG.ritmo; nextPeek = Date.now() + 70e3 * CFG.ritmo; nextReto = Date.now() + 100e3 * CFG.ritmo;
  pos = edge('b', -40); tgt = CFG.mi + 70; mode = 'walk'; last = performance.now(); requestAnimationFrame(frame); setInterval(sched, 1000);
  if (SS('mm_hi') !== '1' && !silent) { SS('mm_hi', '1'); setTimeout(() => { if (mode !== 'cart') show(cerrado() ? R(L.cerrado) : R(L.hi), [['🛍️ Recomendame', recMenu], ['🔥 Ofertas', () => tour(true)]], 9000) }, 1800) }
}
let tries = 0;
(function esperar() {
  if (window.mensajeActivo === true) return setTimeout(esperar, 500);   // hay un aviso importante en pantalla: espera a que lo cierren
  if (listo() || ++tries > 16) setTimeout(iniciar, 300); else setTimeout(esperar, 250);
})();
window.__mm = { show, tour, recomendar, despertar, piedra: evPiedra, correr: evCorrer, musica: evMusica, setWX: w => { WX = w }, noche: v => { nightOv = v }, darCodigo, verOfertas, tiro: contarTiro, last: () => lastRec, flip, state: () => ({ fl, mode, sub, pos, promos, sensor, tgt, toCart, WX, grump, corre, rock: !!rock }) };
})();
