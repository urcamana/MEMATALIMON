(function () {
  "use strict";

  var FUENTES = [
    { id: "alfaslaboneregular", label: "Alfa Slab One", family: "LB Alfa Slab One", weight: 400 },
    { id: "alluraregular", label: "Allura", family: "LB Allura", weight: 400 },
    { id: "amaticscbold", label: "Amatic SC", family: "LB Amatic SC", weight: 700 },
    { id: "antonregular", label: "Anton", family: "LB Anton", weight: 400 },
    { id: "archivoblackregular", label: "Archivo Black", family: "LB Archivo Black", weight: 400 },
    { id: "assetregular", label: "Asset", family: "LB Asset", weight: 400 },
    { id: "baloo2extrabold", label: "Baloo 2", family: "LB Baloo 2", weight: 800 },
    { id: "bangersregular", label: "Bangers", family: "LB Bangers", weight: 400 },
    { id: "barlowcondensedblack", label: "Barlow Condensed", family: "LB Barlow Condensed", weight: 900 },
    { id: "bebasneueregular", label: "Bebas Neue", family: "LB Bebas Neue", weight: 400 },
    { id: "blackopsoneregular", label: "Black Ops One", family: "LB Black Ops One", weight: 400 },
    { id: "bonanovascbold", label: "Bona Nova SC", family: "LB Bona Nova SC", weight: 700 },
    { id: "boogalooregular", label: "Boogaloo", family: "LB Boogaloo", weight: 400 },
    { id: "bowlbyonescregular", label: "Bowlby One SC", family: "LB Bowlby One SC", weight: 400 },
    { id: "bungeeregular", label: "Bungee", family: "LB Bungee", weight: 400 },
    { id: "caveatbrushregular", label: "Caveat Brush", family: "LB Caveat Brush", weight: 400 },
    { id: "charmbold", label: "Charm", family: "LB Charm", weight: 700 },
    { id: "chelseamarketregular", label: "Chelsea Market", family: "LB Chelsea Market", weight: 400 },
    { id: "cherrybomboneregular", label: "Cherry Bomb One", family: "LB Cherry Bomb One", weight: 400 },
    { id: "cinzelblack", label: "Cinzel", family: "LB Cinzel", weight: 900 },
    { id: "cinzeldecorativeblack", label: "Cinzel Decorative", family: "LB Cinzel Decorative", weight: 900 },
    { id: "cookieregular", label: "Cookie", family: "LB Cookie", weight: 400 },
    { id: "courgetteregular", label: "Courgette", family: "LB Courgette", weight: 400 },
    { id: "damionregular", label: "Damion", family: "LB Damion", weight: 400 },
    { id: "dancingscriptbold", label: "Dancing Script", family: "LB Dancing Script", weight: 700 },
    { id: "dokdoregular", label: "Dokdo", family: "LB Dokdo", weight: 400 },
    { id: "eaglelakeregular", label: "Eagle Lake", family: "LB Eagle Lake", weight: 400 },
    { id: "engagementregular", label: "Engagement", family: "LB Engagement", weight: 400 },
    { id: "exo2black", label: "Exo 2", family: "LB Exo 2", weight: 900 },
    { id: "fjallaoneregular", label: "Fjalla One", family: "LB Fjalla One", weight: 400 },
    { id: "fontdinerswankyregular", label: "Fontdiner Swanky", family: "LB Fontdiner Swanky", weight: 400 },
    { id: "francoisoneregular", label: "Francois One", family: "LB Francois One", weight: 400 },
    { id: "frecklefaceregular", label: "Freckle Face", family: "LB Freckle Face", weight: 400 },
    { id: "fredokabold", label: "Fredoka", family: "LB Fredoka", weight: 700 },
    { id: "gamaamliregular", label: "Ga Maamli", family: "LB Ga Maamli", weight: 400 },
    { id: "gloriahallelujahregular", label: "Gloria Hallelujah", family: "LB Gloria Hallelujah", weight: 400 },
    { id: "greatvibesregular", label: "Great Vibes", family: "LB Great Vibes", weight: 400 },
    { id: "grechenfuemenregular", label: "Grechen Fuemen", family: "LB Grechen Fuemen", weight: 400 },
    { id: "indieflowerregular", label: "Indie Flower", family: "LB Indie Flower", weight: 400 },
    { id: "irishgroverregular", label: "Irish Grover", family: "LB Irish Grover", weight: 400 },
    { id: "kalambold", label: "Kalam", family: "LB Kalam", weight: 700 },
    { id: "kanitblack", label: "Kanit", family: "LB Kanit", weight: 900 },
    { id: "kaushanscriptregular", label: "Kaushan Script", family: "LB Kaushan Script", weight: 400 },
    { id: "librebaskervillebold", label: "Libre Baskerville", family: "LB Libre Baskerville", weight: 700 },
    { id: "lilitaoneregular", label: "Lilita One", family: "LB Lilita One", weight: 400 },
    { id: "lobsterregular", label: "Lobster", family: "LB Lobster", weight: 400 },
    { id: "lobstertwobold", label: "Lobster Two", family: "LB Lobster Two", weight: 700 },
    { id: "luckiestguyregular", label: "Luckiest Guy", family: "LB Luckiest Guy", weight: 400 },
    { id: "lugrasimoregular", label: "Lugrasimo", family: "LB Lugrasimo", weight: 400 },
    { id: "matemasieregular", label: "Matemasie", family: "LB Matemasie", weight: 400 },
    { id: "meddonregular", label: "Meddon", family: "LB Meddon", weight: 400 },
    { id: "metalmaniaregular", label: "Metal Mania", family: "LB Metal Mania", weight: 400 },
    { id: "mochiypopponeregular", label: "Mochiy Pop P One", family: "LB Mochiy Pop P One", weight: 400 },
    { id: "montezregular", label: "Montez", family: "LB Montez", weight: 400 },
    { id: "montserratblack", label: "Montserrat", family: "LB Montserrat", weight: 900 },
    { id: "mrbedfortregular", label: "Mr Bedfort", family: "LB Mr Bedfort", weight: 400 },
    { id: "mrdafoeregular", label: "Mr Dafoe", family: "LB Mr Dafoe", weight: 400 },
    { id: "niconneregular", label: "Niconne", family: "LB Niconne", weight: 400 },
    { id: "noricanregular", label: "Norican", family: "LB Norican", weight: 400 },
    { id: "nosiferregular", label: "Nosifer", family: "LB Nosifer", weight: 400 },
    { id: "nunitoblack", label: "Nunito", family: "LB Nunito", weight: 900 },
    { id: "oswaldbold", label: "Oswald", family: "LB Oswald", weight: 700 },
    { id: "pacificoregular", label: "Pacifico", family: "LB Pacifico", weight: 400 },
    { id: "passiononeblack", label: "Passion One", family: "LB Passion One", weight: 900 },
    { id: "patrickhandregular", label: "Patrick Hand", family: "LB Patrick Hand", weight: 400 },
    { id: "patuaoneregular", label: "Patua One", family: "LB Patua One", weight: 400 },
    { id: "permanentmarkerregular", label: "Permanent Marker", family: "LB Permanent Marker", weight: 400 },
    { id: "playfairdisplayblack", label: "Playfair Display", family: "LB Playfair Display", weight: 900 },
    { id: "poppinsblack", label: "Poppins", family: "LB Poppins", weight: 900 },
    { id: "ralewayblack", label: "Raleway", family: "LB Raleway", weight: 900 },
    { id: "rammettooneregular", label: "Rammetto One", family: "LB Rammetto One", weight: 400 },
    { id: "reemkufiinkregular", label: "Reem Kufi Ink", family: "LB Reem Kufi Ink", weight: 400 },
    { id: "righteousregular", label: "Righteous", family: "LB Righteous", weight: 400 },
    { id: "robotocondensedblack", label: "Roboto Condensed", family: "LB Roboto Condensed", weight: 900 },
    { id: "romanescoregular", label: "Romanesco", family: "LB Romanesco", weight: 400 },
    { id: "rubikmonooneregular", label: "Rubik Mono One", family: "LB Rubik Mono One", weight: 400 },
    { id: "rubikspraypaintregular", label: "Rubik Spray Paint", family: "LB Rubik Spray Paint", weight: 400 },
    { id: "rubikwetpaintregular", label: "Rubik Wet Paint", family: "LB Rubik Wet Paint", weight: 400 },
    { id: "russooneregular", label: "Russo One", family: "LB Russo One", weight: 400 },
    { id: "sacramentoregular", label: "Sacramento", family: "LB Sacramento", weight: 400 },
    { id: "sairablack", label: "Saira", family: "LB Saira", weight: 900 },
    { id: "sairacondensedblack", label: "Saira Condensed", family: "LB Saira Condensed", weight: 900 },
    { id: "sairaexpandedblack", label: "Saira Expanded", family: "LB Saira Expanded", weight: 900 },
    { id: "sairaextracondensedblack", label: "Saira Extra Condensed", family: "LB Saira Extra Condensed", weight: 900 },
    { id: "sairasemicondensedblack", label: "Saira Semi Condensed", family: "LB Saira Semi Condensed", weight: 900 },
    { id: "sairasemiexpandedblack", label: "Saira Semi Expanded", family: "LB Saira Semi Expanded", weight: 900 },
    { id: "sairastencilblack", label: "Saira Stencil", family: "LB Saira Stencil", weight: 900 },
    { id: "sairaultracondensedblack", label: "Saira Ultra Condensed", family: "LB Saira Ultra Condensed", weight: 900 },
    { id: "sarinaregular", label: "Sarina", family: "LB Sarina", weight: 400 },
    { id: "satisfyregular", label: "Satisfy", family: "LB Satisfy", weight: 400 },
    { id: "sedgwickavedisplayregular", label: "Sedgwick Ave Display", family: "LB Sedgwick Ave Display", weight: 400 },
    { id: "shadowsintolighttworegular", label: "Shadows Into Light Two", family: "LB Shadows Into Light Two", weight: 400 },
    { id: "shojumaruregular", label: "Shojumaru", family: "LB Shojumaru", weight: 400 },
    { id: "sigmaroneregular", label: "Sigmar One", family: "LB Sigmar One", weight: 400 },
    { id: "sonsieoneregular", label: "Sonsie One", family: "LB Sonsie One", weight: 400 },
    { id: "specialgothicexpandedoneregular", label: "Special Gothic Expanded One", family: "LB Special Gothic Expanded One", weight: 400 },
    { id: "stalinistoneregular", label: "Stalinist One", family: "LB Stalinist One", weight: 400 },
    { id: "stickregular", label: "Stick", family: "LB Stick", weight: 400 },
    { id: "tagesschriftregular", label: "Tagesschrift", family: "LB Tagesschrift", weight: 400 },
    { id: "tekobold", label: "Teko", family: "LB Teko", weight: 700 },
    { id: "tradewindsregular", label: "Trade Winds", family: "LB Trade Winds", weight: 400 },
    { id: "ultraregular", label: "Ultra", family: "LB Ultra", weight: 400 },
    { id: "unifrakturcookbold", label: "Unifraktur Cook", family: "LB Unifraktur Cook", weight: 700 },
    { id: "unifrakturmaguntiaregular", label: "Unifraktur Maguntia", family: "LB Unifraktur Maguntia", weight: 400 },
    { id: "yanonekaffeesatzbold", label: "Yanone Kaffeesatz", family: "LB Yanone Kaffeesatz", weight: 700 },
    { id: "yellowtailregular", label: "Yellowtail", family: "LB Yellowtail", weight: 400 },
    { id: "yesteryearregular", label: "Yesteryear", family: "LB Yesteryear", weight: 400 },
  ];

  var WA_NUMERO = "5493751588753";
  var MAX_TEXTOS = 12;

  var modelos = [];
  var actual = null;
  var nextId = 1;
  /** @type {{id:number,text:string,fuente:string,size:number,rot:number,bold:boolean,italic:boolean,underline:boolean,x:number,y:number}[]} */
  var textos = [];
  var drag = null;

  var listaEl = document.getElementById("listaModelos");
  var listaTextosEl = document.getElementById("listaTextos");
  var previewImg = document.getElementById("previewImg");
  var zonaLimite = document.getElementById("zonaLimite");
  var previewWrap = document.getElementById("previewWrap");
  var btnAgregar = document.getElementById("btnAgregarTexto");
  var btnWhatsApp = document.getElementById("btnWhatsApp");
  var btnDescargar = document.getElementById("btnDescargar");
  var btnTogglePreview = null;
  var previewSticky = null;

  function labelFuente(id) {
    var f = FUENTES.find(function (x) { return x.id === id; });
    return f ? f.label : id;
  }

  function opcionesFuente(selected) {
    return FUENTES.map(function (f) {
      return (
        '<option value="' + f.id + '"' +
        (f.id === selected ? " selected" : "") +
        ">" + f.label + "</option>"
      );
    }).join("");
  }

  function clamp(n, a, b) {
    n = parseInt(n, 10);
    if (isNaN(n)) n = a;
    return Math.max(a, Math.min(b, n));
  }

  function nuevoTexto(parcial) {
    var defFuente = (actual && actual.fuenteDefault) || "oswaldbold";
    var t = {
      id: nextId++,
      text: "",
      fuente: defFuente,
      size: textos.length === 0 ? 36 : 28,
      rot: 0,
      bold: false,
      italic: false,
      underline: false,
      x: 50,
      y: 30 + (textos.length % 5) * 12
    };
    if (parcial) {
      Object.keys(parcial).forEach(function (k) { t[k] = parcial[k]; });
    }
    return t;
  }

  function aplicarZona() {
    if (!actual || !actual.zona) return;
    var z = actual.zona;
    var forma = actual.forma || "rect";
    // Porcentajes relativos al preview-stage (= tamaño real del SVG en pantalla)
    zonaLimite.style.left = z.left + "%";
    zonaLimite.style.top = z.top + "%";
    zonaLimite.style.width = z.width + "%";
    zonaLimite.style.height = z.height + "%";
    zonaLimite.className = "zona-limite forma-" + forma;
    renderCapas();
  }

  function aplicarZonaTrasLayout() {
    // Esperar a que el navegador calcule el tamaño final de la imagen
    requestAnimationFrame(function () {
      requestAnimationFrame(aplicarZona);
    });
  }

  function setFuenteClass(el, id) {
    FUENTES.forEach(function (f) { el.classList.remove("f-" + f.id); });
    el.classList.add("f-" + id);
  }

  function renderCapas() {
    zonaLimite.innerHTML = "";
    textos.forEach(function (t) {
      var el = document.createElement("div");
      el.className = "texto-capa" + (t.text ? "" : " vacio");
      el.dataset.id = String(t.id);
      el.textContent = t.text || "Texto";
      setFuenteClass(el, t.fuente);
      el.style.left = t.x + "%";
      el.style.top = t.y + "%";
      el.style.transform = "translate(-50%, -50%) rotate(" + t.rot + "deg)";
      el.style.fontSize = t.size + "px";
      // peso base de la fuente elegida; el check Negrita solo sube si hace falta
      var baseW = 400;
      var fmeta = FUENTES.find(function (x) { return x.id === t.fuente; });
      if (fmeta && fmeta.weight) baseW = fmeta.weight;
      el.style.fontWeight = t.bold ? String(Math.max(700, baseW)) : String(baseW);
      el.style.fontStyle = t.italic ? "italic" : "normal";
      el.style.textDecoration = t.underline ? "underline" : "none";
      zonaLimite.appendChild(el);
    });
  }

  function renderListaTextos() {
    listaTextosEl.innerHTML = "";
    textos.forEach(function (t, idx) {
      var max = (actual && actual.maxCaracteres) || 40;
      var div = document.createElement("div");
      div.className = "bloque-texto";
      div.dataset.id = String(t.id);
      div.innerHTML =
        "<h3><span>Texto " + (idx + 1) + "</span>" +
        (textos.length > 1
          ? '<button type="button" class="btn-quitar-texto" data-quitar="' + t.id + '">Quitar</button>'
          : "") +
        "</h3>" +
        '<input type="text" class="form-control mb-2 inp-texto" data-id="' + t.id + '" maxlength="' + max + '" ' +
        'placeholder="Ej: una letra o una palabra" value="' + String(t.text).replace(/"/g, "&quot;") + '">' +
        '<div class="row g-2 align-items-end mb-2">' +
        '<div class="col-6 col-md-3"><label class="form-label small mb-0">Fuente</label>' +
        '<select class="form-select form-select-sm inp-fuente" data-id="' + t.id + '">' + opcionesFuente(t.fuente) + "</select></div>" +
        '<div class="col-4 col-md-2"><label class="form-label small mb-0">Tamaño</label>' +
        '<input type="number" class="form-control form-control-sm inp-size" data-id="' + t.id + '" min="8" max="120" value="' + t.size + '"></div>' +
        '<div class="col-4 col-md-2"><label class="form-label small mb-0">Inclinación (°)</label>' +
        '<input type="number" class="form-control form-control-sm inp-rot" data-id="' + t.id + '" min="-360" max="360" value="' + t.rot + '"></div>' +
        '<div class="col-4 col-md-5"><span class="small text-muted contador" data-id="' + t.id + '">' +
        t.text.length + " / " + max + "</span></div>" +
        "</div>" +
        '<div class="d-flex flex-wrap gap-3 estilo-checks">' +
        '<div class="form-check"><input class="form-check-input inp-bold" type="checkbox" data-id="' + t.id + '" id="b' + t.id + '"' + (t.bold ? " checked" : "") + ">" +
        '<label class="form-check-label" for="b' + t.id + '">Negrita</label></div>' +
        '<div class="form-check"><input class="form-check-input inp-italic" type="checkbox" data-id="' + t.id + '" id="i' + t.id + '"' + (t.italic ? " checked" : "") + ">" +
        '<label class="form-check-label" for="i' + t.id + '">Cursiva</label></div>' +
        '<div class="form-check"><input class="form-check-input inp-underline" type="checkbox" data-id="' + t.id + '" id="u' + t.id + '"' + (t.underline ? " checked" : "") + ">" +
        '<label class="form-check-label" for="u' + t.id + '">Subrayado</label></div>' +
        "</div>";
      listaTextosEl.appendChild(div);
    });

    btnAgregar.disabled = textos.length >= MAX_TEXTOS;
    btnAgregar.style.opacity = textos.length >= MAX_TEXTOS ? "0.5" : "1";
  }

  function findTexto(id) {
    id = parseInt(id, 10);
    return textos.find(function (t) { return t.id === id; });
  }

  function refrescarTodo() {
    renderListaTextos();
    renderCapas();
  }

  function agregarTexto() {
    if (textos.length >= MAX_TEXTOS) return;
    textos.push(nuevoTexto());
    refrescarTodo();
  }

  function quitarTexto(id) {
    if (textos.length <= 1) return;
    textos = textos.filter(function (t) { return t.id !== id; });
    refrescarTodo();
  }

  // Eventos delegados en lista de textos
  listaTextosEl.addEventListener("input", function (e) {
    var el = e.target;
    var id = el.dataset.id;
    if (!id) return;
    var t = findTexto(id);
    if (!t) return;
    var max = (actual && actual.maxCaracteres) || 40;

    if (el.classList.contains("inp-texto")) {
      t.text = el.value.slice(0, max);
      if (el.value !== t.text) el.value = t.text;
      var c = listaTextosEl.querySelector('.contador[data-id="' + id + '"]');
      if (c) c.textContent = t.text.length + " / " + max;
    } else if (el.classList.contains("inp-size")) {
      t.size = clamp(el.value, 8, 120);
      el.value = t.size;
    } else if (el.classList.contains("inp-rot")) {
      t.rot = clamp(el.value, -360, 360);
      el.value = t.rot;
    }
    renderCapas();
  });

  listaTextosEl.addEventListener("change", function (e) {
    var el = e.target;
    var id = el.dataset.id;
    if (!id) return;
    var t = findTexto(id);
    if (!t) return;
    if (el.classList.contains("inp-fuente")) t.fuente = el.value;
    if (el.classList.contains("inp-bold")) t.bold = el.checked;
    if (el.classList.contains("inp-italic")) t.italic = el.checked;
    if (el.classList.contains("inp-underline")) t.underline = el.checked;
    renderCapas();
  });

  listaTextosEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-quitar]");
    if (!btn) return;
    quitarTexto(parseInt(btn.dataset.quitar, 10));
  });

  btnAgregar.addEventListener("click", agregarTexto);

  function seleccionarModelo(m) {
    actual = m;
    // Mantener textos del usuario pero resetear posiciones un poco
    if (!textos.length) {
      textos = [nuevoTexto()];
    }
    previewImg.src = m.imagen;
    previewImg.onload = function () {
      aplicarZonaTrasLayout();
    };
    if (previewImg.complete) aplicarZonaTrasLayout();
    else aplicarZona();
    refrescarTodo();
    document.querySelectorAll(".card-modelo").forEach(function (c) {
      c.classList.toggle("active", c.dataset.id === m.id);
    });
  }

  function miniaturaDe(m) {
    if (m.miniatura) return m.miniatura;
    if (m.imagen && m.imagen.indexOf('.svg') !== -1) return m.imagen.replace(/\.svg$/i, '.jpg');
    return m.imagen || '';
  }

  function renderListaModelos() {
    listaEl.innerHTML = modelos
      .map(function (m) {
        var thumb = miniaturaDe(m);
        return (
          '<div class="col-6 col-md-3">' +
          '<div class="card-modelo" data-id="' + m.id + '">' +
          '<img src="' + thumb + '" alt="' + m.nombre + '" class="card-modelo-img" loading="lazy">' +
          '<div class="p-2 small fw-semibold text-center">' + m.nombre + "</div>" +
          "</div></div>"
        );
      })
      .join("");
    listaEl.querySelectorAll(".card-modelo").forEach(function (card) {
      card.addEventListener("click", function () {
        var m = modelos.find(function (x) { return x.id === card.dataset.id; });
        if (m) seleccionarModelo(m);
      });
    });
  }

  /* Arrastre (mouse + touch móvil) */
  function getPoint(e, rect) {
    var src = null;
    if (e.touches && e.touches.length) src = e.touches[0];
    else if (e.changedTouches && e.changedTouches.length) src = e.changedTouches[0];
    else src = e;
    var cx = src.clientX;
    var cy = src.clientY;
    return {
      x: ((cx - rect.left) / rect.width) * 100,
      y: ((cy - rect.top) / rect.height) * 100
    };
  }

  function aplicarPosicionCapa(t) {
    var el = zonaLimite.querySelector('.texto-capa[data-id="' + t.id + '"]');
    if (!el) return;
    el.style.left = t.x + "%";
    el.style.top = t.y + "%";
    el.style.transform = "translate(-50%, -50%) rotate(" + (t.rot || 0) + "deg)";
  }

  function onDown(e) {
    var el = e.target.closest(".texto-capa");
    if (!el) return;
    var t = findTexto(el.dataset.id);
    if (!t) return;
    // solo un dedo
    if (e.touches && e.touches.length > 1) return;
    var rect = zonaLimite.getBoundingClientRect();
    var p = getPoint(e, rect);
    drag = {
      id: t.id,
      startX: p.x,
      startY: p.y,
      x0: t.x,
      y0: t.y,
      touchId: e.touches && e.touches[0] ? e.touches[0].identifier : null
    };
    el.classList.add("arrastrando");
    e.preventDefault();
    e.stopPropagation();
  }

  function onMove(e) {
    if (!drag) return;
    // en multi-touch, seguir el dedo del drag
    if (e.touches && e.touches.length && drag.touchId != null) {
      var found = false;
      for (var i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === drag.touchId) { found = true; break; }
      }
      if (!found) return;
    }
    var rect = zonaLimite.getBoundingClientRect();
    var p = getPoint(e, rect);
    var t = findTexto(drag.id);
    if (!t) return;
    t.x = Math.max(5, Math.min(95, drag.x0 + (p.x - drag.startX)));
    t.y = Math.max(8, Math.min(92, drag.y0 + (p.y - drag.startY)));
    // mover sin recrear el DOM (evita que el touch se "trabe")
    aplicarPosicionCapa(t);
    e.preventDefault();
  }

  function onUp(e) {
    if (!drag) return;
    if (e && e.changedTouches && drag.touchId != null) {
      var match = false;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === drag.touchId) { match = true; break; }
      }
      if (!match) return;
    }
    drag = null;
    renderCapas();
  }

  zonaLimite.addEventListener("mousedown", onDown);
  zonaLimite.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
  window.addEventListener("touchcancel", onUp);
  window.addEventListener("resize", aplicarZonaTrasLayout);
  if (typeof ResizeObserver !== "undefined" && previewImg) {
    var ro = new ResizeObserver(function () { aplicarZonaTrasLayout(); });
    ro.observe(previewImg);
    var stage = document.getElementById("previewStage");
    if (stage) ro.observe(stage);
  }

  if (btnTogglePreview && previewSticky) {
    btnTogglePreview.addEventListener("click", function () {
      var colapsada = previewSticky.classList.toggle("colapsada");
      btnTogglePreview.setAttribute("aria-expanded", colapsada ? "false" : "true");
      btnTogglePreview.textContent = colapsada ? "Mostrar vista previa" : "Achicar vista previa";
    });
  }

  function estilosStr(t) {
    var parts = [];
    if (t.bold) parts.push("negrita");
    if (t.italic) parts.push("cursiva");
    if (t.underline) parts.push("subrayado");
    return parts.length ? parts.join(", ") : "normal";
  }

  function armarMensajeWA() {
    var modelo = actual ? actual.nombre : "chapita";
    var partes = [
      "Hola! Quiero encargar un grabado:",
      "",
      "Modelo: " + modelo,
      "Forma de área: " + ((actual && actual.forma) || "rect")
    ];
    textos.forEach(function (t, i) {
      partes.push(
        "",
        "— Texto " + (i + 1) + " —",
        'Texto: "' + ((t.text || "").trim() || "(vacío)") + '"',
        "Fuente: " + labelFuente(t.fuente),
        "Tamaño: " + t.size + " px",
        "Inclinación: " + t.rot + "°",
        "Estilo: " + estilosStr(t)
      );
    });
    partes.push(
      "",
      "Adjunto la captura del diseño que descargué de la web.",
      "",
      "(Por favor no modificar este mensaje)"
    );
    return partes.join("\n");
  }

  async function capturarPreview() {
    var prevBorder = zonaLimite.style.border;
    zonaLimite.style.border = "none";
    try {
      return await html2canvas(previewWrap, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false
      });
    } finally {
      zonaLimite.style.border = prevBorder;
    }
  }

  btnDescargar.addEventListener("click", async function () {
    btnDescargar.disabled = true;
    btnDescargar.textContent = "Generando imagen…";
    try {
      var canvas = await capturarPreview();
      var a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "grabado-simulacion.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("No se pudo generar la captura. Probá de nuevo.");
    }
    btnDescargar.disabled = false;
    btnDescargar.textContent = "1. Descargar captura del diseño";
  });

  btnWhatsApp.addEventListener("click", function () {
    var url = "https://wa.me/" + WA_NUMERO + "?text=" + encodeURIComponent(armarMensajeWA());
    window.open(url, "_blank");
  });

  async function init() {
    try {
      var r = await fetch("modelos-grabado.json?v=" + Date.now());
      var todos = await r.json();
      modelos = todos.filter(function (m) { return m.activo !== false; });
    } catch (e) {
      listaEl.innerHTML = '<div class="col-12 text-danger small">No se pudo cargar modelos-grabado.json</div>';
      return;
    }
    renderListaModelos();
    textos = [nuevoTexto()];
    if (modelos.length) seleccionarModelo(modelos[0]);
    else refrescarTodo();
  }

  init();
})();
