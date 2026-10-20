/* Escáner de QR de producto - Me Mata Limón
 *
 * Lee QR con el link del producto (ej. https://mematalimon.com.ar/index.html?p=3),
 * deja solo el ID en #formulario y dispara la búsqueda.
 *
 * Estrategia:
 * 1) BarcodeDetector nativo SOLO si el navegador declara soporte de qr_code
 * 2) Si no, ZXing (QR primero) — más fiable en iPhone y muchos Android
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
  var zxingControls = null;
  var zxingReader = null;
  var abierto = false;
  var yaLeyo = false;

  // ---------- parseo del QR ----------

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

  function valorUtil(codigo) {
    return !!extraerIdProducto(codigo);
  }

  function mostrarMensaje(texto) {
    if (msg) msg.textContent = texto;
  }

  // ---------- UI ----------

  function crearVentana() {
    overlay = document.createElement('div');
    overlay.className = 'escaner-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Escanear código QR del producto');

    var marco = document.createElement('div');
    marco.className = 'escaner-marco';

    video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.setAttribute('autoplay', '');
    video.muted = true;
    video.playsInline = true;

    var guia = document.createElement('div');
    guia.className = 'escaner-guia';

    marco.appendChild(video);
    marco.appendChild(guia);

    msg = document.createElement('p');
    msg.className = 'escaner-msg';
    msg.setAttribute('aria-live', 'polite');

    var cerrar = document.createElement('button');
    cerrar.type = 'button';
    cerrar.className = 'escaner-cerrar';
    cerrar.textContent = 'Cerrar';
    cerrar.addEventListener('click', cerrarEscaner);

    var ayuda = document.createElement('p');
    ayuda.className = 'escaner-msg';
    ayuda.style.opacity = '0.85';
    ayuda.style.fontSize = '0.8rem';
    ayuda.textContent = 'Acercá el QR hasta que entre en el recuadro. Buena luz ayuda.';

    overlay.appendChild(marco);
    overlay.appendChild(msg);
    overlay.appendChild(ayuda);
    overlay.appendChild(cerrar);
    document.body.appendChild(overlay);
  }

  function detenerCamara() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (zxingControls && typeof zxingControls.stop === 'function') {
      try { zxingControls.stop(); } catch (e) { /* */ }
      zxingControls = null;
    }
    if (zxingReader) {
      try {
        if (typeof zxingReader.reset === 'function') zxingReader.reset();
        if (typeof zxingReader.stopContinuousDecode === 'function') zxingReader.stopContinuousDecode();
      } catch (e) { /* */ }
      zxingReader = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    if (video) {
      try { video.pause(); } catch (e) { /* */ }
      video.srcObject = null;
    }
  }

  function cerrarEscaner() {
    abierto = false;
    yaLeyo = false;
    detenerCamara();
    document.removeEventListener('keydown', alTeclear);
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = video = msg = null;
  }

  function alTeclear(e) {
    if (e.key === 'Escape') cerrarEscaner();
  }

  function codigoLeido(codigo) {
    if (!abierto || yaLeyo) return;
    codigo = String(codigo || '').trim();
    // Debe ser un link de producto (?p=ID). Si no, avisar.
    var id = extraerIdProducto(codigo);
    if (!id) {
      mostrarMensaje('QR leído, pero no es un link de producto (?p=…). Probá de nuevo.');
      return;
    }
    yaLeyo = true;
    if (navigator.vibrate) {
      try { navigator.vibrate(60); } catch (e) { /* */ }
    }
    cerrarEscaner();
    // Texto COMPLETO del QR en el buscador (ej. https://mematalimon.com.ar/index.html?p=91)
    // logica.js extrae el id de ?p= y muestra el producto
    input.value = codigo;
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
  }

  var CONSTRAINTS = {
    audio: false,
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  };

  // ---------- Nativo (solo si soporta QR) ----------

  async function nativoSoportaQr() {
    if (!('BarcodeDetector' in window)) return false;
    try {
      var soportados = await window.BarcodeDetector.getSupportedFormats();
      return soportados && soportados.indexOf('qr_code') !== -1;
    } catch (e) {
      return false;
    }
  }

  async function iniciarNativo() {
    var detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    if (!abierto) { detenerCamara(); return; }

    video.srcObject = stream;
    await video.play();
    mostrarMensaje('Apuntá al QR del producto');

    var leyendo = false;
    timer = setInterval(async function () {
      if (!abierto || yaLeyo || leyendo || !video || video.readyState < 2) return;
      leyendo = true;
      try {
        var res = await detector.detect(video);
        for (var i = 0; i < res.length; i++) {
          if (valorUtil(res[i].rawValue)) {
            codigoLeido(res[i].rawValue);
            break;
          }
        }
      } catch (e) { /* seguir */ }
      leyendo = false;
    }, 200);
  }

  // ---------- ZXing (principal en la práctica) ----------

  function cargarZXing() {
    return new Promise(function (resolve, reject) {
      if (window.ZXing) return resolve(window.ZXing);
      var s = document.createElement('script');
      s.src = ZXING_URL;
      s.async = true;
      s.onload = function () { window.ZXing ? resolve(window.ZXing) : reject(new Error('zxing')); };
      s.onerror = function () { reject(new Error('zxing-load')); };
      document.head.appendChild(s);
    });
  }

  async function iniciarZXing() {
    mostrarMensaje('Preparando el escáner QR…');
    var ZX = await cargarZXing();
    if (!abierto) return;

    // Preferir lector solo QR si existe
    var Reader = ZX.BrowserQRCodeReader || ZX.BrowserMultiFormatReader;
    zxingReader = new Reader();

    mostrarMensaje('Apuntá al QR del producto');

    // decodeFromVideoDevice / decodeFromConstraints según versión
    if (typeof zxingReader.decodeFromConstraints === 'function') {
      var hintsOk = false;
      try {
        // MultiFormat: limitar a QR
        if (ZX.BarcodeFormat && ZX.DecodeHintType && zxingReader instanceof ZX.BrowserMultiFormatReader) {
          // nueva instancia con hints
          var hints = new Map();
          hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.QR_CODE]);
          hints.set(ZX.DecodeHintType.TRY_HARDER, true);
          zxingReader = new ZX.BrowserMultiFormatReader(hints, 200);
        }
      } catch (e) { /* default */ }

      zxingControls = await zxingReader.decodeFromConstraints(
        CONSTRAINTS,
        video,
        function (resultado, err) {
          if (resultado) codigoLeido(resultado.getText());
        }
      );
      return;
    }

    if (typeof zxingReader.decodeFromVideoDevice === 'function') {
      await zxingReader.decodeFromVideoDevice(
        undefined,
        video,
        function (resultado, err) {
          if (resultado) codigoLeido(resultado.getText());
        }
      );
      return;
    }

    // Fallback manual: stream + decode once loop
    stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
    if (!abierto) { detenerCamara(); return; }
    video.srcObject = stream;
    await video.play();

    timer = setInterval(async function () {
      if (!abierto || yaLeyo || !video) return;
      try {
        if (typeof zxingReader.decodeOnceFromVideoElement === 'function') {
          var r = await zxingReader.decodeOnceFromVideoElement(video);
          if (r) codigoLeido(r.getText());
        }
      } catch (e) {
        // NotFoundException es normal entre frames
      }
    }, 300);
  }

  // ---------- abrir ----------

  async function abrirEscaner() {
    if (abierto) return;

    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Este navegador no permite usar la cámara aquí. Probá en HTTPS o escribí el producto en el buscador.');
      return;
    }

    abierto = true;
    yaLeyo = false;
    crearVentana();
    document.addEventListener('keydown', alTeclear);
    mostrarMensaje('Abriendo la cámara…');

    try {
      // En la práctica ZXing lee mejor los QR de producto; nativo solo si QR está garantizado
      var usarNativo = await nativoSoportaQr();
      // En iOS Safari BarcodeDetector casi no existe; en Android a veces es irregular → ZXing por defecto
      var esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

      if (usarNativo && !esIOS) {
        try {
          await iniciarNativo();
          return;
        } catch (e) {
          if (e && (e.name === 'NotAllowedError' || e.name === 'NotFoundError')) throw e;
          detenerCamara();
          mostrarMensaje('Probando otro motor de lectura…');
        }
      }
      await iniciarZXing();
    } catch (e) {
      detenerCamara();
      var nombre = e && e.name;
      if (nombre === 'NotAllowedError') {
        mostrarMensaje('Falta permiso de cámara. Activalo en el navegador y reintentá.');
      } else if (nombre === 'NotFoundError') {
        mostrarMensaje('No se encontró cámara.');
      } else {
        console.error('Escáner QR:', e);
        mostrarMensaje('No se pudo iniciar el escáner. Escribí el producto a mano.');
      }
    }
  }

  btn.setAttribute('aria-label', 'Escanear código QR del producto');
  btn.setAttribute('title', 'Escanear QR del producto');
  btn.addEventListener('click', abrirEscaner);
})();
