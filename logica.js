//importamos los modulos y variables a ser utilizados

//datos carga el Json en variable (datos)
import data from './jADatos.js';
const datos = Array.from(data);
//mBotones muestra los botones Agregar al carrito con movimiento
import * as mBotones from './mBotones.js';
//alertas muestras las alertas!
import * as alertas from './alertas.js';
//cargamos las funciones de vuscar los datos de los productos para agregar al carrito
import * as buscarDatos from './buscarDatos.js';
//funciones de carga y extraccion de local storage
import * as localStor from './localStor.js';
//cargamos la funcion de descuentos correspondientes
import * as descu from './descu.js';
//vargamos la funvion de subir scroll y el boton con esa misma accion
import * as subirScroll from './subirScroll.js';
//cargamos la inicializacion de itemCarrito
import * as inItemCarr from './inItemCarr.js';
//cargamos la variable de itemCarrito
import { itemCarrito } from './inItemCarr.js';
//cargamos los eventos de cerrar canvas
import * as eventCerrCanvas from './eventCerrCanvas.js';
//cargamos el evento que asigna las medidas de los productos cartuchos-agujas-punteras
import * as varianteDeMedidas from './varianteDeMedidas.js';
//cargamos la animacion compartida del logo de fondo (antes duplicada con index.html)
import { iniciarAnimLogo } from './animLogo.js';

iniciarAnimLogo();

// ==========================================
// MÓDULO DE FAVORITOS MEJORADO
// ==========================================
let listaFavoritos = [];

// Leemos el LocalStorage y nos aseguramos de convertirlo correctamente a Array de Números
try {
  const favsGuardados = JSON.parse(localStorage.getItem('favoritos_limon'));
  if (Array.isArray(favsGuardados)) {
    listaFavoritos = favsGuardados.map(id => parseInt(id)).filter(id => !isNaN(id));
  }
} catch (e) {
  listaFavoritos = [];
}

function guardarFavoritosLS() {
  localStorage.setItem('favoritos_limon', JSON.stringify(listaFavoritos));
  actualizarVistaFavoritos();
}

function toggleFavorito(articuloId) {
  const idNum = parseInt(articuloId);
  const index = listaFavoritos.indexOf(idNum);

  if (index === -1) {
    listaFavoritos.push(idNum);
    alertas.alertAgrego("Favoritos", "Agregado a tus favoritos ❤️", "alert-danger");
  } else {
    listaFavoritos.splice(index, 1);
    alertas.alertAgrego("Favoritos", "Eliminado de tus favoritos 💔", "alert-warning");
  }

  guardarFavoritosLS();

  // Actualizar íconos en las tarjetas del catálogo
  document.querySelectorAll(`.btn-favorito-card[data-articulo="${idNum}"]`).forEach(btn => {
    btn.innerHTML = listaFavoritos.includes(idNum) ? '❤️' : '🤍';
  });
}

