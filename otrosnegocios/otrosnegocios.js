/**
 * otrosnegocios.js
 * Lógica propia para /otrosnegocios/ (no toca logica.js de la web principal)
 *
 * Preferencia negocios:
 *   - preferencia > 0 : se ordenan de menor a mayor (1 primero, luego 2, etc.)
 *   - mismo número   : se mezclan entre ellos
 *   - preferencia 0  : van al final, en orden aleatorio
 *   - sin límite de cantidad por nivel ni de número máximo
 *
 * Productos: prioriza por categorías de favoritos_limon + vistos_limon
 * Imágenes: lazy (principal al inicio, B/C al hover)
 * Compartir (solo productos): comparte el link de afiliado
 */

(function () {
  "use strict";

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function formatFecha(iso) {
    if (!iso) return "";
    try {
      const [y, m, d] = iso.split("-");
      return `Actualizado el ${d}/${m}/${y}`;
    } catch (e) {
      return "Actualizado: " + iso;
    }
  }

  async function cargarJSON(ruta) {
    const res = await fetch(ruta + "?v=" + Date.now());
    if (!res.ok) throw new Error("No se pudo cargar " + ruta);
    return res.json();
  }

  // =====================================================
  // ORDEN NEGOCIOS
  // preferencia > 0 ordenados ascendente; 0 al final aleatorio
  // =====================================================
  function ordenarNegocios(lista) {
    const porNivel = {};
    const aleatorios = [];

    lista.forEach((item) => {
      const pref = Number(item.preferencia);
      if (pref > 0 && !isNaN(pref)) {
        if (!porNivel[pref]) porNivel[pref] = [];
        porNivel[pref].push(item);
      } else {
        aleatorios.push(item);
      }
    });

    const niveles = Object.keys(porNivel)
      .map(Number)
      .sort((a, b) => a - b);

    const resultado = [];
    niveles.forEach((n) => {
      resultado.push(...shuffle(porNivel[n]));
    });
    resultado.push(...shuffle(aleatorios));
    return resultado;
  }

  // =====================================================
  // ORDEN PRODUCTOS (favoritos / vistos del usuario)
  // =====================================================
  async function obtenerCategoriasPreferidas() {
    let ids = [];
    try {
      const favs = JSON.parse(localStorage.getItem("favoritos_limon") || "[]");
      const vistos = JSON.parse(localStorage.getItem("vistos_limon") || "[]");
      ids = [...new Set([...favs, ...vistos].map(Number).filter((n) => !isNaN(n)))];
    } catch (e) {
      return [];
    }
    if (ids.length === 0) return [];

    try {
      const articulos = await cargarJSON("../articulos.json");
      const cats = new Set();
      articulos.forEach((p) => {
        if (ids.includes(Number(p.Artículo)) && p.Categoria) {
          cats.add(String(p.Categoria).trim());
        }
      });
      return Array.from(cats);
    } catch (e) {
      console.warn("No se pudo leer articulos.json:", e);
      return [];
    }
  }

  function ordenarProductos(lista, categoriasPreferidas) {
    if (!categoriasPreferidas || categoriasPreferidas.length === 0) {
      return shuffle(lista);
    }
    const preferidos = [];
    const resto = [];
    lista.forEach((item) => {
      const cat = String(item.categoria || "").trim();
      if (categoriasPreferidas.includes(cat)) preferidos.push(item);
      else resto.push(item);
    });
    return [...shuffle(preferidos), ...shuffle(resto)];
  }

  // =====================================================
  // COMPARTIR LINK DE AFILIADO
  // =====================================================
  async function compartirLink(url, titulo) {
    const datos = {
      title: titulo || "Producto recomendado",
      text: titulo || "Mirá este producto",
      url: url
    };
    try {
      if (navigator.share) {
        await navigator.share(datos);
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiado al portapapeles.\nPodés pegarlo y enviarlo.");
    } catch (e2) {
      prompt("Copiá este link:", url);
    }
  }

  // =====================================================
  // CREAR TARJETA
  // =====================================================
  function crearTarjeta(item, tipo, baseImg) {
    const id = item.id;
    const nombre = item.nombre || "Sin nombre";
    const descripcion = item.descripcion || "";
    const link = item.link || "#";
    const extra = (tipo === "negocio" || tipo === "servicio") ? (item.rubro || "") : (item.categoria || "");
    const actualizado = formatFecha(item.actualizado);
    const carouselId = "carousel-" + tipo + "-" + id;

    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";
    col.dataset.id = id;
    col.dataset.nombre = nombre.toLowerCase();
    col.dataset.extra = extra.toLowerCase();

    const esRecomendado = (tipo === "negocio" || tipo === "servicio") && (item.recomendado === true || item.recomendado === "true");
    const badgeRecomendado = esRecomendado
      ? `<span class="badge-recomendado">¡Recomendado por nosotros!</span>`
      : "";

        const btnCompartir =
      (tipo === "producto" || tipo === "curso" || tipo === "libro")
        ? `<button type="button" class="btn btn-compartir-prod" title="Compartir con alguien" aria-label="Compartir este producto"
             data-link="${String(link).replace(/"/g, "&quot;")}"
             data-nombre="${String(nombre).replace(/"/g, "&quot;")}">
             <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
               <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
             </svg>
             <span class="btn-compartir-txt">Compartir</span>
           </button>`
        : "";

    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 position-relative">
        ${badgeRecomendado}
        <div id="${carouselId}" class="carousel slide position-relative" data-bs-ride="false" data-bs-interval="false"
             data-id="${id}" data-descripcion="${nombre.replace(/"/g, "&quot;")}" data-cargado="false">
          <div class="carousel-indicators"></div>
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="./${baseImg}/${id}.jpg"
                   class="card-img-top img-item"
                   alt="${nombre.replace(/"/g, "&quot;")}"
                   draggable="false"
                   onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2216%22%3ESin imagen%3C/text%3E%3C/svg%3E'">
            </div>
          </div>
          <button class="carousel-control-prev d-none" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Anterior</span>
          </button>
          <button class="carousel-control-next d-none" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="visually-hidden">Siguiente</span>
          </button>
          ${btnCompartir}
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fs-6 mb-1">${nombre}</h5>
          ${extra ? `<span class="badge badge-rubro mb-2 align-self-start">${extra}</span>` : ""}
          <p class="card-text small text-muted flex-grow-1">${descripcion}</p>
          <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ver mt-auto">
            ${tipo === "negocio" || tipo === "servicio" ? "Ver / Contactar" : (tipo === "curso" ? "Ver curso / ebook" : (tipo === "libro" ? "Ver libro" : "Ver en Mercado Libre"))}
          </a>
          ${(tipo === "negocio" || tipo === "servicio") && (item.ubicacion === true || item.ubicacion === "true") && item.mapa
            ? `<a href="${String(item.mapa).replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary mt-2">Ver en MAPS</a>`
            : ""}
          ${actualizado ? `<small class="text-muted mt-2 d-block" style="font-size:0.7rem">${actualizado}</small>` : ""}
        </div>
      </div>
    `;

    return col;
  }

  // =====================================================
  // LAZY LOAD IMÁGENES
  // =====================================================
  function cargarImagenesSecundariasLazy(itemId, carouselId, baseImg) {
    const carouselElem = document.getElementById(carouselId);
    if (!carouselElem || carouselElem.dataset.cargado === "true") return;
    carouselElem.dataset.cargado = "true";

    const sufijos = ["B", "C"];
    let encontradas = 0;

    sufijos.forEach((sufijo) => {
      const ruta = `./${baseImg}/${itemId}${sufijo}.jpg`;
      const testImg = new Image();

      testImg.onload = () => {
        encontradas++;
        const carouselInner = carouselElem.querySelector(".carousel-inner");
        const carouselIndicators = carouselElem.querySelector(".carousel-indicators");

        if (carouselIndicators && carouselIndicators.children.length === 0) {
          const ind0 = document.createElement("button");
          ind0.type = "button";
          ind0.setAttribute("data-bs-target", "#" + carouselId);
          ind0.setAttribute("data-bs-slide-to", "0");
          ind0.className = "active";
          carouselIndicators.appendChild(ind0);
        }

        const itemDiv = document.createElement("div");
        itemDiv.className = "carousel-item";
        const img = document.createElement("img");
        img.src = ruta;
        img.className = "card-img-top img-item";
        img.alt = carouselElem.dataset.descripcion || "";
        img.setAttribute("draggable", "false");
        itemDiv.appendChild(img);
        carouselInner.appendChild(itemDiv);

        const totalItems = carouselInner.querySelectorAll(".carousel-item").length;
        if (carouselIndicators) {
          const indNew = document.createElement("button");
          indNew.type = "button";
          indNew.setAttribute("data-bs-target", "#" + carouselId);
          indNew.setAttribute("data-bs-slide-to", (totalItems - 1).toString());
          carouselIndicators.appendChild(indNew);
        }

        if (encontradas > 0) {
          const btnPrev = carouselElem.querySelector(".carousel-control-prev");
          const btnNext = carouselElem.querySelector(".carousel-control-next");
          if (btnPrev) btnPrev.classList.remove("d-none");
          if (btnNext) btnNext.classList.remove("d-none");
        }
      };

      testImg.src = ruta;
    });
  }

  function activarLazyImagenes(baseImg) {
    ["mouseover", "touchstart", "click"].forEach((eventType) => {
      document.addEventListener(
        eventType,
        (e) => {
          const carousel = e.target.closest(".carousel");
          if (!carousel) return;
          const itemId = carousel.dataset.id;
          if (itemId && carousel.dataset.cargado !== "true") {
            cargarImagenesSecundariasLazy(itemId, carousel.id, baseImg);
          }
        },
        { passive: true }
      );
    });
  }

  function filtrarTarjetas(texto) {
    const q = (texto || "").trim().toLowerCase();
    document.querySelectorAll("#contenedorTarjetas > [data-id]").forEach((col) => {
      if (!q) {
        col.classList.remove("d-none");
        return;
      }
      const nombre = col.dataset.nombre || "";
      const extra = col.dataset.extra || "";
      col.classList.toggle("d-none", !(nombre.includes(q) || extra.includes(q)));
    });
  }

  // =====================================================
  // INIT
  // =====================================================
  async function initNegocios() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando negocios...";
      const lista = await cargarJSON("./negocios.json");
      const ordenados = ordenarNegocios(lista);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "negocio", "locales")));
      contenedor.appendChild(frag);
      if (mensaje) mensaje.textContent = "";
      activarLazyImagenes("locales");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los negocios. Revisá negocios.json";
    }
  }

  async function initProductos() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando productos...";
      const lista = await cargarJSON("./productos.json");
      const catsPref = await obtenerCategoriasPreferidas();
      const ordenados = ordenarProductos(lista, catsPref);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "producto", "productos")));
      contenedor.appendChild(frag);

      if (mensaje) {
        if (catsPref.length > 0) {
          mensaje.textContent = "Mostrando primero productos relacionados a tus intereses";
          mensaje.classList.add("text-success");
        } else {
          mensaje.textContent = "";
        }
      }

      activarLazyImagenes("productos");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));

      // Botón compartir
      contenedor.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-compartir-prod");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        compartirLink(btn.dataset.link, btn.dataset.nombre);
      });
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los productos. Revisá productos.json";
    }
  }


  async function initCursos() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando cursos...";
      const lista = await cargarJSON("./cursos.json");
      const catsPref = await obtenerCategoriasPreferidas();
      const ordenados = ordenarProductos(lista, catsPref);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "curso", "cursos")));
      contenedor.appendChild(frag);

      if (mensaje) {
        if (catsPref.length > 0) {
          mensaje.textContent = "Mostrando primero cursos relacionados a tus intereses";
          mensaje.classList.add("text-success");
        } else {
          mensaje.textContent = "";
        }
      }

      activarLazyImagenes("cursos");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));

      contenedor.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-compartir-prod");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        compartirLink(btn.dataset.link, btn.dataset.nombre);
      });
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los cursos. Revisá cursos.json";
    }
  }


  async function initServicios() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando servicios...";
      const lista = await cargarJSON("./servicios.json");
      const ordenados = ordenarNegocios(lista);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "servicio", "servicios")));
      contenedor.appendChild(frag);
      if (mensaje) mensaje.textContent = "";
      activarLazyImagenes("servicios");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los servicios. Revisá servicios.json";
    }
  }


  async function initLibros() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando libros...";
      const lista = await cargarJSON("./libros.json");
      const catsPref = await obtenerCategoriasPreferidas();
      const ordenados = ordenarProductos(lista, catsPref);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "libro", "libros")));
      contenedor.appendChild(frag);

      if (mensaje) {
        if (catsPref.length > 0) {
          mensaje.textContent = "Mostrando primero libros relacionados a tus intereses";
          mensaje.classList.add("text-success");
        } else {
          mensaje.textContent = "";
        }
      }

      activarLazyImagenes("libros");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));

      contenedor.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-compartir-prod");
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        compartirLink(btn.dataset.link, btn.dataset.nombre);
      });
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los libros. Revisá libros.json";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "negocios") initNegocios();
    else if (page === "servicios") initServicios();
    else if (page === "productos") initProductos();
    else if (page === "cursos") initCursos();
    else if (page === "libros") initLibros();
  });
})();
