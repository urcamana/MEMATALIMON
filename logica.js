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

// Declaramos el botón de WhatsApp UNA SOLA VEZ al inicio (evita error de inicialización)
const enlaceWhatsApp = document.createElement("a");
enlaceWhatsApp.className = "btn btn-success btn-lg w-100 fw-bold shadow-sm rounded-pill my-3 d-flex align-items-center justify-content-center gap-2";
enlaceWhatsApp.textContent = "Enviar carrito por WhatsApp";

enlaceWhatsApp.addEventListener('click', function (event) {
  event.preventDefault();
  actualizarEnlaceWhatsApp();
  const urlActual = enlaceWhatsApp.getAttribute("href");
  if (!urlActual || urlActual === `https://wa.me/` || urlActual.endsWith('text=')) {
    alertas.alertAgrego("Atención", "Seleccioná un método de pago antes de enviar", "alert-warning");
    return;
  }
  window.open(urlActual, '_blank');
  localStorage.removeItem('datosCarrito');
});

// Inyectar en el contenedor del carrito cuando exista
(function inyectarBotonWhatsApp() {
  const contenedorWhats = document.getElementById("whats");
  if (contenedorWhats && !contenedorWhats.contains(enlaceWhatsApp)) {
    contenedorWhats.appendChild(enlaceWhatsApp);
  }
})();


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

//VARIABLE PARA MOSTRAR CANTIDAD DE ITEMS EN FLOBO DE CARRITO
const cantCarritod = document.getElementById("cantCarrito");
let cantCarritoLet = 0;
let flagMostrarDescuentos = false;

//cargamos los template del html y creamos los fragmentos
let template = document.getElementById("contTemplate").content;
let fragmento = document.createDocumentFragment();

let template2 = document.getElementById("contTemplate2").content;
let fragmento2 = document.createDocumentFragment();

let template3 = document.getElementById("contTemplate3").content;

//cargamos donde mostramos total de carrino en el navbar
let totalCarritoNavb = document.getElementById("totalCarritoNavb");
//cargamos a interes la etiqueta donde mostraremos el titulo de producto
const interes = document.getElementById("interes");

//cargamos a interes2 la etiqueta donde mostraremos el precio total
const intprecioTotal = document.getElementById("precioTotal");
var selectElement = template2.querySelector('.variantes');



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

  // Badge solo cuando queda exactamente 1 unidad (texto discreto)
  const badgeStock = template2.querySelector(".badge-ultimas-unidades");
  if (badgeStock) {
    const stockNum = Number(datos.Inventario);
    if (stockNum === 1) {
      badgeStock.classList.remove("d-none");
      badgeStock.textContent = "quedan pocas unidades";
    } else {
      badgeStock.classList.add("d-none");
      badgeStock.textContent = "";
    }
  }

  const h5Element = template2.querySelector("h5");
  if (h5Element) {
    const descripcionTexto = datos.Descripción;
    if (typeof descripcionTexto === 'string') {
      h5Element.textContent = descripcionTexto;
      if (descripcionTexto.length < 35) {
        h5Element.style.fontSize = '1.8VH';
      } else {
        h5Element.style.fontSize = '1.6VH';
      }
    } else {
      h5Element.textContent = 'Descripción no válida';
      h5Element.style.fontSize = '1.4VH';
    }
  }

  // Variantes
  varianteDeMedidas.AgregaVariantes(datos, template2);

  // Precios e Inventario
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
  if (btnMasInfo) {
    btnMasInfo.dataset.articulo = datos.Artículo;
  }

  // Asignar ID al botón de agregar al carrito
  const addButton = template2.querySelector(".botonaparecer");
  if (addButton) {
    addButton.setAttribute("id", "idbot" + (datos.Artículo));
  }

  // Asignar data-articulo al botón "Comprar solamente este producto"
  const btnComprarSolo = template2.querySelector(".btn-comprar-solo");
  if (btnComprarSolo) {
    btnComprarSolo.dataset.articulo = datos.Artículo;
  }

  // Botón compartir + id en la tarjeta para link directo ?p=ID
  const btnShare = template2.querySelector(".btn-compartir-prod");
  if (btnShare) {
    btnShare.dataset.articulo = datos.Artículo;
    btnShare.dataset.nombre = typeof datos.Descripción === 'string' ? datos.Descripción : 'Producto';
  }
  // Marcar la columna de la tarjeta con data-producto-id (después del clone se aplica al root)
  const colRoot = template2.querySelector('.col-sm-6, .col-6, .col-md-6') || template2.firstElementChild;
  if (colRoot) {
    colRoot.dataset.productoId = datos.Artículo;
    colRoot.id = 'producto-' + datos.Artículo;
  }

  let clone2 = document.importNode(template2, true);
  fragmento2.appendChild(clone2);
  return fragmento2;
}


inItemCarr.inItemCarr();
actualizarCarrito();
actualizarVistaFavoritos();

subirScroll.crearBotonScroll();

document.addEventListener('contextmenu', function (event) {
  if (event.target.closest('.img-prod') || event.target.closest('.carrito-item-img')) {
    event.preventDefault();
  }
});