function actualizarVistaFavoritos() {
  const cantFavElem = document.getElementById("cantFavoritos");
  if (cantFavElem) cantFavElem.textContent = listaFavoritos.length;

  const contenedorFav = document.getElementById("contenedorListaFavoritos");
  const mensajeVacio = document.getElementById("sinFavoritosMensaje");

  if (!contenedorFav) return;

  contenedorFav.innerHTML = '';

  if (listaFavoritos.length === 0) {
    if (mensajeVacio) mensajeVacio.classList.remove('d-none');
    return;
  }

  if (mensajeVacio) mensajeVacio.classList.add('d-none');

  listaFavoritos.forEach(idFav => {
    const prod = datos.find(d => d.Artículo === idFav);
    if (!prod) return;

    // Cálculo del precio final
    let precioCalculado = Number(prod.Venta.replace(/,/g, ".")) * Number(prod.DOLAR);
    if (prod.Descuento != 0) {
      precioCalculado = precioCalculado * (1 - Number(prod.Descuento.replace(/,/g, ".")));
    }
    const precioFormat = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCalculado);

    // Crear ítem de tarjeta para la lista de Favoritos
    const cardFav = document.createElement('div');
    cardFav.className = 'card bg-secondary text-white p-3 border-0 shadow-sm position-relative';
    cardFav.innerHTML = `
      <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle btn-quitar-fav" data-articulo="${prod.Artículo}" title="Quitar de favoritos">
        ❌
      </button>
      <div class="d-flex align-items-center mb-2">
        <img src="./imgcarrito/${prod.Artículo}.jpg" onerror="this.src='./imgcarrito/IMGND.jpg'" style="width: 60px; height: 60px; object-fit: cover;" class="rounded me-3">
        <div>
          <h6 class="mb-1 text-truncate" style="max-width: 180px;">${prod.Descripción}</h6>
          <strong class="text-warning fs-6">$${precioFormat}</strong>
        </div>
      </div>
      <div class="d-flex align-items-center justify-content-between gap-2 mt-2">
        <div class="d-flex align-items-center gap-1">
          <small>Cant:</small>
          <input type="number" class="form-control form-control-sm cant-fav-input" style="width: 60px;" value="1" min="1" max="${prod.Inventario}">
        </div>
        <button class="btn btn-sm btn-success btn-fav-agregar-carr flex-grow-1 fw-bold">
          🛒 Agregar
        </button>
      </div>
    `;

    // Evento para quitar de favoritos
    cardFav.querySelector('.btn-quitar-fav').addEventListener('click', () => {
      toggleFavorito(prod.Artículo);
    });

    // Evento para agregar al carrito desde favoritos con la cantidad especificada
    cardFav.querySelector('.btn-fav-agregar-carr').addEventListener('click', () => {
      const cantInput = cardFav.querySelector('.cant-fav-input');
      const unidades = parseInt(cantInput.value) || 1;

      const idBaseProducto = prod.Artículo;
      const unidadesYaEnCarrito = itemCarrito.reduce((total, item) => {
        const idBaseItem = item.ImagenId !== undefined ? item.ImagenId : item.Artículo;
        return idBaseItem === idBaseProducto ? total + item.Unidades : total;
      }, 0);

      if (unidadesYaEnCarrito + unidades > prod.Inventario) {
        alertas.alertAgrego(prod.Descripción, "NO HAY STOCK SUFICIENTE", "alert-danger");
        return;
      }

      let siEstaId = itemCarrito.find(artic => artic.Artículo === prod.Artículo);
      if (siEstaId) {
        siEstaId.Unidades += unidades;
      } else {
        let ventaFinal = prod.Descuento != 0 
          ? (Number(prod.Venta.replace(/,/g, ".")) * (1 - (Number(prod.Descuento.replace(/,/g, "."))))) 
          : prod.Venta;
        
        itemCarrito.push({
          Artículo: prod.Artículo,
          Descripción: prod.Descripción,
          Venta: ventaFinal.toString(),
          DOLAR: prod.DOLAR,
          Unidades: unidades,
          ImagenId: prod.Artículo
        });
      }

      localStor.guardarEnLocalStorage(itemCarrito);
      actualizarCarrito();
      actualizarEnlaceWhatsApp();
      alertas.alertAgrego(prod.Descripción, `Se agregaron ${unidades} unidad(es) al carrito`, "alert-success");
    });

    contenedorFav.appendChild(cardFav);
  });
}

// VARIABLE PARA MOSTRAR CANTIDAD DE ITEMS EN FLOBO DE CARRITO
const cantCarritod = document.getElementById("cantCarrito");
let cantCarritoLet = 0;
let flagMostrarDescuentos = false;

// cargamos los template del html y creamos los fragmentos
let template = document.getElementById("contTemplate").content;
let fragmento = document.createDocumentFragment();

let template2 = document.getElementById("contTemplate2").content;
let fragmento2 = document.createDocumentFragment();

let template3 = document.getElementById("contTemplate3").content;

