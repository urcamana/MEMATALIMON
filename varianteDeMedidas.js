import * as eliminarDelDom from './eliminarDelDom.js';

export function AgregaVariantes(datos, template2) {

    // No necesitas redeclarar estas variables con var dentro del else
    let selectElement5 = template2.querySelector('.tVariante');
    let selectElement4 = template2.querySelector('.tMedida');
let i=0;
  //  const categoriasValidas = ["CABELLO", "PUNTERAS"];

    // Verificamos si la categoría NO está en la lista de categorías válidas

   // if (!categoriasValidas.includes(datos.Categoria) || datos.VarianteP=="1") {

    
    if (datos.VarianteP==""|| datos.VarianteP==null) {
     
    //if (!categoriasValidas.includes(datos.Categoria) || datos.VarianteP=="") {

        // Si existen los elementos, los eliminamos
        if (selectElement4) eliminarDelDom.removeElements([selectElement4]);
        if (selectElement5) eliminarDelDom.removeElements([selectElement5]);

    } else {
        // Si la categoría es válida, nos aseguramos de que los selects existan o los creamos.

        // Eliminar los existentes si es necesario (tu lógica original lo hacía aquí)
        // Considera si realmente necesitas eliminarlos y recrearlos siempre.
        // Si solo necesitas actualizar opciones, podrías solo limpiar el innerHTML.
        // Mantengo tu lógica original por ahora:
        if (selectElement4) eliminarDelDom.removeElements([selectElement4]);
        if (selectElement5) eliminarDelDom.removeElements([selectElement5]);

        // Volvemos a buscar por si fueron eliminados y necesitamos crearlos
        selectElement4 = template2.querySelector('.tMedida');
        selectElement5 = template2.querySelector('.tVariante');

        // Si no existen después de intentar eliminar, los creamos
        if (selectElement4 == null) {
            selectElement4 = document.createElement('select');
            selectElement4.classList.add('tMedida');
            selectElement4.setAttribute("id", "med" + (datos.Artículo));
            template2.querySelector('.variantes').appendChild(selectElement4);
        }

        if (selectElement5 == null) {
            selectElement5 = document.createElement('select');
            selectElement5.classList.add('tVariante');
            selectElement5.setAttribute("id", "var" + (datos.Artículo));
            template2.querySelector('.variantes').appendChild(selectElement5);
        }

        // --- Lógica para selectElement4 (tMedida) ---
        // Crear las nuevas opciones para tMedida (esto parece fijo en tu código)

      let nuevasOpciones = ''; // Inicializamos la cadena de opciones vacía

      // Verificamos que datos.VarianteP exista y sea un string no vacío

      if (typeof datos.VarianteP === 'string' && datos.VarianteP.trim().length > 0) {
          // Dividimos el string por la coma para obtener un array de opciones
          const opcionesArray = datos.VarianteP.split(',');

          // Iteramos sobre el array de opciones
          opcionesArray.forEach(opcion => {
              // Quitamos espacios en blanco al inicio y final de cada opción
              const opcionLimpia = opcion.trim();
              // Nos aseguramos de no agregar opciones vacías si hay comas seguidas (,,)
              
              if (opcionLimpia) {
                i++
                let opcionLimpia2= i;
                  // Creamos el string del <option> y lo añadimos a nuevasOpciones2
                  // Usamos la opción limpia como valor y como texto visible
                  nuevasOpciones += `<option value="${opcionLimpia2}">${opcionLimpia}</option>`;
              }
          });
      } else {
          // Opcional: ¿Qué hacer si datos.VarianteP está vacío o no existe?
          // Podrías poner una opción por defecto o dejarlo vacío.
          nuevasOpciones = '<option value="">--sin variantes--</option>';
         // console.warn(`datos.VarianteP está vacío o no definido para el artículo: ${datos.Artículo}`);
      }

      // Asignar las opciones generadas al select tVariante
      selectElement4.innerHTML = nuevasOpciones;
  i=0;
//----------------------------------------------------------------------------------------------------------------------------
        // --- Lógica para selectElement5 (tVariante) ---
        let nuevasOpciones2 = ''; // Inicializamos la cadena de opciones vacía

        // Verificamos que datos.VarianteS exista y sea un string no vacío

        if (typeof datos.VarianteS === 'string' && datos.VarianteS.trim().length > 0) {
            // Dividimos el string por la coma para obtener un array de opciones
            const opcionesArray = datos.VarianteS.split(',');

            // Iteramos sobre el array de opciones
            opcionesArray.forEach(opcion => {
                // Quitamos espacios en blanco al inicio y final de cada opción
                const opcionLimpia = opcion.trim();
                // Nos aseguramos de no agregar opciones vacías si hay comas seguidas (,,)
                
                if (opcionLimpia) {
                  i++
                  let opcionLimpia2= i;
                    // Creamos el string del <option> y lo añadimos a nuevasOpciones2
                    // Usamos la opción limpia como valor y como texto visible
                    nuevasOpciones2 += `<option value="${opcionLimpia2}">${opcionLimpia}</option>`;
                }
            });
        } else {
            // Opcional: ¿Qué hacer si datos.VarianteS está vacío o no existe?
            // Podrías poner una opción por defecto o dejarlo vacío.
            nuevasOpciones2 = '<option value="">--sin variantes--</option>';
           
           //SI NO HAY VARIANTES ELIMINAMOS EL SELECT
            if (selectElement5) eliminarDelDom.removeElements([selectElement5]);

           // console.warn(`datos.VarianteS está vacío o no definido para el artículo: ${datos.Artículo}`);
        }

        // Asignar las opciones generadas al select tVariante
        selectElement5.innerHTML = nuevasOpciones2;
    }
}