// Click izquierdo en la imagen del producto → siguiente foto del carrusel
document.addEventListener('click', function (event) {
  const img = event.target.closest('.img-prod');
  if (!img) return;
  // No interferir si el click fue en controles del carrusel
  if (event.target.closest('.carousel-control-prev, .carousel-control-next')) return;
  // Solo en catálogo (no miniaturas del carrito)
  if (img.classList.contains('carrito-item-img')) return;

  const carouselElem = img.closest('.carousel');
  if (!carouselElem) return;

  event.preventDefault();

  const avanzar = () => {
    try {
      const inst = bootstrap.Carousel.getOrCreateInstance(carouselElem, { interval: false, ride: false });
      inst.next();
    } catch (err) {
      const items = carouselElem.querySelectorAll('.carousel-item');
      if (items.length < 2) return;
      let idx = 0;
      items.forEach((it, i) => { if (it.classList.contains('active')) idx = i; });
      items[idx].classList.remove('active');
      items[(idx + 1) % items.length].classList.add('active');
    }
  };

  // Cargar imágenes secundarias si aún no están, y luego avanzar
  const articuloId = carouselElem.dataset.articulo;
  const descripcion = carouselElem.dataset.descripcion || '';
  if (articuloId && carouselElem.dataset.cargado !== 'true') {
    try {
      cargarImagenesSecundariasLazy(articuloId, carouselElem.id, descripcion);
    } catch (err) {}
    // Esperar un momento a que se agreguen slides (carga async de B/C/D/E.jpg)
    setTimeout(avanzar, 200);
  } else {
    avanzar();
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
  // Agregar evento de clic al botón
  boton.addEventListener("click", () => {
    FILTROS = boton.textContent;
    renderizarCatalogo(FILTROS);

    const botones = document.querySelectorAll(".categoria-btn");
    botones.forEach(btn => {
      btn.classList.remove("btn-dark");
      btn.classList.add("btn-outline-dark");
    });
    boton.classList.remove("btn-outline-dark");
    boton.classList.add("btn-dark");

    try { subirScroll.subir(); } catch (e) {}
  });

  lil.appendChild(boton);
  dropdownMenu.appendChild(lil);
});


function obtenerURL() {
  const urlParams = new URLSearchParams(window.location.search);

  const FILTROS = urlParams.get('filtro') || 'todos'; // Si no hay filtro, se usa 'todos'

// ✅ AHORA
while (fragmento2.firstChild) fragmento2.removeChild(fragmento2.firstChild);
while (fragmento.firstChild) fragmento.removeChild(fragmento.firstChild);

let FILTRO = FILTROS.toUpperCase();
datos.forEach((datos) => {
  if (datos.Inventario >= 1 && (FILTRO === "TODOS" || datos.Categoria == FILTRO)) {
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
if (target) {
  target.appendChild(fragmento2);
}
  //MOSTRAMOS EL BOTON QUE SELECCIONAMOS
  //CAMBIAMOS EL NOMBRE AL BOTON PRINCIPAL DEL MENU DESPLEGABLE POR EL SELECCIONADO
  nombreDesplegable.textContent = FILTRO;
  //PONEMOS A ESCUCHAR LOS BOTONES NUEVAMENTE
  escucharBotones();
  var a = true;

  descu.porDeDescuento();

  varianteDeMedidas.cambiarVariantes()

  subirScroll.subir()
};



let contenedorId = 0;




// =====================================================
// HELPERS: precio final, ordenar y renderizar catálogo
// =====================================================
function precioFinalProducto(prod) {
  let p = Number(String(prod.Venta).replace(/,/g, ".")) * Number(prod.DOLAR || 1);
  if (prod.Descuento != 0 && prod.Descuento != "0") {
    const d = Number(String(prod.Descuento).replace(/,/g, "."));
    p = p * (1 - d);
  }
  return p;
}

let ordenActual = "nombre-asc";

function ordenarProductos(lista) {
  const arr = [...lista];
  switch (ordenActual) {
    case "nombre-desc":
      arr.sort((a, b) => String(b.Descripción).localeCompare(String(a.Descripción), "es"));
      break;
    case "precio-asc":
      arr.sort((a, b) => precioFinalProducto(a) - precioFinalProducto(b));
      break;
    case "precio-desc":
      arr.sort((a, b) => precioFinalProducto(b) - precioFinalProducto(a));
      break;
    case "descuento":
      arr.sort((a, b) => {
        const da = (a.Descuento != 0 && a.Descuento != "0") ? 1 : 0;
        const db = (b.Descuento != 0 && b.Descuento != "0") ? 1 : 0;
        if (db !== da) return db - da;
        return String(a.Descripción).localeCompare(String(b.Descripción), "es");
      });
      break;
    case "nombre-asc":
    default:
      arr.sort((a, b) => String(a.Descripción).localeCompare(String(b.Descripción), "es"));
      break;
  }
  return arr;
}

function renderizarCatalogo(filtroCategoria) {
  // filtroCategoria: "VER TODOS" | "CON DESCUENTOS" | nombre de categoría
  const filtro = filtroCategoria || FILTROS || "VER TODOS";

  while (fragmento2.firstChild) fragmento2.removeChild(fragmento2.firstChild);
  while (fragmento.firstChild) fragmento.removeChild(fragmento.firstChild);

  let lista = datos.filter(p => {
    if (Number(p.Inventario) < 1) return false;
    if (filtro === "VER TODOS" || filtro === "TODOS" || !filtro) return true;
    if (filtro === "CON DESCUENTOS") return p.Descuento != 0 && p.Descuento != "0";
    return p.Categoria === filtro;
  });

  lista = ordenarProductos(lista);

  lista.forEach(prod => {
    contenedorId = 0;
    fragmento2 = MostrarEnCatalogo(prod, contenedorId);
  });

  mBotones.mostrarBotones();

  let clone = document.importNode(template, true);
  fragmento.appendChild(clone);

  const contenedorCatalogo = document.getElementById("contenedorCatalogo");
  if (contenedorCatalogo) {
    contenedorCatalogo.innerHTML = "";
    contenedorCatalogo.appendChild(fragmento);
    const target = document.getElementById(String(contenedorId));
    if (target) target.appendChild(fragmento2);
  } else {
    document.body.appendChild(fragmento);
    const target = document.getElementById(String(contenedorId));
    if (target) target.appendChild(fragmento2);
  }

  // Quitar loader si todavía está
  const loaderInicial = document.getElementById("loaderCatalogo");
  if (loaderInicial) loaderInicial.remove();

  try { descu.porDeDescuento(); } catch (e) {}
  try { varianteDeMedidas.cambiarVariantes(); } catch (e) {}
}

// Listener del selector de orden (módulo ES: DOM ya está listo)
(function initOrdenSelect() {
  const sel = document.getElementById("selectOrden");
  if (sel) {
    sel.addEventListener("change", () => {
      ordenActual = sel.value;
      renderizarCatalogo(FILTROS || "VER TODOS");
    });
  }
})();

// Carga inicial del catálogo (con orden y skeleton)
FILTROS = "VER TODOS";
renderizarCatalogo("VER TODOS");
escucharBotones(); // Esta es la única llamada a escucharBotones que debe existir.
descu.porDeDescuento();
abrirProductoDesdeURL(); // Si viene ?p=ID desde un link compartido











//ponemos a escuchar todos los botones y mandamos a agregar los datos
//esta es la funcion que agrega los datos a itemCarrito
function escucharBotones() {

  // Adjuntamos un único event listener al documento entero para delegación de eventos.
  // Esto garantiza que el listener esté siempre activo, sin importar si los elementos
  // del DOM son agregados o eliminados dinámicamente.
  document.addEventListener('click', event => {
    // Usamos event.target.closest() para verificar si el clic fue en un botón
    // con un ID que empieza por 'idbot'. Esto funciona para botones dinámicos.
    const btn = event.target.closest('button[id^=idbot]');

    if (btn) {
      event.stopImmediatePropagation(); // Detiene la propagación del evento de forma inmediata

      var da = btn.id; // Obtenemos el ID del botón que fue clicado
      var regex = /(\d+)/g; // Expresión regular corregida
      var da2 = (da.match(regex));

      // Asegúrate de que da2 tenga al menos un elemento antes de acceder a da2[0]
      if (!da2 || da2.length === 0) {
        console.error("Error: No se pudo extraer el ID numérico del botón.", da);
        return; // Salir de la función si no hay ID numérico
      }
      let productId = da2[0]; // Usar el primer elemento del array

      let selectElement = document.getElementById('idbot' + productId); // Obtener el elemento select por su id

      let unidades = 1; // Valor por defecto
      if (selectElement) {
        unidades = Number(selectElement.value);
      } else {
      }


      let selectElement77 = document.getElementById('med' + productId); // Obtener el elemento select por su id
      var medidas = null;
      var textMedidas = "";
      if (selectElement77 != null) {
        medidas = selectElement77.value; // Obtener el valor seleccionado del elemento select
        if (selectElement77.selectedIndex >= 0) {
          const selectedOptionElement = selectElement77.options[selectElement77.selectedIndex];
          textMedidas = selectedOptionElement.textContent;
        } else {
        }
      } else {
      }

      let selectElement7 = document.getElementById('var' + productId); // Obtener el elemento select por su id
      var varied = null;
      var varied2 = "";
      if (selectElement7 != null) {
        varied = selectElement7.value; // Obtener el valor seleccionado del elemento select
        if (selectElement7.selectedIndex >= 0) {
          const selectedOptionElement2 = selectElement7.options[selectElement7.selectedIndex];
          varied2 = selectedOptionElement2.textContent;
        } else {
        }
      } else {
      }

      //buscamos los datos del boton precionado
      var tit = buscarDatos.buscarId(parseInt(productId));
      var pre = buscarDatos.buscarIdPrecio(parseInt(productId));
      var dol = buscarDatos.buscarIdDol(parseInt(productId));
      var stock = buscarDatos.buscarStock(parseInt(productId));
      var desc = buscarDatos.buscarDescuento(parseInt(productId));

      // El stock es del PRODUCTO, no de cada variante por separado: si hay
      // 10 en stock y ya tenés 8 de una variante en el carrito, no podés
      // agregar 8 más de otra variante (serían 16 de un producto con solo
      // 10 disponibles). Sumamos las unidades de TODAS las variantes de
      // este mismo producto que ya estén en el carrito antes de validar.
      const idBaseProducto = parseInt(productId);
      const unidadesYaEnCarrito = itemCarrito.reduce((total, item) => {
        const idBaseItem = item.ImagenId !== undefined ? item.ImagenId : item.Artículo;
        return idBaseItem === idBaseProducto ? total + item.Unidades : total;
      }, 0);

      if (unidadesYaEnCarrito + unidades > stock) {
        let suceso = "NO HAY STOCK SUFICIENTE";
        let tipoAlert = "alert-danger";
        alertas.alertAgrego(tit, suceso, tipoAlert);
        total();
        return;
      }

      let agregarOModificarItem = (articuloId, Artículo, Descripción, Venta, DOLAR, Unidades, Descuento, ImagenId) => {
        let siEstaId = itemCarrito.find(artic => artic.Artículo === (parseInt(articuloId)));

        if (siEstaId) {
          siEstaId.Unidades += Unidades;
          localStor.guardarEnLocalStorage(itemCarrito);
          agregar(Descripción, articuloId); // Usar Descripción en lugar de tit para la alerta
        } else {
          if (Descuento != 0) {
            let ventaCD = ((Venta) * (1 - (Number(Descuento) / 100)));
            // Guardamos "ImagenId" (el id real del producto) además de
            // "Artículo" (que para variantes es un id compuesto y no
            // corresponde a ningún archivo de imagen real).
            itemCarrito.push({ Artículo, Descripción, Venta: ventaCD.toString(), DOLAR, Unidades, ImagenId });
            localStor.guardarEnLocalStorage(itemCarrito);
            agregar(Descripción, articuloId); // Usar Descripción en lugar de tit para la alerta

          } else {
            itemCarrito.push({ Artículo, Descripción, Venta, DOLAR, Unidades, ImagenId });
            localStor.guardarEnLocalStorage(itemCarrito);
            agregar(Descripción, articuloId); // Usar Descripción en lugar de tit para la alerta
          }
        }
      };

      if (medidas == null && varied == null) {
        agregarOModificarItem(productId, (parseInt(productId)), tit, pre, dol, unidades, desc, parseInt(productId));
      } else {
        if (varied == null) {
          varied2 = "";
        }
        let articuloIdModificado = medidas + '9990' + productId + varied; // Concatenar como string
        // Le pasamos parseInt(productId) como ImagenId: es el id real del
        // producto base, el que sí corresponde a un archivo de imagen.
        agregarOModificarItem(articuloIdModificado, (parseInt(articuloIdModificado)), `${tit}  ${textMedidas} ${varied2}`, pre, dol, unidades, desc, parseInt(productId));
      }


      total();
    }
  });
}







//AGREGAMOS LOS DATOS AL CANVAS AL TOCAR BOTONES "AGREGAR AL CARRITO" DEL CATALOGO
// (antes esta función reconstruía el carrito a mano Y LUEGO llamaba a
// actualizarCarrito(), que hacía el mismo trabajo de nuevo: quedaba doble
// renderizado. Ahora actualizarCarrito() es la única fuente de verdad.)
function agregar(da, da2) {

  let suceso = "Se agregó al carrito";
  let tipoAlert = "alert-success";
  alertas.alertAgrego(da, suceso, tipoAlert);

  // Animación del ícono del carrito en el navbar
  const btnCarritoNav = document.getElementById('listaInteres');
  if (btnCarritoNav) {
    btnCarritoNav.classList.remove('carrito-animado');
    void btnCarritoNav.offsetWidth; // force reflow
    btnCarritoNav.classList.add('carrito-animado');
  }

  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}










//MOSTRAMOS LOS TOTALES EN EL CANVAS Y EL MENU SUPERIOR, TAMBIEN DA EL TOTAL EN EL WHATSAPP

function total() {
  let sumaTotal = 0;

  itemCarrito.forEach(producto => {
    sumaTotal += (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);


  });
  sumaTotal = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sumaTotal);

intprecioTotal.className = "fs-4 fw-bold text-warning bg-dark p-2 rounded text-center my-2";
  intprecioTotal.textContent = "IMPORTE TOTAL: $ " + sumaTotal;
  totalCarritoNavb.textContent = "$ " + sumaTotal

  // Cantidad total de unidades en el carrito (sumando todos los productos)
  const cantidadTotal = itemCarrito.reduce((total, item) => total + item.Unidades, 0);
  const elementoCantidadTotal = document.getElementById("cantidadTotalCarrito");
  if (elementoCantidadTotal) {
    elementoCantidadTotal.textContent = "Cantidad de productos: " + cantidadTotal;
  }

  return ("$ " + sumaTotal);
}


eventCerrCanvas.eventCerrCanvas();







// Función para generar el enlace de WhatsApp
function generarEnlaceWhatsApp() {

  const telefono = "5493751588753"; // Reemplaza con el número de teléfono deseado

    // 1. Validar de forma obligatoria que haya seleccionado un método de pago antes de continuar
  const selectorPago = document.getElementById('metodoPago');
  const pagoElegido = selectorPago ? selectorPago.value : '';

  if (!pagoElegido) {
      return ""; // Frena la ejecución si no hay método de pago
  }

  // Construir el texto del mensaje
  let textoCarrito = "¡Hola! Quiero hacer el siguiente pedido desde la web:\n";
  let UnidadesProductosTotales = 0;

  itemCarrito.forEach(producto => {
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
    precioCatalogo = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);

    textoCarrito += `\n• ${producto.Unidades} x ${producto.Descripción}  →  $${precioCatalogo}`;
    UnidadesProductosTotales += producto.Unidades;
  });

  let tota = total();
  textoCarrito += `\n\n────────────────────`;
  textoCarrito += `\n*IMPORTE TOTAL:* ${tota}`;
  textoCarrito += `\n*Total de productos:* ${UnidadesProductosTotales}`;

  // --- DATOS DE ENTREGA ---
  textoCarrito += `\n\n── DATOS DE ENTREGA ──`;
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

  // --- DATOS DE PAGO ---
  textoCarrito += `\n\n── DATOS DE PAGO ──`;
  textoCarrito += `\n*Forma de pago:* ${pagoElegido}`;

  // --- CÓDIGO PROMOCIONAL ---
  const campoCodigo = document.getElementById('codigoPromocional');
  const codigoPromo = campoCodigo ? campoCodigo.value.trim() : '';
  if (codigoPromo) {
    textoCarrito += `\n\n── CÓDIGO PROMOCIONAL ──`;
    textoCarrito += `\n*Código:* ${codigoPromo}`;
  }

  // --- OBSERVACIONES / PERSONALIZACIÓN ---
  const campoObservaciones = document.getElementById('observacionesPedido');
  const observaciones = campoObservaciones ? campoObservaciones.value.trim() : '';
  if (observaciones) {
    textoCarrito += `\n\n── OBSERVACIONES / PERSONALIZACIÓN ──`;
    textoCarrito += `\n${observaciones}`;
  }

  textoCarrito += `\n\n¡Gracias!`;

  const enlace = `https://wa.me/${telefono}/?text=${encodeURIComponent(textoCarrito)}`;
  return enlace;
}

// Función para actualizar el enlace de WhatsApp
function actualizarEnlaceWhatsApp() {
  const enlace = generarEnlaceWhatsApp();
    if (!enlace) {
      enlaceWhatsApp.removeAttribute("href");
      return;
  }
  enlaceWhatsApp.setAttribute("class", "btn btn-success")
  enlaceWhatsApp.setAttribute("href", enlace);
  enlaceWhatsApp.style.cssText = '  font-weight: bold;font-size: 17px; color: white;   ;';

}


// (enlaceWhatsApp se declara al inicio del archivo)

// Ejemplo de modificación del array y actualización del enlace

actualizarEnlaceWhatsApp(); // Actualizar el enlace

filtrarConBusqueda()









function filtrarConBusqueda() {
  const formulario = document.querySelector('#formulario');
  // Si por algún motivo no existe el input, no rompemos el resto de la web
  if (!formulario) {
    console.warn('No se encontró #formulario');
    return;
  }

  let debounceBusqueda;

  const filtrar = () => {

    const texto = formulario.value.toLowerCase().trim();
    let coincidencias = 0;

    // Al buscar: ocultar banners y categorías para que los resultados queden arriba
    // Al borrar la búsqueda: volver a mostrarlos
    const hayBusqueda = texto.length > 0;
    document.querySelectorAll('.ocultar-en-busqueda').forEach(el => {
      if (hayBusqueda) {
        el.classList.add('d-none');
      } else {
        el.classList.remove('d-none');
      }
    });

    for (let producto of datos) {
      let Descripcion = producto.Descripción.toLowerCase();
      //BORRAMOS LOS ELEMENTOS DEL CATALOGO

      //lo siguiente elimina tarjetas container, pero borra todos.
      // const element2 = document.querySelector(".tarjetas");
      // element2.remove();
      //VEMOS SI COINCIDEN CON EL TEXTO BUSCADO, SI TIENE INVENTARIO Y NO TIENE DESCUENTO
      if (Descripcion.indexOf(texto) !== -1 /*&& producto.Descuento == 0*/ && producto.Inventario >= 1) {

        contenedorId = 0;
        //mostramos los datos en el catalogo!!! <--------------------------------------------------
        fragmento2 = MostrarEnCatalogo(producto, contenedorId);
        coincidencias++;
      }
    }

// ✅ AHORA
let clone = document.importNode(template, true);
fragmento.appendChild(clone);

const contenedorCatalogo = document.getElementById('contenedorCatalogo');
if (contenedorCatalogo) {
  contenedorCatalogo.innerHTML = '';
  contenedorCatalogo.appendChild(fragmento);
}

const target = document.getElementById(contenedorId);
if (target) {
  target.appendChild(fragmento2);
}

    // Si no hubo coincidencias, mostramos un aviso en vez de dejar la sección vacía
    if (coincidencias === 0) {
      const contenedorResultados = document.getElementById(contenedorId);
      const sinResultados = document.createElement('div');
      sinResultados.className = 'sin-resultados';
      sinResultados.textContent = texto
        ? `No encontramos productos que coincidan con "${formulario.value}"`
        : 'No hay productos disponibles.';
      contenedorResultados.appendChild(sinResultados);
    }

    mBotones.mostrarBotones();


    var a = true;

    descu.porDeDescuento();

    varianteDeMedidas.cambiarVariantes()

    // Eliminamos la llamada redundante a escucharBotones() aquí
    // escucharBotones();
    if (texto.length > 0) {
      // Llevar al usuario directo a los resultados (sin banners arriba)
      const dest = document.getElementById('contenedorCatalogo') || document.querySelector('.tarjetas.contenedor');
      if (dest) {
        const y = dest.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    } else {
      try { subirScroll.subir(); } catch (e) {}
    }

  };

  // Debounce: esperamos 300ms de inactividad antes de refiltrar,
  // para no reconstruir todo el catálogo en cada tecla presionada
  const filtrarConDebounce = () => {
    clearTimeout(debounceBusqueda);
    debounceBusqueda = setTimeout(filtrar, 300);
  };

  //PONEMOS LOS EVENTOS DEL BUSCADOR

  formulario.addEventListener('input', filtrarConDebounce);
  // Sacamos el listener de 'change': se disparaba al perder el foco el
  // input (blur), lo cual pasa justo antes del evento 'click' cuando el
  // usuario tocaba un botón "Agregar" del resultado de la búsqueda. Eso
  // reconstruía el catálogo (y hacía scroll arriba) en medio del click,
  // dejando el botón original removido del DOM antes de que el click
  // llegara a procesarse: la página subía y el producto no se agregaba.
  // El listener de 'input' (con debounce) ya cubre la búsqueda mientras
  // se escribe, y el de 'keydown' cubre Enter.
  formulario.addEventListener('keydown', (event) => {
    if (event.keyCode === 13 || event.key === 'Enter') { // Verifica si se presionó Enter
      clearTimeout(debounceBusqueda);
      filtrar();
      //llamamos la funcion ocultar canvas cuando precionamos enter o buscar
      ocultarCanvasBusqueda();
    }
  });
}









// funcion ocultar canvas
function ocultarCanvasBusqueda() {
  // Obtenemos los elementos
  const elementosBackdrop = document.getElementsByClassName("offcanvas-backdrop");
  const canvasInteres = document.getElementById("offcanvasDarkNavbar");

  // Ocultamos los elementos backdrop y el canvas
  for (let i = 0; i < elementosBackdrop.length; i++) {
    elementosBackdrop[i].classList.remove('show');
  }
  if (canvasInteres) {
    canvasInteres.classList.remove('show');
  }

  // Usamos Bootstrap para ocultar el offcanvas
  const offcanvasElement = document.getElementById('offcanvasDarkNavbar');
  const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
  offcanvas.hide();

  // Eliminamos los estilos del body
  const body = document.body;
  body.removeAttribute('style');
}





//actualizamos el carrito
//actualizamos el carrito
function actualizarCarrito() {
  total();
  // Limpiar el contenido existente en el contenedor
  interes.innerHTML = '';
  cantCarritoLet = 0;
  // Mostrar los productos en el DOM
  itemCarrito.forEach(producto => {
    const fila = document.createElement("li");
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
    precioCatalogo = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);

    fila.setAttribute("id", "item" + producto.Artículo);
    fila.setAttribute("class", "list-group-item d-flex align-items-center carrito-item");

    // Miniatura del producto, para identificarlo más fácil de un vistazo.
    // Para productos con variante, "Artículo" es un id compuesto (no
    // corresponde a ningún archivo real), así que usamos "ImagenId" si
    // existe. Los carritos guardados antes de este cambio no tienen ese
    // campo, así que como respaldo usamos "Artículo" igual que antes.
    const idImagenProducto = producto.ImagenId !== undefined ? producto.ImagenId : producto.Artículo;
    const miniatura = document.createElement("img");
    miniatura.className = "carrito-item-img";
    miniatura.src = "./imgcarrito/" + idImagenProducto + ".jpg";
    miniatura.alt = producto.Descripción;
    miniatura.draggable = false;
    miniatura.onerror = function () { this.src = "./imgcarrito/IMGND.jpg"; };

    // Nombre y precio del producto
    const info = document.createElement("div");
    info.className = "carrito-item-info";
    info.innerHTML = `<span class="carrito-item-nombre">${producto.Descripción}</span>
      <span class="carrito-item-precio">$${precioCatalogo}</span>`;

    // Controles de cantidad: - / cantidad / +, y botón de eliminar aparte
    const controles = document.createElement("div");
    controles.className = "carrito-item-controles";

    const btnMenos = document.createElement("button");
    btnMenos.type = "button";
    btnMenos.className = "btn btn-sm btn-outline-light carrito-btn-cantidad";
    btnMenos.textContent = "−";
    btnMenos.setAttribute("aria-label", "Quitar una unidad de " + producto.Descripción);
    btnMenos.addEventListener("click", () => cambiarCantidadCarrito(producto.Artículo, -1));

    const cantidadTexto = document.createElement("span");
    cantidadTexto.className = "carrito-item-cantidad";
    cantidadTexto.textContent = producto.Unidades;

    const btnMas = document.createElement("button");
    btnMas.type = "button";
    btnMas.className = "btn btn-sm btn-outline-light carrito-btn-cantidad";
    btnMas.textContent = "+";
    btnMas.setAttribute("aria-label", "Agregar una unidad de " + producto.Descripción);
    btnMas.addEventListener("click", () => cambiarCantidadCarrito(producto.Artículo, 1));

    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn btn-sm btn-outline-danger carrito-btn-eliminar";
    btnEliminar.innerHTML = "🗑";
    btnEliminar.setAttribute("aria-label", "Eliminar " + producto.Descripción + " del carrito");
    btnEliminar.addEventListener("click", () => eliminarDelCarrito(producto.Artículo));

    controles.appendChild(btnMenos);
    controles.appendChild(cantidadTexto);
    controles.appendChild(btnMas);
    controles.appendChild(btnEliminar);

    fila.appendChild(miniatura);
    fila.appendChild(info);
    fila.appendChild(controles);

    //AGREGAMOS LAS UNIDADES A MOSTRAR EN GLOBO DE CARRITO
    cantCarritoLet += producto.Unidades;

    interes.appendChild(fila);

  });

  cantCarritod.textContent = cantCarritoLet;

  localStor.guardarEnLocalStorage(itemCarrito);
  actualizarBotonWhatsAppFinal();

};








// Aumenta o disminuye en 1 la cantidad de un producto del carrito.
// Si llega a 0, se elimina directamente.
function cambiarCantidadCarrito(articuloId, delta) {
  const item = itemCarrito.find(p => p.Artículo === articuloId);
  if (!item) return;

  const nuevasUnidades = item.Unidades + delta;

  if (delta > 0) {
    // Para productos con variante, "Artículo" es un id compuesto que no
    // existe en el catálogo (por eso buscarStock no lo encontraba y el
    // límite de stock no se aplicaba). Usamos "ImagenId" (el id real del
    // producto) para esta comprobación, con respaldo a "Artículo" para
    // carritos guardados antes de este cambio.
    const idRealProducto = item.ImagenId !== undefined ? item.ImagenId : item.Artículo;

    // Además, el stock es del producto en general, no de cada variante
    // por separado: sumamos las unidades de TODAS las variantes de este
    // mismo producto que ya estén en el carrito (menos este item, que ya
    // se cuenta en "nuevasUnidades").
    const unidadesDeOtrasVariantes = itemCarrito.reduce((total, otro) => {
      if (otro === item) return total;
      const idBaseOtro = otro.ImagenId !== undefined ? otro.ImagenId : otro.Artículo;
      return idBaseOtro === idRealProducto ? total + otro.Unidades : total;
    }, 0);

    const stock = buscarDatos.buscarStock(idRealProducto);
    if (stock !== undefined && (unidadesDeOtrasVariantes + nuevasUnidades) > stock) {
      let suceso = "NO HAY STOCK SUFICIENTE";
      let tipoAlert = "alert-danger";
      alertas.alertAgrego(item.Descripción, suceso, tipoAlert);
      return;
    }
  }

  // Si llegaría a 0, delegamos en eliminarDelCarrito (que pide confirmación)
  // en vez de restar primero: así, si el usuario cancela, la cantidad
  // queda intacta en vez de quedar en 0 sin eliminarse.
  if (nuevasUnidades <= 0) {
    eliminarDelCarrito(articuloId);
    return;
  }

  item.Unidades = nuevasUnidades;

  let suceso = delta > 0 ? "Se agregó una unidad" : "Se quitó una unidad";
  let tipoAlert = delta > 0 ? "alert-success" : "alert-danger";
  alertas.alertAgrego(item.Descripción, suceso, tipoAlert);

  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}

// Elimina un producto completo del carrito, sin importar la cantidad.
function eliminarDelCarrito(articuloId) {
  const index = itemCarrito.findIndex(p => p.Artículo === articuloId);
  if (index === -1) return;

  const descripcion = itemCarrito[index].Descripción;

  if (!confirm(`¿Eliminar "${descripcion}" del carrito?`)) {
    return;
  }

  itemCarrito.splice(index, 1);

  let suceso = "Se eliminó del carrito";
  let tipoAlert = "alert-danger";
  alertas.alertAgrego(descripcion, suceso, tipoAlert);

  actualizarCarrito();
  actualizarEnlaceWhatsApp();
}

//creamos funcion que crea boton, lo muestra si hay items y borra todo el carrito.
function borrarCarritoCompleto() {

  const BCarritoComp = document.getElementById('borrarCarr');

  BCarritoComp.innerHTML = '';

  if (itemCarrito.length <= 0) {
    BCarritoComp.classList.remove('show');
    BCarritoComp.classList.add('hide');
    return;
  }

  const btnBorrarCarrito = document.createElement("button");
  btnBorrarCarrito.setAttribute("class", "btn btn-outline-danger btn-vaciar-carrito w-100 mt-2");
  btnBorrarCarrito.setAttribute("id", "btbc");
  btnBorrarCarrito.innerHTML = "🗑 Vaciar carrito";

  BCarritoComp.appendChild(btnBorrarCarrito);

  BCarritoComp.classList.remove('hide');
  BCarritoComp.classList.add('show');

  btnBorrarCarrito.addEventListener('click', function (event) {
    event.preventDefault();

    if (!confirm("¿Vaciar todo el carrito? Esta acción no se puede deshacer.")) {
      return;
    }

    itemCarrito.splice(0, itemCarrito.length);

    let suceso = "Ya no hay elementos";
    let tipoAlert = "alert-danger";
    let da = "SE VACIÓ EL CARRITO";
    alertas.alertAgrego(da, suceso, tipoAlert);

    actualizarCarrito();
    actualizarEnlaceWhatsApp();
  });
};

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
// Función para poblar el desplegable de Productos en el Navbar
// Mejora: también rellena el menú móvil (#listaCategoriasMenuMovil) si existe
function poblarMenuDesplegableProductos(categorias) {
  const menus = [
    document.getElementById("listaCategoriasMenu"),
    document.getElementById("listaCategoriasMenuMovil")
  ].filter(Boolean);

  if (menus.length === 0) return;

  const htmlBase = `
    <li><a class="dropdown-item filtro-cat-nav" href="#" data-cat="TODOS">Ver todos los productos</a></li>
    <li><hr class="dropdown-divider"></li>
  `;

  let extras = "";
  categorias.forEach(cat => {
    if (cat && cat !== "VER TODOS" && cat !== "CON DESCUENTOS") {
      extras += `<li><a class="dropdown-item filtro-cat-nav" href="#" data-cat="${cat}">${cat}</a></li>`;
    }
  });

  menus.forEach(menuContainer => {
    menuContainer.innerHTML = htmlBase + extras;

    menuContainer.querySelectorAll(".filtro-cat-nav").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const categoriaSeleccionada = e.target.getAttribute("data-cat");
        FILTROS = categoriaSeleccionada === "TODOS" ? "VER TODOS" : categoriaSeleccionada;
        renderizarCatalogo(FILTROS);
        try { subirScroll.subir(); } catch (err) {}

        const offcanvasElement = document.getElementById("offcanvasDarkNavbar");
        if (offcanvasElement) {
          const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
          if (bsOffcanvas) bsOffcanvas.hide();
        }
      });
    });
  });
}

