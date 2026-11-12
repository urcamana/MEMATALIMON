/* Limón 🍋 — mascota vendedora para la tienda. */
(() => {
'use strict';
const CFG = { json: 'articulos.json', items: 'items_limon.json', obsequios: 'obsequios/', desc: 'desc_limon.json', W: 60, H: 72, mi: 64, md: 84, borde: 4, maxPromos: 20, ritmo: 1, lat: -26.4, lon: -54.63, calor: 30, frio: 12, viento: 30, modelos: 'modelos/' };   // lat/lon: ubicación del local (para el clima). calor: grados a partir de los que se acalora   // ritmo: 1 = normal, 0.5 = más charlatán, 2 = más callado
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
  hi: ['¡Hola! Soy Limón 🍋 Tocame si querés ver ofertas o que te recomiende algo.', '¡Bienvenido a la tienda! Soy Limón 🍋 Si NO necesitás ayuda, tocame 😝.', '¡Hola! Limón al servicio 🍋 ¿Te muestro las ofertas?'],
  oferta: [(p, n) => `¿Este te sirve? ¡Comprálo, está en oferta! ${p} OFF 🍋`, (p, n) => `Psst… ${n} tiene ${p} de descuento. ¡No te lo pierdas!`, (p, n) => `¡Ofertón! ${n}, ${p} OFF. Yo en tu lugar lo llevo 😉`],
  rec: [(n, p) => `No te distraigas conmigo 😅 ¿Ya viste ${n}? Está a ${p}.`, (n, p) => `¡Ojo con ${n}! ${p} y es genial 🍋`, (n, p) => `¿Buscás algo? Mirá ${n}: ${p}.`],
  recOf: [(n, p, d) => `¡${n} está en oferta! ${d}% OFF, ahora ${p} 🔥`],
  quip: ['🍋 Si la vida te da limones… ¡mirá las ofertas!', '¿Buscás algo en particular? Probá el buscador de arriba 🔎', 'Estoy de turno vigilando las ofertas 👀', '¿Sabías que podés mandar tu carrito por WhatsApp? Es re fácil 📲'],
  nudge: ['Tu carrito te está esperando 🛒 ¿Lo terminamos?', '¿Te falta algo o ya cerramos la compra? 🍋'],
  add: ['¡Buena elección! 🍋', 'Menos mal que lo agregaste, si no lo elegías perdias la oportunidad', '¡Eso! Al carrito 🛒', '¡Qué buen ojo!', '¡Uh, ese es de los buenos!'],
  poke: ['¡Cosquillas! 🤭', 'Ojo con voltear tu pantalla, ¡yo soy el patrón!😂', 'Cobro por cada tocada, aca nadie trabaja gratis... 😆', 'Soy muy ocupado, ¿sabés? 😎', 'Hola, hola, soy el jefe... 😎'],
  fall: ['¡Aaah! ¡Avisá antes de dar vuelta el celu! 😵', 'Uf… me mareé ⭐', 'Me parece que esto es algo personal 😒', 'Uy, todo gira... 😵‍💫🥴', '¡Cuidado, que soy frágil! 🍋'],
  peek: [() => '¿Este? 👀', () => '¿Qué tal este? 🍋', n => `Mmm… ¿y ${n}? 😏`, () => 'Este tiene buena pinta, ¿no?'],
  retoInv: ['Si me agarrás y me tirás desde lo alto {veces} veces, te doy un código de descuento 😈', 'Reto: revoleame por tu pantalla {veces} veces y te regalo un descuento 🍋', '¿Te animás? Agarrame y tirame desde arriba {veces} veces… y te doy un código 🎁'],
  retoProg: ['¡Van {n} de {veces}! Seguí, que me estoy mareando 😵', '{n} de {veces}… ¡qué brazo! 💪', '¡{n} de {veces}! No pares ahora 😈'],
  retoPremio: ['¡Está bien, ganaste! 🏆 Tomá {descuento} de descuento con la clave: {clave}', '¡Me rindo! 😵 Tu premio: {descuento} de descuento con la clave: {clave}'],
  desp: ['No me pagan horas extras… al menos haceme un pedido 😤', 'Ya que me despertaste, sumá cosas al carrito 🛒', '¡Eh! Estaba durmiendo… Si me despertás, comprá algo 😠', 'Tenés suerte de que soy simpático… ¿qué vas a llevar?', 'Me despertaste. Ahora me debés un pedido 😤🍋'],
  despCerrado: ['Estamos cerrados y encima me despertás 😤 Dejá tu pedido y mis empleados lo ven apenas abran', '¿A esta hora? Hasta los jefes dormimos… Dejá tu pedido y mañana te atienden 😴', 'Soy el jefe y estoy durmiendo. Dejá tu pedido, que mis empleados se encargan 😤'],
  cerrado: ['Ahora estamos cerrados, pero dejanos tu pedido que mis empleados te atenderán pronto.', 'Yo soy el jefe, pero estoy de paso… 🍋 podes seguir comprando...', 'Estamos cerrados, pero mis empleados ven los pedidos apenas abren. ¡Yo soy el jefe, ojo! 😎', 'Cerrado por ahora. Armá tu carrito y mis empleados se encargan cuando vuelvan 🛒', 'Mis empleados están descansando (yo no, soy el jefe 😤). Dejá tu pedido y te atienden pronto.'],
  addCerrado: ['¡Buena elección! Mis empleados lo preparan apenas abramos 🍋', '¡Eso! Dejá el pedido y ellos se encargan cuando vuelvan 🛒'],
  trip: ['Esto me trajo recuerdos de aquel día que me caí del árbol 🌳🍋', '¿Quién tiró esa piedra? ¡Fue a propósito! 😤', 'Auch… eso dolió más que un exprimidor 🍋'],
  corrio: ['¡Uff! Si me hubiera chocado a esa velocidad me hacía limonada 🍋💨', '¡Uf! Corrí tan rápido que casi me exprimo 😅', '¡Qué carrera! Nuevo récord personal 🏅'],
  musica: ['¡Qué buen tema! 🎧 Por cierto, acá vendemos auriculares re buenos…', '¡Qué buen tema! 🎶 Acá tenemos auriculares geniales 😉'],
  wx: {
    frio: ['¡Brrr! 🥶 Con {T}° hasta los limones nos congelamos', 'Hace {T}°… me puse el gorro y la bufanda 🧣', '¡Qué frío! ({T}°) Ideal para quedarse en casa eligiendo cositas 🍋'],
    tormenta: ['¡Hay tormenta! ⚡ Mejor comprar desde casa', 'Se viene tormenta… ¡qué miedo! 😱 Yo me quedo acá, calentito'],
    viento: ['¡Qué viento! 💨 Casi se me vuela la hojita'],
    calor: ['¡Qué calor! 🥵 Con {T}° hasta un limón se exprime solo', 'Con {T}° hasta los limones sudamos 🥵', '¡{T}° afuera! Me quedo en la sombra de tu pantalla 😎'],
    lluvia: ['¡Está lloviendo! ☔ Buen momento para comprar sin mojarte', 'Llueve… yo ya saqué el paraguas ☔ ¿Y tu pedido?', '¡Día de lluvia! Ideal para elegir cositas desde casa 🍋', 'Se anuncian lluvias… ¿ahí ya comenzó? ☔ Yo ya abrí el paraguas'],
    nube: ['Está nublado… saqué el paraguas por las dudas ☂️ ¡Pero no llueve!', 'Nublado… abro el paraguas, miro arriba… ¡nada! Lo cierro ☂️', 'Se viene nublado, saqué el paraguas… ¿llueve? Nope, lo guardo 🍋']
  },
  primera: '¡Hola! Soy Limón 🍋 ¿Primera vez por acá? Te cuento cómo comprar en 3 pasos.',
  cierre: ['Cerramos en {min} minutos ⏰ Mandá tu pedido ahora para que lo atiendan hoy', 'Ojo que cerramos en {min} minutos… ¡mandá tu pedido ahora y lo atienden hoy! 🍋', 'Quedan {min} minutos de atención ⏰ ¡Armá tu carrito y envialo por WhatsApp!'],
  cierreCod: ['Cerramos en {min} minutos ⏰ Mandá tu pedido ahora y usá la clave {clave} para {descuento} de descuento', 'Últimos {min} minutos ⏰ Con la clave {clave} tenés {descuento} de descuento si mandás tu pedido ya'],
  fechaHoy: ['¡Feliz {t}! 🎉', '¡Hoy es {t}! 🎁 ¿Ya tenés el regalo?'],
  fechaAyer: ['Ayer fue {t} 🎁 ¡Todavía estás a tiempo de dar un regalo atrasado!'],
  fechaManana: ['¡Mañana es {t}! 🎁 ¡Todavía llegás con el regalo!'],
  fechaPronto: ['¡{t} en {n} días! 🎁 Todavía llegás con el regalo', 'Faltan {n} días: {t} 🎁 ¿Ya elegiste el regalo?'],
  fechaLejos: ['Se acerca: {t} 🎁 ¿Ya pensaste el regalo?', '¡Ya casi es {t}! 🎁 Mirá estas ideas para regalar'],
  hiManana: ['¡Buen día! ☀️ Soy Limón 🍋 Mate en mano, ¿te ayudo a elegir algo?', '¡Buen día! Soy Limón 🍋 Tocame si querés ver las ofertas del día.'],
  trueno: ['¡¿Qué fue eso?! ⚡😱', '¡Qué trueno! ⚡ Me asusté un poquito…'],
  bat: ['Te queda poca batería 🔋 ({n}%) ¡Ojo!', 'Tu celu está al {n}% 🔋 ¡Cuidalo!'],
  bat2: ['¡Solo {n}% de batería! 🪫 Buscá un enchufe pronto'],
  batBroma: ['Tu batería anda en {n}%… igual que mi paciencia 😅', '{n}% de batería… ¡y yo que pensaba que me cansaba rápido! 🔋', 'Con {n}% de batería hasta yo me pongo nervioso 😬'],
  favOferta: ['¡Ese que guardaste está en oferta! 🔥 {n}: {d}% OFF', '¡Buenas noticias! {n} (de tus favoritos) tiene {d}% de descuento 🍋'],
  favPocasAviso: ['Quedan pocas unidades de uno de tus favoritos: {n} ⏳', '¡Ojo! {n} se está por agotar y lo tenés en favoritos 😱'],
  carritoAviso: ['¿Lo terminamos? 🛒 Tenés {n} producto{s} esperando', 'Tu pedido está casi listo 🛍️ ¿Lo enviamos por WhatsApp?'],
  wake: ['¡Ah! Estaba soñando con ofertas 💤', 'Productos a pedido: pedidos.mematalimon.com.ar', '¡Ah! ya te atiendo.. solo deja que me despabilo 🥱💤', '¿Alguien puede pensar en Limón?🥱', '¡¡Soñé que habia malas ofertas!! 🥴💤'],
};

/* ---------- Estructura (Shadow DOM: el CSS de la tienda no lo toca) ---------- */
const host = document.createElement('div');
host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1046';
const sh = host.attachShadow({ mode: 'open' });
sh.innerHTML = `<style>
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
#m{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 100%;pointer-events:auto;touch-action:none;cursor:grab;will-change:transform;transition:opacity .4s}
#comp{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:50% 100%;pointer-events:none;display:none;will-change:transform}
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
<div id="comp"><svg viewBox="0 0 80 96"><g id="compg"></g></svg></div><div id="m"><svg viewBox="0 0 80 96"><ellipse cx="40" cy="92" rx="20" ry="4" fill="#0003"/>
<g id="bd"><g id="fx"><g id="s_espalda"></g>
<g id="l1"><path d="M32 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="33" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<g id="l2"><path d="M48 74V85" stroke="#7a5d00" stroke-width="5" stroke-linecap="round"/><ellipse cx="47" cy="88" rx="6.5" ry="3.4" fill="#6b4ca3"/></g>
<ellipse cx="40" cy="50" rx="27" ry="29" fill="#ffe14a" stroke="#c99a00" stroke-width="3"/>
<ellipse id="heat" cx="40" cy="50" rx="26" ry="28" fill="#ff5a36" opacity="0"/>
<g id="hp" style="display:none"><path d="M16 46Q40 -4 64 46" fill="none" stroke="#3a2a66" stroke-width="4" stroke-linecap="round"/><ellipse cx="15" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/><ellipse cx="65" cy="49" rx="5.5" ry="8" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2"/></g>
<path id="leaf" d="M40 22Q42 8 58 8Q56 22 40 22Z" fill="#5bbf4a" stroke="#3c8c32" stroke-width="2" stroke-linejoin="round"/>
<g id="um" style="display:none"><path d="M6 0Q38 -32 70 0Q60 -6 52 0Q44 -6 38 0Q32 -6 24 0Q16 -6 6 0Z" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="2" stroke-linejoin="round"/><path d="M38 0 L22 54" stroke="#4a2b8a" stroke-width="2.5" stroke-linecap="round"/><circle cx="22" cy="54" r="2.5" fill="#4a2b8a"/></g>
<g id="a1"><g id="s_mano_i"></g><ellipse cx="14" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/><g id="um2" style="display:none"><path d="M11 52 L11 78" stroke="#4a2b8a" stroke-width="2.2" stroke-linecap="round"/><path d="M11 52 Q6 48 8 42 Q11 38 14 42 Q16 48 11 52" fill="#7b4fc9" stroke="#4a2b8a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11" cy="78" r="1.8" fill="#4a2b8a"/></g></g>
<g id="a2"><g id="mate" style="display:none"><path d="M61 42Q59 58 66 58Q73 58 71 42Z" fill="#a9743a" stroke="#6b4420" stroke-width="1.6"/><path d="M60 42H72" stroke="#6b4420" stroke-width="2"/><path d="M68 42L74 26" stroke="#c0c0c0" stroke-width="2" stroke-linecap="round"/><circle cx="75" cy="25" r="1.8" fill="#c0c0c0"/></g>
<g id="jer" style="display:none"><rect x="63" y="28" width="6" height="22" rx="2" fill="#e8f4ff" stroke="#6a8fb0" stroke-width="1.5"/><path d="M66 28V16" stroke="#9aa" stroke-width="1.6" stroke-linecap="round"/><rect x="60" y="48" width="12" height="3" rx="1" fill="#6a8fb0"/><rect x="64" y="52" width="4" height="5" fill="#6a8fb0"/><path d="M63 36H69M63 40H69" stroke="#6a8fb0" stroke-width="1"/></g>
<g id="copa" style="display:none"><path d="M60 30H72L69.5 44Q66 47 62.5 44Z" fill="#ffe9a8" stroke="#c9a227" stroke-width="1.6"/><path d="M66 46V56M61 56H71" stroke="#c9a227" stroke-width="2" stroke-linecap="round"/><circle cx="64" cy="36" r="1" fill="#fff"/><circle cx="68" cy="39" r="1" fill="#fff"/></g>
<g id="corn" style="display:none"><path d="M62 52L90 34L94 46Z" fill="#74acdf" stroke="#3d7fb8" stroke-width="1.6" stroke-linejoin="round"/><path d="M74 44L78 38M82 40L86 34" stroke="#fff" stroke-width="3"/><circle cx="62" cy="54" r="4" fill="#f6b40e"/></g>
<g id="cartel" style="display:none"><path d="M64 24V54" stroke="#8d6e63" stroke-width="2.2" stroke-linecap="round"/><rect x="40" y="8" width="48" height="17" rx="2.5" fill="#e53935" stroke="#b71c1c" stroke-width="1.6"/><text class="tx" data-cx="64" x="64" y="20.2" font-size="9.5" font-weight="700" fill="#fff" text-anchor="middle" font-family="system-ui,sans-serif">OFERTAS</text></g>
<g id="s_mano_d"></g><ellipse cx="66" cy="55" rx="5" ry="8" fill="#ffe14a" stroke="#c99a00" stroke-width="2.5"/></g>
<ellipse cx="24" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/><ellipse cx="56" cy="57" rx="4.5" ry="3" fill="#ff9aa8" opacity=".6"/>
<g id="e1"><ellipse cx="32" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p1" cx="32" cy="47" r="3" fill="#222"/></g>
<g id="e2"><ellipse cx="48" cy="46" rx="5.6" ry="6.4" fill="#fff" stroke="#333" stroke-width="1"/><circle id="p2" cx="48" cy="47" r="3" fill="#222"/></g>
<g id="cl" style="display:none" fill="none" stroke="#5a3d00" stroke-width="2.2" stroke-linecap="round"><path d="M27 46Q32 50 37 46"/><path d="M43 46Q48 50 53 46"/></g>
<g id="hat1" style="display:none"><path d="M31 21L42 -9L52 21Z" fill="#ff5fa2" stroke="#c2336f" stroke-width="2" stroke-linejoin="round"/><circle cx="42" cy="-10" r="3.5" fill="#ffe14a"/><path d="M34 15H50M37 8H48" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>
<g id="hat2" style="display:none"><path d="M27 21Q30 -8 54 -2Q44 6 56 12L58 21Z" fill="#d62828" stroke="#a31515" stroke-width="2" stroke-linejoin="round"/><rect x="24" y="17" width="36" height="8" rx="4" fill="#fff" stroke="#ddd"/><circle cx="55" cy="-1" r="4.5" fill="#fff" stroke="#ddd"/></g>
<g id="hat3" style="display:none"><path d="M24 24Q22 -6 41 -6Q60 -6 58 24Z" fill="#4a7fd1" stroke="#2f55a0" stroke-width="2"/><rect x="21" y="18" width="40" height="9" rx="3" fill="#2f55a0"/><circle cx="41" cy="-8" r="5" fill="#fff" stroke="#ddd"/></g>
<g id="hat4" style="display:none"><path d="M26 22Q40 2 56 22Z" fill="#ffb02e" stroke="#c97b00" stroke-width="2" stroke-linejoin="round"/><path d="M50 21Q68 19 72 26Q60 28 48 24Z" fill="#ffb02e" stroke="#c97b00" stroke-width="2" stroke-linejoin="round"/></g>
<g id="hat5" style="display:none"><path d="M26 22Q30 -4 54 2Q62 6 66 18Q62 14 58 22Z" fill="#6b4ca3" stroke="#3a2a66" stroke-width="2" stroke-linejoin="round"/><rect x="24" y="18" width="36" height="7" rx="3" fill="#fff" stroke="#ddd"/><circle cx="66" cy="19" r="4.5" fill="#fff" stroke="#ddd"/></g>
<g id="hat6" style="display:none"><path d="M20 19L40 10L60 19L40 28Z" fill="#222" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/><path d="M31 23V28Q40 33 49 28V23" fill="#333"/><path d="M58 20V31" stroke="#ffd34a" stroke-width="2"/><circle cx="58" cy="32" r="2.8" fill="#ffd34a"/></g>
<g id="hat7" style="display:none"><path d="M27 22Q20 10 30 6Q34 -4 44 2Q56 -2 55 8Q62 14 54 22Z" fill="#fff" stroke="#cfcfcf" stroke-width="1.8"/><rect x="28" y="18" width="26" height="6" rx="2" fill="#fff" stroke="#cfcfcf" stroke-width="1.5"/></g>
<g id="hat8" style="display:none"><path d="M24 22Q26 2 41 2Q56 2 58 22Z" fill="#ffc400" stroke="#c28f00" stroke-width="2"/><rect x="21" y="19" width="40" height="5" rx="2" fill="#ffc400" stroke="#c28f00" stroke-width="1.5"/><rect x="38" y="3" width="6" height="16" fill="#ffd84a"/></g>
<g id="hat9" style="display:none"><path d="M41 7Q39 0 45 -4" stroke="#6b4a1e" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M44 -2Q54 -8 57 0Q50 4 44 -2Z" fill="#5bbf4a" stroke="#3c8c32" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="29" cy="15" rx="9" ry="11" fill="#ef6c00" stroke="#a84c00" stroke-width="1.8"/><ellipse cx="53" cy="15" rx="9" ry="11" fill="#ef6c00" stroke="#a84c00" stroke-width="1.8"/><ellipse cx="41" cy="14" rx="11" ry="12.5" fill="#ff9a2e" stroke="#a84c00" stroke-width="1.8"/><path d="M35.5 9.5L39 9.5L37.2 14Z M43 9.5L46.5 9.5L44.7 14Z" fill="#3b1e00"/><path d="M34 18.5L36.5 21L39 18.5L41 21L43 18.5L45.5 21L48 18.5" fill="none" stroke="#3b1e00" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></g>
<g id="hat10" style="display:none"><path d="M31 21L42 -9L52 21Z" fill="#74acdf" stroke="#3d7fb8" stroke-width="2" stroke-linejoin="round"/><path d="M35 14H49M38 5H46" stroke="#fff" stroke-width="3"/><circle cx="42" cy="-10" r="3.6" fill="#f6b40e" stroke="#c78f00"/></g>
<g id="gl" style="display:none"><path d="M24 44H56" stroke="#111" stroke-width="2.4"/><rect x="23" y="41" width="16" height="11" rx="4.5" fill="#15152a"/><rect x="41" y="41" width="16" height="11" rx="4.5" fill="#15152a"/><path d="M26 44L30 43M44 44L48 43" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/></g>
<g id="gl2" style="display:none" fill="none" stroke="#333" stroke-width="2"><circle cx="32" cy="46" r="8.6"/><circle cx="48" cy="46" r="8.6"/><path d="M40.6 45Q40 43.5 39.4 45"/><path d="M23.4 46L17 43M56.6 46L63 43"/></g>
<g id="scarf" style="display:none"><path d="M14 66Q40 80 66 66L67 75Q40 90 13 75Z" fill="#e8574c" stroke="#b03a30" stroke-width="1.8" stroke-linejoin="round"/><path d="M52 78L58 96L48 94Z" fill="#e8574c" stroke="#b03a30" stroke-width="1.8" stroke-linejoin="round"/><path d="M20 70Q40 82 60 70" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/></g>
<g id="tie" style="display:none"><path d="M36 66H44L42 70H38Z" fill="#a93226"/><path d="M38 70H42L45 86L40 90L35 86Z" fill="#c0392b" stroke="#8e2a20" stroke-width="1.5" stroke-linejoin="round"/></g>
<g id="steto" style="display:none" fill="none" stroke="#444" stroke-width="2.2" stroke-linecap="round"><path d="M28 62Q22 82 36 86Q50 86 50 70V64"/><path d="M52 62V68M28 62V66"/><circle cx="36" cy="86" r="3.6" fill="#cfd8dc"/></g>
<g id="esc" style="display:none"><path d="M49 70L45 84M55 70L59 84" stroke="#74acdf" stroke-width="3" stroke-linecap="round"/><circle cx="52" cy="67" r="7" fill="#fff" stroke="#74acdf" stroke-width="3"/><circle cx="52" cy="67" r="3" fill="#74acdf"/></g>
<g id="hearts" style="display:none" fill="#ff4d79"><text id="h1" font-size="11">❤</text><text id="h2" font-size="9">❤</text><text id="h3" font-size="12">❤</text></g>
<path id="mo" d="M33 58Q40 65 47 58" stroke="#8a4b00" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<g id="br" style="display:none" stroke="#5a3d00" stroke-width="2.8" stroke-linecap="round"><path d="M24 37L38 42"/><path d="M56 37L42 42"/></g>
<g id="sw" style="display:none" fill="#6ec6ff" stroke="#2b8fd6" stroke-width=".8"><path id="sw1" d="M62 34q4 6 0 9q-4-3 0-9z"/><path id="sw2" d="M14 38q4 6 0 9q-4-3 0-9z"/></g>
<g id="s_cuerpo"></g><g id="s_cuello"></g><g id="s_cara"></g><g id="s_cabeza"></g>
</g>
<g id="s_disfraz"></g>
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
let ITEMS = null, DESC = null, ALL = new Map(), tStart = Date.now(), cartSince = 0, lastRec = null, nextPeek = Date.now() + 70e3, nextReto = Date.now() + 100e3, wantCart = false, toCart = false, lastFav = 0, pidio = false, WX = null, umAnim = null, grump = 0, tripRot = 0, corre = false, rock = null, trip = null, lastEvt = Date.now() - 45e3, nextCerrado = Date.now() + 40e3, cerrados = 0, nightOv = null;
const ROT = { b: 0, t: 180, l: 90, r: -90 };
const night = () => nightOv !== null ? nightOv : (h => h >= 23 || h < 7)(new Date().getHours());
let cerradoOv = null;
const cerrado = () => cerradoOv !== null ? cerradoOv : /cerrado/i.test((document.getElementById('badgeAbierto') || {}).textContent || '');   // lee el cartel «Abierto/Cerrado ahora» de tu página
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
const canSpeak = () => !silent && !tipeando && promos < CFG.maxPromos && Date.now() - lastSay > 16000 * CFG.ritmo && !bubUntil && !cartOpen() && !document.hidden;
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
      const it = d.map(p => { let ds = num(p.Descuento); if (ds > 0 && ds < 1) ds *= 100; ds = Math.round(ds); return { id: p['Artículo'], n: String(p['Descripción'] || '').trim(), c: String(p.Categoria || ''), d: ds, pr: num(p.Venta) * (num(p.DOLAR) || 1) * (1 - ds / 100), inv: num(p.Inventario), st: num(p.Inventario) >= 1 && num(p.Venta) > 0 } });
      ALL = new Map(it.map(p => [p.id, p])); ART = it.filter(p => p.st && p.n);
    } catch (e) { ART = [] }
    ITEMS = await leer(CFG.items) || {}; DESC = await leer(CFG.desc); await cargarEventos(); calcularFecha();
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
L.recCat = [(c, n, p) => `Vi que te interesan los productos de ${c}. Quizás te guste ${n}: ${p} 🍋`, (c, n, p) => `Por lo que veo, lo tuyo es ${c} 😏 Mirá ${n}, está a ${p}.`, (c, n, p) => `Como te gusta la categoría ${c}, te muestro ${n}: ${p}.`];
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
function codigoElegible(motivo) {
  const D = DESC; if (!D || D.activo !== true) return null;
  if ((+SS('mm_dn') || 0) >= (D.maxPorVisita ?? 1)) return null;
  if (!+SS('mm_dn') && Date.now() - (+LS('mm_dto') || 0) < (D.pausaDias ?? 3) * 864e5) return null;
  const hoy = new Date().toISOString().slice(0, 10);
  const base = (D.codigos || []).filter(c => c.activo !== false && c.uso !== 'reto' && c.clave && num(c.descuento) > 0 && (!c.vence || String(c.vence) >= hoy));
  const propios = base.filter(c => c.uso === motivo), ok = propios.length ? propios : motivo === 'cierre' ? [] : base.filter(c => !c.uso || c.uso === 'general');   // 'cierre' solo usa un código marcado para eso
  return ok.length ? R(ok.flatMap(c => Array(Math.max(1, (c.peso | 0) || 1)).fill(c))) : null;
}
function darCodigo(motivo = 'indecision', min) {
  const c = codigoElegible(motivo); if (!c) return false;
  const cier = motivo === 'cierre', fr = cier ? (DESC.frasesCierre && DESC.frasesCierre.length ? DESC.frasesCierre : L.cierreCod) : (DESC.frases && DESC.frases.length ? DESC.frases : L.dto), mn = num(c.minimo) > 0 ? ` (en compras desde ${money(num(c.minimo))})` : '';
  const t = fill(R(fr), { descuento: num(c.descuento) + '%', clave: c.clave, min }) + mn + (DESC.aviso ? ' ' + DESC.aviso : '');
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
function irCategoria(nombre, luego, texto) {
  const b = $a('.categoria-btn').find(x => x.textContent.trim().toLowerCase() === nombre.toLowerCase()), c = $q('#contenedorCatalogo');
  if (!b) return show(`Buscá «${nombre}» entre las categorías 😉`, null, 4000);
  b.click();
  if (texto) setTimeout(() => { const f = $q('#formulario'); if (f) { f.value = texto; f.dispatchEvent(new Event('input', { bubbles: true })) } }, 350);
  setTimeout(() => { if (c) scrollTo({ top: c.getBoundingClientRect().top + scrollY - navBottom() - 10, behavior: reduce ? 'auto' : 'smooth' }); if (luego) setTimeout(luego, 1500) }, texto ? 900 : 400);
}
function verOfertas() { irCategoria('CON DESCUENTOS', () => tour(true)) }
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
const climaFrase = () => { const k = WX && (WX.tormenta ? 'tormenta' : WX.lluvia ? 'lluvia' : WX.calor ? 'calor' : WX.frio ? 'frio' : WX.nube ? 'nube' : WX.viento ? 'viento' : null); return k && fill(R(L.wx[k]), { T: Math.round(WX.T) }) };
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
  animarModelos(); vestirAplicar();
  g('um2').style.display = holdClosed ? '' : 'none';
  g('sw').style.display = wx.calor ? '' : 'none'; g('heat').setAttribute('opacity', wx.calor ? .22 : 0);
  if (wx.calor) [1, 2].forEach(i => { const k = (T * .9 + i * .5) % 1, s = g('sw' + i); s.setAttribute('transform', `translate(0 ${k * 12})`); s.setAttribute('opacity', 1 - k) });
  if (musica) [1, 2].forEach(i => { const k = (T * .7 + i * .5) % 1, n = g('n' + i); n.setAttribute('x', (i === 1 ? 62 : 8) + Math.sin(T * 3 + i) * 3); n.setAttribute('y', 18 - k * 26); n.setAttribute('opacity', 1 - k) });
  g('br').style.display = grump > 0 ? '' : 'none';
  const lf = g('leaf'); if (lf) lf.setAttribute('transform', rt(wx.viento ? Math.sin(T * 9) * 14 : Math.sin(T * 1.6) * 2, 40, 22));
  if (wx.tormenta && mode === 'idle' && sub !== 'sleep' && T > nextSusto) { nextSusto = T + rnd(25, 45); happy = Math.max(happy, .7); if (!silent && !tipeando && !bubUntil && Math.random() < .5) show(R(L.trueno), null, 2600) }
  if (visSig.includes('hearts')) [1, 2, 3].forEach(i => { const k = (T * .5 + i * .33) % 1, e = g('h' + i); e.setAttribute('x', [4, 62, 33][i - 1] + Math.sin(T * 2 + i) * 3); e.setAttribute('y', 34 - k * 40); e.setAttribute('opacity', 1 - k) });
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
  const lieOn = !!MOD.lie && mode === 'idle' && sub === 'sit'; MOD.lieK = (MOD.lieK || 0) + ((lieOn ? 1 : 0) - (MOD.lieK || 0)) * Math.min(1, dt * 4);
  const lk = MOD.lie ? MOD.lieK : 0, lieA = lk * (MOD.lie ? MOD.lie.grados : 0) * face;   // se recuesta de costado sobre el objeto
  const d = ((ROT[fl] + tripRot + lieA + (D ? clamp(D.vx * .06, -25, 25) : 0) - rot + 540) % 360) - 180; rot += d * Math.min(1, dt * 12);
  squash = Math.max(0, squash - dt * 1.4); stars = Math.max(0, stars - dt); happy = Math.max(0, happy - dt);
  const hop = happy > 0 ? Math.abs(Math.sin(T * 13)) * 9 : 0;
  const bob = sub === 'music' && mode === 'idle' ? Math.sin(T * 6) * 4 : 0, shake = grump > 0 ? Math.sin(T * 45) * 1.2 : (WX && WX.frio && mode === 'idle' && sub !== 'sleep') ? Math.sin(T * 38) * .9 : 0;
  m.style.transform = `translate(${pos.x - W / 2 + lk * (MOD.lie ? MOD.lie.dx : 0) * face}px,${pos.y - H - hop + lk * (MOD.lie ? MOD.lie.dy : 0)}px) rotate(${rot}deg)`;
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
  drawComp(dt); extras(dt); placeBub();
}
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; T += dt;
  if (mode === 'idle') idle(dt); else if (mode === 'walk') walk(dt); else if (mode === 'jump') jump(dt); else if (mode === 'perch') perch(dt); else if (mode === 'cart') cartMode(); else if (mode === 'trip') tropiezo(dt);
  rockUpd(dt); draw(dt); requestAnimationFrame(frame);
}

/* ---------- Interacción ---------- */
function despertar() {   // lo despiertan de noche: se enoja un rato y los incentiva a comprar
  sub = 'stand'; tm = 7; happy = 0;
  if (!night()) return show(R(L.wake), null, 2500);
  grump = 6; show(R(cerrado() ? L.despCerrado : L.desp), [['🛒 Mi carrito', abrirCarrito], ['🔥 Ver ofertas', verOfertas]], 9000);
}
function menu() {
  const b = [['🛍️ Recomendame', recMenu], ['🔥 Ofertas', () => tour(true)], ['🎁 Ayudame a elegir', regalosMenu], ['🛵 Envíos', envioTabla]];
  b.push([silent ? '🔔 Hablar' : '🤫 Silencio', () => { silent = !silent; SS('mm_sil', silent ? '1' : '0'); show(silent ? 'Ok, me quedo calladito 🤫' : '¡Vuelvo a charlar! 🍋', null, 2500) }]);
  b.push(['👋 Chau', () => { LS('mm_off', Date.now() + 7 * 864e5); show('¡Chau! Vuelvo en unos días 👋', null, 2200); setTimeout(() => { host.remove(); window.__mmOn = false }, 2400) }]);
  b.unshift(['💬 Preguntame', () => window.__mmChat && window.__mmChat()]);
  show(R(L.poke), b, 12000);
}
/* ============================================================
   PARCHE MÍNIMO PARA mascota.js
   Pegá este bloque JUSTO DESPUÉS de la definición de la función menu()
   ============================================================ */

/* --- Antagonista Empírico (solo se activa con ?antagonista) --- */
if (window.__Antagonista && window.__Antagonista.activo) {
  const _menuOriginal = menu;
  menu = function () {
    window.__Antagonista.menu(show);
  };
  window.__mmMenuOriginal = _menuOriginal;
  console.info('[Limón] Menú Antagonista Empírico enganchado (con IA)');
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
  else { happy = .6; if (sub === 'sleep') despertar(); else if (bubUntil) hide(); else if (DESC && Date.now() - tStart > 60e3 && Math.random() < (DESC.alTocar ?? .15) && darCodigo('toque')) { } else menu() }
});
const act = () => {
  const ina = Date.now() - lastAct; lastAct = Date.now();
  if (sub === 'sleep' && mode === 'idle' && !night()) { sub = 'stand'; tm = 1.5; if (!silent && !bubUntil) show(R(L.wake), null, 2500) }
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
  const cc = $q('#cantCarrito'); cartCount = parseInt(cc && cc.textContent) || 0; cartSince = cartCount > 0 ? Date.now() : 0; cartIds = leerCarrito().map(x => x['Artículo']);
  if (cc) new MutationObserver(() => {
    const n = parseInt(cc.textContent) || 0, up = n > cartCount; cartCount = n; cartSince = n > 0 ? Date.now() : 0;
    if (up && Date.now() - lastAdd > 8000 && mode !== 'cart') { lastAdd = Date.now(); happy = 1.2; complemento().then(ok => { if (!ok && !silent && !tipeando && Math.random() < .5) show(R(cerrado() ? L.addCerrado : L.add), null, 2600) }) } else if (!up) cartIds = leerCarrito().map(x => x['Artículo'])
  }).observe(cc, { childList: true, characterData: true, subtree: true });
  const o = cartEl(); if (o) new MutationObserver(onCart).observe(o, { attributes: true, attributeFilter: ['class'] });
}

L.fav = ['¿En favoritos? ¿Y si mañana ya no está disponible? 😬', 'Guardarlo está bien… pero comprarlo es mejor 😏', 'Los favoritos son los primeros en agotarse 🍋', 'Ojo, lo que se deja para después a veces ya no vuelve 👀'];
L.favPocas = ['¡Quedan pocas unidades de ese! No lo dejes solo en favoritos 😱', '¡Está por agotarse! Si te gusta, no lo pienses tanto 🏃', 'Ese se termina pronto… ¿lo llevamos ahora? 🛒'];
document.addEventListener('click', e => {
  const bf = e.target.closest && e.target.closest('.btn-favorito-card'); if (!bf) return;
  setTimeout(() => {
    if (silent || tipeando || cartOpen() || !/❤/.test(bf.textContent) || Date.now() - lastFav < 15000) return;   // solo al agregar, no al quitar
    lastFav = Date.now(); const c = bf.closest('.tarjetas2') || bf.closest('.card-group') || document, poco = !!c.querySelector('.badge-ultimas-unidades:not(.d-none)');
    happy = .8; show(R(poco ? L.favPocas : L.fav), null, 5200);
  }, 60);
});

/* ---------- Extras de venta ---------- */
let EVENTOS = [], evForzado = null, FECHA = null, hat = null, fechaOv = null, lastComp = 0, cartIds = [], tipeando = false, ideaI = {};
const hoyF = () => fechaOv ? new Date(fechaOv) : new Date();
const getP = id => ALL.get(id) ?? ALL.get(Number(id)) ?? ALL.get(String(id));
const leerCarrito = () => { try { const d = JSON.parse(LS('datosCarrito') || 'null'); return d && d.items ? d.items : [] } catch (e) { return [] } };
const irObsequios = () => { location.href = CFG.obsequios + 'obsequios.html' };

/* Callarse mientras escriben (buscador, código del carrito, etc.) */
const campo = 'input,textarea,select,[contenteditable="true"]';
document.addEventListener('focusin', e => { if (e.target.matches && e.target.matches(campo)) { tipeando = true; if (bubUntil) hide() } });
document.addEventListener('focusout', () => setTimeout(() => { const a = document.activeElement; if (!a || !a.matches || !a.matches(campo)) tipeando = false }, 1200));

/* Complemento al agregar: reglas en items_limon.json → "complementos" */
async function complemento() {
  const reglas = Array.isArray((ITEMS || {}).complementos) ? ITEMS.complementos : [];
  const ids = leerCarrito().map(x => x['Artículo']), nuevos = ids.filter(id => !cartIds.includes(id)); cartIds = ids;
  if (!reglas.length || !nuevos.length || silent || tipeando || cartOpen() || Date.now() - lastComp < 90e3) return false;
  await cargar(); const p = getP(nuevos[nuevos.length - 1]); if (!p) return false;
  const enCarrito = ids.map(getP).filter(Boolean), minus = s => String(s || '').toLowerCase();
  const tiene = o => enCarrito.some(q => minus(q.c) === minus(o.categoria) && (!o.buscar || minus(q.n).includes(minus(o.buscar))));
  const r = reglas.find(r => r.cuando && minus(r.cuando.categoria) === minus(p.c) && (!r.cuando.nombre || minus(p.n).includes(minus(r.cuando.nombre))) && !SS('mm_cx_' + (r.id || r.texto)));
  if (!r) return false;
  const of = (r.ofrece || []).filter(o => !tiene(o)); if (!of.length) return false;
  SS('mm_cx_' + (r.id || r.texto), '1'); lastComp = Date.now(); happy = 1;
  show(of.length < (r.ofrece || []).length ? (r.textoAlt || '¿Querés ver algo que va con eso? 🎁') : (r.texto || '¿Te muestro algo que va con eso? 🍋'), of.slice(0, 2).map(o => [o.boton || 'Ver ' + o.categoria, () => irCategoria(o.categoria, null, o.buscar)]), 12000); return true;
}

/* Primera visita / carrito que espera */
async function saludoInicial() {
  await cargar(); const I = ITEMS || {};
  const viejo = await enlaceViejo(); if (viejo) return viejo;
  if (cartCount > 0 && I.carritoEspera !== false && SS('mm_back') !== '1') {
    SS('mm_back', '1'); LS('mm_vis', '1'); let vistos = []; try { vistos = JSON.parse(LS('vistos_limon') || '[]') } catch (e) {}
    const v = vistos.map(getP).find(Boolean), n = cartCount, b = [['🛒 Abrir carrito', abrirCarrito]];
    if (v) b.push(['👀 Seguir donde dejé', () => verProducto(v.id)]);
    return [`¡Volviste! Tu carrito sigue con ${n} producto${n > 1 ? 's' : ''} 🛒`, b, 10000];
  }
  if (!LS('mm_vis') && I.primeraVisita !== false) { LS('mm_vis', '1'); return [L.primera, [['❓ ¿Cómo compro?', () => comoComprar()], ['Ya sé cómo 😎', () => {}]], 12000] }
  LS('mm_vis', '1');
  return [cerrado() ? R(L.cerrado) : (hr => hr >= 6 && hr < 12)(hoyF().getHours()) ? R(L.hiManana) : R(L.hi), [['🛍️ Recomendame', recMenu], ['🔥 Ofertas', () => tour(true)]], 9000];
}
function comoComprar(i = 0) {
  const P = ((ITEMS || {}).comoComprar || {}).pasos || ['1️⃣ Elegís el producto y la cantidad, y tocás «Agregar».', '2️⃣ Abrís el carrito 🛒, completás entrega y forma de pago.', '3️⃣ Enviás el pedido por WhatsApp y te confirmamos. ¡Listo! 🍋'];
  show(P[i], i < P.length - 1 ? [['Siguiente ▶', () => comoComprar(i + 1)]] : [['⭐ Opiniones de clientes', () => { location.href = 'testimonios.html' }], ['¡Entendido!', () => {}]], 15000);
}

/* Cierre cerca: lee «Abierto ahora» y las franjas de #horarioHoy */
function minutosParaCerrar() {
  const b = (document.getElementById('badgeAbierto') || {}).textContent || '', t = (document.getElementById('horarioHoy') || {}).textContent || '';
  if (!/abierto/i.test(b)) return null;
  const d = hoyF(), ahora = d.getHours() * 60 + d.getMinutes(); let res = null;
  for (const m of t.matchAll(/(\d{1,2})(?::(\d{2}))?\s*a\s*(\d{1,2})(?::(\d{2}))?\s*hs/g)) { const ini = +m[1] * 60 + (+m[2] || 0), fin = +m[3] * 60 + (+m[4] || 0); if (ahora >= ini && ahora < fin) res = { min: fin - ahora, fin } }
  return res;
}
function chequearCierre() {
  const C = (ITEMS || {}).cierre; if (!C || C.activo === false) return false;
  const r = minutosParaCerrar(); if (!r || r.min > (C.minutos ?? 30) || r.min < 3) return false;
  const k = 'mm_cierre_' + r.fin; if (SS(k)) return false; SS(k, '1');
  if (!darCodigo('cierre', r.min)) promo(fill(R(L.cierre), { min: r.min }), [['🛒 Mi carrito', abrirCarrito]]);
  return true;
}

/* Fechas especiales: usa la lista de eventos de obsequios/obsequios.js (una sola fuente de fechas) */
async function cargarEventos() {
  if (((ITEMS || {}).fechas || {}).activo === false) return;
  try { const t = await (await fetch(CFG.obsequios + 'obsequios.js')).text(), a = t.indexOf('[', t.indexOf('const EVENTOS')), z = t.indexOf('];', a); EVENTOS = new Function('return ' + t.slice(a, z + 1))() } catch (e) { EVENTOS = [] }
}
function enesimo(y, m, dow, n) { const d = new Date(y, m - 1, 1); let c = 0; while (d.getMonth() === m - 1) { if (d.getDay() === dow && ++c === n) return new Date(d); d.setDate(d.getDate() + 1) } return new Date(y, m - 1, 15) }
const ACC_DEF = { enamorados: ['corazones'], novia: ['corazones'], navidad: ['santa'], padre: ['corbata'], hombre: ['corbata'], profe: ['birrete'], profesor: ['birrete'], bibliotecario: ['lentes'], programador: ['lentes'], psicologo: ['lentes'], disenador_grafico: ['lentes'], quimico: ['lentes'], optico: ['lentes'], fotografo: ['lentes'], periodista: ['lentes'], contador: ['corbata'], abogado: ['corbata'], bancario: ['corbata'], inmobiliario: ['corbata'], viajante: ['corbata'], comercio_exterior: ['corbata'], empleado_comercio: ['corbata'], enfermeria: ['jeringa'], farmaceutico: ['jeringa'], odontologo: ['lentes'], kinesiologo: ['estetoscopio'], veterinario: ['estetoscopio'], medico: ['estetoscopio'], pizzero_pastelero: ['chef'], gastronomico: ['chef'], ingeniero: ['casco'], arquitecto: ['casco'], mecanico: ['casco'], transporte: ['gorra'], camionero: ['gorra'], canillita: ['gorra'], guardavidas: ['sol'], vitivinicola: ['copa'], musico: ['auriculares'], locutor: ['auriculares'], mundial: ['mundial'] };
const accDe = ev => { const o = (((ITEMS || {}).fechas || {}).accesorios || {})[ev.id] ?? ev.accesorio ?? ACC_DEF[ev.id]; return o ? [].concat(o) : ['fiesta'] };
function diaDe(ev, yy) {
  const d = ev.tipoFecha === 'tercer_domingo' ? enesimo(yy, ev.mes, 0, 3) : ev.tipoFecha === 'segundo_lunes' ? enesimo(yy, ev.mes, 1, 2) : ev.tipoFecha === 'cuarto_viernes' ? enesimo(yy, ev.mes, 5, 4) : ev.tipoFecha === 'dia_256' ? new Date(yy, 0, 256) : new Date(yy, (ev.mes || 1) - 1, ev.dia || 1);
  if (ev.offset) d.setDate(d.getDate() + ev.offset); return d;
}
function ocurrencia(ev, hoy) {   // la que está en curso o la próxima (campos opcionales: duracion en días, anio)
  const dur = Math.max(1, ev.duracion || 0); let mejor = null;
  for (const yy of [hoy.getFullYear() - 1, hoy.getFullYear(), hoy.getFullYear() + 1]) {
    if (ev.anio && +ev.anio !== yy) continue;
    const dias = Math.round((diaDe(ev, yy) - hoy) / 864e5);
    if (dias >= -dur && (!mejor || dias < mejor.dias)) mejor = { dias, dur };
  }
  return mejor;
}
const EXCL_DEF = new Set(['25mayo', 'bandera', 'independencia', 'sanmartin']);
function calcularFecha() {
  const F = (ITEMS || {}).fechas || {}; FECHA = null; if (F.activo === false) return;
  const mapa = new Map(EVENTOS.filter(e => !e.always).map(e => [e.id, e]));   // si un evento está en los dos lugares, se combinan (gana items_limon.json)
  (F.extras || []).forEach(e => e.activo === false ? mapa.delete(e.id) : mapa.set(e.id, { ...(mapa.get(e.id) || {}), ...e }));
  const todas = [...mapa.values()];
  const prin = F.principales || (Array.isArray(F.celebrar) ? F.celebrar : ['enamorados', 'padre', 'amigo', 'profe', 'madre', 'navidad', 'novia', 'mujer', 'hombre', 'niño']);
  const dur0 = e => e.duracion > 1 ? e.duracion : 0, antes = e => e.vestirAntes ?? F.vestirAntes ?? 0;   // el disfraz/objeto se ve solo ese día (o todo el evento si es largo)
  const on = x => x.dias <= antes(x.ev) && x.dias >= -dur0(x.ev);
  const excl = F.excluir || [], hoy = hoyF(); hoy.setHours(12, 0, 0, 0);
  // candidatos dentro de la ventana de aviso (sin prioridades: ninguna fecha gana siempre)
  const l = todas.filter(e => !excl.includes(e.id)).map(e => ({ ev: e, ...ocurrencia(e, hoy) }))
    .filter(x => x.dias !== undefined && x.dias <= (prin.includes(x.ev.id) ? (F.avisoDias ?? 14) : (x.ev.aviso ?? F.avisoOtros ?? 2)));
  l.forEach(x => { x.acc = accDe(x.ev); x.on = on(x) });
  const onList = l.filter(x => x.on);
  if (onList.length) {
    // varias fechas en curso → se turnan: rotación por día + contador de sesión (al recargar cambia el turno)
    const seed = hoy.getFullYear() * 400 + hoy.getMonth() * 40 + hoy.getDate();
    let rot = +SS('mm_frot') || 0;
    if (!SS('mm_frot_set')) { rot = (rot + 1) % Math.max(onList.length, 1); SS('mm_frot', String(rot)); SS('mm_frot_set', '1') }
    // si coinciden varias: 1) la elegida en el modo prueba, 2) la que cae EXACTO hoy (las demás solo están en ventana), 3) opcional fechas.prioridad, 4) turnos
    const exacta = onList.filter(x => x.dias === 0), forz = onList.filter(x => x.ev.id === evForzado), prio = new Set(F.prioridad || []);
    let pool = forz.length ? forz : exacta.length ? exacta : onList; const pp = pool.filter(x => prio.has(x.ev.id)); if (pp.length) pool = pp;
    FECHA = pool[(seed + rot) % pool.length];
    FECHA.todos = [FECHA];   // solo esa fecha: animación / mensaje / accesorios de una a la vez
  } else {
    // nadie en curso: aviso del más cercano (por distancia en días)
    l.sort((a, b) => Math.abs(a.dias) - Math.abs(b.dias) || a.dias - b.dias);
    FECHA = l[0] || null;
    if (FECHA) FECHA.todos = [];
  }
  activarModelos();
}
function fechaMsg() {
  const x = FECHA; if (!x) return false; const ev = x.ev, t = ev.titulo, n = x.dias;
  const txt = n === 0 || (n < 0 && x.dur > 1) ? (ev.saludo || MOD.saludo || fill(R(L.fechaHoy), { t })) : n < 0 ? fill(R(L.fechaAyer), { t }) : n === 1 ? fill(R(L.fechaManana), { t }) : n <= 3 ? fill(R(L.fechaPronto), { t, n }) : fill(R(L.fechaLejos), { t });
  promo(txt, [...(ev.archivo ? [['🎁 Ver ideas', () => regaloIdeas(ev.archivo, t)]] : []), ['Ahora no', () => {}]]); return true;
}

/* Ayudante de regalos: usa los mismos JSON de obsequios/ */
async function regaloIdeas(archivo, titulo) {
  await cargar(); let lista = [];
  try { lista = await (await fetch(CFG.obsequios + archivo, { cache: 'no-cache' })).json() } catch (e) {}
  const ideas = (lista || []).map(x => ({ p: getP(x.id), t: x.texto })).filter(x => x.p && x.p.st);
  if (!ideas.length) return show('Para eso todavía no tengo ideas cargadas 🤔 Mirá la página de ideas para regalar.', [['🎁 Ver ideas', irObsequios]], 8000);
  const k = ideaI[archivo] == null ? Math.floor(Math.random() * ideas.length) : (ideaI[archivo] + 1) % ideas.length; ideaI[archivo] = k;
  const { p, t } = ideas[k];
  show((t ? t + ' — ' : '') + corto(p.n) + ': ' + money(p.pr), [['👀 Verlo', () => verProducto(p.id)], ...(ideas.length > 1 ? [['🔄 Otra idea', () => regaloIdeas(archivo, titulo)]] : []), ['📖 Ver todas', irObsequios]], 16000);
}
async function regalosMenu() {
  await cargar(); const opts = [];
  if (FECHA && FECHA.ev.archivo) opts.push(['🎉 ' + FECHA.ev.titulo.split('/')[0].trim(), () => regaloIdeas(FECHA.ev.archivo, FECHA.ev.titulo)]);
  ((ITEMS || {}).regalos || [{ boton: '👶 Para peques', archivo: 'peques.json' }, { boton: '🎂 Cumpleaños', archivo: 'cumple.json' }, { boton: '🤝 Amigo invisible', archivo: 'amigo_invisible.json' }]).forEach(r => opts.push([r.boton, () => regaloIdeas(r.archivo, r.boton)]));
  show('¿Para quién es el regalo? 🎁', opts.slice(0, 4), 14000);
}

/* ---------- Modelos por fecha: cada archivo de modelos/ es un disfraz u objeto distinto ---------- */
let MAPA = null, MODS = {}, modTok = 0, MOD = { anim: [], ocultos: [], extras: [], disfraz: false, comp: null, n: 0, nombres: '', saludo: '', lie: null, lieK: 0, dichos: [] }, nextDicho = Date.now() + 25e3;
const HUECOS = ['espalda', 'cuerpo', 'cuello', 'cara', 'cabeza', 'mano_d', 'mano_i', 'disfraz'];
async function leerModelo(id) { if (!(id in MODS)) { const j = await leer(CFG.modelos + id + '.json'); MODS[id] = j && j.partes ? j : null } return MODS[id] }
async function activarModelos() {
  const tok = ++modTok; if (MAPA === null) MAPA = await leer(CFG.modelos + '_mapa.json') || {};
  const usados = new Set(), ms = [];
  const sinMod = new Set(((ITEMS || {}).fechas || {}).sinModelo || [...EXCL_DEF]);   // fechas patrias: van solas con la escarapela, sin modelo de modelos/
  for (const x of (FECHA && FECHA.on ? FECHA.todos : [])) {
    if (sinMod.has(x.ev.id)) continue;
    for (const id of [].concat(MAPA[x.ev.id] || [])) {
      const m = await leerModelo(id); if (!m) continue;
      const sl = m.disfraz ? [...HUECOS, 'companero'] : (m.partes || []).map(pt => pt.slot);
      if (sl.some(s => usados.has(s))) continue;   // un modelo no pisa el hueco de otro
      sl.forEach(s => usados.add(s)); ms.push(m);
    }
  }
  if (tok !== modTok) return;   // cambió la fecha mientras cargaba
  limpiarModelos(); if (ms.length) aplicarModelos(ms);
}
function limpiarModelos() {
  HUECOS.forEach(s => { const e = g('s_' + s); if (e) e.innerHTML = '' }); g('compg').innerHTML = '';
  MOD.ocultos.forEach(id => { const e = g(id); if (e) e.style.display = '' });
  MOD = { anim: [], ocultos: [], extras: [], disfraz: false, comp: null, n: 0, nombres: '', saludo: '', lie: null, lieK: 0, dichos: [] };
}
function aplicarModelos(ms) {
  ms.forEach(m => {
    (m.partes || []).forEach(pt => {
      if (pt.slot === 'companero') { g('compg').innerHTML += pt.svg; MOD.comp = { dx: pt.dx ?? 46, dy: pt.dy ?? 0 } }
      else { const e = g('s_' + pt.slot); if (e) e.innerHTML += pt.svg }
    });
    if (m.disfraz) MOD.disfraz = true; if (m.saludo) MOD.saludo = m.saludo; if (m.recuesta) MOD.lie = m.recuesta; (m.dichos || []).forEach(d => MOD.dichos.push(d));
    (m.ocultar || []).forEach(id => { const e = g(id); if (e) { e.style.display = 'none'; MOD.ocultos.push(id) } });
    (m.extras || []).forEach(x => MOD.extras.push(x)); MOD.nombres += (MOD.nombres ? ', ' : '') + m.id; MOD.n++;
  });
  ms.forEach(m => (m.anim || []).forEach(a => { const e = g(a.sel); if (e) MOD.anim.push({ ...a, e }) }));
}
function animarModelos() {   // animaciones simples que pueden usar los modelos
  sh.querySelectorAll('.tx').forEach(e => e.setAttribute('transform', face < 0 ? `translate(${2 * (+e.dataset.cx || 40)} 0) scale(-1 1)` : ''));   // textos (clase tx + data-cx): se des-espejan
  for (const a of MOD.anim) {
    const [px, py] = a.pivote || [40, 48], v = a.vel ?? 1, s = Math.sin(T * v * 6.2832 + (a.fase ?? 0));
    if (a.tipo === 'balanceo') a.e.setAttribute('transform', rt(s * (a.grados ?? 8), px, py));
    else if (a.tipo === 'giro') a.e.setAttribute('transform', rt(T * v * 360, px, py));
    else if (a.tipo === 'rueda') a.e.setAttribute('transform', rt((fl === 'b' || fl === 't' ? pos.x : pos.y) * (a.k ?? 5), px, py));
    else if (a.tipo === 'pulso') a.e.setAttribute('transform', `translate(${px} ${py}) scale(${1 + s * (a.amp ?? .05)}) translate(${-px} ${-py})`);
    else if (a.tipo === 'flota') a.e.setAttribute('transform', `translate(0 ${s * (a.amp ?? 2)})`);
    else if (a.tipo === 'parpadeo') a.e.setAttribute('opacity', (T * v + (a.fase ?? 0)) % 1 < (a.duty ?? .1) ? 1 : 0);
    else if (a.tipo === 'subida') { const k = (T * v + (a.fase ?? 0)) % 1; a.e.setAttribute('transform', `translate(${Math.sin(k * 6.28) * (a.amp ?? 2)} ${-k * (a.alto ?? 14)})`); a.e.setAttribute('opacity', 1 - k) }
  }
}
function drawComp(dt) {   // objeto acompañante (cochecito, carrito…): sigue a Limón y se queda en el piso si él se sube a una tarjeta
  const c = g('comp'); if (!MOD.comp || m.classList.contains('gone')) { c.style.display = 'none'; return } c.style.display = 'block';
  if (mode !== 'perch' && mode !== 'jump' && mode !== 'drag') { MOD.tx = pos.x; MOD.ty = pos.y }
  if (MOD.cx == null) { MOD.cx = MOD.tx ?? pos.x; MOD.cy = MOD.ty ?? pos.y }
  const k = Math.min(1, dt * 7); MOD.cx += ((MOD.tx ?? pos.x) - MOD.cx) * k; MOD.cy += ((MOD.ty ?? pos.y) - MOD.cy) * k;
  c.style.transform = `translate(${MOD.cx - W / 2}px,${MOD.cy - H}px) rotate(${ROT[fl]}deg) translate(${MOD.comp.dx * face}px,${MOD.comp.dy}px) scale(${face},1)`;   // sin la inclinación de Limón (tropiezo, recostado)
}

/* ---------- Ropa y accesorios (fechas, clima, hora) ---------- */
const KIND = { fiesta: ['hat1'], santa: ['hat2'], lana: ['hat3', 'scarf'], gorra: ['hat4'], dormir: ['hat5'], birrete: ['hat6'], chef: ['hat7'], casco: ['hat8'], calabaza: ['hat9'], mundial: ['hat10', 'corn'], sol: ['gl'], lentes: ['gl2'], corbata: ['tie'], estetoscopio: ['steto'], jeringa: ['jer'], escarapela: ['esc'], corazones: ['hearts'], ofertas: ['gl', 'cartel'], copa: ['hat1', 'copa'], auriculares: ['hp', 'nt'], mate: ['mate'] };
const CABEZA = new Set(['hat1', 'hat2', 'hat3', 'hat4', 'hat5', 'hat6', 'hat7', 'hat8', 'hat9', 'hat10', 'hp']), TODOS = [...new Set(Object.values(KIND).flat())];
let visSig = '', nextSusto = 12, BAT = null;
function vestirAplicar() {
  const vis = new Set(); let cab = false, dorm = sub === 'sleep' && mode === 'idle';
  const add = ks => ks.forEach(k => (KIND[k] || []).forEach(id => { if (CABEZA.has(id)) { if (cab) return; cab = true } vis.add(id) }));
  if (FECHA && FECHA.on && !MOD.n) FECHA.todos.forEach(x => add(x.acc));
  add(MOD.extras);
  const wx = WX || {}, hr = hoyF().getHours();
  if (wx.frio) add(['lana']); if (wx.calor) add(dorm ? ['gorra'] : ['gorra', 'sol']);
  if (dorm || (cerrado() && hr >= 13 && hr < 17)) add(['dormir']);
  if (sub === 'music' && mode === 'idle') add(['auriculares']);
  if (hr >= 6 && hr < 12 && sub === 'sit' && mode === 'idle') add(['mate']);
  if (MOD.disfraz) vis.clear();
  const sig = [...vis].join(); if (sig === visSig) return; visSig = sig;
  TODOS.forEach(id => { const e = g(id); if (e) e.style.display = vis.has(id) ? '' : 'none' });
}

/* Batería baja: solo un recordatorio amable (o una broma), sin vender nada */
async function bateria() {
  if (((ITEMS || {}).bateria || {}).activo === false || !navigator.getBattery) return;
  try { const b = await navigator.getBattery(), f = () => { BAT = { n: Math.round(b.level * 100), carga: b.charging } }; f(); b.addEventListener('levelchange', f); b.addEventListener('chargingchange', f) } catch (e) {}
}

/* Favoritos en oferta o por agotarse (favoritos_limon) */
async function favoritosAviso() {
  const F = (ITEMS || {}).favoritos || {}; if (F.activo === false) return false;
  let fav = []; try { fav = JSON.parse(LS('favoritos_limon') || '[]').map(Number) } catch (e) {}
  await cargar(); const lim = F.pocas ?? 1, xs = fav.map(getP).filter(p => p && p.st);
  const of = xs.filter(p => p.d > 0), poco = xs.filter(p => p.inv <= lim), ambos = of.filter(p => poco.includes(p));
  const p = ambos.length ? R(ambos) : of.length ? R(of) : poco.length ? R(poco) : null; if (!p) return false;
  const n = corto(p.n), t = ambos.includes(p) ? `¡${n} está en oferta (${p.d}% OFF) y quedan pocas unidades! 🔥 Lo tenés en favoritos, no lo pierdas` : of.includes(p) ? fill(R(L.favOferta), { n, d: p.d }) : fill(R(L.favPocasAviso), { n });
  promo(t, [['👀 Verlo', () => verProducto(p.id)], ['Ahora no', () => {}]]); return true;
}

/* Enlace ?p= de un producto agotado o que ya no existe: ofrece parecidos */
async function enlaceViejo() {
  const id = new URLSearchParams(location.search).get('p'); if (!id) return null;
  await cargar(); const p = getP(Number(id)); if (p && p.st) return null;
  const sim = p ? ART.filter(q => q.c === p.c && q.id !== p.id && permitido(q)).sort((a, b) => Math.abs(a.pr - p.pr) - Math.abs(b.pr - p.pr)).slice(0, 2) : [];
  const b = sim.map(q => ['👀 ' + corto(q.n).slice(0, 18) + ' · ' + money(q.pr), () => verProducto(q.id)]);
  if (!b.length) b.push(['🔥 Ver ofertas', verOfertas], ['🛍️ Recomendame', recMenu]);
  return [p ? 'Ese producto se agotó 😕 Pero mirá estos parecidos:' : 'Ese enlace es de un producto que ya no está 😕 Pero mirá lo que tenemos:', b, 15000];
}

/* Envío o retiro */
function envioTabla() {
  const E = (ITEMS || {}).envio || {}, tabla = E.tabla || [['Km 1 al 6', '$3.000 / $3.500'], ['Km 7 al 9', '$3.500 / $4.000'], ['Km 10 al 11', '$4.500 / $5.000']];
  show('🛵 Envío por moto (aprox.)\n' + tabla.map(r => r[0] + ': ' + r[1]).join('\n') + '\n' + (E.nota || 'Valores aproximados: dependen de la zona y de la ubicación que nos mandes por WhatsApp.') + '\n' + (E.retiro || 'Retirando personalmente no se abona el envío 🛍️'), [['🛒 Mi carrito', abrirCarrito]], 20000);
}

/* ---------- Modo prueba: abrí la tienda con «?limon» al final (ej. index.html?limon) ---------- */
async function panelPrueba() {
  await cargar();
  const css = document.createElement('style');
  css.textContent = '#tp{position:absolute;left:8px;bottom:70px;width:232px;max-height:62vh;overflow:auto;padding:8px 10px;border-radius:12px;background:#000d;color:#fff;font:12px system-ui,sans-serif;pointer-events:auto;line-height:1.35}#tp label{display:block;margin:5px 0 2px}#tp input,#tp select{width:100%;font:12px system-ui;padding:3px;border-radius:6px;border:0}#tp input[type=checkbox]{width:auto}#tp .g{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:7px}#tp button{border:0;border-radius:8px;padding:6px 4px;background:#ffffff26;color:#fff;font:12px system-ui;cursor:pointer}#tp button:hover{background:#ffffff48}#tp .h{display:flex;justify-content:space-between;align-items:center}#tp #ts{margin-top:6px;opacity:.8;font-size:11px}';
  sh.appendChild(css);
  const pan = document.createElement('div'); pan.id = 'tp';
  pan.innerHTML = '<div class="h"><b>🍋 Modo prueba</b><button id="tx" style="width:26px">–</button></div><div id="tb"><label>Evento<select id="te"><option value="">(elegí uno)</option></select></label><label>Fecha y hora<input id="tf" type="datetime-local"></label><label>Clima<select id="tw"><option value="">Real</option><option value="frio">Frío (7°)</option><option value="calor">Calor (35°)</option><option value="lluvia">Lluvia</option><option value="nube">Nublado</option><option value="tormenta">Tormenta</option><option value="viento">Viento</option><option value="nada">Sin clima</option></select></label><label><input id="tn" type="checkbox"> Noche</label><label><input id="tc" type="checkbox"> Local cerrado</label><div class="g" id="bt"></div><div id="ts"></div></div>';
  sh.appendChild(pan);
  const q = id => pan.querySelector('#' + id), pad = n => String(n).padStart(2, '0'), loc = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const F = (ITEMS || {}).fechas || {}, lista = [...EVENTOS.filter(e => !e.always), ...(F.extras || []).filter(e => e.activo !== false)];
  lista.forEach((e, i) => { const o = document.createElement('option'); o.value = i; o.textContent = e.titulo; q('te').append(o) });
  const aplicar = (v, id) => { fechaOv = v ? new Date(v) : null; evForzado = id || null; SS('mm_fecha', ''); calcularFecha() };
  q('te').onchange = () => { const ev = lista[+q('te').value]; if (!ev) return; const hoy = new Date(); hoy.setHours(12, 0, 0, 0); const o = ocurrencia(ev, hoy); if (!o) return show('Ese evento ya pasó (tiene un año fijo).', null, 3000); const d = new Date(hoy); d.setDate(d.getDate() + o.dias); q('tf').value = loc(d); aplicar(q('tf').value, ev.id) };
  q('tf').onchange = () => aplicar(q('tf').value);
  const W = { frio: { T: 7, frio: true }, calor: { T: 35, calor: true }, lluvia: { T: 20, lluvia: true }, nube: { T: 22, nube: true }, tormenta: { T: 22, tormenta: true, lluvia: true }, viento: { T: 20, viento: true } };
  q('tw').onchange = () => { SS('mm_wxd', ''); if (q('tw').value === '') clima(); else WX = W[q('tw').value] || null };
  q('tn').onchange = () => { nightOv = q('tn').checked ? true : null };
  q('tc').onchange = () => { cerradoOv = q('tc').checked ? true : null };
  q('tx').onclick = () => { const b = q('tb'); b.style.display = b.style.display === 'none' ? '' : 'none'; q('tx').textContent = b.style.display === 'none' ? '+' : '–' };
  const reposo = () => { if (mode === 'cart') return; J = null; P = null; D = null; trip = null; tripRot = 0; corre = false; wantCart = false; toCart = false; fl = 'b'; const [a, b] = range('b'); u = clamp(pos.x, a, b); pos = edge('b', u); mode = 'idle'; sub = 'stand'; tm = 20; grump = 0; hide() };
  const izq = () => { const [a] = range('b'); u = a + 10; pos = edge('b', u) };
  const acc = [
    ['🪨 Piedra', () => { reposo(); izq(); evPiedra() }], ['🏃 Correr', () => { reposo(); izq(); evCorrer() }], ['🎧 Música', () => { reposo(); evMusica() }], ['☂️ Paraguas', () => { reposo(); WX = { T: 22, nube: true }; umAnim = { t: 0 } }],
    ['🧉 Sentarse', () => { reposo(); sub = 'sit' }], ['😤 Despertar', () => { reposo(); nightOv = true; q('tn').checked = true; sub = 'sleep'; setTimeout(despertar, 1200) }], ['🎁 Msj. de fecha', () => { SS('mm_fecha', ''); if (!fechaMsg()) show('No hay evento para esa fecha.', null, 3000) }], ['🔋 Batería 15%', () => { BAT = { n: 15, carga: false }; SS('mm_b1', ''); SS('mm_b2', '') }],
    ['🔋 Batería 8%', () => { BAT = { n: 8, carga: false }; SS('mm_b1', ''); SS('mm_b2', '') }], ['💸 Código', () => { SS('mm_dn', '0'); LS('mm_dto', '0'); if (!darCodigo('indecision')) show('No hay código disponible (¿desc_limon.json activo?).', null, 4000) }], ['🛵 Envíos', envioTabla], ['🛍️ Recomendar', recMenu],
    ['🔥 Ofertas', () => { reposo(); tour(true) }], ['🔄 Restablecer', () => { fechaOv = null; evForzado = null; nightOv = null; cerradoOv = null; q('tf').value = ''; q('te').value = ''; q('tw').value = ''; q('tn').checked = q('tc').checked = false; calcularFecha(); clima(); reposo(); tm = 2 }]];
  acc.forEach(([t, f]) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; q('bt').append(b) });
  setInterval(() => { q('ts').textContent = (FECHA ? `Evento: ${FECHA.ev.titulo} (${FECHA.dias} d) · ` : 'Sin evento · ') + 'puesto: ' + (visSig || 'nada') + (MOD.n ? ' · modelo: ' + MOD.nombres : '') }, 700);
}

/* ---------- Planificador (cada segundo) ---------- */
function sched() {
  const now = Date.now(); if (document.hidden || mode === 'cart' || mode === 'drag') return;
  const min = (now - tStart) / 6e4, ina = (now - lastAct) / 1e3, car = cartSince ? (now - cartSince) / 6e4 : 0, libre = mode === 'idle' && sub !== 'sleep' && !silent && !tipeando && !bubUntil && !cartOpen();
  const CA = (ITEMS || {}).carritoAviso || {}, t1 = CA.minutos ?? 3, EN = (ITEMS || {}).envio || {};
  if (libre && BAT && !BAT.carga) {   // batería: recordatorio amable, sin ventas
    const um = ((ITEMS || {}).bateria || {}).umbral ?? 20;
    if (BAT.n <= 10 && !SS('mm_b2')) { SS('mm_b2', '1'); SS('mm_b1', '1'); show(fill(R(L.bat2), { n: BAT.n }), null, 6000); return }
    if (BAT.n <= um && !SS('mm_b1')) { SS('mm_b1', '1'); show(fill(R(L.bat), { n: BAT.n }), null, 6000); return }
    if (BAT.n <= 45 && !SS('mm_bj') && Math.random() < .004) { SS('mm_bj', '1'); show(fill(R(L.batBroma), { n: BAT.n }), null, 5000); return }
  }
  if (libre && now - lastSay > 8000 && cartCount > 0 && EN.activo !== false && !SS('mm_envio') && car >= 1.2 && ina >= 10) {   // retiro en el local
    SS('mm_envio', '1'); promo(EN.retiro || 'Retirando personalmente no se abona el envío 🛍️', [['🛵 Ver costos de envío', envioTabla], ['Ahora no', () => {}]]); return;
  }
  if (libre && CA.activo !== false && cartCount > 0 && car >= t1 && ina >= 15 && !SS('mm_ca')) {   // paso 1: aviso amable, sin descuento
    SS('mm_ca', '1'); promo(fill(R(L.carritoAviso), { n: cartCount, s: cartCount > 1 ? 's' : '' }), [['🛒 Abrir carrito', abrirCarrito]]); return;
  }
  if (libre && DESC && DESC.activo === true && now - lastSay > 8000) {   // paso 2: recién más tarde, el código
    if (((car >= Math.max(DESC.minutosCarritoParado ?? 6, t1 + 2) && ina >= 15) || (min >= (DESC.minutosSinComprar ?? 5) && ina >= (DESC.inactivoSeg ?? 40))) && darCodigo('indecision')) return;
  }
  if (mode === 'idle' && sub !== 'sleep') {
    if (canSpeak() && now - lastScroll > 1500) {
      if (chequearCierre()) return;
      if (MOD.dichos.length && now >= nextDicho) { nextDicho = now + gap(70, 130); promo(R(MOD.dichos)); return }   // frases del modelo del día (ej. «¡Qué lindo mi anillo!»)
      if (!SS('mm_favs') && now - tStart > 12e3) { SS('mm_favs', '1'); favoritosAviso(); return }
      if (FECHA && !SS('mm_fecha') && now - tStart > 25e3) { SS('mm_fecha', '1'); if (fechaMsg()) return }
      if (now >= nextTour) { if (tour(false)) { nextTour = now + gap(35, 60); return } nextTour = now + 12e3 }
      if (now >= nextPeek) { if (tour(false, true)) { nextPeek = now + gap(100, 170); return } nextPeek = now + 15e3 }
      if (now >= nextRec) { nextRec = now + gap(45, 80); recomendar(); return }
      if (cerrado() && now >= nextCerrado && cerrados < 3) { nextCerrado = now + gap(90, 150); cerrados++; promo(R(L.cerrado), [['🛒 Mi carrito', abrirCarrito]]); return }
      if (WX && !SS('mm_wxd') && now - tStart > 15e3) { const t = climaFrase(); if (t) { SS('mm_wxd', '1'); if (WX.nube) umAnim = { t: 0 }; promo(t); return } }
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
  document.body.appendChild(host); vigilarTienda(); cargar(); if (CFG.clima !== false) clima(); bateria(); if (/[?&]limon(=|&|$)/.test(location.search)) panelPrueba();
  nextTour = Date.now() + 12e3 * CFG.ritmo; nextRec = Date.now() + 30e3 * CFG.ritmo; nextQuip = Date.now() + 22e3 * CFG.ritmo; nextPeek = Date.now() + 70e3 * CFG.ritmo; nextReto = Date.now() + 100e3 * CFG.ritmo;
  pos = edge('b', -40); tgt = CFG.mi + 70; mode = 'walk'; last = performance.now(); requestAnimationFrame(frame); setInterval(sched, 1000);
  if (SS('mm_hi') !== '1' && !silent) { SS('mm_hi', '1'); setTimeout(async () => { if (mode !== 'cart') { const [t, b, ms] = await saludoInicial(); if (mode !== 'cart') show(t, b, ms) } }, 1800) }
}
let tries = 0;
(function esperar() {
  if (window.mensajeActivo === true) return setTimeout(esperar, 500);   // hay un aviso importante en pantalla: espera a que lo cierren
  if (listo() || ++tries > 16) setTimeout(iniciar, 300); else setTimeout(esperar, 250);
})();
window.__mm = { show, complemento, saludoInicial, comoComprar, chequearCierre, regalosMenu, regaloIdeas, fechaMsg, setFecha: d => { fechaOv = d; calcularFecha() }, fecha: () => FECHA, hatOf: () => FECHA && FECHA.on ? FECHA.acc : null, vestido: () => visSig, tiempos: (c, i) => { cartSince = Date.now() - c * 6e4; lastAct = Date.now() - i * 1e3 }, tipeando: () => tipeando, tour, recomendar, despertar, piedra: evPiedra, correr: evCorrer, musica: evMusica, setWX: w => { WX = w }, noche: v => { nightOv = v }, darCodigo, verOfertas, tiro: contarTiro, last: () => lastRec, flip, state: () => ({ face, fl, mode, sub, pos, promos, sensor, tgt, toCart, WX, umAnim, grump, corre, rock: !!rock }) };
})();
