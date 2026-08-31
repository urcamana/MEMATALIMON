//funcion para mostrar los botones en movimiento



//hacemos que los botones agregar carrito aparezcan despues de mostrar las tarjetas
export function mostrarBotones() {

    $(document).ready(function () {
        var botones = document.querySelectorAll('.botonaparecer');

        var opciones = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        var observer = new IntersectionObserver(function (entradas, observer) {
            entradas.forEach(function (entrada) {
                if (entrada.intersectionRatio > 0) {
                    setTimeout(function () {
                        entrada.target.style.opacity = '1';
                        entrada.target.style.animation = 'aparecerDesdeAbajo 0.5s ease-in-out forwards';
                    }, 400); // Retraso de 2 segundos (2000 milisegundos)
                    observer.unobserve(entrada.target);
                }
            });
        }, opciones);

        botones.forEach(function (boton) {
            observer.observe(boton);
        });
    });
}