// cargamos donde mostramos total de carrino en el navbar
let totalCarritoNavb = document.getElementById("totalCarritoNavb");
const interes = document.getElementById("interes");
const intprecioTotal = document.getElementById("precioTotal");
var selectElement = template2.querySelector('.variantes');

// CREACIÓN GLOBAL DEL BOTÓN WHATSAPP
const enlaceWhatsApp = document.createElement("a");
enlaceWhatsApp.className = "btn btn-success btn-lg w-100 fw-bold shadow-sm rounded-pill my-3 d-flex align-items-center justify-content-center gap-2";
enlaceWhatsApp.innerHTML = "📲 Enviar carrito por WhatsApp";

enlaceWhatsApp.addEventListener('click', function (event) {
  event.preventDefault();
  actualizarEnlaceWhatsApp();
  const urlActual = enlaceWhatsApp.getAttribute("href");
  if (!urlActual || urlActual.endsWith('text=')) {
    alertas.alertAgrego("Atención", "Seleccioná un método de pago antes de enviar", "alert-warning");
    return;
  }
  
  window.open(urlActual, '_blank');
  localStorage.removeItem('datosCarrito');
});

function MostrarEnCatalogo(datos, contenedorId) {
  template.querySelector('.esteSi').setAttribute("id", contenedorId);

  const carouselId = "carousel-prod-" + datos.Artículo;
  const carouselElem = template2.querySelector(".carousel");
  carouselElem.setAttribute("id", carouselId);

  const carouselInner = template2.querySelector(".carousel-inner");
  const carouselIndicators = template2.querySelector(".carousel-indicators");
  const btnPrev = template2.querySelector(".carousel-control-prev");
  const btnNext = template2.querySelector(".carousel-control-next");

  btnPrev.setAttribute("data-bs-target", "#" + carouselId);
  btnNext.setAttribute("data-bs-target", "#" + carouselId);
  
  carouselElem.dataset.articulo = datos.Artículo;
  carouselElem.dataset.descripcion = typeof datos.Descripción === 'string' ? datos.Descripción : "Producto";

  btnPrev.classList.remove("d-none");
  btnNext.classList.remove("d-none");
  carouselIndicators.innerHTML = '';

  const imgPrincipal = carouselInner.querySelector("img");
  imgPrincipal.src = "./imgcarrito/" + datos.Artículo + ".jpg";
  imgPrincipal.id = "img" + datos.Artículo;
  imgPrincipal.alt = typeof datos.Descripción === 'string' ? datos.Descripción : "Producto";
  imgPrincipal.onerror = function () { this.src = "./imgcarrito/IMGND.jpg"; };

  const btnFavCard = template2.querySelector(".btn-favorito-card");
  if (btnFavCard) {
    btnFavCard.dataset.articulo = datos.Artículo;
btnFavCard.className = "btn-favorito-card btn btn-sm position-absolute top-0 end-0 m-2 fs-3 border-0 bg-transparent";
    btnFavCard.innerHTML = listaFavoritos.includes(datos.Artículo) ? '❤️' : '🤍';
  }

  const h5Element = template2.querySelector("h5");
  if (h5Element) {
    const descripcionTexto = datos.Descripción;
    if (typeof descripcionTexto === 'string') {
      h5Element.textContent = descripcionTexto;
      h5Element.style.fontSize = descripcionTexto.length < 35 ? '1.8VH' : '1.6VH';
    } else {
      h5Element.textContent = 'Descripción no válida';
      h5Element.style.fontSize = '1.4VH';
    }
  }

  varianteDeMedidas.AgregaVariantes(datos, template2);

  template2.querySelector(".cantidad").setAttribute("id", "idbot" + (datos.Artículo));
  template2.querySelector(".cantidad").setAttribute("max", (datos.Inventario));
  
  if (datos.Descuento != 0) {
    let precioCatalogo = (Number(datos.Venta.replace(/,/g, ".")));
    let precioCatalogo2 = precioCatalogo * (1 - Number(datos.Descuento.replace(/,/g, ".")));
    let precioCatalogo3 = precioCatalogo2 / 1.21;

    precioCatalogo = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);
    precioCatalogo2 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo2);
    precioCatalogo3 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo3);

    template2.querySelector("small").innerHTML = "<del>$" + precioCatalogo + "</del>";
    template2.querySelector("h7").textContent = "$" + precioCatalogo2;
    template2.querySelector("h11").textContent = "Sin imp. nac.: $" + precioCatalogo3;
  } else {
    let precioCatalogo = (Number(datos.Venta.replace(/,/g, ".")) * Number(datos.DOLAR));
    let precioCatalogo3 = precioCatalogo / 1.21;

    precioCatalogo = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);
    precioCatalogo3 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo3);

    template2.querySelector("small").textContent = "";
    template2.querySelector("h7").textContent = "$" + precioCatalogo;
    template2.querySelector("h11").textContent = "Sin imp. nac.: $" + precioCatalogo3;
  }

  const btnMasInfo = template2.querySelector(".btn-mas-info");
  if (btnMasInfo) btnMasInfo.dataset.articulo = datos.Artículo;

  const addButton = template2.querySelector(".botonaparecer");
  if (addButton) addButton.setAttribute("id", "idbot" + (datos.Artículo));

  let clone2 = document.importNode(template2, true);
  fragmento2.appendChild(clone2);
  return fragmento2;
}