// Delegación de eventos global para precargar/cargar imágenes secundarias al interactuar con las flechitas
['mouseover', 'touchstart', 'click'].forEach(eventType => {
  document.addEventListener(eventType, function (e) {
    const btn = e.target.closest('.carousel-control-prev, .carousel-control-next');
    if (!btn) return;

    const carouselElem = btn.closest('.carousel');
    if (!carouselElem) return;

    const articuloId = carouselElem.dataset.articulo;
    const descripcion = carouselElem.dataset.descripcion;

    if (articuloId && carouselElem.dataset.cargado !== "true") {
      cargarImagenesSecundariasLazy(articuloId, carouselElem.id, descripcion);
    }
  }, { passive: true });
});

function cargarImagenesSecundariasLazy(articuloId, carouselId, descripcion) {
  const carouselElem = document.getElementById(carouselId);
  if (!carouselElem || carouselElem.dataset.cargado === "true") return;

  carouselElem.dataset.cargado = "true";

  const sufijos = ["B", "C", "D", "E"];
  let encontradas = 0;
  let completadas = 0;

  sufijos.forEach((sufijo) => {
    const ruta = `./imgcarrito/${articuloId}${sufijo}.jpg`;
    const testImg = new Image();

    testImg.onload = () => {
      encontradas++;
      completadas++;

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
      img.className = "card-img-top img-prod";
      img.alt = descripcion;
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
    };

    testImg.onerror = () => {
      completadas++;
      // Si se evaluaron los 4 sufijos y no se encontró ninguna imagen secundaria
      if (completadas === sufijos.length && encontradas === 0) {
        const btnPrev = carouselElem.querySelector(".carousel-control-prev");
        const btnNext = carouselElem.querySelector(".carousel-control-next");
        if (btnPrev) btnPrev.classList.add("d-none");
        if (btnNext) btnNext.classList.add("d-none");
      }
    };

    testImg.src = ruta;
  });
}

