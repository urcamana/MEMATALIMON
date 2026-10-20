/* Códigos de barras EAN-13 · Me Mata Limón
 *
 * - "Desde un número de producto": arma un EAN-13 propio = "20" + número (10 dígitos) + verificador.
 *   (los prefijos 20 a 29 están reservados para códigos de uso interno de cada negocio).
 *   Coincide con la fórmula de Excel que usa la tienda, así el EAN de la planilla y el de la etiqueta son iguales.
 * - "Ya tengo el código": dibuja el EAN que viene en la caja (valida o calcula el último dígito).
 * - No usa datos de la tienda ni librerías externas: el código de barras se dibuja acá mismo en SVG.
 */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };

  // ---------- Tablas EAN-13 ----------
  var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  var G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  var R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
  var PARIDAD = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

  var MAX_RANGO = 200;
  var MAX_ETIQUETAS = 500;

  function digitoVerificador(d12) {
    var suma = 0;
    for (var i = 0; i < 12; i++) suma += Number(d12.charAt(i)) * (i % 2 === 0 ? 1 : 3);
    return (10 - (suma % 10)) % 10;
  }

  function eanDesdeNumero(numero) {
    var base = '20' + String(numero).padStart(10, '0');
    return base + digitoVerificador(base);
  }

  // 95 módulos: guarda + 6 dígitos + guarda central + 6 dígitos + guarda
  function patronEAN(ean) {
    var primero = Number(ean.charAt(0));
    var par = PARIDAD[primero];
    var p = '101';
    for (var i = 1; i <= 6; i++) {
      var d = Number(ean.charAt(i));
      p += par.charAt(i - 1) === 'L' ? L[d] : G[d];
    }
    p += '01010';
    for (var j = 7; j <= 12; j++) p += R[Number(ean.charAt(j))];
    p += '101';
    return p;
  }

  // ---------- Dibujo SVG (vectorial: sale nítido al imprimir) ----------
  var ZONA_IZQ = 11;     // zona de silencio izquierda (módulos)
  var ANCHO_TOTAL = 113; // 11 + 95 + 7
  var ALTO_BARRAS = 56;
  var ALTO_GUARDA = 61.5;
  var ALTO_TOTAL = 68;

  function esGuarda(m) {
    return m < 3 || (m >= 45 && m < 50) || m >= 92;
  }

  function svgEAN(ean) {
    var patron = patronEAN(ean);
    var rects = '';
    var m = 0;
    while (m < patron.length) {
      if (patron.charAt(m) === '1') {
        var ini = m;
        while (m < patron.length && patron.charAt(m) === '1') m++;
        var alto = esGuarda(ini) ? ALTO_GUARDA : ALTO_BARRAS;
        rects += '<rect x="' + (ZONA_IZQ + ini) + '" y="0" width="' + (m - ini) + '" height="' + alto + '"/>';
      } else {
        m++;
      }
    }

    var textos = '<text x="' + (ZONA_IZQ - 5.5) + '" y="65">' + ean.charAt(0) + '</text>';
    var k;
    for (k = 0; k < 6; k++) {
      textos += '<text x="' + (ZONA_IZQ + 3 + (k + 0.5) * 7) + '" y="65">' + ean.charAt(1 + k) + '</text>';
    }
    for (k = 0; k < 6; k++) {
      textos += '<text x="' + (ZONA_IZQ + 50 + (k + 0.5) * 7) + '" y="65">' + ean.charAt(7 + k) + '</text>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + ANCHO_TOTAL + ' ' + ALTO_TOTAL + '"' +
      ' preserveAspectRatio="xMidYMid meet" role="img" aria-label="Código de barras EAN-13 ' + ean + '">' +
      '<rect width="' + ANCHO_TOTAL + '" height="' + ALTO_TOTAL + '" fill="#fff"/>' +
      '<g fill="#000" shape-rendering="crispEdges">' + rects + '</g>' +
      '<g fill="#000" font-family="Arial, Helvetica, sans-serif" font-size="9" text-anchor="middle">' + textos + '</g>' +
      '</svg>';
  }

  // ---------- Estado e interfaz ----------
  var modo = 'id';
  var items = [];      // [{ numero, ean }]
  var tituloActual = '';

  function mostrarError(texto) {
    var e = $('#err');
    if (!texto) {
      e.classList.add('hidden');
      e.textContent = '';
      return;
    }
    e.textContent = texto;
    e.classList.remove('hidden');
  }

  function soloDigitos(v) {
    return String(v || '').replace(/\s+/g, '');
  }

  function leerItems() {
    var lista = [];
    var i;

    if (modo === 'id') {
      var d = soloDigitos($('#id-desde').value);
      var h = soloDigitos($('#id-hasta').value);

      if (!d) throw new Error('Escribí el número de producto.');
      if (!/^\d{1,10}$/.test(d)) throw new Error('El número de producto debe tener solo dígitos (hasta 10).');
      var desde = Number(d);
      if (desde < 1) throw new Error('El número de producto tiene que ser 1 o mayor.');

      var hasta = desde;
      if (h) {
        if (!/^\d{1,10}$/.test(h)) throw new Error('“Hasta” debe tener solo dígitos (hasta 10).');
        hasta = Number(h);
        if (hasta < desde) throw new Error('“Hasta” no puede ser menor que el número inicial.');
        if (hasta - desde + 1 > MAX_RANGO) throw new Error('El rango es muy grande: máximo ' + MAX_RANGO + ' códigos a la vez.');
      }
      for (i = desde; i <= hasta; i++) lista.push({ numero: String(i), ean: eanDesdeNumero(i) });
      return lista;
    }

    var lineas = $('#codigos').value.split(/\r?\n/)
      .map(function (l) { return l.replace(/[\s-]/g, ''); })
      .filter(Boolean);
    if (!lineas.length) throw new Error('Pegá al menos un código.');
    if (lineas.length > MAX_RANGO) throw new Error('Máximo ' + MAX_RANGO + ' códigos a la vez.');

    lineas.forEach(function (c, idx) {
      if (!/^\d{12,13}$/.test(c)) throw new Error('Línea ' + (idx + 1) + ': tiene que tener 12 o 13 dígitos solamente.');
      var base = c.slice(0, 12);
      var dv = digitoVerificador(base);
      if (c.length === 13 && Number(c.charAt(12)) !== dv) {
        throw new Error('Línea ' + (idx + 1) + ': el último dígito no coincide. Para ' + base + ' debería ser ' + dv + '.');
      }
      lista.push({ numero: '', ean: base + dv });
    });
    return lista;
  }

  function medida(id, minimo, maximo, porDefecto) {
    var v = Number($(id).value);
    if (!isFinite(v) || v <= 0) return porDefecto;
    return Math.min(maximo, Math.max(minimo, v));
  }

  function dibujarEtiquetas() {
    var ancho = medida('#ancho', 25, 200, 50);
    var alto = medida('#alto', 15, 120, 30);
    var copias = Math.round(medida('#copias', 1, 50, 1));
    var conBorde = $('#borde').checked;
    var titulo = $('#titulo').value.trim();
    tituloActual = titulo;

    if (items.length * copias > MAX_ETIQUETAS) {
      throw new Error('Son demasiadas etiquetas (' + (items.length * copias) + '). Máximo ' + MAX_ETIQUETAS + ' por vez.');
    }

    var cont = $('#hojas');
    cont.innerHTML = '';

    items.forEach(function (it) {
      for (var c = 0; c < copias; c++) {
        var etq = document.createElement('div');
        etq.className = 'etq' + (conBorde ? ' con-borde' : '');
        etq.style.width = ancho + 'mm';
        etq.style.height = alto + 'mm';

        if (titulo) {
          var t = document.createElement('div');
          t.className = 'etq-tit';
          t.textContent = titulo;
          etq.appendChild(t);
        }
        var cajaSvg = document.createElement('div');
        cajaSvg.className = 'etq-svg';
        cajaSvg.innerHTML = svgEAN(it.ean);
        etq.appendChild(cajaSvg);
        cont.appendChild(etq);
      }
    });

    var tbody = $('#tabla');
    tbody.innerHTML = '';
    items.forEach(function (it) {
      var tr = document.createElement('tr');
      tr.className = 'border-t border-primary/10';
      var a = document.createElement('td');
      a.className = 'px-3 py-1.5';
      a.textContent = it.numero || '—';
      var b = document.createElement('td');
      b.className = 'px-3 py-1.5';
      b.textContent = it.ean;
      tr.appendChild(a);
      tr.appendChild(b);
      tbody.appendChild(tr);
    });

    var total = items.length * copias;
    $('#resumen').textContent = items.length + (items.length === 1 ? ' código' : ' códigos') +
      ' · ' + total + (total === 1 ? ' etiqueta' : ' etiquetas') + ' de ' + ancho + ' × ' + alto + ' mm';

    // El PNG solo se ofrece cuando hay un único código
    $('#btn-png').classList.toggle('hidden', items.length !== 1);
    $('#btn-imprimir').classList.toggle('col-span-2', items.length !== 1);
  }

  function generar() {
    mostrarError('');
    try {
      items = leerItems();
      dibujarEtiquetas();
    } catch (e) {
      $('#sec-resultado').classList.add('hidden');
      mostrarError(e.message);
      return;
    }
    var sec = $('#sec-resultado');
    sec.classList.remove('hidden');
    sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- Acciones ----------
  function descargarPNG() {
    if (items.length !== 1) return;
    var ean = items[0].ean;
    var escala = 12; // 113 × 12 = 1356 px de ancho
    var svg = svgEAN(ean);
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = ANCHO_TOTAL * escala;
      canvas.height = ALTO_TOTAL * escala;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (png) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = 'EAN-' + ean + '.png';
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
          a.remove();
        }, 500);
      }, 'image/png');
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      mostrarError('No se pudo crear la imagen. Probá con “Imprimir” y guardá como PDF.');
    };
    img.src = url;
  }

  function copiarLista() {
    var texto = items.map(function (it) { return (it.numero || '') + '\t' + it.ean; }).join('\n');
    var btn = $('#btn-copiar');
    var aviso = function (t) {
      var original = btn.textContent;
      btn.textContent = t;
      setTimeout(function () { btn.textContent = original; }, 1600);
    };

    function respaldo() {
      var ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      aviso(ok ? '¡Copiado!' : 'No se pudo copiar');
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(function () { aviso('¡Copiado!'); }, respaldo);
    } else {
      respaldo();
    }
  }

  function cambiarModo(nuevo) {
    modo = nuevo;
    document.querySelectorAll('.modo').forEach(function (b) {
      var activo = b.getAttribute('data-modo') === nuevo;
      b.classList.toggle('active', activo);
      b.classList.toggle('border-2', activo);
      b.classList.toggle('border', !activo);
    });
    $('#campos-id').classList.toggle('hidden', nuevo !== 'id');
    $('#campos-codigo').classList.toggle('hidden', nuevo !== 'codigo');
    mostrarError('');
  }

  // ---------- Eventos ----------
  document.querySelectorAll('.modo').forEach(function (b) {
    b.addEventListener('click', function () { cambiarModo(b.getAttribute('data-modo')); });
  });

  document.querySelectorAll('.preset').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#ancho').value = b.getAttribute('data-w');
      $('#alto').value = b.getAttribute('data-h');
    });
  });

  $('#btn-gen').addEventListener('click', generar);
  ['#id-desde', '#id-hasta'].forEach(function (s) {
    $(s).addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); generar(); }
    });
  });
  $('#btn-imprimir').addEventListener('click', function () { window.print(); });
  $('#btn-png').addEventListener('click', descargarPNG);
  $('#btn-copiar').addEventListener('click', copiarLista);

  // Si cambian medidas, copias o texto con el resultado a la vista, se redibuja solo
  ['#ancho', '#alto', '#copias', '#borde', '#titulo'].forEach(function (s) {
    $(s).addEventListener('input', function () {
      if (!items.length || $('#sec-resultado').classList.contains('hidden')) return;
      try { dibujarEtiquetas(); mostrarError(''); } catch (e) { mostrarError(e.message); }
    });
  });

  // Para pruebas y para quien quiera reutilizar el cálculo desde la consola
  window.MMLBarras = { eanDesdeNumero: eanDesdeNumero, digitoVerificador: digitoVerificador, patronEAN: patronEAN, svgEAN: svgEAN };
})();
