#!/bin/bash
export LC_ALL="es_ES.UTF-8"

# 1. CONFIGURA AQUÍ LA RUTA DE TU CARPETA
# Reemplaza esto con la ruta de la carpeta que quieres actualizar
CORREO_REPO_PATH="C:/Users/yo/Desktop/TIENDA/MEMATALIMON"

# 2. Agrega todos los cambios apuntando a esa carpeta
echo "Agregando cambios en el repositorio..."
git -C "$CORREO_REPO_PATH" add .

# 3. Te pregunta el mensaje del commit
echo "----------------------------------------"
echo "Escribe el mensaje para este commit (luego presiona ENTER):"
read -r mensaje_usuario
echo "----------------------------------------"

# Valida que no hayas dejado el mensaje vacío
if [ -z "$mensaje_usuario" ]; then
    echo "Error: El mensaje del commit no puede estar vacío. Proceso cancelado."
    exit 1
fi

# 4. Hace el commit en esa carpeta con tu texto
echo "Ejecutando git commit..."
git -C "$CORREO_REPO_PATH" commit -m "$mensaje_usuario"

# 5. Sube los cambios a GitHub desde esa carpeta
echo "Ejecutando git push..."
git -C "$CORREO_REPO_PATH" push

echo "¡Todo listo y subido con éxito desde fuera de la carpeta!"