// Inicialización de Favoritos y Carrito
inItemCarr.inItemCarr();
actualizarCarrito();
actualizarVistaFavoritos();

subirScroll.crearBotonScroll();

document.addEventListener('contextmenu', function (event) {
  if (event.target.closest('.img-prod') || event.target.closest('.carrito-item-img')) {
    event.preventDefault();
  }
});

var FILTROS = "";
let unidades = 1;

const dropdownContainer = document.querySelector(".porCategoria");
const dropdownMenu = dropdownContainer.querySelector(".porCategoriaUl");
const nombreDesplegable = dropdownContainer.querySelector(".nombreDesplegable");

const categoriasUnicas = new Set();

datos.forEach(objeto => {
  categoriasUnicas.add("VER TODOS");
  categoriasUnicas.add("CON DESCUENTOS");

  if (objeto.Inventario >= 1) {
    categoriasUnicas.add(objeto.Categoria);
  }
});

poblarMenuDesplegableProductos(categoriasUnicas);

categoriasUnicas.forEach(categoria => {
  const lil = document.createElement("li");
  const boton = document.createElement("button");
  boton.textContent = categoria;
  boton.className = "btn btn-outline-dark rounded-pill m-1 categoria-btn";
  boton.type = "button";
  
  boton.addEventListener("click", () => {
    FILTROS = boton.textContent;

    while (fragmento2.firstChild) fragmento2.removeChild(fragmento2.firstChild);
    while (fragmento.firstChild) fragmento.removeChild(fragmento.firstChild);

    datos.forEach((datos) => {
      if (datos.Inventario >= 1 && (FILTROS === "VER TODOS" || datos.Categoria == FILTROS || (FILTROS === "CON DESCUENTOS" && datos.Descuento != 0))) {
        contenedorId = 0;
        fragmento2 = MostrarEnCatalogo(datos, contenedorId);
      }
      mBotones.mostrarBotones();
    });

    let clone = document.importNode(template, true);
    fragmento.appendChild(clone);

    const contenedorCatalogo = document.getElementById('contenedorCatalogo');
    if (contenedorCatalogo) {
      contenedorCatalogo.innerHTML = '';
      contenedorCatalogo.appendChild(fragmento);
    }

    const target = document.getElementById(contenedorId);
    if (target) target.appendChild(fragmento2);

    const botones = document.querySelectorAll(".categoria-btn");
    botones.forEach(btn => {
      btn.classList.remove("btn-dark");
      btn.classList.add("btn-outline-dark");
    });

    boton.classList.remove("btn-outline-dark");
    boton.classList.add("btn-dark");

    descu.porDeDescuento();
    varianteDeMedidas.cambiarVariantes();
    subirScroll.subir();
  });

  lil.appendChild(boton);
  dropdownMenu.appendChild(lil);
});

