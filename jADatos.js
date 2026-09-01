//EL PRIMERO ES EL ORIGINAL
// //creamos el array con los datos
// import data from './articulos.json' with { type: 'json' };

// //creamos el array datos con los datos del json
// export const datos = Array.from(data);






// Cargar los datos desde el JSON

// export let datos;

// fetch('articulos.json')
//   .then(response => response.json())
//   .then(data => {
//     // Crear el array de datos
//     datos = Array.from(data);

//     // Hacer algo con los datos
//     console.log(datos);
//   })
//   .catch(error => {
//     console.error('Error al cargar los datos:', error);
//   });





// jADatos.js
// Cargar el archivo JSON con manejo de errores para que la tienda
// no quede en blanco silenciosamente si falla la carga.
let data;

try {
  const response = await window.fetch('./articulos.json');

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al cargar articulos.json`);
  }

  data = await response.json();

} catch (error) {
  console.error('No se pudo cargar el catálogo de productos:', error);

  // Mostramos un aviso visible al usuario en vez de dejar la página vacía
  document.body.innerHTML = `
    <div style="text-align:center; padding: 4rem 1rem; font-family: sans-serif;">
      <h2>No pudimos cargar el catálogo</h2>
      <p>Por favor, recargá la página. Si el problema persiste, contactanos por WhatsApp.</p>
             <div class="redes">

            <a id="w" href="https://wa.me/message/5493751588752" target="_blank"><img src="IMG/w.png"
                    alt="WhatsApp"></a>
            <!-- 
            <a id="I" href="#i"><img src="../IMG/i.png" alt="Instagram"></a>

            <a id="F" href="#f"><img src="../IMG/f.png" alt="Facebook"></a> -->

        </div>
    </div>
  `;

  // Array vacío para que el resto del código no rompa si algo sigue ejecutándose
  data = [];
}

// Exportar el array de datos
export default data;