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

// Faltaba esta llamada: se importaba la función pero nunca se ejecutaba,
// así que en tienda.html el logo de fondo nunca pasaba a segundo plano.
iniciarAnimLogo();
//import * as propagandaAlAzar from'./propaganda.js';

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

  // Configuración del id único para el carrusel
  const carouselId = "carousel-prod-" + datos.Artículo;
  const carouselElem = template2.querySelector(".carousel");
  carouselElem.setAttribute("id", carouselId);

  const carouselInner = template2.querySelector(".carousel-inner");
  const carouselIndicators = template2.querySelector(".carousel-indicators");
  const btnPrev = template2.querySelector(".carousel-control-prev");
  const btnNext = template2.querySelector(".carousel-control-next");

  // Asignar targets de Bootstrap
  btnPrev.setAttribute("data-bs-target", "#" + carouselId);
  btnNext.setAttribute("data-bs-target", "#" + carouselId);
  
  // Guardamos datos en el dataset para los eventos globales
  carouselElem.dataset.articulo = datos.Artículo;
  carouselElem.dataset.descripcion = typeof datos.Descripción === 'string' ? datos.Descripción : "Producto";

  // Mantenemos los botones visibles desde el principio
  btnPrev.classList.remove("d-none");
  btnNext.classList.remove("d-none");
  carouselIndicators.innerHTML = '';

  // Configurar la imagen principal dentro del carrusel
  const imgPrincipal = carouselInner.querySelector("img");
  imgPrincipal.src = "./imgcarrito/" + datos.Artículo + ".jpg";
  imgPrincipal.id = "img" + datos.Artículo;
  imgPrincipal.alt = typeof datos.Descripción === 'string' ? datos.Descripción : "Producto";
  imgPrincipal.onerror = function () { this.src = "./imgcarrito/IMGND.jpg"; };

  // Descripción en H5
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

  // Guardamos el ID del artículo en el botón + Info para poder ubicarlo
  const btnMasInfo = template2.querySelector(".btn-mas-info");
  if (btnMasInfo) {
    btnMasInfo.dataset.articulo = datos.Artículo;
  }

  // Asignar ID al botón de agregar al carrito
  const addButton = template2.querySelector(".botonaparecer");
  if (addButton) {
    addButton.setAttribute("id", "idbot" + (datos.Artículo));
  }

  let clone2 = document.importNode(template2, true);
  fragmento2.appendChild(clone2);
  return fragmento2;
}










//llamamos a la inicializacion de itemCarrito y luego actualizamos
inItemCarr.inItemCarr();
actualizarCarrito();

// Faltaba esta llamada: se importaba subirScroll pero nunca se ejecutaba
// crearBotonScroll(), que es la función que arma el botón flotante y lo
// agrega a la página. Por eso nunca aparecía al hacer scroll.
subirScroll.crearBotonScroll();

// Evita el menú nativo del navegador ("Abrir imagen en pestaña nueva",
// "Copiar imagen", etc) al mantener apretada una imagen de producto en
// celular. El CSS (-webkit-touch-callout) ya lo bloquea en iOS; esto es
// el respaldo para Android, donde a veces el menú igual aparece.
// Cubre tanto las imágenes del catálogo (.img-prod) como la miniatura
// del carrito (.carrito-item-img).
document.addEventListener('contextmenu', function (event) {
  if (event.target.closest('.img-prod') || event.target.closest('.carrito-item-img')) {
    event.preventDefault();
  }
});

//creamos una variable para los filtros de productos en catalogo
var FILTROS = "";

//creamos una variable para las unidades a ser agregadas al itemCarrito
let unidades = 1;

// Obtener el contenedor del menú desplegable para buscar productos por categoria
const dropdownContainer = document.querySelector(".porCategoria");
const dropdownMenu = dropdownContainer.querySelector(".porCategoriaUl");
const nombreDesplegable = dropdownContainer.querySelector(".nombreDesplegable");

// Crear un conjunto (Set) para almacenar las categorías únicas
const categoriasUnicas = new Set();

// Iterar sobre el array de datos y agregar cada categoría al conjunto
datos.forEach(objeto => {
  //si las categorias tienen productos con stock la agregamos al menu desplegable
  categoriasUnicas.add("VER TODOS");
  categoriasUnicas.add("CON DESCUENTOS");


  if (objeto.Inventario >= 1) {
    categoriasUnicas.add(objeto.Categoria);

  }
});