let contenedorId = 0;

datos.sort((a, b) => a.Descripción.localeCompare(b.Descripción));

let descActual = '';
datos.forEach(datos => {
  if (datos.Descripción !== descActual && datos.Inventario >= 1) {
    descActual = datos.Descripción;
  }
  if (datos.Inventario >= 1) {
    contenedorId = 0;
    fragmento2 = MostrarEnCatalogo(datos, contenedorId);
  }
  mBotones.mostrarBotones();
});

let clone = document.importNode(template, true);
fragmento.appendChild(clone);
document.body.appendChild(fragmento);
document.getElementById(contenedorId).appendChild(fragmento2);

const loaderInicial = document.getElementById('loaderCatalogo');
if (loaderInicial) loaderInicial.remove();
escucharBotones();
descu.porDeDescuento();

// Delegación global de eventos para botones
function escucharBotones() {
  document.addEventListener('click', event => {
    const btnFav = event.target.closest('.btn-favorito-card');
    if (btnFav) {
      event.stopImmediatePropagation();
      const artId = btnFav.dataset.articulo;
      if (artId) toggleFavorito(artId);
      return;
    }

    const btn = event.target.closest('button[id^=idbot]');
    if (btn) {
      event.stopImmediatePropagation();

      var da = btn.id;
      var regex = /(\d+)/g;
      var da2 = (da.match(regex));

      if (!da2 || da2.length === 0) return;
      let productId = da2[0];

      let selectElement = document.getElementById('idbot' + productId);
      let unidades = selectElement ? Number(selectElement.value) : 1;

      let selectElement77 = document.getElementById('med' + productId);
      var medidas = null;
      var textMedidas = "";
      if (selectElement77 != null) {
        medidas = selectElement77.value;
        if (selectElement77.selectedIndex >= 0) {
          textMedidas = selectElement77.options[selectElement77.selectedIndex].textContent;
        }
      }

      let selectElement7 = document.getElementById('var' + productId);
      var varied = null;
      var varied2 = "";
      if (selectElement7 != null) {
        varied = selectElement7.value;
        if (selectElement7.selectedIndex >= 0) {
          varied2 = selectElement7.options[selectElement7.selectedIndex].textContent;
        }
      }

      var tit = buscarDatos.buscarId(parseInt(productId));
      var pre = buscarDatos.buscarIdPrecio(parseInt(productId));
      var dol = buscarDatos.buscarIdDol(parseInt(productId));
      var stock = buscarDatos.buscarStock(parseInt(productId));
      var desc = buscarDatos.buscarDescuento(parseInt(productId));

      const idBaseProducto = parseInt(productId);
      const unidadesYaEnCarrito = itemCarrito.reduce((total, item) => {
        const idBaseItem = item.ImagenId !== undefined ? item.ImagenId : item.Artículo;
        return idBaseItem === idBaseProducto ? total + item.Unidades : total;
      }, 0);

      if (unidadesYaEnCarrito + unidades > stock) {
        alertas.alertAgrego(tit, "NO HAY STOCK SUFICIENTE", "alert-danger");
        total();
        return;
      }

      let agregarOModificarItem = (articuloId, Artículo, Descripción, Venta, DOLAR, Unidades, Descuento, ImagenId) => {
        let siEstaId = itemCarrito.find(artic => artic.Artículo === (parseInt(articuloId)));

        if (siEstaId) {
          siEstaId.Unidades += Unidades;
          localStor.guardarEnLocalStorage(itemCarrito);
          agregar(Descripción, articuloId);
        } else {
          if (Descuento != 0) {
            let ventaCD = ((Venta) * (1 - (Number(Descuento) / 100)));
            itemCarrito.push({ Artículo, Descripción, Venta: ventaCD.toString(), DOLAR, Unidades, ImagenId });
            localStor.guardarEnLocalStorage(itemCarrito);
            agregar(Descripción, articuloId);
          } else {
            itemCarrito.push({ Artículo, Descripción, Venta, DOLAR, Unidades, ImagenId });
            localStor.guardarEnLocalStorage(itemCarrito);
            agregar(Descripción, articuloId);
          }
        }
      };

      if (medidas == null && varied == null) {
        agregarOModificarItem(productId, (parseInt(productId)), tit, pre, dol, unidades, desc, parseInt(productId));
      } else {
        if (varied == null) varied2 = "";
        let articuloIdModificado = medidas + '9990' + productId + varied;
        agregarOModificarItem(articuloIdModificado, (parseInt(articuloIdModificado)), `${tit}  ${textMedidas} ${varied2}`, pre, dol, unidades, desc, parseInt(productId));
      }

      total();
    }
  });
}

