/**
 * Compatibilidad modelo ↔ producto (compartido por guía e index).
 * Expone window.CompatModelo
 */
(function (global) {
  "use strict";

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

  function labelModelo(m) {
    var base = norm(m.marca + " " + m.modelo);
    if (norm(m.marca) === "motorola") base += " " + norm("moto " + m.modelo);
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

  function tipoCableProducto(text) {
    var d = norm(text);
    if (/tipoc\s*a\s*tipoc|tipo\s*c\s*a\s*tipo\s*c/.test(d)) return "TIPOC_A_TIPOC";
    if (/tipoc\s*a\s*iphone|tipo\s*c\s*a\s*iphone|tipoc\s*a\s*lightning/.test(d)) return "TIPOC_A_IPHONE";
    if (/(usb\s*a\s*iphone|usb\s*a\s*lightning)/.test(d) ||
        (/usb/.test(d) && /iphone|lightning/.test(d) && !/tipoc|tipo\s*c/.test(d))) return "USB_A_IPHONE";
    if (/(usb\s*a\s*tipoc|usb\s*a\s*tipo\s*c)/.test(d) ||
        (/usb/.test(d) && /tipoc|tipo\s*c/.test(d) && !/tipoc\s*a\s*tipoc/.test(d))) return "USB_A_TIPOC";
    if (/\bv8\b|micro\s*usb|microusb/.test(d)) return "V8";
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
    var d = norm(text);
    return /\bapple\b/.test(d) || /\biphone\b/.test(d) || /\blightning\b/.test(d);
  }
  function esModeloApple(modelo) {
    return norm(modelo.marca) === "apple";
  }

  function textoProd(prod) {
    return String(prod.Descripción || "") + " " + String(prod.Categoria || "");
  }

  function matchCabezalOCompleto(prod, modelo, tipo) {
    var t = textoProd(prod);
    var d = norm(t);
    if (tipo === "completo") {
      if (!esCargadorCompleto(t)) return false;
    } else {
      if (!esCabezal(t)) return false;
    }
    if (/notebook|laptop|pilas|\baa\b|\baaa\b/.test(d)) return false;
    if (diceApple(t) && !esModeloApple(modelo)) return false;

    var pot = Number(modelo.potencia) || 0;
    var cor = Number(modelo.corriente) || 0;
    var fm = tipoFichaModelo(modelo.fichas);
    var okW = tienePotenciaMin(t, pot);
    var okA = cor > 0 && tieneAmperajeMin(t, cor);
    if (!okW && !okA) return false;

    if (fm === "V8") {
      if (/tipoc|tipo\s*c/.test(d) && !/usb/.test(d)) return false;
      return /usb/.test(d) || /\bv8\b|micro/.test(d) || okA || okW;
    }
    if (fm === "LIGHTNING") {
      if (/\bv8\b|micro\s*usb/.test(d) && !/usb|tipoc|apple|iphone/.test(d)) return false;
      return true;
    }
    if (fm === "TIPOC" || fm === "TIPOC_CC" || fm === "TIPOC_IPHONE") {
      return (/tipoc|tipo\s*c|usb/.test(d)) && !/\bv8\b|micro\s*usb/.test(d);
    }
    return true;
  }

  function matchCable(prod, modelo) {
    var t = textoProd(prod);
    if (!esCable(t)) return false;
    if (/joystick|hdmi|rca|auxiliar|ps3|ps4|auricular/.test(norm(t))) return false;
    var tipoCab = tipoCableProducto(t);
    if (!tipoCab) return false;

    var fm = tipoFichaModelo(modelo.fichas);
    var pot = Number(modelo.potencia) || 0;
    var cor = Number(modelo.corriente) || 0;
    var okTipo = false;

    if (fm === "V8") {
      okTipo = tipoCab === "V8";
    } else if (fm === "LIGHTNING") {
      if (tipoCab === "TIPOC_A_IPHONE") okTipo = true;
      if (tipoCab === "USB_A_IPHONE") okTipo = cor < 10;
    } else if (fm === "TIPOC_CC" || fm === "TIPOC") {
      if (tipoCab === "TIPOC_A_TIPOC") okTipo = true;
      if (tipoCab === "USB_A_TIPOC") okTipo = cor < 10;
    } else if (fm === "TIPOC_IPHONE") {
      if (tipoCab === "TIPOC_A_IPHONE") okTipo = true;
      if (tipoCab === "USB_A_IPHONE") okTipo = cor < 10;
    }
    if (!okTipo) return false;

    var okW = tienePotenciaMin(t, pot);
    var okA = cor > 0 && tieneAmperajeMin(t, cor);
    if (tipoCab === "USB_A_TIPOC" || tipoCab === "USB_A_IPHONE" || tipoCab === "V8") {
      return okA || okW;
    }
    return okW;
  }

  function compatible(prod, modelo) {
    if (Number(prod.Inventario) < 1) return false;
    if (matchCabezalOCompleto(prod, modelo, "completo")) return true;
    if (matchCabezalOCompleto(prod, modelo, "cabezal")) return true;
    if (matchCable(prod, modelo)) return true;
    return false;
  }

  function findModelos(modelos, query) {
    var q = expandQuery(query);
    if (!q || q.length < 2) return [];
    return modelos.filter(function (m) {
      var label = labelModelo(m);
      return label.indexOf(q) !== -1 ||
        norm(m.modelo).indexOf(q) !== -1 ||
        q.split(" ").every(function (part) { return !part || label.indexOf(part) !== -1; });
    });
  }

  /** Productos compatibles con el mejor modelo encontrado; orden: completo → cabezal → cable */
  function productosCompatibles(articulos, modelo) {
    var lista = articulos.filter(function (p) { return compatible(p, modelo); });
    lista.sort(function (a, b) {
      function rank(p) {
        var t = textoProd(p);
        if (esCargadorCompleto(t)) return 0;
        if (esCabezal(t)) return 1;
        return 2;
      }
      return rank(a) - rank(b);
    });
    return lista;
  }

  global.CompatModelo = {
    norm: norm,
    expandQuery: expandQuery,
    findModelos: findModelos,
    compatible: compatible,
    productosCompatibles: productosCompatibles
  };
})(typeof window !== "undefined" ? window : globalThis);