poblarMenuDesplegableProductos(categoriasUnicas);

// Crear los elementos de lista dinámicamente utilizando las categorías únicas
categoriasUnicas.forEach(categoria => {
  const lil = document.createElement("li");
  const boton = document.createElement("button");
  boton.textContent = categoria;
  boton.className = "btn btn-outline-dark rounded-pill m-1 categoria-btn";
  boton.type = "button";
  // Agregar evento de clic al botón
  boton.addEventListener("click", () => {

    FILTROS = boton.textContent;

// ✅ AHORA
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
  contenedorCatalogo.innerHTML = ''; // Limpia únicamente el contenedor del catálogo
  contenedorCatalogo.appendChild(fragmento);
}

const target = document.getElementById(contenedorId);
if (target) {
  target.appendChild(fragmento2);
}
    //MOSTRAMOS EL BOTON QUE SELECCIONAMOS
    //CAMBIAMOS EL NOMBRE AL BOTON PRINCIPAL DEL MENU DESPLEGABLE POR EL SELECCIONADO
    //nombreDesplegable.textContent = FILTROS;

    const botones = document.querySelectorAll(".categoria-btn");

    botones.forEach(btn => {
      btn.classList.remove("btn-dark");
      btn.classList.add("btn-outline-dark");
    });

    boton.classList.remove("btn-outline-dark");
    boton.classList.add("btn-dark");
    // Eliminamos la llamada redundante a escucharBotones() aquí
    // escucharBotones();


    var a = true;
    descu.porDeDescuento();
    varianteDeMedidas.cambiarVariantes()

    subirScroll.subir()

  });
  //ESTO SUBE AL DOM LAS CATEGORIAS

  lil.appendChild(boton);

  dropdownMenu.appendChild(lil);
 // const lil2 = document.createElement("ul");
 // dropdownMenu.appendChild(lil2);
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



// 1. Ordenar el array por la propiedad "Categoria":
datos.sort((a, b) => a.Descripción.localeCompare(b.Descripción));

// 2. Iterar sobre el array ordenado y agrupar por categoría:
let descActual = '';
datos.forEach(datos => {
  if (datos.Descripción !== descActual && datos.Inventario >= 1) {

    descActual = datos.Descripción;


  }
  if (datos.Inventario >= 1) {

    contenedorId = 0
    fragmento2 = MostrarEnCatalogo(datos, contenedorId);
  }

  mBotones.mostrarBotones();

});

let clone = document.importNode(template, true);
fragmento.appendChild(clone);
document.body.appendChild(fragmento);//agregamos el contenedor padre
document.getElementById(contenedorId).appendChild(fragmento2); //agregamos las cards

// Ocultamos el loader inicial: el catálogo ya está pintado
const loaderInicial = document.getElementById('loaderCatalogo');
if (loaderInicial) loaderInicial.remove();
escucharBotones(); // Esta es la única llamada a escucharBotones que debe existir.
descu.porDeDescuento();










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

  const telefono = "5493751588752"; // Reemplaza con el número de teléfono deseado

    // 1. Validar de forma obligatoria que haya seleccionado un método de pago antes de continuar
  const selectorPago = document.getElementById('metodoPago');
  const pagoElegido = selectorPago ? selectorPago.value : '';

  if (!pagoElegido) {
      return ""; // Frena la ejecución si no hay método de pago
  }

  // Construir el texto del mensaje con la información de los duplicados y los precios
  let textoCarrito = "Hola! Me interesan estos productos de la web:";
  let UnidadesProductosTotales = 0;


  itemCarrito.forEach(producto => {
    var precioCatalogo = (producto.Venta.replace(/,/g, ".") * producto.DOLAR * producto.Unidades);
    precioCatalogo = new Intl.NumberFormat('es-Mx', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(precioCatalogo);

    textoCarrito += `\n\n ${producto.Unidades} - ${producto.Descripción} -  $${precioCatalogo}`;

    UnidadesProductosTotales += producto.Unidades;
  });
  let tota = total();
  textoCarrito += `\n\n--- IMPORTE TOTAL DEL CARRITO: ${tota} `; // Agregar un salto de línea adicional
  textoCarrito += `\n\n--- Total de productos: ${UnidadesProductosTotales} \n`;

  textoCarrito += `\n--- DATOS DE ENTREGA ---`;

  // 1. Capturar el método de entrega seleccionado (Radio buttons)
  const opcionEntrega = document.querySelector('input[name="metodoEntrega"]:checked');
  const metodo = opcionEntrega ? opcionEntrega.value : 'No seleccionado';

  if (metodo === "retiro") {
    textoCarrito += `\n*Método:* Retirar personalmente`;
  } else if (metodo === "envio") {
    // 2. Si es envío, capturar la dirección ingresada
    const direccion = document.getElementById('direccionEnvio') ? document.getElementById('direccionEnvio').value : '';
    textoCarrito += `\n*Método:* Envío a domicilio`;
    textoCarrito += `\n*Dirección:* ${direccion || 'No especificada'}`;
  } else {
    textoCarrito += `\n*Método:* No especificado`;
  }

    // --- ADICIONAL: MÉTODO DE PAGO ---
  textoCarrito += `\n\n--- DATOS DE PAGO ---`;
  textoCarrito += `\n*Forma de pago:* ${pagoElegido}`;
  
  // 3. Capturar el cuadro de observaciones
  const campoObservaciones = document.getElementById('observacionesPedido');
  const observaciones = campoObservaciones ? campoObservaciones.value.trim() : '';
  if (observaciones) {
    textoCarrito += `\n*Observaciones:* ${observaciones}`;
  }
  
  textoCarrito += `\n\n`; // Espaciado final de cierre

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

// Agregamos el enlace de WhatsApp al documento
const enlaceWhatsApp = document.createElement("button");

enlaceWhatsApp.addEventListener('click', function (event) {
  event.preventDefault(); // Evita la redirección automática

  actualizarEnlaceWhatsApp(); 
  const urlActual = enlaceWhatsApp.getAttribute("href");
  if (urlActual === `https://wa.me` || !urlActual || urlActual.endsWith('text=')) {
      return; 
  }
  
  window.open(urlActual, '_blank');
  localStorage.removeItem('datosCarrito')
});
enlaceWhatsApp.textContent = "Enviar carrito por WhatsApp";
document.getElementById("whats").appendChild(enlaceWhatsApp);

// Ejemplo de modificación del array y actualización del enlace

actualizarEnlaceWhatsApp(); // Actualizar el enlace

filtrarConBusqueda()









//usamos el siguiente codigo para buscar productos
function filtrarConBusqueda() {

  //buscador
  //VEMOS EL CONTENIDO DEL FORMULARIO BUSCAR
  const formulario = document.querySelector('#formulario');

  let debounceBusqueda;

  const filtrar = () => {

    const texto = formulario.value.toLowerCase();
    let coincidencias = 0;
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
    subirScroll.subir();

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
  borrarCarritoCompleto()

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
  btnBorrarCarrito.setAttribute("class", "btn btn-outline-danger");
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
// Función para poblar el desplegable de Productos en el Navbar
function poblarMenuDesplegableProductos(categorias) {
  const menuContainer = document.getElementById("listaCategoriasMenu");
  if (!menuContainer) return;

  menuContainer.innerHTML = `
    <li><a class="dropdown-item filtro-cat-nav" href="#" data-cat="TODOS">Ver todos los productos</a></li>
    <li><hr class="dropdown-divider"></li>
  `;

  categorias.forEach(cat => {
    if (cat && cat !== "VER TODOS" && cat !== "CON DESCUENTOS") {
      const li = document.createElement("li");
      li.innerHTML = `<a class="dropdown-item filtro-cat-nav" href="#" data-cat="${cat}">${cat}</a>`;
      menuContainer.appendChild(li);
    }
  });

  menuContainer.querySelectorAll(".filtro-cat-nav").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const categoriaSeleccionada = e.target.getAttribute("data-cat");

      FILTROS = categoriaSeleccionada === "TODOS" ? "VER TODOS" : categoriaSeleccionada;

      while (fragmento2.firstChild) fragmento2.removeChild(fragmento2.firstChild);
      while (fragmento.firstChild) fragmento.removeChild(fragmento.firstChild);

      datos.forEach((producto) => {
        if (producto.Inventario >= 1 && (FILTROS === "VER TODOS" || producto.Categoria === FILTROS || (FILTROS === "CON DESCUENTOS" && producto.Descuento != 0))) {
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

      const offcanvasElement = document.getElementById("offcanvasDarkNavbar");
      if (offcanvasElement) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (bsOffcanvas) bsOffcanvas.hide();
      }
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