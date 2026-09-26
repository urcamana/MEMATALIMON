(function () {
  function precioAR(prod) {
    let p = Number(String(prod.Venta).replace(/,/g, '.')) * Number(prod.DOLAR || 1);
    if (prod.Descuento != 0 && prod.Descuento != '0') {
      const d = Number(String(prod.Descuento).replace(/,/g, '.'));
      p = p * (1 - d);
    }
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);
  }

  function leerFavoritos() {
    try {
      const raw = JSON.parse(localStorage.getItem('favoritos_limon') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(function (id) { return parseInt(id, 10); }).filter(function (id) { return !isNaN(id); });
    } catch (e) { return []; }
  }

  function leerVistos() {
    try {
      const raw = JSON.parse(localStorage.getItem('vistos_limon') || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(function (id) { return parseInt(id, 10); }).filter(function (id) { return !isNaN(id); });
    } catch (e) { return []; }
  }

  function guardarFavoritos(lista) {
    localStorage.setItem('favoritos_limon', JSON.stringify(lista));
  }

  function registrarVistoLocal(id) {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) return;
    let lista = leerVistos().filter(function (n) { return n !== idNum; });
    lista.unshift(idNum);
    if (lista.length > 12) lista = lista.slice(0, 12);
    localStorage.setItem('vistos_limon', JSON.stringify(lista));
  }

  function toggleFavoritoLocal(id) {
    const idNum = parseInt(id, 10);
    let lista = leerFavoritos();
    const idx = lista.indexOf(idNum);
    if (idx === -1) lista.push(idNum);
    else lista.splice(idx, 1);
    guardarFavoritos(lista);
    registrarVistoLocal(idNum);
    return lista.indexOf(idNum) !== -1;
  }

  function urlProducto(articuloId) {
    try {
      const u = new URL(window.location.href);
      u.pathname = u.pathname.replace(/testimonios\.html.*/i, 'index.html');
      if (!/index\.html$/i.test(u.pathname)) {
        u.pathname = u.pathname.replace(/\/?$/, '/') + 'index.html';
      }
      u.search = '';
      u.hash = '';
      u.searchParams.set('p', String(articuloId));
      return u.toString();
    } catch (e) {
      return 'index.html?p=' + encodeURIComponent(articuloId);
    }
  }

  async function compartirProducto(articuloId, nombre, precio) {
    const url = urlProducto(articuloId);
    const titulo = nombre || 'Producto Me Mata Limón';
    const texto = precio
      ? '¡Mirá esto de Me Mata Limón!\n' + titulo + '\nPrecio: $' + precio + '\n' + url
      : '¡Mirá esto de Me Mata Limón!\n' + titulo + '\n' + url;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url: url });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(texto);
      alert('Listo: se copió el texto con el link para compartir.');
    } catch (e) {
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
    }
  }

  function tarjetaProducto(prod, texto, esFavoritoSlot) {
    const id = prod.Artículo;
    const nombre = prod.Descripción || 'Producto';
    const img = './imgcarrito/' + id + '.jpg';
    const link = 'index.html?p=' + encodeURIComponent(id);
    const precio = precioAR(prod);
    const favs = leerFavoritos();
    const esFav = favs.indexOf(Number(id)) !== -1;
    const badge = esFavoritoSlot
      ? '<span class="badge-rec-fav">De tus favoritos</span>'
      : '';
    return (
      '<div class="col-12 col-md-4">' +
        '<div class="card h-100 rec-card shadow-sm' + (esFavoritoSlot ? ' rec-card-fav' : '') + '">' +
          '<div class="rec-img-wrap">' +
            badge +
            '<button type="button" class="btn-fav-rec" data-id="' + id + '" title="Favorito" aria-label="Favorito">' +
              (esFav ? '❤️' : '🤍') +
            '</button>' +
            '<button type="button" class="btn-share-rec" data-id="' + id + '" data-nombre="' + String(nombre).replace(/"/g, '&quot;') + '" data-precio="' + precio + '" title="Compartir" aria-label="Compartir">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/></svg>' +
            '</button>' +
            '<img src="' + img + '" class="card-img-top rec-img" alt="' + String(nombre).replace(/"/g, '&quot;') + '" onerror="this.src=\'./imgcarrito/IMGND.jpg\'">' +
          '</div>' +
          '<div class="card-body d-flex flex-column">' +
            '<h3 class="h6 fw-bold">' + nombre + '</h3>' +
            '<p class="text-danger fw-semibold mb-2">$' + precio + '</p>' +
            (texto ? '<p class="small text-secondary flex-grow-1">' + texto + '</p>' : '<div class="flex-grow-1"></div>') +
            '<a href="' + link + '" class="btn btn-dark btn-sm rounded-pill mt-2">Ver en la tienda</a>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindCardActions(root) {
    if (!root) return;
    root.querySelectorAll('.btn-fav-rec').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const ahora = toggleFavoritoLocal(id);
        btn.textContent = ahora ? '❤️' : '🤍';
      });
    });
    root.querySelectorAll('.btn-share-rec').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const sid = btn.getAttribute('data-id');
        registrarVistoLocal(sid);
        compartirProducto(sid, btn.getAttribute('data-nombre'), btn.getAttribute('data-precio'));
      });
    });
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

      const favs = leerFavoritos();
      if (lista.length >= 2 && favs.length > 0) {
        const idsFijos = {};
        lista.forEach(function (item, idx) {
          if (idx !== 1) idsFijos[String(item.id)] = true;
        });
        let elegido = null;
        for (let i = 0; i < favs.length; i++) {
          const prod = byId[String(favs[i])];
          if (!prod || Number(prod.Inventario) < 1) continue;
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

      cont.innerHTML = lista.map(function (r) {
        const prod = byId[String(r.id)];
        if (!prod) {
          return '<div class="col-12 col-md-4"><div class="alert alert-light border">No se encontró el artículo ID ' + r.id + '</div></div>';
        }
        return tarjetaProducto(prod, r.texto, r.esFavorito);
      }).join('') || '<div class="col-12 text-secondary">No hay recomendaciones cargadas.</div>';
      bindCardActions(cont);
    } catch (e) {
      cont.innerHTML = '<div class="col-12 text-danger">No se pudieron cargar las recomendaciones.</div>';
      console.warn(e);
    }
  }

  async function cargarUltimosVistos() {
    const cont = document.getElementById('listaUltimosVistos');
    if (!cont) return;
    try {
      const arts = await fetch('./articulos.json').then(r => r.json());
      const byId = {};
      arts.forEach(a => { byId[String(a.Artículo)] = a; });

      let ids = leerVistos().slice(0, 6);
      if (!ids.length) {
        ids = leerFavoritos().slice().reverse().slice(0, 6);
      }

      const cards = [];
      const usados = {};
      ids.forEach(function (id) {
        const key = String(id);
        if (usados[key]) return;
        const prod = byId[key];
        if (!prod) return;
        if (Number(prod.Inventario) < 1) return;
        usados[key] = true;
        cards.push(tarjetaProducto(prod, '', false));
      });

      if (!cards.length) {
        cont.innerHTML = '<div class="col-12 text-secondary small">Cuando agregues productos al carrito o los marques como favoritos en la tienda, van a aparecer acá.</div>';
        return;
      }
      cont.innerHTML = cards.join('');
      bindCardActions(cont);
    } catch (e) {
      console.warn(e);
      cont.innerHTML = '<div class="col-12 text-secondary">No se pudieron cargar los últimos vistos.</div>';
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
      interval: false, ride: false, wrap: true, touch: true, keyboard: true
    });
    inner.querySelectorAll('.galeria-img').forEach(function (img) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', function (e) {
        e.preventDefault();
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
  cargarUltimosVistos();
})();