function agregar(da, da2) {
  alertas.alertAgrego(da, "Se agregó al carrito", "alert-success");
  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}

function total() {
  let sumaTotal = 0;
  itemCarrito.forEach(producto => {
    sumaTotal += (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
  });
  sumaTotal = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sumaTotal);

intprecioTotal.className = "fs-4 fw-bold text-warning bg-dark p-2 rounded text-center my-2";
  intprecioTotal.textContent = "IMPORTE TOTAL: $ " + sumaTotal;
  totalCarritoNavb.textContent = "$ " + sumaTotal;

  const cantidadTotal = itemCarrito.reduce((total, item) => total + item.Unidades, 0);
  const elementoCantidadTotal = document.getElementById("cantidadTotalCarrito");
  if (elementoCantidadTotal) {
    elementoCantidadTotal.textContent = "Cantidad de productos: " + cantidadTotal;
  }

  return ("$ " + sumaTotal);
}

eventCerrCanvas.eventCerrCanvas();

function generarEnlaceWhatsApp() {
  const telefono = "5493751588752";
  const selectorPago = document.getElementById('metodoPago');
  const pagoElegido = selectorPago ? selectorPago.value : '';

  if (!pagoElegido) return "";

  let textoCarrito = "Hola! Me interesan estos productos de la web:";
  let UnidadesProductosTotales = 0;

  itemCarrito.forEach(producto => {
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.UnUnits); // Ojo con el nombre original
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
    precioCatalogo = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);

    textoCarrito += `\n\n ${producto.Unidades} - ${producto.Descripción} -  $${precioCatalogo}`;
    UnidadesProductosTotales += producto.Unidades;
  });

  let tota = total();
  textoCarrito += `\n\n--- IMPORTE TOTAL DEL CARRITO: ${tota} `;
  textoCarrito += `\n\n--- Total de productos: ${UnidadesProductosTotales} \n`;
  textoCarrito += `\n--- DATOS DE ENTREGA ---`;

  const opcionEntrega = document.querySelector('input[name="metodoEntrega"]:checked');
  const metodo = opcionEntrega ? opcionEntrega.value : 'No seleccionado';

  if (metodo === "retiro") {
    textoCarrito += `\n*Método:* Retirar personalmente`;
  } else if (metodo === "envio") {
    const direccion = document.getElementById('direccionEnvio') ? document.getElementById('direccionEnvio').value : '';
    textoCarrito += `\n*Método:* Envío a domicilio`;
    textoCarrito += `\n*Dirección:* ${direccion || 'No especificada'}`;
  } else {
    textoCarrito += `\n*Método:* No especificado`;
  }

  textoCarrito += `\n\n--- DATOS DE PAGO ---`;
  textoCarrito += `\n*Forma de pago:* ${pagoElegido}`;

  const campoObservaciones = document.getElementById('observacionesPedido');
  const observaciones = campoObservaciones ? campoObservaciones.value.trim() : '';
  if (observaciones) {
    textoCarrito += `\n*Observaciones:* ${observaciones}`;
  }

  textoCarrito += `\n\n`;

  return `https://wa.me/${telefono}/?text=${encodeURIComponent(textoCarrito)}`;
}

