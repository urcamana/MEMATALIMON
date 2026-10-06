/**
 * Búsqueda estricta cable / cabezal / cargador completo
 *
 * Cables reconocidos:
 *  - V8
 *  - USB a iphone  (sinónimo: lightning)
 *  - TipoC a iphone
 *  - USB a TIPOC
 *  - TIPOC a TIPOC
 *
 * Reglas:
 *  - Cargador completo / cabezal: nombre contiene frase + W >= potencia + ficha ok
 *    · si el producto dice "apple" → solo modelos Apple
 *  - Cable: tipo de cable compatible + (W >= potencia O A >= corriente)
 *    · potencia modelo >= 20 → corriente=10 en JSON → no entran USB (máx ~6A)
 *    · potencia <= 18 → corriente = W/5 → pueden entrar USB a TIPOC / USB a iphone
 *  - Sinónimos búsqueda: moto↔motorola, lightning↔iphone
 */
(function () {
  "use strict";

  var modelos = [];
  var articulos = [];

  var SHARE_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">' +
    '<path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5m-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3m11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>' +
    "</svg>";

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function expandQuery(q) {
    q = norm(q);
    if (!q) return q;
    q = q.replace(/\bmoto\b/g, "motorola");
    q = q.replace(/\blightning\b/g, "iphone");
    return q;
  }

  function labelModeloBuscable(m) {
    var base = norm(m.marca + " " + m.modelo);
    if (norm(m.marca) === "motorola") base += " " + norm("moto " + m.modelo);
    if (norm(m.marca) === "apple") base += " " + norm(m.modelo).replace("iphone", "iphone lightning");
    return base;
  }

  function parseAllWatts(text) {
    var out = [], re = /(\d+(?:[.,]\d+)?)\s*w\b/gi, m;
    while ((m = re.exec(text)) !== null) out.push(parseFloat(m[1].replace(",", ".")));
    return out;
  }

  function parseAllAmps(text) {
    var out = [], re = /(\d+(?:[.,]\d+)?)\s*a\b/gi, m;
    while ((m = re.exec(text)) !== null) out.push(parseFloat(m[1].replace(",", ".")));
    return out;
  }

  function tienePotenciaMin(text, minW) {
    var ws = parseAllWatts(text);
    if (!ws.length) return false;
    return ws.some(function (w) { return w + 0.001 >= minW; });
  }

  function tieneAmperajeMin(text, minA) {
    var as = parseAllAmps(text);
    if (!as.length) return false;
    return as.some(function (a) { return a + 0.001 >= minA; });
  }

  /** Clasifica el cable del producto */
  function tipoCableProducto(text) {
    var d = norm(text);
    // orden: más específico primero
    if (/tipoc\s*a\s*tipoc|tipo\s*c\s*a\s*tipo\s*c/.test(d)) return "TIPOC_A_TIPOC";
    if (/tipoc\s*a\s*iphone|tipo\s*c\s*a\s*iphone|tipoc\s*a\s*lightning|tipo\s*c\s*a\s*lightning/.test(d)) return "TIPOC_A_IPHONE";
    if (/(usb\s*a\s*iphone|usb\s*a\s*lightning|cable\s*usb\s*a\s*iphone|usb a iphone)/.test(d) ||
        (/usb/.test(d) && /iphone|lightning/.test(d) && !/tipoc|tipo\s*c/.test(d))) return "USB_A_IPHONE";
    if (/(usb\s*a\s*tipoc|usb\s*a\s*tipo\s*c|cable\s*usb\s*a\s*tipoc)/.test(d) ||
        (/usb/.test(d) && /tipoc|tipo\s*c/.test(d) && !/tipoc\s*a\s*tipoc/.test(d))) return "USB_A_TIPOC";
    if (/\bv8\b|micro\s*usb|microusb/.test(d)) return "V8";
    // genérico "cable ... iphone" sin usb/tipoc explícito
    if (/\bcable\b/.test(d) && /iphone|lightning/.test(d)) return "USB_A_IPHONE";
    if (/\bcable\b/.test(d) && /tipoc|tipo\s*c/.test(d)) return "USB_A_TIPOC";
    return null;
  }

  function tipoFichaModelo(ficha) {
    var f = norm(ficha);
    if (/v8|micro/.test(f)) return "V8";
    if (/lightning|iphone/.test(f) && !/tipo\s*c|tipoc/.test(f)) return "LIGHTNING";
    if (/tipo\s*c\s*a\s*tipo\s*c|tipoc a tipoc/.test(f)) return "TIPOC_CC";
    if (/tipo\s*c\s*a\s*iphone|tipoc a iphone/.test(f)) return "TIPOC_IPHONE";
    if (/tipo\s*c|tipoc/.test(f)) return "TIPOC";
    return "OTRO";
  }

  function esCargadorCompleto(text) {
    return norm(text).indexOf("cargador completo") !== -1;
  }

  function esCabezal(text) {
    return /\bcabezal\b/.test(norm(text));
  }

  function esCable(text) {
    var d = norm(text);
    return /\bcable\b/.test(d) && d.indexOf("cargador completo") === -1 && !/\bcabezal\b/.test(d);
  }

  function diceApple(text) {
    // "Apple", "iPhone" o "Lightning" en el nombre → exclusivo para modelos Apple
    var d = norm(text);
    return /\bapple\b/.test(d) || /\biphone\b/.test(d) || /\blightning\b/.test(d);
  }

  function esModeloApple(modelo) {
    return norm(modelo.marca) === "apple";
  }

  /**
   * Cabezal / cargador completo:
   * - debe tener W >= potencia
   * - ficha compatible (TIPOC en nombre para modelos C, V8 para V8, etc.)
   * - si dice Apple → solo iPhone
   */
  function matchCabezalOCompleto(prod, modelo, tipo) {
    var t = String(prod.Descripción || "") + " " + String(prod.Categoria || "");
    var d = norm(t);

    if (tipo === "completo") {
      if (!esCargadorCompleto(t)) return false;
    } else {
      if (!esCabezal(t)) return false;
    }

    if (/notebook|laptop|pilas|\baa\b|\baaa\b/.test(d)) return false;

    // Apple / iPhone / Lightning en el nombre → solo modelos Apple
    if (diceApple(t) && !esModeloApple(modelo)) return false;

    var pot = Number(modelo.potencia) || 0;
    var cor = Number(modelo.corriente) || 0;
    var fm = tipoFichaModelo(modelo.fichas);

    // Potencia (W) o amperaje (A) mínimo
    var okW = tienePotenciaMin(t, pot);
    var okA = cor > 0 && tieneAmperajeMin(t, cor);
    if (!okW && !okA) return false;

    if (fm === "V8") {
      // Cabezales V8 = salida USB-A (en el nombre suele decir "USB" y amperaje, no "V8")
      // Acepta: "Cabezal USB", "USB + TIPOC", etc. Rechaza solo TIPOC sin USB.
      if (/tipoc|tipo\s*c/.test(d) && !/usb/.test(d)) return false;
      return /usb/.test(d) || /\bv8\b|micro/.test(d) || okA || okW;
    }

    if (fm === "LIGHTNING") {
      if (/\bv8\b|micro\s*usb/.test(d) && !/usb|tipoc|apple|iphone/.test(d)) return false;
      return true;
    }

    // TIPOC / TIPOC_CC / TIPOC_IPHONE
    if (fm === "TIPOC" || fm === "TIPOC_CC" || fm === "TIPOC_IPHONE") {
      return (/tipoc|tipo\s*c|usb/.test(d)) && !/\bv8\b|micro\s*usb/.test(d);
    }

    return true;
  }

  /**
   * Cable compatible según ficha del modelo y potencia/corriente
   */
  function matchCable(prod, modelo) {
    var t = String(prod.Descripción || "") + " " + String(prod.Categoria || "");
    if (!esCable(t)) return false;
    if (/joystick|hdmi|rca|auxiliar|ps3|ps4|auricular/.test(norm(t))) return false;

    var tipoCab = tipoCableProducto(t);
    if (!tipoCab) return false;

    var fm = tipoFichaModelo(modelo.fichas);
    var pot = Number(modelo.potencia) || 0;
    var cor = Number(modelo.corriente) || 0;

    // ¿este tipo de cable es válido para la ficha del modelo?
    var okTipo = false;

    if (fm === "V8") {
      okTipo = tipoCab === "V8";
    } else if (fm === "LIGHTNING") {
      // TipoC a iPhone siempre válido si cumple potencia
      // USB a iPhone solo si el modelo admite USB (corriente <= 6 implícito: cor < 10)
      if (tipoCab === "TIPOC_A_IPHONE") okTipo = true;
      if (tipoCab === "USB_A_IPHONE") okTipo = cor < 10; // 20W+ tiene corriente 10 → no USB
    } else if (fm === "TIPOC_CC" || fm === "TIPOC") {
      if (tipoCab === "TIPOC_A_TIPOC") okTipo = true;
      // USB a TIPOC solo si potencia baja (corriente < 10 → modelos <= 18W)
      if (tipoCab === "USB_A_TIPOC") okTipo = cor < 10;
    } else if (fm === "TIPOC_IPHONE") {
      if (tipoCab === "TIPOC_A_IPHONE") okTipo = true;
      if (tipoCab === "USB_A_IPHONE") okTipo = cor < 10;
    }

    if (!okTipo) return false;

    // Cumplir potencia O amperaje (mínimo)
    // Cables C-C / C-Lightning suelen marcar W; USB suelen marcar A
    var okW = tienePotenciaMin(t, pot);
    var okA = cor > 0 && tieneAmperajeMin(t, cor);

    // Si el cable es USB_*, priorizar amperaje; si no hay A, no alcanza solo con W inventado
    if (tipoCab === "USB_A_TIPOC" || tipoCab === "USB_A_IPHONE" || tipoCab === "V8") {
      // USB: necesita A >= corriente; si no hay A en nombre, rechazar
      // (salvo que tenga W >= pot como respaldo raro)
      return okA || okW;
    }

    // TIPOC a TIPOC / TIPOC a iPhone: necesitan W >= potencia
    return okW;
  }

  function compatibleConModelo(prod, modelo) {
    if (Number(prod.Inventario) < 1) return false;
    var t = String(prod.Descripción || "") + " " + String(prod.Categoria || "");

    if (matchCabezalOCompleto(prod, modelo, "completo")) return true;
    if (matchCabezalOCompleto(prod, modelo, "cabezal")) return true;
    if (matchCable(prod, modelo)) return true;
    return false;
  }

  function precioAR(prod) {
    try {
      var venta = Number(String(prod.Venta || 0).replace(/,/g, "."));
      var desc = Number(String(prod.Descuento || 0).replace(/,/g, "."));
      var final = desc ? venta * (1 - desc) : venta;
      return Math.round(final).toLocaleString("es-AR");
    } catch (e) {
      return prod.Venta || "—";
    }
  }

  function getFavoritos() {
    try {
      return JSON.parse(localStorage.getItem("favoritos_limon") || "[]").map(Number).filter(function (n) { return !isNaN(n); });
    } catch (e) { return []; }
  }
  function setFavoritos(arr) { localStorage.setItem("favoritos_limon", JSON.stringify(arr)); }
  function toggleFav(id) {
    var favs = getFavoritos();
    var i = favs.indexOf(Number(id));
    if (i >= 0) favs.splice(i, 1); else favs.push(Number(id));
    setFavoritos(favs);
    return favs.indexOf(Number(id)) >= 0;
  }
  function getCarrito() {
    try {
      var raw = localStorage.getItem("datosCarrito");
      if (!raw) return [];
      var datos = JSON.parse(raw);
      if (datos.timestamp && Date.now() > datos.timestamp) {
        localStorage.removeItem("datosCarrito");
        return [];
      }
      return datos.items || [];
    } catch (e) { return []; }
  }
  function setCarrito(items) {
    localStorage.setItem("datosCarrito", JSON.stringify({
      items: items,
      timestamp: Date.now() + 23 * 60 * 60 * 1000
    }));
  }
  function agregarAlCarrito(prod) {
    var items = getCarrito();
    var id = prod.Artículo;
    var existe = items.find(function (x) { return Number(x.Artículo) === Number(id); });
    if (existe) {
      existe.Unidades = Number(existe.Unidades || 1) + 1;
    } else {
      var ventaFinal = Number(prod.Descuento) != 0
        ? (Number(String(prod.Venta).replace(/,/g, ".")) * (1 - Number(String(prod.Descuento).replace(/,/g, "."))))
        : prod.Venta;
      items.push({
        Artículo: prod.Artículo,
        Descripción: prod.Descripción,
        Venta: String(ventaFinal),
        DOLAR: prod.DOLAR,
        Unidades: 1,
        ImagenId: prod.Artículo
      });
    }
    setCarrito(items);
  }
  function mostrarAvisoCarrito(nombre) {
    var viejo = document.getElementById("avisoCarritoGuia");
    if (viejo) viejo.remove();
    var overlay = document.createElement("div");
    overlay.id = "avisoCarritoGuia";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:16px;max-width:380px;width:100%;padding:1.25rem 1.35rem;box-shadow:0 12px 40px rgba(0,0,0,.25);text-align:center;">' +
        '<p class="mb-1 fw-semibold" style="color:#5c3d8a;">Se agregó el producto al carrito</p>' +
        '<p class="small text-muted mb-3">' + (nombre || "Producto") + '</p>' +
        '<p class="small mb-3">¿Querés ir a la tienda o continuar en esta sección?</p>' +
        '<div class="d-flex flex-column flex-sm-row gap-2 justify-content-center">' +
          '<a href="tienda.html" class="btn btn-primary rounded-pill px-3">Ir al carrito</a>' +
          '<button type="button" class="btn btn-outline-secondary rounded-pill px-3" id="btnContinuarGuia">Continuar acá</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById("btnContinuarGuia").addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
  }
  async function compartirProd(prod) {
    var url = location.origin + "/tienda.html?p=" + encodeURIComponent(prod.Artículo);
    var titulo = prod.Descripción || "Producto";
    try {
      if (navigator.share) {
        await navigator.share({ title: titulo, text: titulo, url: url });
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiado: " + url);
    } catch (e2) {
      prompt("Copiá este link:", url);
    }
  }

  function etiquetaTipo(prod) {
    var t = String(prod.Descripción || "") + " " + String(prod.Categoria || "");
    if (esCargadorCompleto(t)) return "Cargador completo";
    if (esCabezal(t)) return "Cabezal";
    var tc = tipoCableProducto(t);
    if (tc) return "Cable";
    return prod.Categoria || "Producto";
  }

  function renderResultados(lista) {
    var cont = document.getElementById("resultadosCompatibles");
    if (!cont) return;
    if (!lista.length) {
      cont.innerHTML = '<div class="col-12"><p class="text-muted small mb-0">No hay productos que cumplan tipo + potencia/amperaje + ficha. Probá otro modelo.</p></div>';
      return;
    }
    var favs = getFavoritos();
    cont.innerHTML = lista.map(function (prod) {
      var id = prod.Artículo;
      var esFav = favs.indexOf(Number(id)) >= 0;
      return (
        '<div class="col-6 col-md-4 col-lg-3">' +
          '<div class="card guia-prod-card">' +
            '<img src="./imgcarrito/' + id + '.jpg" alt="" onerror="this.src=\'./imgcarrito/IMGND.jpg\'">' +
            '<div class="card-body d-flex flex-column p-2 p-md-3">' +
              '<span class="badge bg-secondary align-self-start mb-1" style="font-size:0.65rem">' + etiquetaTipo(prod) + '</span>' +
              '<h3 class="h6 mb-1" style="font-size:0.85rem">' + (prod.Descripción || "") + '</h3>' +
              '<p class="text-danger fw-semibold mb-2">$' + precioAR(prod) + '</p>' +
              '<div class="guia-prod-actions mt-auto">' +
                '<button type="button" class="btn btn-sm btn-primary btn-guia-carr" data-id="' + id + '">Al carrito</button>' +
                '<button type="button" class="btn btn-sm btn-outline-danger btn-guia-fav" data-id="' + id + '">' + (esFav ? "❤️" : "🤍") + '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary btn-guia-share" data-id="' + id + '" title="Compartir">' + SHARE_SVG + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function mostrarInfoModelo(m) {
    var el = document.getElementById("infoModeloElegido");
    if (!el) return;
    el.classList.remove("d-none");
    el.innerHTML = "Buscando → <strong>" + m.marca + " " + m.modelo + "</strong> · mín. " +
      m.potencia + "W · ficha " + m.fichas +
      (m.corriente ? " · cable USB mín. " + m.corriente + "A" : "");
  }

  function buscarCompatibles(m) {
    mostrarInfoModelo(m);
    var lista = articulos.filter(function (p) { return compatibleConModelo(p, m); });
    lista.sort(function (a, b) {
      function rank(p) {
        var t = String(p.Descripción || "");
        if (esCargadorCompleto(t)) return 0;
        if (esCabezal(t)) return 1;
        return 2;
      }
      return rank(a) - rank(b);
    });
    renderResultados(lista);
  }

  function filtrarSugerencias(q) {
    q = expandQuery(q);
    if (!q || q.length < 1) return [];
    return modelos.filter(function (m) {
      var label = labelModeloBuscable(m);
      return label.indexOf(q) !== -1 ||
        norm(m.modelo).indexOf(q) !== -1 ||
        q.split(" ").every(function (part) { return !part || label.indexOf(part) !== -1; });
    }).slice(0, 12);
  }

  function renderSugerencias(lista) {
    var box = document.getElementById("sugerenciasModelo");
    if (!box) return;
    if (!lista.length) {
      box.classList.add("d-none");
      box.innerHTML = "";
      return;
    }
    box.classList.remove("d-none");
    box.innerHTML = lista.map(function (m) {
      return '<button type="button" class="list-group-item list-group-item-action">' +
        m.marca + " " + m.modelo +
        ' <span class="text-muted small">(' + m.potencia + "W · " + m.fichas + ")</span></button>";
    }).join("");
    box.querySelectorAll("button").forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        var m = lista[i];
        var input = document.getElementById("inputModelo");
        if (input) input.value = m.marca + " " + m.modelo;
        box.classList.add("d-none");
        buscarCompatibles(m);
      });
    });
  }

  async function init() {
    var input = document.getElementById("inputModelo");
    if (!input) return;
    try {
      var rm = await fetch("./modelos.json?v=" + Date.now());
      var ra = await fetch("./articulos.json?v=" + Date.now());
      modelos = await rm.json();
      articulos = await ra.json();
    } catch (e) {
      console.error(e);
      var cont = document.getElementById("resultadosCompatibles");
      if (cont) cont.innerHTML = '<div class="col-12 text-danger small">No se pudieron cargar modelos.json o articulos.json</div>';
      return;
    }

    input.addEventListener("input", function () { renderSugerencias(filtrarSugerencias(input.value)); });
    input.addEventListener("focus", function () { if (input.value) renderSugerencias(filtrarSugerencias(input.value)); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#busquedaModelo")) {
        var box = document.getElementById("sugerenciasModelo");
        if (box) box.classList.add("d-none");
      }
    });

    document.getElementById("resultadosCompatibles").addEventListener("click", function (e) {
      var btnCarr = e.target.closest(".btn-guia-carr");
      var btnFav = e.target.closest(".btn-guia-fav");
      var btnShare = e.target.closest(".btn-guia-share");
      if (btnCarr) {
        var id = Number(btnCarr.dataset.id);
        var prod = articulos.find(function (p) { return Number(p.Artículo) === id; });
        if (prod) { agregarAlCarrito(prod); mostrarAvisoCarrito(prod.Descripción); }
      }
      if (btnFav) {
        btnFav.textContent = toggleFav(Number(btnFav.dataset.id)) ? "❤️" : "🤍";
      }
      if (btnShare) {
        var prodS = articulos.find(function (p) { return Number(p.Artículo) === Number(btnShare.dataset.id); });
        if (prodS) compartirProd(prodS);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
