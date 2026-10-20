/* Escáner QR de producto - Me Mata Limón (móvil + PC)
 *
 * 1) Abre la cámara nosotros (getUserMedia con varios intentos)
 * 2) Muestra el video en pantalla
 * 3) ZXing lee el QR sobre ese stream (más estable en celulares)
 * 4) Pone el texto completo del QR en #formulario y dispara la búsqueda
 */
(function () {
  'use strict';

  var ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

  var btn = document.getElementById('btnEscanear');
  var input = document.getElementById('formulario');
  if (!btn || !input) return;

  var overlay = null;
  var video = null;
  var msg = null;
  var stream = null;
  var timer = null;
  var zxingReader = null;
  var zxingStop = null;
  var abierto = false;
  var yaLeyo = false;

  function extraerIdProducto(texto) {
    texto = String(texto || '').trim();
    if (!texto) return null;
    if (/^\d{1,6}$/.test(texto)) return texto;
    try {
      var raw = texto;
      if (!/^https?:\/\//i.test(raw)) {
        if (raw.indexOf('?') !== -1 || /(?:^|[?&\s/])p=\d+/i.test(raw)) {
          raw = 'https://mematalimon.com.ar/' + raw.replace(/^\//, '');
        }
      }
      if (/^https?:\/\//i.test(raw)) {
        var u = new URL(raw);
        var p = u.searchParams.get('p') || u.searchParams.get('producto');
        if (p && /^\d+$/.test(String(p).trim())) return String(p).trim();
      }
    } catch (e) { /* regex */ }
    var m = texto.match(/[?&]p=(\d+)/i) || texto.match(/[?&]producto=(\d+)/i);
    if (m) return m[1];
    m = texto.match(/(?:^|[^\w])p=(\d+)/i);
    return m ? m[1] : null;
  }

  function mostrarMensaje(texto) {
    if (msg) msg.textContent = texto;
  }

  function crearVentana() {
    overlay = document.createElement('div');
    overlay.className = 'escaner-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Escanear código QR del producto');

    var marco = document.createElement('div');
    marco.className = 'escaner-marco';

    video = document.createElement('video');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.setAttribute('muted', 'true');
    video.setAttribute('autoplay', 'true');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('autoplay', '');
    // Evita pantalla negra en iOS: el video debe poder autoplay silencioso
    video.setAttribute('disablePictureInPicture', 'true');

    var guia = document.createElement('div');
    guia.className = 'escaner-guia';

    marco.appendChild(video);
    marco.appendChild(guia);

    msg = document.createElement('p');
    msg.className = 'escaner-msg';
    msg.setAttribute('aria-live', 'polite');

    var ayuda = document.createElement('p');
    ayuda.className = 'escaner-msg';
    ayuda.style.opacity = '0.85';
    ayuda.style.fontSize = '0.85rem';
    ayuda.textContent = 'Acercá el QR al recuadro. Si queda negro, cerrá y volvé a tocar el botón.';

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'escaner-cerrar';
    cerrar.textContent = 'Cerrar';
    cerrar.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      cerrarEscaner();
    });

    overlay.appendChild(marco);
    overlay.appendChild(msg);
    overlay.appendChild(ayuda);
    overlay.appendChild(cerrar);
    document.body.appendChild(overlay);

    // Evitar scroll del body en móvil mientras está abierto
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function detenerCamara() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (typeof zxingStop === 'function') {
      try { zxingStop(); } catch (e) { /* */ }
      zxingStop = null;
    }
    if (zxingReader) {
      try {
        if (typeof zxingReader.reset === 'function') zxingReader.reset();
        if (typeof zxingReader.stopContinuousDecode === 'function') zxingReader.stopContinuousDecode();
        if (typeof zxingReader.stopAsyncDecode === 'function') zxingReader.stopAsyncDecode();
      } catch (e) { /* */ }
      zxingReader = null;
    }
    if (stream) {
      try {
        stream.getTracks().forEach(function (t) { t.stop(); });
      } catch (e) { /* */ }
      stream = null;
    }
    if (video) {
      try {
        video.pause();
        video.srcObject = null;
        video.removeAttribute('src');
        video.load();
      } catch (e) { /* */ }
    }
  }

  function cerrarEscaner() {
    abierto = false;
    yaLeyo = false;
    detenerCamara();
    document.removeEventListener('keydown', alTeclear);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = video = msg = null;
  }

  function alTeclear(e) {
    if (e.key === 'Escape') cerrarEscaner();
  }

  function codigoLeido(codigo) {
    if (!abierto || yaLeyo) return;
    codigo = String(codigo || '').trim();
    var id = extraerIdProducto(codigo);
    if (!id) {
      mostrarMensaje('QR leído, pero no es un link de producto (?p=…). Probá de nuevo.');
      return;
    }
    yaLeyo = true;
    if (navigator.vibrate) {
      try { navigator.vibrate(50); } catch (e) { /* */ }
    }
    cerrarEscaner();
    // Texto completo del QR en el buscador
    input.value = codigo;
    try { input.focus(); } catch (e) { /* */ }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
  }

  /** Intenta varias configuraciones de cámara (celulares varían mucho). */
  async function pedirCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw Object.assign(new Error('no-media'), { name: 'NotSupportedError' });
    }

    var intentos = [
      { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
      { audio: false, video: { facingMode: { exact: 'environment' } } },
      { audio: false, video: { facingMode: 'environment' } },
      { audio: false, video: { facingMode: 'user' } },
      { audio: false, video: true }
    ];

    var ultimoError = null;
    for (var i = 0; i < intentos.length; i++) {
      try {
        var s = await navigator.mediaDevices.getUserMedia(intentos[i]);
        return s;
      } catch (e) {
        ultimoError = e;
        // Permiso denegado: no seguir intentando
        if (e && e.name === 'NotAllowedError') throw e;
      }
    }
    throw ultimoError || new Error('camara');
  }

  async function mostrarVideo(s) {
    stream = s;
    video.srcObject = s;
    // Esperar metadatos y play (crítico en iOS/Android)
    await new Promise(function (resolve) {
      if (video.readyState >= 1) return resolve();
      var ok = function () {
        video.removeEventListener('loadedmetadata', ok);
        resolve();
      };
      video.addEventListener('loadedmetadata', ok);
      setTimeout(resolve, 1500);
    });
    try {
      await video.play();
    } catch (e) {
      // Algunos navegadores requieren otro intento
      video.muted = true;
      await video.play();
    }
  }

  function cargarZXing() {
    return new Promise(function (resolve, reject) {
      if (window.ZXing) return resolve(window.ZXing);
      var s = document.createElement('script');
      s.src = ZXING_URL;
      s.async = true;
      s.onload = function () {
        if (window.ZXing) resolve(window.ZXing);
        else reject(new Error('zxing'));
      };
      s.onerror = function () { reject(new Error('zxing-load')); };
      document.head.appendChild(s);
    });
  }

  async function iniciarLecturaZXing() {
    mostrarMensaje('Preparando lectura del QR…');
    var ZX = await cargarZXing();
    if (!abierto || !video) return;

    var hints = null;
    try {
      hints = new Map();
      if (ZX.DecodeHintType && ZX.BarcodeFormat) {
        hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.QR_CODE]);
        hints.set(ZX.DecodeHintType.TRY_HARDER, true);
      }
    } catch (e) { hints = null; }

    try {
      zxingReader = hints
        ? new ZX.BrowserMultiFormatReader(hints, 250)
        : new ZX.BrowserMultiFormatReader(undefined, 250);
    } catch (e) {
      zxingReader = new ZX.BrowserQRCodeReader
        ? new ZX.BrowserQRCodeReader()
        : new ZX.BrowserMultiFormatReader();
    }

    mostrarMensaje('Apuntá al QR del producto');

    var onResult = function (resultado, err) {
      if (!abierto || yaLeyo) return;
      if (resultado) {
        try {
          codigoLeido(resultado.getText());
        } catch (e) { /* */ }
      }
    };

    // Preferir stream ya abierto (no pedir la cámara de nuevo)
    if (stream && typeof zxingReader.decodeFromStream === 'function') {
      await zxingReader.decodeFromStream(stream, video, onResult);
      zxingStop = function () {
        try { zxingReader.reset(); } catch (e) { /* */ }
      };
      return;
    }

    if (typeof zxingReader.decodeFromVideoElement === 'function') {
      // Algunas versiones devuelven controls / Promise
      var ret = zxingReader.decodeFromVideoElement(video, onResult);
      if (ret && typeof ret.then === 'function') await ret;
      zxingStop = function () {
        try { zxingReader.reset(); } catch (e) { /* */ }
      };
      return;
    }

    // Fallback: decodificar por intervalos
    timer = setInterval(function () {
      if (!abierto || yaLeyo || !video || !zxingReader) return;
      if (typeof zxingReader.decodeOnceFromVideoElement !== 'function') return;
      zxingReader.decodeOnceFromVideoElement(video).then(function (r) {
        if (r) codigoLeido(r.getText());
      }).catch(function () { /* NotFound entre frames */ });
    }, 350);
  }

  // BarcodeDetector nativo solo como refuerzo extra (si ya hay video)
  function iniciarNativoSobreVideo() {
    if (!('BarcodeDetector' in window) || !video) return;
    var detector;
    try {
      detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {
      return;
    }
    var leyendo = false;
    timer = setInterval(async function () {
      if (!abierto || yaLeyo || leyendo || !video || video.readyState < 2) return;
      leyendo = true;
      try {
        var res = await detector.detect(video);
        for (var i = 0; i < res.length; i++) {
          if (extraerIdProducto(res[i].rawValue)) {
            codigoLeido(res[i].rawValue);
            break;
          }
        }
      } catch (e) { /* */ }
      leyendo = false;
    }, 280);
  }

  async function abrirEscaner(ev) {
    if (ev) {
      try { ev.preventDefault(); } catch (e) { /* */ }
    }
    if (abierto) return;

    if (!window.isSecureContext) {
      alert('La cámara solo funciona en HTTPS (o en localhost).');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Este navegador no puede usar la cámara. Probá Chrome o Safari actualizado.');
      return;
    }

    abierto = true;
    yaLeyo = false;
    crearVentana();
    document.addEventListener('keydown', alTeclear);
    mostrarMensaje('Pediendo permiso de cámara…');

    try {
      var s = await pedirCamara();
      if (!abierto) {
        s.getTracks().forEach(function (t) { t.stop(); });
        return;
      }
      mostrarMensaje('Abriendo cámara…');
      await mostrarVideo(s);
      if (!abierto) return;

      // En paralelo: ZXing es el principal; nativo refuerza si existe
      try {
        await iniciarLecturaZXing();
      } catch (eZ) {
        console.warn('ZXing falló, intento nativo:', eZ);
        iniciarNativoSobreVideo();
        if (!timer) throw eZ;
        mostrarMensaje('Apuntá al QR del producto');
      }

      // Si ZXing arrancó, igual se puede sumar nativo sin segundo timer conflictivo:
      // solo si no hay timer de fallback
    } catch (e) {
      console.error('Escáner QR:', e);
      var nombre = e && e.name;
      if (nombre === 'NotAllowedError' || nombre === 'PermissionDeniedError') {
        mostrarMensaje('Permiso de cámara denegado. En el celular: Ajustes del navegador → Cámara → Permitir, y reintentá.');
      } else if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
        mostrarMensaje('No se encontró cámara en este dispositivo.');
      } else if (nombre === 'NotReadableError' || nombre === 'TrackStartError') {
        mostrarMensaje('La cámara está ocupada por otra app. Cerrala y reintentá.');
      } else if (nombre === 'OverconstrainedError') {
        mostrarMensaje('No se pudo usar la cámara trasera. Cerrá y probá de nuevo.');
      } else {
        mostrarMensaje('No se pudo abrir la cámara. Cerrá y reintentá, o escribí el producto a mano.');
      }
    }
  }

  btn.setAttribute('aria-label', 'Escanear código QR del producto');
  btn.setAttribute('title', 'Escanear QR del producto');
  // click + touchend (algunos Android pierden el gesto en click diferido)
  btn.addEventListener('click', abrirEscaner);
})();