function actualizarEnlaceWhatsApp() {
  const enlace = generarEnlaceWhatsApp();
  if (!enlace) {
    enlaceWhatsApp.removeAttribute("href");
    return;
  }
  enlaceWhatsApp.setAttribute("href", enlace);
}

actualizarEnlaceWhatsApp();
filtrarConBusqueda();

function filtrarConBusqueda() {
  const formulario = document.querySelector('#formulario');
  if (!formulario) return;
  let debounceBusqueda;

  const filtrar = () => {
    const texto = formulario.value.toLowerCase();
    let coincidencias = 0;

    for (let producto of datos) {
      let Descripcion = producto.Descripción.toLowerCase();
      if (Descripcion.indexOf(texto) !== -1 && producto.Inventario >= 1) {
        contenedorId = 0;
        fragmento2 = MostrarEnCatalogo(producto, contenedorId);
        coincidencias++;
      }
    }

    let clone = document.importNode(template, true);
    fragmento.appendChild(clone);

    const contenedorCatalogo = document.getElementById('contenedorCatalogo');
    if (contenedorCatalogo) {
      contenedorCatalogo.innerHTML = '';
      contenedorCatalogo.appendChild(fragmento);
    }

    const target = document.getElementById(contenedorId);
    if (target) target.appendChild(fragmento2);

    if (coincidencias === 0) {
      const contenedorResultados = document.getElementById(contenedorId);
      const sinResultados = document.createElement('div');
      sinResultados.className = 'sin-resultados';
      sinResultados.textContent = texto
        ? `No encontramos productos que coincidan con "${formulario.value}"`
        : 'No hay productos disponibles.';
      if (contenedorResultados) contenedorResultados.appendChild(sinResultados);
    }

    mBotones.mostrarBotones();
    descu.porDeDescuento();
    varianteDeMedidas.cambiarVariantes();
    subirScroll.subir();
  };

  const filtrarConDebounce = () => {
    clearTimeout(debounceBusqueda);
    debounceBusqueda = setTimeout(filtrar, 300);
  };

  formulario.addEventListener('input', filtrarConDebounce);
  formulario.addEventListener('keydown', (event) => {
    if (event.keyCode === 13 || event.key === 'Enter') {
      clearTimeout(debounceBusqueda);
      filtrar();
      ocultarCanvasBusqueda();
    }
  });
}

function ocultarCanvasBusqueda() {
  const elementosBackdrop = document.getElementsByClassName("offcanvas-backdrop");
  for (let i = 0; i < elementosBackdrop.length; i++) {
    elementosBackdrop[i].classList.remove('show');
  }

  const offcanvasElement = document.getElementById('offcanvasDarkNavbar');
  if (offcanvasElement) {
    const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
    offcanvas.hide();
  }

  document.body.removeAttribute('style');
}