// --- Tu función cambiarVariantes (sin cambios respecto a la original) ---
export function cambiarVariantes() {
    const selects = document.querySelectorAll('select[id^=med]');

    selects.forEach(select => {
        select.addEventListener('change', event => {
            const id = event.target.id;

            // Corrección: Debería ser event.target.id, no event.target.Id
            if (!event.target) {
                console.error(`El elemento target del evento no existe.`);
                return;
            }
            let selectElement7 = document.getElementById(id); // Obtener el elemento select por su id
            if (!selectElement7) {
                 console.error(`El elemento select con ID "${id}" no existe en el DOM.`);
                 return;
            }

            var varied = selectElement7.value; // Obtener el valor seleccionado del elemento select

            var regex = /(\d+)/g;
            var idMatch = id.match(regex); // Es buena práctica chequear si match devolvió algo

            if (!idMatch) {
                console.error(`No se pudo extraer el número del ID "${id}"`);
                return;
            }
            var id2 = idMatch[0]; // match devuelve un array, usualmente queremos el primer elemento

            const selectElement77 = document.getElementById("var" + id2); // Obtener el elemento select por su id
            if (!selectElement77) {

               // console.error(`El elemento select variante con ID "var${id2}" no existe.`);
                return;
            }

            // // El switch para actualizar las opciones de 'tVariante' según la selección de 'tMedida'
            // switch (varied) {
            //     case '1': // SH
            //         // Crear las nuevas opciones
            //         let nuevasOpcionesRL = '<option value="1">1</option>' +
            //                              '<option value="3">3</option>' +
            //                              '<option value="5">5</option>' +
            //                              '<option value="7">7</option>' +
            //                              '<option value="9">9</option>' +
            //                              '<option value="11">11</option>' +
            //                              '<option value="13">13</option>' +
            //                              '<option value="15">15</option>';
            //         // Asignar las opciones al select
            //         selectElement77.innerHTML = nuevasOpcionesRL;
            //         break;
            //     case '2': // AC
            //          // Crear las nuevas opciones
            //         let nuevasOpcionesM1 = '<option value="7">7</option>' +
            //                                '<option value="9">9</option>' +
            //                                '<option value="11">11</option>' +
            //                                '<option value="13">13</option>' +
            //                                '<option value="15">15</option>';
            //         // Asignar las opciones al select
            //         selectElement77.innerHTML = nuevasOpcionesM1;
            //         break;
            //     // Faltan los case '3' y '4' que estaban comentados en tu código original
            //     // case '3': ... break;
            //     // case '4': ... break;
            //     default:
            //         console.log(`Opción no válida seleccionada en tMedida: ${varied}`);
            //         // Podrías limpiar las opciones o poner un mensaje por defecto
            //         selectElement77.innerHTML = '<option value="">-- Seleccione medida --</option>';
            //         break;
            // }
        });
    });
}