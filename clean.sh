#!/bin/bash
# Script de limpieza para el proyecto de invitaciones
# Ejecutar con: bash clean.sh

echo "=== Limpieza del Proyecto ==="
echo ""

# Función para obtener tamaño de carpeta
get_folder_size() {
    if [ -d "$1" ]; then
        du -sm "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Mostrar tamaños antes de limpiar
echo "Tamaños antes de limpiar:"
frontend_next_size=$(get_folder_size "frontend/.next")
frontend_node_size=$(get_folder_size "frontend/node_modules")
backend_node_size=$(get_folder_size "backend/node_modules")
backend_uploads_size=$(get_folder_size "backend/uploads")

echo "  Frontend .next: ${frontend_next_size} MB"
echo "  Frontend node_modules: ${frontend_node_size} MB"
echo "  Backend node_modules: ${backend_node_size} MB"
echo "  Backend uploads: ${backend_uploads_size} MB"
echo ""

# Preguntar qué limpiar
read -p "¿Limpiar frontend/.next? (s/n): " clean_next
read -p "¿Limpiar frontend/node_modules? (s/n): " clean_frontend_node
read -p "¿Limpiar backend/node_modules? (s/n): " clean_backend_node
read -p "¿Limpiar backend/uploads/*.webp? (s/n): " clean_uploads

echo ""
echo "Limpiando..."

# Limpiar .next
if [ "$clean_next" = "s" ]; then
    if [ -d "frontend/.next" ]; then
        echo "  Eliminando frontend/.next..."
        rm -rf frontend/.next
        echo "  ✓ frontend/.next eliminado"
    fi
fi

# Limpiar frontend node_modules
if [ "$clean_frontend_node" = "s" ]; then
    if [ -d "frontend/node_modules" ]; then
        echo "  Eliminando frontend/node_modules..."
        rm -rf frontend/node_modules
        echo "  ✓ frontend/node_modules eliminado"
    fi
    if [ -f "frontend/package-lock.json" ]; then
        rm -f frontend/package-lock.json
        echo "  ✓ frontend/package-lock.json eliminado"
    fi
fi

# Limpiar backend node_modules
if [ "$clean_backend_node" = "s" ]; then
    if [ -d "backend/node_modules" ]; then
        echo "  Eliminando backend/node_modules..."
        rm -rf backend/node_modules
        echo "  ✓ backend/node_modules eliminado"
    fi
    if [ -f "backend/package-lock.json" ]; then
        rm -f backend/package-lock.json
        echo "  ✓ backend/package-lock.json eliminado"
    fi
fi

# Limpiar uploads
if [ "$clean_uploads" = "s" ]; then
    if [ -d "backend/uploads" ]; then
        echo "  Eliminando backend/uploads/*.webp..."
        find backend/uploads -name "*.webp" -type f -delete
        echo "  ✓ Archivos .webp eliminados (manteniendo .gitkeep)"
    fi
fi

echo ""
echo "=== Limpieza completada ==="

# Mostrar tamaños después de limpiar
echo ""
echo "Tamaños después de limpiar:"
frontend_next_size_after=$(get_folder_size "frontend/.next")
frontend_node_size_after=$(get_folder_size "frontend/node_modules")
backend_node_size_after=$(get_folder_size "backend/node_modules")
backend_uploads_size_after=$(get_folder_size "backend/uploads")

echo "  Frontend .next: ${frontend_next_size_after} MB"
echo "  Frontend node_modules: ${frontend_node_size_after} MB"
echo "  Backend node_modules: ${backend_node_size_after} MB"
echo "  Backend uploads: ${backend_uploads_size_after} MB"

total_freed=$((frontend_next_size - frontend_next_size_after + 
               frontend_node_size - frontend_node_size_after + 
               backend_node_size - backend_node_size_after + 
               backend_uploads_size - backend_uploads_size_after))

echo ""
echo "Espacio liberado: ${total_freed} MB"

# Preguntar si reinstalar dependencias
if [ "$clean_frontend_node" = "s" ] || [ "$clean_backend_node" = "s" ]; then
    echo ""
    read -p "¿Reinstalar dependencias? (s/n): " reinstall
    if [ "$reinstall" = "s" ]; then
        if [ "$clean_frontend_node" = "s" ]; then
            echo ""
            echo "Instalando dependencias del frontend..."
            cd frontend && npm install && cd ..
        fi
        if [ "$clean_backend_node" = "s" ]; then
            echo ""
            echo "Instalando dependencias del backend..."
            cd backend && npm install && cd ..
        fi
    fi
fi

echo ""
echo "¡Listo! Ahora puedes hacer commit y push a GitLab."
