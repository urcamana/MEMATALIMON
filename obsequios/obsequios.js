(function () {
  // Fechas de referencia (Argentina). Ventana: 30 días antes → 7 días después.
  // always: true = siempre visible
  const EVENTOS = [
    { id: 'cumple', archivo: 'cumple.json', titulo: 'Cumpleaños', always: true },
    { id: 'graduaciones', archivo: 'graduaciones.json', titulo: 'Graduaciones', always: true },
    { id: 'aniversarios', archivo: 'aniversarios.json', titulo: 'Aniversarios', always: true },
    { id: 'amigo_invisible', archivo: 'amigo_invisible.json', titulo: 'Amigo invisible', always: true },
    { id: 'enamorados', archivo: 'enamorados.json', titulo: 'San Valentín / Enamorados', always: false, mes: 2, dia: 14 },
    { id: 'padre', archivo: 'padre.json', titulo: 'Día del Padre', always: false, mes: 6, dia: 15 }, // 3er domingo ~junio
    { id: 'amigo', archivo: 'amigo.json', titulo: 'Día del Amigo', always: false, mes: 7, dia: 20 },
    { id: 'peques', archivo: 'peques.json', titulo: 'Día del Niño', always: false, mes: 8, dia: 10 }, // 2do domingo ~agosto
    { id: 'profe', archivo: 'profe.json', titulo: 'Día del Maestro', always: false, mes: 9, dia: 11 },
    { id: 'madre', archivo: 'madre.json', titulo: 'Día de la Madre', always: false, mes: 10, dia: 18 }, // 3er domingo ~octubre
    { id: 'navidad', archivo: 'navidad.json', titulo: 'Navidad y Reyes', always: false, mes: 12, dia: 25 }
  ];

  const DIAS_ANTES = 30;
  const DIAS_DESPUES = 7;

  function precioAR(prod) {
    let p = Number(String(prod.Venta).replace(/,/g, '.')) * Number(prod.DOLAR || 1);
    if (prod.Descuento != 0 && prod.Descuento != '0') {
      const d = Number(String(prod.Descuento).replace(/,/g, '.'));
      p = p * (1 - d);
    }
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);
  }

  function fechaEventoEsteAnio(mes, dia, ref) {
    const y = ref.getFullYear();
    let d = new Date(y, mes - 1, dia);
    // Si ya pasó la ventana de "después", usar el del año siguiente
    const fin = new Date(d);
    fin.setDate(fin.getDate() + DIAS_DESPUES);
    if (ref > fin) {
      d = new Date(y + 1, mes - 1, dia);
    }
    return d;
  }

  function estaEnVentana(ev, hoy) {
    if (ev.always) return true;
    const evento = fechaEventoEsteAnio(ev.mes, ev.dia, hoy);
    const inicio = new Date(evento);
    inicio.setDate(inicio.getDate() - DIAS_ANTES);
    const fin = new Date(evento);
    fin.setDate(fin.getDate() + DIAS_DESPUES);
    return hoy >= inicio && hoy <= fin;
  }

  function tarjeta(prod, texto) {
    const id = prod.Artículo;
    const nombre = prod.Descripción || 'Producto';
    const img = '../imgcarrito/' + id + '.jpg';
    const link = '../index.html?p=' + encodeURIComponent(id);
    return (
      '<div class="col-12 col-sm-6 col-md-4">' +
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

  async function cargarProductosEvento(archivo, articulos) {
    const res = await fetch('./' + archivo);
    if (!res.ok) throw new Error('No se pudo cargar ' + archivo);
    const lista = await res.json();
    const mapa = {};
    articulos.forEach(function (p) { mapa[p.Artículo] = p; });

    const cols = [];
    (lista || []).forEach(function (item) {
      const prod = mapa[item.id];
      if (!prod) return;
      if (Number(prod.Inventario) < 1) return;
      cols.push(tarjeta(prod, item.texto));
    });
    if (!cols.length) {
      return '<div class="col-12 text-muted small">Por ahora no hay productos cargados para esta ocasión (revisá el JSON o el stock).</div>';
    }
    return cols.join('');
  }

  async function init() {
    const cont = document.getElementById('listaEventos');
    const sin = document.getElementById('sinEventos');
    if (!cont) return;

    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);

    const visibles = EVENTOS.filter(function (ev) { return estaEnVentana(ev, hoy); });
    if (!visibles.length) {
      if (sin) sin.classList.remove('d-none');
      return;
    }

    let articulos = [];
    try {
      const r = await fetch('../articulos.json');
      articulos = await r.json();
    } catch (e) {
      cont.innerHTML = '<div class="alert alert-warning">No se pudo cargar el catálogo (<code>articulos.json</code>).</div>';
      return;
    }

    cont.innerHTML = '';

    visibles.forEach(function (ev) {
      const bloque = document.createElement('div');
      bloque.className = 'obsequio-evento';
      bloque.innerHTML =
        '<button type="button" class="btn btn-obsequio-titulo w-100" aria-expanded="false" data-ev="' + ev.id + '">' +
          ev.titulo +
          ' <span class="obsequio-chevron">▼</span>' +
        '</button>' +
        '<div class="obsequio-panel d-none">' +
          '<div class="row g-3 justify-content-center py-3" data-panel="' + ev.id + '">' +
            '<div class="col-12 text-center text-muted small">Cargando…</div>' +
          '</div>' +
        '</div>';
      cont.appendChild(bloque);

      const btn = bloque.querySelector('button');
      const panel = bloque.querySelector('.obsequio-panel');
      const grid = bloque.querySelector('[data-panel]');
      let cargado = false;

      btn.addEventListener('click', async function () {
        const abierto = !panel.classList.contains('d-none');
        // Cerrar otros
        cont.querySelectorAll('.obsequio-panel').forEach(function (p) { p.classList.add('d-none'); });
        cont.querySelectorAll('.btn-obsequio-titulo').forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
          const ch = b.querySelector('.obsequio-chevron');
          if (ch) ch.textContent = '▼';
        });
        if (abierto) return;

        panel.classList.remove('d-none');
        btn.setAttribute('aria-expanded', 'true');
        const ch = btn.querySelector('.obsequio-chevron');
        if (ch) ch.textContent = '▲';

        if (!cargado) {
          try {
            grid.innerHTML = await cargarProductosEvento(ev.archivo, articulos);
            cargado = true;
          } catch (err) {
            grid.innerHTML = '<div class="col-12 text-danger small">No se pudo cargar <code>' + ev.archivo + '</code>.</div>';
          }
        }
      });
    });
  }

  init();
})();
