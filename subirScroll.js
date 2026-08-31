//FUNCION PARA SUBIR ARRIBA DEL DOM






export function subir() {

  window.scrollTo({
    top: 0, behavior: "smooth"
  })
}








export function crearBotonScroll() {
  //creamos el boton que aparece al haber scroll hacia arriba para subir
  // Primero, crea el elemento del botón
  const scrollUpButton = document.createElement('button');
  const scrollUpButtonImg = document.createElement('img');
  scrollUpButtonImg.src = './IMG/up.png'; // Reemplaza con la ruta de tu imagen
  scrollUpButton.appendChild(scrollUpButtonImg);
  scrollUpButton.classList.add('scroll-up-btn');

  // Agrega un evento de clic al botón que llame a la función 'subir()'
  scrollUpButton.addEventListener('click', subir);

  // Luego, agrega el botón al DOM con posición fija
  const scrollUpButtonContainer = document.createElement('div');
  scrollUpButtonContainer.classList.add('scroll-up-btn-container');
  scrollUpButtonContainer.appendChild(scrollUpButton);
  document.body.appendChild(scrollUpButtonContainer);
  // Función para mostrar/ocultar el botón según el scroll
  function toggleScrollUpButton() {
    if (window.pageYOffset > 0) {
      scrollUpButtonContainer.style.display = 'block';
      scrollUpButtonContainer.style.zIndex = '10';
    } else {
      scrollUpButtonContainer.style.display = 'none';
      scrollUpButtonContainer.style.zIndex = '10';

    }
  }
  // Agrega un evento de scroll a la ventana que llame a la función 'toggleScrollUpButton()'
  window.addEventListener('scroll', toggleScrollUpButton);


}
