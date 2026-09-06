#!/bin/bash
export LC_ALL="es_ES.UTF-8"

# 1. CONFIGURA AQUÍ LA RUTA DE TU CARPETA
CORREO_REPO_PATH="C:/Users/yo/Desktop/TIENDA/MEMATALIMON"

# 2. Agrega todos los cambios apuntando a esa carpeta
echo "Agregando cambios en el repositorio..."
git -C "$CORREO_REPO_PATH" add .

# 3. Hace el commit con el mensaje fijo "banner"
echo "Ejecutando git commit con mensaje: banner..."
git -C "$CORREO_REPO_PATH" commit -m "banner"

# 4. Sube los cambios a GitHub desde esa carpeta
echo "Ejecutando git push..."
git -C "$CORREO_REPO_PATH" push

echo "¡Todo listo! Cambios del banner subidos con éxito."
