//funciones de carga y extraccion de local storage
import * as localStor from './localStor.js';
//alertas muestras las alertas!
import * as alertas from './alertas.js';

//creamos un array para guardar los productos
//si tiene contenido en local storage guarda la lista en itemcarrito
export let itemCarrito = localStor.extraerDeLocalStorage();







export function inItemCarr() {

  if (itemCarrito !== null) {

    let contenido = tieneContenido(itemCarrito);
    if (contenido > 0) {
      let suceso = "Productos en tu carrito";
      let tipoAlert = "alert-success";
      let da = contenido;
      alertas.alertAgrego(da, suceso, tipoAlert);

    }
  }
}








export function tieneContenido(array) {

  const sumarUnidades = (array) => array.reduce((total, item) => total + item.Unidades, 0);
  const sumaTotal = sumarUnidades(array)
  return sumaTotal;
}