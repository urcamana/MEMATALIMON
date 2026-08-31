

export function eventCerrCanvas() {
    //cargamos los valores de canvas y botones

    let canvasInteres = document.getElementById("offcanvasDark");

    let botonInteres = document.getElementById("listaInteres");

    //cambiamos el hide por show del canvas al apretar boton
    botonInteres.addEventListener("click", event => {

        canvasInteres.classList.remove("hide", "show");

        canvasInteres.classList.add("show");


    });

    //cambiamos el show por hide al apretar la x cerrar del canvas
    let botonInteresC = document.getElementById("cerrarCanvas");

    botonInteresC.addEventListener("click", event2 => {

        canvasInteres.classList.replace("show", "hide");

    });
}