// Variable para almacenar el JSON de detalles en memoria y no volver a descargarlo
let cacheDetallesExtra = null;

// Escuchador global de clics para los botones "+ Info"
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-mas-info');
  if (!btn) return;

  const tarjeta = btn.closest('.card-body');
  if (!tarjeta) return;

  const infoContainer = tarjeta.querySelector('.info-extra-container');
  const infoTexto = tarjeta.querySelector('.info-extra-texto');
  const articuloId = btn.dataset.articulo;

  if (!infoContainer || !infoTexto) return;

  const estaOculto = infoContainer.classList.contains('d-none');

  if (estaOculto) {
    infoContainer.classList.remove('d-none');
    btn.textContent = '- Info';
    
    // Consultar la información extendida
    obtenerDetallesExtra(articuloId, infoTexto);
  } else {
    infoContainer.classList.add('d-none');
    btn.textContent = '+ Info';
  }
});



// =====================================================
// COMPARTIR PRODUCTO + LINK DIRECTO (?p=ID)
// =====================================================
function urlProductoCompartible(articuloId) {
  const u = new URL(window.location.href);
  let path = u.pathname;
  if (/contacto\.html|politicas\.html/i.test(path)) {
    path = path.replace(/contacto\.html|politicas\.html/i, 'index.html');
  }
  u.pathname = path;
  u.search = '';
  u.hash = '';
  u.searchParams.set('p', String(articuloId));
  return u.toString();
}

