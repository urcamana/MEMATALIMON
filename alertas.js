

// Guardamos referencia al temporizador activo. Antes, cada llamada a
// alertAgrego() programaba su propio setTimeout de 2 segundos sin cancelar
// el anterior: si se agregaban dos productos seguidos (o pasaba cualquier
// otra alerta) antes de que pasaran esos 2 segundos, el temporizador VIEJO
// terminaba ocultando la alerta NUEVA mucho antes de tiempo, dando la
// sensación de un parpadeo rapidísimo e inconsistente. Ahora cancelamos el
// temporizador anterior cada vez que se muestra una alerta nueva, así
// siempre se ve completa por sus 2 segundos.
let temporizadorAlerta = null;

//funcion PARA MOSTRAR ALERTAS PERSONALIZADAS
export function alertAgrego(titAlert, suceso, tipoAlert) {
    //ponemos el titulo del producto en el alert
    let alertTitulo = document.getElementById("alertTit");
    alertTitulo.textContent = `${titAlert} `;

    //ponemos el suceso del alert- sea danger o sucess
    let alertSuceso = document.getElementById("alertSuceso");
    alertSuceso.textContent = `${suceso} `;

    let alertAgrego = document.getElementById("alertAgrego");

    // Cancelamos el temporizador de una alerta anterior si todavía estaba
    // corriendo, para que no le corte el tiempo a esta alerta nueva.
    if (temporizadorAlerta) {
        clearTimeout(temporizadorAlerta);
    }

    //hacemos el alert visible 
    alertAgrego.classList.remove("hide", "show");
    alertAgrego.style.cssText = 'z-index: -50 !important;';

    alertAgrego.classList.remove("alert-success", "alert-danger");
    alertAgrego.classList.add(tipoAlert);

    alertAgrego.classList.add("show");
    alertAgrego.style.cssText = 'z-index: 50 !important;';
    //Colocamos el timpo del alert antes de desactivarse
    temporizadorAlerta = setTimeout(() => {
        alertAgrego.classList.remove("hide", "show");
        alertAgrego.style.cssText = 'z-index: -50 !important;';
        alertAgrego.classList.add("hide");
        temporizadorAlerta = null;


    }, 2000);

};


