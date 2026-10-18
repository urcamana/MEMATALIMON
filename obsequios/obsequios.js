(function () {
  /**
   * Ideas para regalar — Argentina
   * Ventana: 30 días antes → 7 días después.
   * always: true = siempre visible (van primero en las pestañas).
   * tipoFecha: 'fijo' | 'tercer_domingo' | 'segundo_lunes' | 'dia_256'
   */
  const EVENTOS = [
    // --- Siempre visibles (primero) ---
    { id: 'cumple', archivo: 'cumple.json', titulo: 'Cumpleaños', always: true },
    { id: 'graduaciones', archivo: 'graduaciones.json', titulo: 'Graduaciones', always: true },
    { id: 'aniversarios', archivo: 'aniversarios.json', titulo: 'Aniversarios', always: true },
    { id: 'amigo_invisible', archivo: 'amigo_invisible.json', titulo: 'Amigo invisible', always: true },
    { id: 'peques', archivo: 'peques.json', titulo: 'Para peques', always: true },

    // --- Temporada ---
    { id: 'enamorados', archivo: 'enamorados.json', titulo: 'San Valentín / Enamorados', always: false, tipoFecha: 'fijo', mes: 2, dia: 14 },
    { id: 'padre', archivo: 'padre.json', titulo: 'Día del Padre', always: false, tipoFecha: 'tercer_domingo', mes: 6 },
    { id: 'amigo', archivo: 'amigo.json', titulo: 'Día del Amigo', always: false, tipoFecha: 'fijo', mes: 7, dia: 20 },
    { id: 'profe', archivo: 'profe.json', titulo: 'Día del Maestro', always: false, tipoFecha: 'fijo', mes: 9, dia: 11 },
    { id: 'madre', archivo: 'madre.json', titulo: 'Día de la Madre', always: false, tipoFecha: 'tercer_domingo', mes: 10 },
    { id: 'navidad', archivo: 'navidad.json', titulo: 'Navidad', always: false, tipoFecha: 'fijo', mes: 12, dia: 25 },

    // --- Secundarias ---
    { id: 'novia', archivo: 'novia.json', titulo: 'Día de la Novia', always: false, tipoFecha: 'fijo', mes: 8, dia: 1 },
    { id: 'mujer', archivo: 'mujer.json', titulo: 'Día de la Mujer', always: false, tipoFecha: 'fijo', mes: 3, dia: 8 },
    { id: 'hombre', archivo: 'hombre.json', titulo: 'Día del Hombre', always: false, tipoFecha: 'fijo', mes: 11, dia: 19 },
    { id: 'niño', archivo: 'infancias.json', titulo: 'Día del Niño/a', always: false, tipoFecha: 'tercer_domingo', mes: 8 },

    // --- Profesiones (mismo nivel; sin array anidado) ---
    // Enero
    { id: 'musico', archivo: 'musico.json', titulo: 'Día del Músico', always: false, tipoFecha: 'fijo', mes: 1, dia: 23 },
    // Febrero
    { id: 'vitivinicola', archivo: 'vitivinicola.json', titulo: 'Día del Trabajador Vitivinícola', always: false, tipoFecha: 'fijo', mes: 2, dia: 1 },
    { id: 'guardavidas', archivo: 'guardavidas.json', titulo: 'Día del Guardavidas', always: false, tipoFecha: 'fijo', mes: 2, dia: 4 },
    { id: 'publicitario', archivo: 'publicitario.json', titulo: 'Día del Redactor Publicitario', always: false, tipoFecha: 'fijo', mes: 2, dia: 15 },
    { id: 'mecanico', archivo: 'mecanico.json', titulo: 'Día del Mecánico Automotor', always: false, tipoFecha: 'fijo', mes: 2, dia: 24 },
    // Marzo
    { id: 'transporte', archivo: 'transporte.json', titulo: 'Día del Trabajador del Transporte', always: false, tipoFecha: 'fijo', mes: 3, dia: 1 },
    { id: 'pizzero_pastelero', archivo: 'pizzero_pastelero.json', titulo: 'Día del Pizzero y Pastelero', always: false, tipoFecha: 'fijo', mes: 3, dia: 12 },
    { id: 'artesano', archivo: 'artesano.json', titulo: 'Día del Artesano', always: false, tipoFecha: 'fijo', mes: 3, dia: 19 },
    // Abril
    { id: 'viajante', archivo: 'viajante.json', titulo: 'Día del Viajante de Comercio', always: false, tipoFecha: 'fijo', mes: 4, dia: 10 },
    { id: 'kinesiologo', archivo: 'kinesiologo.json', titulo: 'Día del Kinesiólogo', always: false, tipoFecha: 'fijo', mes: 4, dia: 13 },
    { id: 'secretaria', archivo: 'secretaria.json', titulo: 'Día de la Secretaria', always: false, tipoFecha: 'fijo', mes: 4, dia: 26 },
    { id: 'disenador_interiores', archivo: 'disenador_interiores.json', titulo: 'Día del Diseñador de Interiores', always: false, tipoFecha: 'fijo', mes: 4, dia: 28 },
    // Mayo
    { id: 'actor', archivo: 'actor.json', titulo: 'Día del Actor', always: false, tipoFecha: 'segundo_lunes', mes: 5 },
    { id: 'disenador_moda', archivo: 'disenador_moda.json', titulo: 'Día del Diseñador de Moda', always: false, tipoFecha: 'fijo', mes: 5, dia: 15 },
    { id: 'gastronomico', archivo: 'gastronomico.json', titulo: 'Día del Trabajador Gastronómico', always: false, tipoFecha: 'fijo', mes: 5, dia: 25 },
    // Junio
    { id: 'periodista', archivo: 'periodista.json', titulo: 'Día del Periodista', always: false, tipoFecha: 'fijo', mes: 6, dia: 7 },
    { id: 'ingeniero', archivo: 'ingeniero.json', titulo: 'Día del Ingeniero', always: false, tipoFecha: 'fijo', mes: 6, dia: 16 },
    { id: 'barrabas', archivo: 'barrabas.json', titulo: 'Día del Barrero y Ceramista', always: false, tipoFecha: 'fijo', mes: 6, dia: 18 },
    { id: 'comercio_exterior', archivo: 'comercio_exterior.json', titulo: 'Día del Despachante de Aduana', always: false, tipoFecha: 'fijo', mes: 6, dia: 25 },
    // Julio
    { id: 'arquitecto', archivo: 'arquitecto.json', titulo: 'Día del Arquitecto', always: false, tipoFecha: 'fijo', mes: 7, dia: 1 },
    { id: 'locutor', archivo: 'locutor.json', titulo: 'Día del Locutor', always: false, tipoFecha: 'fijo', mes: 7, dia: 3 },
    { id: 'camionero', archivo: 'camionero.json', titulo: 'Día del Camionero', always: false, tipoFecha: 'fijo', mes: 7, dia: 26 },
    // Agosto
    { id: 'veterinario', archivo: 'veterinario.json', titulo: 'Día del Veterinario', always: false, tipoFecha: 'fijo', mes: 8, dia: 6 },
    { id: 'abogado', archivo: 'abogado.json', titulo: 'Día del Abogado', always: false, tipoFecha: 'fijo', mes: 8, dia: 29 },
    { id: 'almacenero', archivo: 'almacenero.json', titulo: 'Día del Almacenero', always: false, tipoFecha: 'fijo', mes: 8, dia: 31 },
    // Septiembre
    { id: 'inmobiliario', archivo: 'inmobiliario.json', titulo: 'Día del Corredor Inmobiliario', always: false, tipoFecha: 'fijo', mes: 9, dia: 4 },
    { id: 'bibliotecario', archivo: 'bibliotecario.json', titulo: 'Día del Bibliotecario', always: false, tipoFecha: 'fijo', mes: 9, dia: 13 },
    { id: 'programador', archivo: 'programador.json', titulo: 'Día del Programador', always: false, tipoFecha: 'dia_256', mes: 9 },
    { id: 'profesor', archivo: 'profesor.json', titulo: 'Día del Profesor', always: false, tipoFecha: 'fijo', mes: 9, dia: 17 },
    { id: 'fotografo', archivo: 'fotografo.json', titulo: 'Día del Fotógrafo', always: false, tipoFecha: 'fijo', mes: 9, dia: 21 },
    { id: 'empleado_comercio', archivo: 'empleado_comercio.json', titulo: 'Día del Empleado de Comercio', always: false, tipoFecha: 'fijo', mes: 9, dia: 26 },
    // Octubre
    { id: 'odontologo', archivo: 'odontologo.json', titulo: 'Día del Odontólogo', always: false, tipoFecha: 'fijo', mes: 10, dia: 3 },
    { id: 'farmaceutico', archivo: 'farmaceutico.json', titulo: 'Día del Farmacéutico', always: false, tipoFecha: 'fijo', mes: 10, dia: 12 },
    { id: 'psicologo', archivo: 'psicologo.json', titulo: 'Día del Psicólogo', always: false, tipoFecha: 'fijo', mes: 10, dia: 13 },
    { id: 'disenador_grafico', archivo: 'disenador_grafico.json', titulo: 'Día del Diseñador Gráfico', always: false, tipoFecha: 'fijo', mes: 10, dia: 24 },
    // Noviembre
    { id: 'bancario', archivo: 'bancario.json', titulo: 'Día del Bancario', always: false, tipoFecha: 'fijo', mes: 11, dia: 6 },
    { id: 'canillita', archivo: 'canillita.json', titulo: 'Día del Canillita', always: false, tipoFecha: 'fijo', mes: 11, dia: 7 },
    { id: 'municipal', archivo: 'municipal.json', titulo: 'Día del Empleado Municipal', always: false, tipoFecha: 'fijo', mes: 11, dia: 8 },
    { id: 'enfermeria', archivo: 'enfermeria.json', titulo: 'Día de la Enfermería', always: false, tipoFecha: 'fijo', mes: 11, dia: 21 },
    { id: 'quimico', archivo: 'quimico.json', titulo: 'Día del Químico', always: false, tipoFecha: 'fijo', mes: 11, dia: 26 },
    // Diciembre
    { id: 'medico', archivo: 'medico.json', titulo: 'Día del Médico', always: false, tipoFecha: 'fijo', mes: 12, dia: 3 },
    { id: 'ama_de_casa', archivo: 'ama_de_casa.json', titulo: 'Día del Ama de Casa', always: false, tipoFecha: 'fijo', mes: 12, dia: 9 },
    { id: 'optico', archivo: 'optico.json', titulo: 'Día del Óptico', always: false, tipoFecha: 'fijo', mes: 12, dia: 13 },
    { id: 'contador', archivo: 'contador.json', titulo: 'Día del Contador', always: false, tipoFecha: 'fijo', mes: 12, dia: 17 }
  ];

  const DIAS_ANTES = 30;
  const DIAS_DESPUES = 7;

  /** 3.er domingo del mes (mes 1–12) */
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

  /** 2.º lunes del mes (mes 1–12) */
  function segundoLunes(anio, mes) {
    var d = new Date(anio, mes - 1, 1);
    var lunesCount = 0;
    while (d.getMonth() === mes - 1) {
      if (d.getDay() === 1) {
        lunesCount++;
        if (lunesCount === 2) return new Date(anio, mes - 1, d.getDate());
      }
      d.setDate(d.getDate() + 1);
    }
    return new Date(anio, mes - 1, 8);
  }

  /** Día 256 del año (Día del Programador) */
  function dia256(anio) {
    var d = new Date(anio, 0, 1);
    d.setDate(256);
    return d;
  }

  function fechaEvento(ev, ref) {
    var y = ref.getFullYear();
    var d;
    if (ev.tipoFecha === 'tercer_domingo') {
      d = tercerDomingo(y, ev.mes);
      var fin = new Date(d);
      fin.setDate(fin.getDate() + DIAS_DESPUES);
      if (ref > fin) d = tercerDomingo(y + 1, ev.mes);
    } else if (ev.tipoFecha === 'segundo_lunes') {
      d = segundoLunes(y, ev.mes);
      var finL = new Date(d);
      finL.setDate(finL.getDate() + DIAS_DESPUES);
      if (ref > finL) d = segundoLunes(y + 1, ev.mes);
    } else if (ev.tipoFecha === 'dia_256') {
      d = dia256(y);
      var finP = new Date(d);
      finP.setDate(finP.getDate() + DIAS_DESPUES);
      if (ref > finP) d = dia256(y + 1);
    } else {
      // 'fijo'
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

    var cache = {};
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