function precioTextoParaShare(articuloId) {
  try {
    const prod = datos.find(d => String(d.Artículo) === String(articuloId));
    if (!prod) return '';
    let p = Number(String(prod.Venta).replace(/,/g, '.')) * Number(prod.DOLAR || 1);
    if (prod.Descuento != 0 && prod.Descuento != '0') {
      const d = Number(String(prod.Descuento).replace(/,/g, '.'));
      p = p * (1 - d);
    }
    return new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(p);
  } catch (e) {
    return '';
  }
}

async function compartirProducto(articuloId, nombre) {
  const url = urlProductoCompartible(articuloId);
  const precio = precioTextoParaShare(articuloId);
  const titulo = nombre || 'Producto Me Mata Limón';
  const texto = precio
    ? `Mirá este producto en Me Mata Limón: ${titulo} — $${precio}`
    : `Mirá este producto en Me Mata Limón: ${titulo}`;

  if (navigator.share) {
    try {
      await navigator.share({ title: titulo, text: texto, url });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }

  // Fallback: copiar link + opción WhatsApp
  try {
    await navigator.clipboard.writeText(url);
    alertas.alertAgrego('Link copiado', 'Ya podés pegarlo y mandárselo a alguien.', 'alert-success');
  } catch (e) {
    // Último recurso: WhatsApp con el link
    const wa = `https://wa.me/?text=${encodeURIComponent(texto + '\\n' + url)}`;
    window.open(wa, '_blank');
  }
}

function abrirProductoDesdeURL() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('p') || params.get('producto');
  if (!id) return;

  // Esperar a que el catálogo esté en el DOM
  const tryScroll = (intentos) => {
    const el = document.getElementById('producto-' + id) ||
      document.querySelector(`[data-producto-id="${id}"]`);
    if (el) {
      el.classList.add('producto-destacado');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.classList.remove('producto-destacado'), 3500);
      return;
    }
    if (intentos > 0) setTimeout(() => tryScroll(intentos - 1), 200);
  };
  setTimeout(() => tryScroll(25), 300);
}

