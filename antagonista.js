/**
 * Laboratorio Limón — Módulo Polifacético con IA (Cloudflare Worker)
 * Activación: index.html?antagonista (o ?poliformo)
 *
 * Requiere:
 *   - Worker desplegado en /api/antagonista
 *   - Cargar este archivo DESPUÉS de mascota.js
 *
 * Si el Worker falla, cae a respuestas locales de plantilla (nunca se rompe).
 */

(() => {
  'use strict';

  const isActivo = /[?&](antagonista|poliformo)(?=(=|&|$))/.test(location.search);
  if (!isActivo) {
    window.__Poliformo = { activo: false };
    window.__Antagonista = { activo: false };
    return;
  }

  const CFG = {
    api: '/api/antagonista',          // misma web → sin CORS
    fallbackLocal: true,              // si el Worker falla, usar plantillas
    maxHist: 4
  };

  // Estado global del modo activo en la sesión de chat
  let modoActual = 'antagonista';

  // ---------- Plantillas locales (fallback) ----------
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

  function procesarLocal(texto, modo) {
    const t = (texto || '').trim();
    if (!t) return 'Tirame una consulta, certeza o afirmación y la procesamos 🍋';
    const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
    const blind = BLIND_SPOTS[Math.floor(Math.random() * BLIND_SPOTS.length)];
    const alt = ALTERNATIVAS[Math.floor(Math.random() * ALTERNATIVAS.length)];
    const cierre = CIERRES[Math.floor(Math.random() * CIERRES.length)];
    let cuerpo = ABSOLUTOS.test(t)
      ? `Detecté un absoluto.\nEsos atajos suelen esconder casos borde. ${blind}\n\n`
      : `${blind}\n\n`;
    cuerpo += `${alt}\n\n${cierre}`;
    return `${intro}\n\n${cuerpo}`;
  }

  // ---------- Llamada al Worker con Modo ----------
  let hist = [];
  const charlar = ms => { try { window.__mm && window.__mm.charlar && window.__mm.charlar(ms) } catch (e) {} };

  async function procesarConIA(texto) {
    try {
      const r = await fetch(CFG.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: texto,
          modo: modoActual,
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
      console.warn('[Poliformo] Worker no disponible, uso fallback local', e);
    }
    if (CFG.fallbackLocal) return procesarLocal(texto, modoActual);
    return 'Se me cruzaron los cables un segundo 🍋 Probá de nuevo.';
  }

  // ---------- Menú Multifacético (Los 9 Modos) y UI ----------
  function menuPoliformo(showFn) {
    charlar(60000);
    const opciones = [
      ['🧐 Antagonista Empírico', () => seleccionarModo(showFn, 'antagonista')],
      ['⚖️ Tribunal Doméstico', () => seleccionarModo(showFn, 'tribunal')],
      ['🚀 Excusas Cuánticas', () => seleccionarModo(showFn, 'excusas')],
      ['🛸 Conspiraciones Inofensivas', () => seleccionarModo(showFn, 'conspiraciones')],
      ['⚡ Apocalipsis Cotidiano', () => seleccionarModo(showFn, 'apocalipsis')],
      ['🌌 Metáforas Incomprensibles', () => seleccionarModo(showFn, 'metaforas')],
      ['🦸 Superpoderes Inútiles', () => seleccionarModo(showFn, 'superpoderes')],
      ['🔮 Oráculo del Absurdo', () => seleccionarModo(showFn, 'oraculo')],
      ['👔 Entrevista Imposible', () => seleccionarModo(showFn, 'entrevistas')],
      ['👋 Salir del modo', () => {
        showFn('Para volver al modo normal de la tienda, sacá los parámetros de la URL y recargá.', null, 5000);
      }]
    ];
    showFn('Laboratorio Limón 🍋\n¿Qué versión de mí querés activar hoy?', opciones, 22000);
  }

  function seleccionarModo(showFn, nuevoModo) {
    modoActual = nuevoModo;
    hist = []; // Limpiamos historial al cambiar de personalidad
    pedirConsulta(showFn, false);
  }

  function botonesRespuesta(showFn) {
    return [
      ['🔄 Cambiar de modo', () => menuPoliformo(showFn)],
      ['💬 Seguir charlando', () => pedirConsulta(showFn, true)]
    ];
  }

  async function pedirConsulta(showFn, esSeguir) {
    charlar(120000);
    
    const placeholders = {
      antagonista: 'Escribí una certeza o decisión a cuestionar…',
      tribunal: 'Contá tu conflicto de convivencia o discusión…',
      excusas: '¿A qué evento o tarea querés faltar?',
      conspiraciones: '¿Qué objeto sospechoso querés analizar?',
      apocalipsis: '¿Qué tragedia hogareña estás viviendo?',
      metaforas: '¿Qué cosa querés que explique de forma compleja?',
      superpoderes: 'Contá tus mañas o torpezas diarias…',
      oraculo: '¿Qué pequeña tragedia cotidiana te pasó hoy?',
      entrevistas: 'Preparate para el puesto absurdo que elegiste…'
    };

    const saludos = {
      antagonista: 'Tirame una certeza absoluta y la desarmamos un rato.',
      tribunal: 'Presentá tu caso, acá se hace justicia de almacén.',
      excusas: 'Decime a qué querés faltar y te armo una coartada de alta física.',
      conspiraciones: 'Contame qué objeto cotidiano te mira raro.',
      apocalipsis: 'Sobrevivamos juntos a esta catástrofe de entrecasa.',
      metaforas: 'Te lo explico con física cuántica o astrofísica rebuscada.',
      superpoderes: 'Veamos qué superpoder inútil te define.',
      oraculo: 'Consultemos al cosmos por tus pequeñas tragedias.',
      entrevistas: 'Empecemos con las preguntas para el puesto imposible.'
    };

    if (window.__mmChat) {
      window.__mmChat({
        placeholder: placeholders[modoActual] || 'Escribí tu consulta...',
        manejar: texto => procesarConIA(texto.trim()),
        fijo: true,
        botones: () => botonesRespuesta(showFn)
      });
      setTimeout(() => showFn(esSeguir ? 'Seguimos 🍋 Escribime lo que quieras.' : saludos[modoActual], null, 7000), 200);
      return;
    }
    
    const inputUsuario = window.prompt(saludos[modoActual] || 'Escribí tu consulta:');
    if (inputUsuario === null) return;
    showFn('🍋 Pensando...', null, 25000);
    const respuesta = await procesarConIA(inputUsuario.trim());
    charlar(90000);
    showFn(respuesta, botonesRespuesta(showFn), 22000);
  }

  // ---------- API pública ----------
  window.__Poliformo = window.__Antagonista = {
    activo: true,
    procesar: procesarConIA,
    menu: menuPoliformo,

    attach({ show, menuOriginal }) {
      if (!show) {
        console.warn('[Poliformo] falta la función show()');
        return;
      }
      window.__mmMenuOriginal = menuOriginal;
      window.__mmMenuAntagonista = window.__mmMenuPoliformo = () => menuPoliformo(show);
      console.info('[Laboratorio Limón] Modos múltiples activos. Menú listo en window.__mmMenuPoliformo');
    }
  };

  console.info('%c🍋 Laboratorio Limón activado (Modos múltiples)', 'color:#c99a00;font-weight:bold');
})();