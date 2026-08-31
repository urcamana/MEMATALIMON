// animLogo.js
// Lógica compartida de la animación del logo de fondo.
// Antes estaba duplicada en index.html (inline) y logica.js.

export function iniciarAnimLogo() {
  const fondo = document.getElementById('fondo');
  const fondo2 = document.getElementById('fondo2');

  if (!fondo || !fondo2) return; // por si la página no tiene estos elementos

  function cambiarZIndex() {
    fondo.style.zIndex = -50;
    fondo.style.opacity = "30%";
    fondo2.style.height = "200%";
    // Antes solo "fondo" pasaba a segundo plano; "fondo2" (el logo) se
    // quedaba con z-index altísimo para siempre, tapando el resto del
    // contenido de la página. Ahora también pasa detrás.
    fondo2.style.zIndex = -49;
  }

  setTimeout(cambiarZIndex, 2000);
}