// Click en botón compartir
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-compartir-prod');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const id = btn.dataset.articulo;
  const nombre = btn.dataset.nombre || '';
  if (id) compartirProducto(id, nombre);
});

// =====================================================
// BOTÓN "COMPRAR SOLAMENTE ESTE PRODUCTO"
// Vacía el carrito, agrega solo este producto y abre el carrito
// =====================================================
document.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-comprar-solo');
  if (!btn) return;

  e.preventDefault();
  e.stopPropagation();

  const articuloId = parseInt(btn.dataset.articulo);
  if (!articuloId) return;

  // Buscar el input de cantidad de esta tarjeta
  const tarjeta = btn.closest('.card-body') || btn.closest('.card');
  let unidades = 1;
  if (tarjeta) {
    const inputCant = tarjeta.querySelector('.cantidad');
    if (inputCant) unidades = Math.max(1, parseInt(inputCant.value) || 1);
  }

  // Datos del producto
  const tit = buscarDatos.buscarId(articuloId);
  const pre = buscarDatos.buscarIdPrecio(articuloId);
  const dol = buscarDatos.buscarIdDol(articuloId);
  const stock = buscarDatos.buscarStock(articuloId);
  const desc = buscarDatos.buscarDescuento(articuloId);

  if (unidades > stock) {
    alertas.alertAgrego(tit, "NO HAY STOCK SUFICIENTE", "alert-danger");
    return;
  }

  // Vaciar carrito actual
  itemCarrito.length = 0;

  // Agregar solo este producto (mismo criterio de descuento que el resto del sistema)
  let ventaFinal = pre;
  if (desc != 0 && desc != "0") {
    const descNum = Number(String(desc).replace(/,/g, "."));
    // Si el descuento es < 1 (ej: 0.1) es fracción; si es >= 1 es porcentaje
    const factor = descNum < 1 ? (1 - descNum) : (1 - descNum / 100);
    ventaFinal = (Number(String(pre).replace(/,/g, ".")) * factor).toString();
  }

  itemCarrito.push({
    Artículo: articuloId,
    Descripción: tit,
    Venta: ventaFinal.toString(),
    DOLAR: dol,
    Unidades: unidades,
    ImagenId: articuloId
  });

  localStor.guardarEnLocalStorage(itemCarrito);
  actualizarCarrito();
  actualizarEnlaceWhatsApp();

  alertas.alertAgrego(tit, "Carrito listo con este producto. Completá los datos y enviá por WhatsApp.", "alert-success");

  // Abrir el carrito usando el mismo sistema de la web (clases show/hide)
  const canvasInteres = document.getElementById('offcanvasDark');
  if (canvasInteres) {
    canvasInteres.classList.remove('hide', 'show');
    canvasInteres.classList.add('show');
  }
});

