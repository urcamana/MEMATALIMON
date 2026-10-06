(function () {
  /**
   * Ideas para regalar — Argentina
   * Ventana: 30 días antes → 7 días después.
   * always: true = siempre visible (van primero en las pestañas).
   * tipoFecha: 'fijo' | 'tercer_domingo' (Madre/Padre).
   */
  const EVENTOS = [
    // --- Siempre visibles (primero) ---
    { id: 'cumple', archivo: 'cumple.json', titulo: 'Cumpleaños', always: true },
    { id: 'graduaciones', archivo: 'graduaciones.json', titulo: 'Graduaciones', always: true },
    { id: 'aniversarios', archivo: 'aniversarios.json', titulo: 'Aniversarios', always: true },
    { id: 'amigo_invisible', archivo: 'amigo_invisible.json', titulo: 'Amigo invisible', always: true },
    { id: 'peques', archivo: 'peques.json', titulo: 'Para peques', always: true },
    // --- Temporada (al final; se ocultan fuera de ventana) ---
    { id: 'enamorados', archivo: 'enamorados.json', titulo: 'San Valentín / Enamorados', always: false, tipoFecha: 'fijo', mes: 2, dia: 14 },
    { id: 'padre', archivo: 'padre.json', titulo: 'Día del Padre', always: false, tipoFecha: 'tercer_domingo', mes: 6 },
    { id: 'amigo', archivo: 'amigo.json', titulo: 'Día del Amigo', always: false, tipoFecha: 'fijo', mes: 7, dia: 20 },
    { id: 'profe', archivo: 'profe.json', titulo: 'Día del Maestro', always: false, tipoFecha: 'fijo', mes: 9, dia: 11 },
    { id: 'madre', archivo: 'madre.json', titulo: 'Día de la Madre', always: false, tipoFecha: 'tercer_domingo', mes: 10 },
    { id: 'navidad', archivo: 'navidad.json', titulo: 'Navidad', always: false, tipoFecha: 'fijo', mes: 12, dia: 25 }
  ];

  const DIAS_ANTES = 30;
  const DIAS_DESPUES = 7;

  /** 3.er domingo del mes (1–12), año y */
  function tercerDomingo(anio, mes) {
    var d = new Date(anio, mes - 1, 1);
    var domingoCount = 0;
    while (d.getMonth() === mes - 1) {
      if (d.getDay() === 0) {
        domingoCount++;
        if (domingoCount === 3) return new Date(anio, mes - 1, d.getDate());
      }
      d.setDate(d.getDate() + 1);
    }
    return new Date(anio, mes - 1, 15);
  }

  function fechaEvento(ev, ref) {
    var y = ref.getFullYear();
    var d;
    if (ev.tipoFecha === 'tercer_domingo') {
      d = tercerDomingo(y, ev.mes);
      var fin = new Date(d);
      fin.setDate(fin.getDate() + DIAS_DESPUES);
      if (ref > fin) d = tercerDomingo(y + 1, ev.mes);
    } else {
      d = new Date(y, (ev.mes || 1) - 1, ev.dia || 1);
      var fin2 = new Date(d);
      fin2.setDate(fin2.getDate() + DIAS_DESPUES);
      if (ref > fin2) d = new Date(y + 1, (ev.mes || 1) - 1, ev.dia || 1);
    }
    return d;
  }

  function estaEnVentana(ev, hoy) {
    if (ev.always) return true;
    var evento = fechaEvento(ev, hoy);
    var inicio = new Date(evento);
    inicio.setDate(inicio.getDate() - DIAS_ANTES);
    var fin = new Date(evento);
    fin.setDate(fin.getDate() + DIAS_DESPUES);
    return hoy >= inicio && hoy <= fin;
  }

  function formatearFecha(d) {
    try {
      return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    }
  }

  function precioAR(prod) {
    try {
      var venta = Number(String(prod.Venta || 0).replace(/,/g, '.'));
      var desc = Number(String(prod.Descuento || 0).replace(/,/g, '.'));
      var final = desc ? venta * (1 - desc) : venta;
      return Math.round(final).toLocaleString('es-AR');
    } catch (e) {
      return prod.Venta || '—';
    }
  }

  function tarjeta(prod, texto) {
    var id = prod.Artículo;
    var nombre = prod.Descripción || 'Producto';
    var img = '../imgcarrito/' + id + '.jpg';
    var link = '../index.html?p=' + encodeURIComponent(id);
    return (
      '<div class="col-6 col-md-4">' +
        '<div class="card h-100 rec-card shadow-sm">' +
          '<img src="' + img + '" class="card-img-top rec-img" alt="' + String(nombre).replace(/"/g, '&quot;') + '" onerror="this.src=\'../imgcarrito/IMGND.jpg\'">' +
          '<div class="card-body d-flex flex-column">' +
            '<h3 class="h6 fw-bold">' + nombre + '</h3>' +
            '<p class="text-danger fw-semibold mb-2">$' + precioAR(prod) + '</p>' +
            '<p class="small text-secondary flex-grow-1">' + (texto || '') + '</p>' +
            '<a href="' + link + '" class="btn btn-dark btn-sm rounded-pill mt-2">Ver en la tienda</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /** Devuelve { html, productos: [{prod, texto}] } */
  async function cargarProductosEvento(archivo, articulos) {
    var res = await fetch('./' + archivo);
    if (!res.ok) throw new Error('No se pudo cargar ' + archivo);
    var lista = await res.json();
    var mapa = {};
    articulos.forEach(function (p) { mapa[p.Artículo] = p; });

    var cols = [];
    var productos = [];
    (lista || []).forEach(function (item) {
      var prod = mapa[item.id];
      if (!prod) return;
      if (Number(prod.Inventario) < 1) return;
      cols.push(tarjeta(prod, item.texto));
      productos.push({ prod: prod, texto: item.texto || '' });
    });
    if (!cols.length) {
      return {
        html: '<div class="col-12 text-muted small">Por ahora no hay productos cargados para esta ocasión (revisá el JSON o el stock).</div>',
        productos: []
      };
    }
    return { html: cols.join(''), productos: productos };
  }

  async function init() {
    var tabsEl = document.getElementById('tabsEventos');
    var panelEl = document.getElementById('panelEvento');
    var sin = document.getElementById('sinEventos');
    var ruletaResultado = document.getElementById('ruletaResultado');
    var btnRuleta = document.getElementById('btnRuletaRegalo');
    if (!tabsEl || !panelEl) return;

    var hoy = new Date();
    hoy.setHours(12, 0, 0, 0);

    // Orden del array EVENTOS ya es: always primero, temporada al final
    var visibles = EVENTOS.filter(function (ev) { return estaEnVentana(ev, hoy); });
    if (!visibles.length) {
      if (sin) sin.classList.remove('d-none');
      return;
    }

    var articulos = [];
    try {
      var r = await fetch('../articulos.json');
      articulos = await r.json();
    } catch (e) {
      panelEl.innerHTML = '<div class="alert alert-warning">No se pudo cargar el catálogo (<code>articulos.json</code>).</div>';
      return;
    }

    var activoId = 'cumple';
    if (!visibles.some(function (e) { return e.id === activoId; })) {
      activoId = visibles[0].id;
    }

    var cache = {}; // id -> { html, productos }
    var productosActivos = [];

    function actualizarRuletaUI() {
      if (!btnRuleta) return;
      if (productosActivos.length < 1) {
        btnRuleta.disabled = true;
        btnRuleta.title = 'No hay productos en esta ocasión';
      } else {
        btnRuleta.disabled = false;
        btnRuleta.title = 'Elegí un regalo al azar de esta pestaña';
      }
      if (ruletaResultado) ruletaResultado.innerHTML = '';
    }

    function renderTabs() {
      tabsEl.innerHTML = '';
      visibles.forEach(function (ev) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'obsequio-tab' + (ev.id === activoId ? ' active' : '');
        btn.setAttribute('role', 'tab');
        btn.dataset.tab = ev.id;

        var label = document.createElement('span');
        label.className = 'd-block';
        label.textContent = ev.titulo;
        btn.appendChild(label);

        // Fecha solo en eventos de calendario (no always)
        if (!ev.always) {
          var fe = fechaEvento(ev, hoy);
          var sub = document.createElement('span');
          sub.className = 'd-block small';
          sub.style.fontWeight = '500';
          sub.style.opacity = '0.85';
          sub.style.fontSize = '0.7rem';
          sub.style.marginTop = '0.15rem';
          sub.textContent = formatearFecha(fe);
          btn.appendChild(sub);
        }

        btn.addEventListener('click', function () {
          activoId = ev.id;
          renderTabs();
          mostrarPanel(ev);
        });
        tabsEl.appendChild(btn);
      });
    }

    async function mostrarPanel(ev) {
      panelEl.innerHTML = '<div class="text-center text-muted small py-4">Cargando…</div>';
      productosActivos = [];
      actualizarRuletaUI();
      try {
        if (!cache[ev.id]) {
          cache[ev.id] = await cargarProductosEvento(ev.archivo, articulos);
        }
        var data = cache[ev.id];
        panelEl.innerHTML = '<div class="row g-3 justify-content-center">' + data.html + '</div>';
        productosActivos = data.productos || [];
        actualizarRuletaUI();
      } catch (err) {
        panelEl.innerHTML = '<div class="text-danger small">No se pudo cargar <code>' + ev.archivo + '</code>.</div>';
        productosActivos = [];
        actualizarRuletaUI();
      }
    }

    if (btnRuleta) {
      btnRuleta.addEventListener('click', function () {
        if (!productosActivos.length || !ruletaResultado) return;
        btnRuleta.disabled = true;
        ruletaResultado.innerHTML = '<p class="text-muted small mb-0">Eligiendo…</p>';

        var pasos = 12 + Math.floor(Math.random() * 8);
        var i = 0;
        var timer = setInterval(function () {
          var idx = i % productosActivos.length;
          var p = productosActivos[idx].prod;
          ruletaResultado.innerHTML =
            '<div class="ruleta-spin text-muted small">' + (p.Descripción || '') + '</div>';
          i++;
          if (i >= pasos) {
            clearInterval(timer);
            var elegido = productosActivos[Math.floor(Math.random() * productosActivos.length)];
            var prod = elegido.prod;
            var id = prod.Artículo;
            var nombre = prod.Descripción || 'Producto';
            var img = '../imgcarrito/' + id + '.jpg';
            var link = '../index.html?p=' + encodeURIComponent(id);
            ruletaResultado.innerHTML =
              '<div class="card ruleta-card shadow-sm mx-auto" style="max-width:280px;">' +
                '<img src="' + img + '" class="card-img-top" alt="" style="height:160px;object-fit:contain;background:#f5f5f5;" onerror="this.src=\'../imgcarrito/IMGND.jpg\'">' +
                '<div class="card-body text-center">' +
                  '<p class="small text-muted mb-1">Tu idea de regalo</p>' +
                  '<h3 class="h6 fw-bold">' + nombre + '</h3>' +
                  '<p class="text-danger fw-semibold mb-2">$' + precioAR(prod) + '</p>' +
                  (elegido.texto ? '<p class="small text-secondary">' + elegido.texto + '</p>' : '') +
                  '<a href="' + link + '" class="btn btn-dark btn-sm rounded-pill">Ver en la tienda</a>' +
                '</div>' +
              '</div>';
            btnRuleta.disabled = false;
          }
        }, 80);
      });
    }

    renderTabs();
    var inicial = visibles.find(function (e) { return e.id === activoId; }) || visibles[0];
    mostrarPanel(inicial);
  }

  init();
})();
