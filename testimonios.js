(function () {
  function precioAR(prod) {
    let p = Number(String(prod.Venta).replace(/,/g, '.')) * Number(prod.DOLAR || 1);
    if (prod.Descuento != 0 && prod.Descuento != '0') {
      const d = Number(String(prod.Descuento).replace(/,/g, '.'));
      p = p * (1 - d);
    }
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);
  }

  function tarjetaRecomendado(prod, texto, esFavorito) {
    const id = prod.Artículo;
    const nombre = prod.Descripción || 'Producto';
    const img = './imgcarrito/' + id + '.jpg';
    const link = 'index.html?p=' + encodeURIComponent(id);
    const badge = esFavorito
      ? '<span class="badge-rec-fav">De tus favoritos</span>'
      : '';
    return (
      '<div class="col-12 col-md-4">' +
        '<div class="card h-100 rec-card shadow-sm' + (esFavorito ? ' rec-card-fav' : '') + '">' +
          badge +
          '<img src="' + img + '" class="card-img-top rec-img" alt="' + nombre.replace(/"/g, '&quot;') + '" onerror="this.src=\'./imgcarrito/IMGND.jpg\'">' +
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

  /** Favoritos del cliente (mismo localStorage que la tienda). */
  function leerFavoritosCliente() {
    try {
      const raw = JSON.parse(localStorage.getItem('favoritos_limon') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(function (id) { return parseInt(id, 10); }).filter(function (id) { return !isNaN(id); });
    } catch (e) {
      return [];
    }
  }

  async function cargarRecomendados() {
    const cont = document.getElementById('listaRecomendados');
    if (!cont) return;
    try {
      const [recs, arts] = await Promise.all([
        fetch('./recomendaciones.json').then(r => r.json()),
        fetch('./articulos.json').then(r => r.json())
      ]);
      const byId = {};
      arts.forEach(a => { byId[String(a.Artículo)] = a; });

      let lista = (recs || []).map(function (r) {
        return { id: r.id, texto: r.texto || '', esFavorito: false };
      });

      // Si hay favoritos del cliente, el del MEDIO (índice 1) se personaliza
      const favs = leerFavoritosCliente();
      if (lista.length >= 2 && favs.length > 0) {
        const idsFijos = {};
        lista.forEach(function (item, idx) {
          if (idx !== 1) idsFijos[String(item.id)] = true;
        });
        let elegido = null;
        for (let i = 0; i < favs.length; i++) {
          const prod = byId[String(favs[i])];
          if (!prod) continue;
          if (Number(prod.Inventario) < 1) continue;
          if (idsFijos[String(favs[i])]) continue;
          elegido = favs[i];
          break;
        }
        if (elegido != null) {
          lista[1] = {
            id: elegido,
            texto: 'Lo guardaste en favoritos. ¿Todavía te interesa?',
            esFavorito: true
          };
        }
      }

      const html = lista.map(function (r) {
        const prod = byId[String(r.id)];
        if (!prod) {
          return '<div class="col-12 col-md-4"><div class="alert alert-light border">No se encontró el artículo ID ' + r.id + '</div></div>';
        }
        return tarjetaRecomendado(prod, r.texto, r.esFavorito);
      }).join('');
      cont.innerHTML = html || '<div class="col-12 text-secondary">No hay recomendaciones cargadas.</div>';
    } catch (e) {
      cont.innerHTML = '<div class="col-12 text-danger">No se pudieron cargar las recomendaciones. Revisá <code>recomendaciones.json</code> y <code>articulos.json</code>.</div>';
      console.warn(e);
    }
  }

  function descubrirImagenes(carpeta, max) {
    max = max || 40;
    const pruebas = [];
    for (let i = 1; i <= max; i++) {
      const src = carpeta + '/' + i + '.jpg';
      pruebas.push(new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { resolve({ i: i, src: src }); };
        img.onerror = function () { resolve(null); };
        img.src = src;
      }));
    }
    return Promise.all(pruebas).then(function (results) {
      const paths = [];
      for (let i = 1; i <= max; i++) {
        const hit = results.find(function (r) { return r && r.i === i; });
        if (!hit) break;
        paths.push(hit.src);
      }
      return paths;
    });
  }

  function pintarCarrusel(carouselId, innerId, paths, mensajeVacio) {
    const inner = document.getElementById(innerId);
    const carouselEl = document.getElementById(carouselId);
    if (!inner || !carouselEl) return;

    if (!paths.length) {
      inner.innerHTML = '<div class="carousel-item active"><div class="galeria-placeholder">' + mensajeVacio + '</div></div>';
    } else {
      inner.innerHTML = paths.map(function (src, idx) {
        return (
          '<div class="carousel-item' + (idx === 0 ? ' active' : '') + '">' +
            '<img src="' + src + '" class="d-block galeria-img" alt="Foto ' + (idx + 1) + '" draggable="false">' +
          '</div>'
        );
      }).join('');
    }

    try {
      const prev = bootstrap.Carousel.getInstance(carouselEl);
      if (prev) prev.dispose();
    } catch (e) {}

    const inst = bootstrap.Carousel.getOrCreateInstance(carouselEl, {
      interval: false,
      ride: false,
      wrap: true,
      touch: true,
      keyboard: true
    });

    inner.querySelectorAll('.galeria-img').forEach(function (img) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        inst.next();
      });
    });
  }

  async function cargarGalerias() {
    const [ustedes, nosotros] = await Promise.all([
      descubrirImagenes('ustedes', 40),
      descubrirImagenes('nosotros', 40)
    ]);
    pintarCarrusel('carruselUstedes', 'ustedesInner', ustedes, 'Pronto vas a ver acá fotos de la comunidad.');
    pintarCarrusel('carruselNosotros', 'nosotrosInner', nosotros, 'Pronto vas a ver acá productos que usamos nosotros.');
  }

  cargarRecomendados();
  cargarGalerias();
})();