async function obtenerDetallesExtra(articuloId, elementoDestino) {
  try {
    if (!cacheDetallesExtra) {
      const respuesta = await fetch('./detalles.json');
      if (!respuesta.ok) {
        throw new Error('No se pudo cargar detalles.json');
      }
      cacheDetallesExtra = await respuesta.json();
    }

    // Buscar coincidencia por id de artículo
    const detalleEncontrado = cacheDetallesExtra.find(
      item => String(item.Artículo) === String(articuloId)
    );

    if (detalleEncontrado) {
      let htmlContenido = '';

      // 1. Mostrar información si existe
      if (detalleEncontrado.Info) {
        htmlContenido += `<div class="mb-1 text-secondary">${detalleEncontrado.Info}</div>`;
      }

      // 2. Mostrar link de video si existe
      if (detalleEncontrado.Video) {
        htmlContenido += `
          <div class="mt-2 pt-1 border-top">
            <strong class="d-block text-dark mb-1" style="font-size: 0.78rem;">Video del producto:</strong>
            <a href="${detalleEncontrado.Video}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-danger py-0 px-2 fw-bold" style="font-size: 0.75rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-play-btn-fill me-1" viewBox="0 0 16 16">
                <path d="M0 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm6.79-6.907A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"/>
              </svg>
              Ver Video
            </a>
          </div>
        `;
      }

      if (!detalleEncontrado.Info && !detalleEncontrado.Video) {
        htmlContenido = '<span class="text-secondary">Sin información detallada disponible.</span>';
      }

      elementoDestino.innerHTML = htmlContenido;
    } else {
      elementoDestino.innerHTML = '<span class="text-secondary">Sin datos adicionales para este producto.</span>';
    }
  } catch (error) {
    console.error("Error al obtener detalles adicionales:", error);
    elementoDestino.innerHTML = '<span class="text-danger">Información no disponible.</span>';
  }
}

