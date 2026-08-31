
//funcion eliminar del dom


export function removeElements(elements) {
  elements.forEach(element => {
    if (element) {
      element.remove();
    }
  });
}

// ...