function actualizarCarrito() {
  total();
  interes.innerHTML = '';
  cantCarritoLet = 0;

  itemCarrito.forEach(producto => {
    const fila = document.createElement("li");
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
    precioCatalogo = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);

    fila.setAttribute("id", "item" + producto.Artículo);
    fila.setAttribute("class", "list-group-item d-flex align-items-center carrito-item");

    const idImagenProducto = producto.ImagenId !== undefined ? producto.ImagenId : producto.Artículo;
    const miniatura = document.createElement("img");
    miniatura.className = "carrito-item-img";
    miniatura.src = "./imgcarrito/" + idImagenProducto + ".jpg";
    miniatura.alt = producto.Descripción;
    miniatura.draggable = false;
    miniatura.onerror = function () { this.src = "./imgcarrito/IMGND.jpg"; };

    const info = document.createElement("div");
    info.className = "carrito-item-info";
    info.innerHTML = `<span class="carrito-item-nombre">${producto.Descripción}</span>
      <span class="carrito-item-precio">$${precioCatalogo}</span>`;

    const controles = document.createElement("div");
    controles.className = "carrito-item-controles";

    const btnMenos = document.createElement("button");
    btnMenos.type = "button";
    btnMenos.className = "btn btn-sm btn-outline-light carrito-btn-cantidad";
    btnMenos.textContent = "−";
    btnMenos.addEventListener("click", () => cambiarCantidadCarrito(producto.Artículo, -1));

    const cantidadTexto = document.createElement("span");
    cantidadTexto.className = "carrito-item-cantidad";
    cantidadTexto.textContent = producto.Unidades;

    const btnMas = document.createElement("button");
    btnMas.type = "button";
    btnMas.className = "btn btn-sm btn-outline-light carrito-btn-cantidad";
    btnMas.textContent = "+";
    btnMas.addEventListener("click", () => cambiarCantidadCarrito(producto.Artículo, 1));

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn btn-sm btn-outline-danger carrito-btn-eliminar";
    btnEliminar.innerHTML = "🗑";
    btnEliminar.addEventListener("click", () => eliminarDelCarrito(producto.Artículo));

    controles.appendChild(btnMenos);
    controles.appendChild(cantidadTexto);
    controles.appendChild(btnMas);
    controles.appendChild(btnEliminar);

    fila.appendChild(miniatura);
    fila.appendChild(info);
    fila.appendChild(controles);

    cantCarritoLet += producto.Unidades;
    interes.appendChild(fila);
  });

  cantCarritod.textContent = cantCarritoLet;
  localStor.guardarEnLocalStorage(itemCarrito);
  actualizarBotonWhatsAppFinal();
}

function cambiarCantidadCarrito(articuloId, delta) {
  const item = itemCarrito.find(p => p.Artículo === articuloId);
  if (!item) return;

  const nuevasUnidades = item.Unidades + delta;

  if (delta > 0) {
    const idRealProducto = item.ImagenId !== undefined ? item.ImagenId : item.Artículo;
    const unidadesDeOtrasVariantes = itemCarrito.reduce((total, otro) => {
      if (otro === item) return total;
      const idBaseOtro = otro.ImagenId !== undefined ? otro.ImagenId : otro.Artículo;
      return idBaseOtro === idRealProducto ? total + otro.Unidades : total;
    }, 0);

    const stock = buscarDatos.buscarStock(idRealProducto);
    if (stock !== undefined && (unidadesDeOtrasVariantes + nuevasUnidades) > stock) {
      alertas.alertAgrego(item.Descripción, "NO HAY STOCK SUFICIENTE", "alert-danger");
      return;
    }
  }

  if (nuevasUnidades <= 0) {
    eliminarDelCarrito(articuloId);
    return;
  }

  item.Unidades = nuevasUnidades;
  alertas.alertAgrego(item.Descripción, delta > 0 ? "Se agregó una unidad" : "Se quitó una unidad", delta > 0 ? "alert-success" : "alert-danger");

  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}

function eliminarDelCarrito(articuloId) {
  const index = itemCarrito.findIndex(p => p.Artículo === articuloId);
  if (index === -1) return;

  const descripcion = itemCarrito[index].Descripción;
  if (!confirm(`¿Eliminar "${descripcion}" del carrito?`)) return;

  itemCarrito.splice(index, 1);
  alertas.alertAgrego(descripcion, "Se eliminó del carrito", "alert-danger");

  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}

function actualizarBotonWhatsAppFinal() {
  const contenedorAbajo = document.getElementById('borrarCarr');
  if (!contenedorAbajo) return;

  contenedorAbajo.innerHTML = '';

  if (itemCarrito.length <= 0) {
    contenedorAbajo.classList.remove('show');
    contenedorAbajo.classList.add('hide');
    return;
  }

  contenedorAbajo.appendChild(enlaceWhatsApp);
  contenedorAbajo.classList.remove('hide');
  contenedorAbajo.classList.add('show');
}

function poblarMenuDesplegableProductos(categorias) {
  // Implementación adicional para la lista de desplegable
}