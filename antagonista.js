/**
 * El Antagonista Empírico — módulo con IA (Cloudflare Worker)
 * Activación: index.html?antagonista
 *
 * Requiere:
 *   - Worker desplegado en /api/antagonista (ver antagonista_worker.js)
 *   - Cargar este archivo DESPUÉS de mascota.js
 *
 * Si el Worker falla, cae a respuestas locales de plantilla (nunca se rompe).
 */

(() => {
  'use strict';

  const isAntagonista = /[?&]antagonista(=|&|$)/.test(location.search);
  if (!isAntagonista) {
    window.__Antagonista = { activo: false };
    return;
  }

  const CFG = {
    api: '/api/antagonista',          // misma web → sin CORS
    fallbackLocal: true,              // si el Worker falla, usar plantillas
    maxHist: 4
  };

  // ---------- Plantillas locales (fallback, no inventan datos) ----------
  const INTROS = [
    'Claro, también podría ser que…',
    'Sí, aunque no te olvides de…',
    'Obvio, pero tenemos que tener en cuenta que…',
    'Tiene sentido, y al mismo tiempo…',
    'Entiendo el punto. Ahora miralo desde acá:',
    'Puede ser. Otra lectura posible es…',
    'Dale, vamos a estirar esa idea un segundo…'
  ];
  const BLIND_SPOTS = [
    '¿Qué pasa si la premisa que estás dando por segura resulta incompleta?',
    '¿Hay alguna condición que todavía no contemplaste y que cambiaría el resultado?',
    '¿Quién más se vería afectado y cómo lo vería esa persona?',
    '¿Qué evidencia concreta tenés hoy, y qué evidencia te faltaría para estar más seguro?',
    'Si dentro de un año mirás para atrás, ¿qué te arrepentirías de no haber considerado?',
    '¿Estás resolviendo el problema real o solo la versión más cómoda del problema?'
  ];
  const ALTERNATIVAS = [
    'Otra rama posible: en vez de A, probar B con un costo más bajo y ver qué pasa.',
    'Podés dejar la decisión en “pendiente” un rato y juntar un dato más.',
    'A veces la opción intermedia (ni todo ni nada) es la que menos sesgo arrastra.',
    '¿Y si la pregunta correcta no es “sí o no”, sino “bajo qué condiciones sí”?',
    'Una alternativa práctica: hacer una versión mínima y barata primero, y después escalar.'
  ];
  const CIERRES = [
    'No te cierro la puerta: seguí dándole vueltas. ¿Querés que miremos otra rama?',
    'Queda picando el “también podría ser que…”. Eso es bueno.',
    'El camino está lleno de posibilidades. Elegí con los ojos abiertos.',
    'Seguimos cuando quieras. Yo no me voy a poner dogmático.'
  ];
  const ABSOLUTOS = /\b(siempre|nunca|todos|nadie|imposible|seguro que|definitivamente|obvio que|no hay otra|la única|jamás|100%|sin duda)\b/i;

  function procesarLocal(texto) {
    const t = (texto || '').trim();
    if (!t) return 'Tirame una certeza, una decisión o una afirmación absoluta y la miramos juntos 🍋';
    const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
    const blind = BLIND_SPOTS[Math.floor(Math.random() * BLIND_SPOTS.length)];
    const alt = ALTERNATIVAS[Math.floor(Math.random() * ALTERNATIVAS.length)];
    const cierre = CIERRES[Math.floor(Math.random() * CIERRES.length)];
    let cuerpo = ABSOLUTOS.test(t)
      ? `Detecté un absoluto (“siempre / nunca / todos…”).\nEsos atajos suelen esconder casos borde. ${blind}\n\n`
      : `${blind}\n\n`;
    cuerpo += `${alt}\n\n${cierre}`;
    return `${intro}\n\n${cuerpo}`;
  }

  // ---------- Llamada al Worker ----------
  let hist = [];
  const charlar = ms => { try { window.__mm && window.__mm.charlar && window.__mm.charlar(ms) } catch (e) {} };   // Limón se queda quieto mientras conversan

  async function procesarConIA(texto) {
    try {
      const r = await fetch(CFG.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texto,
          hist: hist.slice(-CFG.maxHist)
        })
      });
      if (!r.ok) throw new Error('status ' + r.status);
      const j = await r.json();
      if (j && j.text) {
        hist.push({ r: 'user', c: texto }, { r: 'assistant', c: j.text });
        return j.text;
      }
    } catch (e) {
      console.warn('[Antagonista] Worker no disponible, uso fallback local', e);
    }
    if (CFG.fallbackLocal) return procesarLocal(texto);
    return 'Se me cruzaron los cables un segundo 🍋 Probá de nuevo.';
  }

  // ---------- Menú y UI ----------
  function menuAntagonista(showFn) {
    charlar(60000);
    const opciones = [
      ['🤔 Cuestionar una certeza', () => pedirCerteza(showFn)],
      ['💬 Seguir charlando', () => pedirCerteza(showFn, true)],
      ['👋 Salir del modo', () => {
        showFn('Para volver al modo normal de la tienda, sacá “?antagonista” de la URL y recargá.', null, 5000);
      }]
    ];
    showFn('El Antagonista Empírico 🍋\n¿Qué querés mirar con más calma?', opciones, 14000);
  }

  function botonesRespuesta(showFn) {
    return [
      ['🤔 Otra certeza', () => pedirCerteza(showFn)],
      ['💬 Seguir', () => pedirCerteza(showFn, true)]
    ];
  }

  /* Abre la misma barra de chat que usa Limón (limon_chat.js). Si no está cargada, cae al cuadro del navegador. */
  async function pedirCerteza(showFn, esSeguir) {
    charlar(120000);
    if (window.__mmChat) {
      window.__mmChat({
        placeholder: esSeguir ? 'Seguí charlando con el Antagonista…' : 'Escribí una certeza o decisión…',
        manejar: texto => procesarConIA(texto.trim()),
        fijo: true,   // el globo queda hasta que cierres la ventanita de chat (✕)
        botones: () => botonesRespuesta(showFn)
      });
      setTimeout(() => showFn(esSeguir ? 'Seguimos 🍋 Escribime lo que quieras cuestionar o matizar.' : 'Escribime una certeza, una decisión o una afirmación absoluta, y la miramos juntos 🍋', null, 7000), 200);
      return;
    }
    const afirmacion = window.prompt(esSeguir ? 'Seguimos. Escribí lo que quieras cuestionar o matizar:' : 'Escribí una certeza, decisión o afirmación absoluta que quieras cuestionar:');
    if (afirmacion === null) return;
    showFn('🍋 Pensando…', null, 25000);
    const respuesta = await procesarConIA(afirmacion.trim());
    charlar(90000);
    showFn(respuesta, botonesRespuesta(showFn), 22000);
  }

  // ---------- API pública ----------
  window.__Antagonista = {
    activo: true,
    procesar: procesarConIA,
    procesarLocal,
    menu: menuAntagonista,

    attach({ show, menuOriginal }) {
      if (!show) {
        console.warn('[Antagonista] falta la función show()');
        return;
      }
      window.__mmMenuOriginal = menuOriginal;
      window.__mmMenuAntagonista = () => menuAntagonista(show);
      console.info('[Antagonista Empírico] activo + IA. Menú listo en window.__mmMenuAntagonista');
    }
  };

  console.info('%c🍋 El Antagonista Empírico activado (?antagonista) — con IA', 'color:#c99a00;font-weight:bold');
})();