// Escuchador global para los botones de favoritos en las tarjetas del catálogo
document.addEventListener('click', event => {
  const btnFav = event.target.closest('.btn-favorito-card');
  if (!btnFav) return;

  const articuloId = btnFav.dataset.articulo;
  if (articuloId) {
    toggleFavorito(parseInt(articuloId));
  }
});

// --- AUTO-SCROLL Y RESALTE INTEGRADO AL FLUJO DE CARGA ---
function procesarParametroProductoURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const idProductoBuscado = urlParams.get('producto');

  if (!idProductoBuscado) return;

  // Damos un pequeño respiro de 300ms para que el DOM termine de procesar las tarjetas
  setTimeout(() => {
    const carousels = document.querySelectorAll('.carousel[data-articulo]');
    let tarjetaBuscada = null;

    carousels.forEach(carousel => {
      if (String(carousel.dataset.articulo) === String(idProductoBuscado)) {
        tarjetaBuscada = carousel;
      }
    });

    if (tarjetaBuscada) {
      // Hacemos scroll suave hasta centrar el producto
      tarjetaBuscada.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Resaltado visual con borde y sombra roja
      const cardContainer = tarjetaBuscada.closest('.card') || tarjetaBuscada;
      if (cardContainer) {
        cardContainer.style.transition = "all 0.4s ease-in-out";
        cardContainer.style.boxShadow = "0 0 30px 10px rgba(255, 71, 87, 0.9)";
        cardContainer.style.border = "3px solid #ff4757";
        cardContainer.style.borderRadius = "10px";

        // Quitamos el efecto a los 5 segundos
        setTimeout(() => {
          cardContainer.style.boxShadow = "";
          cardContainer.style.border = "";
        }, 5000);
      }
    } else {
      console.warn("No se encontró la tarjeta para el producto:", idProductoBuscado);
    }
  }, 300);
}

// Ejecutamos la función inmediatamente después de que el catálogo principal se pinta
procesarParametroProductoURL();

// --- FILTRAR AUTOMÁTICAMENTE DESDE LA URL AL INICIAR ---
const urlParams = new URLSearchParams(window.location.search);
const categoriaBuscada = urlParams.get('categoria');

if (categoriaBuscada && typeof datos !== 'undefined' && datos.length > 0) {
  const catBusq = decodeURIComponent(categoriaBuscada).trim().toLowerCase();
  
  // Buscamos si la categoría existe en nuestros datos
  let categoriaEncontrada = "";
  datos.forEach(prod => {
    if (prod.Categoria && prod.Categoria.trim().toLowerCase() === catBusq) {
      categoriaEncontrada = prod.Categoria; // Respetamos las mayúsculas/minúsculas originales
    }
  });

  if (categoriaEncontrada) {
    // Aplicamos exactamente el mismo filtro que hace tu menú desplegable
    FILTROS = categoriaEncontrada;

    while (fragmento2.firstChild) fragmento2.removeChild(fragmento2.firstChild);
    while (fragmento.firstChild) fragmento.removeChild(fragmento.firstChild);

    datos.forEach((producto) => {
      if (producto.Inventario >= 1 && (producto.Categoria === FILTROS)) {
        contenedorId = 0;
        fragmento2 = MostrarEnCatalogo(producto, contenedorId);
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
    if (target) {
      target.appendChild(fragmento2);
    }

    descu.porDeDescuento();
    varianteDeMedidas.cambiarVariantes();
    subirScroll.subir();
    
    console.log("Categoría aplicada por URL con éxito:", categoriaEncontrada);
  }
}

// --- FILTRADO AUTOMÁTICO DE CATEGORÍA DESDE LA URL (ROBUSTO) ---
window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const categoriaBuscada = urlParams.get('categoria');

  if (!categoriaBuscada) return;

  // Damos un margen de 1 segundo para asegurar que el DOM, los templates y los datos estén listos
  setTimeout(() => {
    const catBusq = decodeURIComponent(categoriaBuscada).trim().toLowerCase();
    
    // Buscamos directamente en los botones de categoría renderizados
    const botones = document.querySelectorAll('.categoria-btn, .filtro-cat-nav, .porCategoriaUl button');
    let encontrado = false;

    botones.forEach(btn => {
      const textoBtn = btn.textContent.trim().toLowerCase();
      // Verificamos si coincide la categoría (ej: "auriculares")
      if (textoBtn === catBusq) {
        btn.click();
        encontrado = true;
      }
    });

    if (!encontrado) {
      console.warn("No se encontró un botón de categoría exacto para:", categoriaBuscada);
    }
  }, 1000);
});