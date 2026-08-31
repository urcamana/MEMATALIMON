// Función para guardar el carrito en el local storage
export function guardarEnLocalStorage(array) {
    var datos = {
        items: array,
        timestamp: new Date().getTime() + 23 * 60 * 60 * 1000 // Marca de tiempo actual + 24 horas en milisegundos
    };

    localStorage.setItem('datosCarrito', JSON.stringify(datos));
}







// Función para extraer el carrito del local storage si existe y está dentro de la fecha de validez
export function extraerDeLocalStorage() {
    var datos = localStorage.getItem('datosCarrito');

    if (datos === null) {
        return [];
    }

    datos = JSON.parse(datos);
    var tiempoActual = new Date().getTime();

    if (tiempoActual > datos.timestamp) {
        localStorage.removeItem('datosCarrito');
        return [];
    }

    return datos.items;
}


