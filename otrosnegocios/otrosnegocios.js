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

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function textoConSaltos(s) {
    return escapeHtml(s).replace(/\n/g, "<br>");
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
  // COMPARTIR (tarjeta o link de afiliado)
  // =====================================================
  function urlDeepLinkTarjeta(id) {
    const u = new URL(window.location.href);
    u.searchParams.set("id", String(id));
    return u.toString();
  }

  async function compartirLink(url, titulo) {
    const datos = {
      title: titulo || "Recomendado en Me Mata Limón",
      text: titulo || "Mirá esto",
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

  // Lightbox de imagen (click en foto del carrusel)
  function asegurarLightbox() {
    if (!document.getElementById("onLightboxStyles")) {
      const st = document.createElement("style");
      st.id = "onLightboxStyles";
      st.textContent = `
        .img-ampliable { cursor: zoom-in; }

        /* Lightbox: imagen lo más grande posible */
        .on-lightbox {
          position: fixed; inset: 0; z-index: 2000;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          padding: 0.5rem;
        }
        .on-lightbox.d-none { display: none !important; }
        .on-lightbox-img {
          width: auto;
          height: auto;
          max-width: 98vw;
          max-height: 96vh;
          object-fit: contain;
          border-radius: 6px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
        }
        .on-lightbox-cerrar {
          position: fixed; top: 10px; right: 12px; z-index: 2001;
          background: rgba(255,255,255,0.2); color: #fff;
          border: none; font-size: 2rem; line-height: 1;
          width: 48px; height: 48px; border-radius: 50%;
          cursor: pointer;
        }

        /* Compartir: botón chico, NO el óvalo del carrusel */
        #contenedorTarjetas .card > .btn-compartir-prod,
        #contenedorTarjetas .btn-compartir-prod {
          position: absolute !important;
          top: 8px !important;
          right: 8px !important;
          bottom: auto !important;
          left: auto !important;
          z-index: 6 !important;
          width: auto !important;
          height: auto !important;
          min-width: 0 !important;
          min-height: 0 !important;
          max-height: none !important;
          padding: 5px 10px !important;
          border-radius: 999px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px !important;
          font-size: 0.72rem !important;
          font-weight: 600 !important;
          line-height: 1 !important;
          background: rgba(255,255,255,0.95) !important;
          color: #5c3d8a !important;
          border: 1px solid rgba(168,140,215,0.55) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
          filter: none !important;
          opacity: 1 !important;
        }
        #contenedorTarjetas .btn-compartir-prod svg {
          width: 14px; height: 14px; flex-shrink: 0;
        }
        @media (max-width: 575.98px) {
          #contenedorTarjetas .btn-compartir-prod {
            width: 34px !important;
            height: 34px !important;
            padding: 0 !important;
            border-radius: 50% !important;
          }
          #contenedorTarjetas .btn-compartir-txt { display: none !important; }
        }

        /* Controles del carrusel: flechas chicas, sin franja blanca */
        #contenedorTarjetas .carousel-control-prev,
        #contenedorTarjetas .carousel-control-next {
          width: 36px !important;
          height: 36px !important;
          top: 50% !important;
          bottom: auto !important;
          transform: translateY(-50%);
          border-radius: 50%;
          background: rgba(0,0,0,0.35) !important;
          opacity: 0.85;
          filter: none !important;
        }
        #contenedorTarjetas .carousel-control-prev { left: 6px; }
        #contenedorTarjetas .carousel-control-next { right: 6px; }
        #contenedorTarjetas .carousel-control-prev-icon,
        #contenedorTarjetas .carousel-control-next-icon {
          width: 1rem; height: 1rem;
          background-size: 100% 100%;
          filter: none !important;
        }
      `;
      document.head.appendChild(st);
    }
    if (document.getElementById("onLightbox")) return;
    const div = document.createElement("div");
    div.id = "onLightbox";
    div.className = "on-lightbox d-none";
    div.innerHTML =
      '<button type="button" class="on-lightbox-cerrar" aria-label="Cerrar">&times;</button>' +
      '<img src="" alt="Vista ampliada" class="on-lightbox-img">';
    document.body.appendChild(div);
    div.addEventListener("click", function (e) {
      if (e.target === div || e.target.classList.contains("on-lightbox-cerrar")) {
        div.classList.add("d-none");
        div.querySelector("img").src = "";
      }
    });
  }

  function abrirLightbox(src, alt) {
    if (!src || src.indexOf("data:image/svg") === 0) return;
    asegurarLightbox();
    const box = document.getElementById("onLightbox");
    const img = box.querySelector("img");
    img.src = src;
    img.alt = alt || "";
    box.classList.remove("d-none");
  }

  function resaltarTarjetaDesdeURL() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;
    const contenedor = document.getElementById("contenedorTarjetas");
    if (!contenedor) return;

    let encontrada = null;
    contenedor.querySelectorAll(":scope > [data-id]").forEach(function (col) {
      if (String(col.dataset.id) === String(id)) {
        col.classList.remove("d-none");
        encontrada = col;
      } else {
        col.classList.add("d-none");
      }
    });

    // Aviso + ver todos
    let aviso = document.getElementById("avisoTarjetaCompartida");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.id = "avisoTarjetaCompartida";
      aviso.className = "col-12 mb-2";
      contenedor.parentElement.insertBefore(aviso, contenedor);
    }
    if (encontrada) {
      const nom = encontrada.dataset.nombre || "";
      aviso.innerHTML =
        '<div class="alert alert-light border small py-2 px-3 d-flex flex-wrap align-items-center justify-content-between gap-2" style="border-radius:12px;">' +
        "<span>Estás viendo el ítem compartido.</span>" +
        '<button type="button" class="btn btn-sm btn-outline-secondary rounded-pill" id="btnVerTodasTarjetas">Ver listado completo</button>' +
        "</div>";
      const btn = document.getElementById("btnVerTodasTarjetas");
      if (btn) {
        btn.addEventListener("click", function () {
          try {
            const u = new URL(window.location.href);
            u.searchParams.delete("id");
            window.history.replaceState({}, "", u.pathname + (u.search || "") + u.hash);
          } catch (e) {}
          contenedor.querySelectorAll(":scope > [data-id]").forEach(function (c) {
            c.classList.remove("d-none");
          });
          aviso.remove();
        });
      }
      const card = encontrada.querySelector(".card") || encontrada;
      card.style.transition = "box-shadow 0.35s ease";
      card.style.boxShadow = "0 0 0 3px rgba(168,140,215,0.9), 0 8px 24px rgba(92,61,138,0.2)";
      setTimeout(function () {
        card.style.boxShadow = "";
      }, 4000);
      setTimeout(function () {
        try {
          const y = encontrada.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        } catch (e) {}
      }, 100);
    } else {
      aviso.innerHTML =
        '<div class="alert alert-warning small py-2 px-3">No se encontró el ítem del link compartido.</div>';
    }
  }


  // =====================================================
  // MODAL +INFO (texto largo opcional del JSON)
  // =====================================================
  function asegurarModalInfo() {
    let overlay = document.getElementById("modalInfoExtra");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "modalInfoExtra";
    overlay.className = "modal-info-extra";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML =
      '<div class="modal-info-box">' +
        '<div class="modal-info-head">' +
          '<h3 class="modal-info-title" id="modalInfoTitulo"></h3>' +
          '<button type="button" class="modal-info-cerrar" aria-label="Cerrar">&times;</button>' +
        '</div>' +
        '<div class="modal-info-body" id="modalInfoCuerpo"></div>' +
      '</div>';
    document.body.appendChild(overlay);

    function cerrar() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    overlay.querySelector(".modal-info-cerrar").addEventListener("click", cerrar);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) cerrar();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) cerrar();
    });
    return overlay;
  }

  function abrirModalInfo(titulo, texto) {
    const overlay = asegurarModalInfo();
    overlay.querySelector("#modalInfoTitulo").textContent = titulo || "Más información";
    overlay.querySelector("#modalInfoCuerpo").innerHTML = textoConSaltos(texto || "");
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  // =====================================================
  // CREAR TARJETA
  // =====================================================
  function crearTarjeta(item, tipo, baseImg) {
    const id = item.id;
    const nombre = item.nombre || "Sin nombre";
    const descripcion = item.descripcion || "";
    const infoTexto = item.info || item.infoExtraTexto || "";
    const mostrarInfo = (item.infoExtra === true || item.infoExtra === "true") && String(infoTexto).trim() !== "";
    const link = item.link || "#";
    const extra = (tipo === "negocio" || tipo === "servicio" || tipo === "profesional") ? (item.rubro || "") : (item.categoria || "");
    const actualizado = formatFecha(item.actualizado);
    const carouselId = "carousel-" + tipo + "-" + id;

    const col = document.createElement("div");
    col.className = "col-6 col-md-4 col-lg-3";
    col.dataset.id = id;
    col.dataset.nombre = nombre.toLowerCase();
    col.dataset.extra = extra.toLowerCase();

    const esRecomendado = (tipo === "negocio" || tipo === "servicio" || tipo === "profesional") && (item.recomendado === true || item.recomendado === "true");
    const badgeRecomendado = esRecomendado
      ? `<span class="badge-recomendado">¡Recomendado por nosotros!</span>`
      : "";

    // Negocio/servicio: link a esta tarjeta (?id=). Producto/curso/libro: link de afiliado.
    const linkCompartir = (tipo === "negocio" || tipo === "servicio" || tipo === "profesional")
      ? urlDeepLinkTarjeta(id)
      : String(link);
    const btnCompartir =
      `<button type="button" class="btn btn-compartir-prod" title="Compartir" aria-label="Compartir"
         data-link="${String(linkCompartir).replace(/"/g, "&quot;")}"
         data-nombre="${String(nombre).replace(/"/g, "&quot;")}">
         <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
           <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>
         </svg>
         <span class="btn-compartir-txt">Compartir</span>
       </button>`;

    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 position-relative">
        ${badgeRecomendado}
        ${btnCompartir}
        <div id="${carouselId}" class="carousel slide position-relative" data-bs-ride="false" data-bs-interval="false"
             data-id="${id}" data-descripcion="${nombre.replace(/"/g, "&quot;")}" data-cargado="false">
          <div class="carousel-indicators"></div>
          <div class="carousel-inner">
            <div class="carousel-item active">
              <img src="./${baseImg}/${id}.jpg"
                   class="card-img-top img-item img-ampliable"
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
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fs-6 mb-1">${escapeHtml(nombre)}</h5>
          ${extra ? `<span class="badge badge-rubro mb-2 align-self-start">${escapeHtml(extra)}</span>` : ""}
          <p class="card-text small text-muted flex-grow-1 mb-1">${escapeHtml(descripcion)}</p>
          ${mostrarInfo ? `<button type="button" class="btn btn-link btn-sm btn-info-extra p-0 mb-2 align-self-start">+ info</button>` : ""}
          <a href="${link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-ver mt-auto">
            ${tipo === "negocio" || tipo === "servicio" || tipo === "profesional" ? "Ver / Contactar" : (tipo === "curso" ? "Ver curso / ebook" : (tipo === "libro" ? "Ver libro" : "Ver en Mercado Libre"))}
          </a>
          ${(tipo === "negocio" || tipo === "servicio" || tipo === "profesional") && item.mapa
            ? `<a href="${String(item.mapa).replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary mt-2 btn-mapa">Ver en Maps</a>`
            : ""}
          ${actualizado ? `<small class="text-muted mt-2 d-block" style="font-size:0.7rem">${actualizado}</small>` : ""}
        </div>
      </div>
    `;

    if (mostrarInfo) {
      const btnInfo = col.querySelector(".btn-info-extra");
      if (btnInfo) {
        btnInfo.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          abrirModalInfo(nombre, infoTexto);
        });
      }
    }

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
        img.className = "d-block w-100 card-img-top img-item img-ampliable";
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

        const totalNow = carouselInner.querySelectorAll(".carousel-item").length;
        if (totalNow > 1) {
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



  async function initProfesionales() {
    const contenedor = document.getElementById("contenedorTarjetas");
    const buscador = document.getElementById("buscador");
    const mensaje = document.getElementById("mensajeEstado");
    if (!contenedor) return;

    try {
      if (mensaje) mensaje.textContent = "Cargando profesionales...";
      const lista = await cargarJSON("./profesionales.json");
      const ordenados = ordenarNegocios(lista);
      contenedor.innerHTML = "";
      const frag = document.createDocumentFragment();
      ordenados.forEach((item) => frag.appendChild(crearTarjeta(item, "profesional", "profesionales")));
      contenedor.appendChild(frag);
      if (mensaje) mensaje.textContent = "";
      activarLazyImagenes("profesionales");
      if (buscador) buscador.addEventListener("input", () => filtrarTarjetas(buscador.value));
    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los profesionales. Revisá profesionales.json";
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

    } catch (err) {
      console.error(err);
      if (mensaje) mensaje.textContent = "No se pudieron cargar los libros. Revisá libros.json";
    }
  }

  // Clicks globales: compartir + ampliar imagen
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-compartir-prod");
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      compartirLink(btn.dataset.link, btn.dataset.nombre);
      return;
    }
    const img = e.target.closest("img.img-ampliable");
    if (img && !e.target.closest(".carousel-control-prev, .carousel-control-next, .carousel-indicators")) {
      e.preventDefault();
      e.stopPropagation();
      abrirLightbox(img.currentSrc || img.src, img.alt || "");
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    asegurarLightbox();
    const page = document.body.dataset.page;
    const after = function () {
      setTimeout(resaltarTarjetaDesdeURL, 50);
    };
    if (page === "profesionales") initProfesionales().then(after).catch(after);
    else if (page === "negocios") initNegocios().then(after).catch(after); // legacy
    else if (page === "servicios") initServicios().then(after).catch(after); // legacy
    else if (page === "productos") initProductos().then(after).catch(after);
    else if (page === "cursos") initCursos().then(after).catch(after);
    else if (page === "libros") initLibros().then(after).catch(after);
  });
})();
