#!/bin/bash

# Script de despliegue para Invitaciones SaaS
# Uso: ./deploy.sh [fresh|normal|update]

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "docker-compose.yml no encontrado. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Verificar que existe .env
if [ ! -f ".env" ]; then
    print_warning "Archivo .env no encontrado. Copiando desde .env.example..."
    cp .env.example .env
    print_warning "Por favor, edita el archivo .env con tus valores antes de continuar."
    exit 1
fi

# Función para hacer backup de la base de datos
backup_database() {
    print_info "Creando backup de la base de datos..."
    
    # Cargar variables de entorno
    source .env
    
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if docker-compose ps mysql | grep -q "Up"; then
        docker exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > "$BACKUP_FILE" 2>/dev/null || {
            print_warning "No se pudo crear el backup (la base de datos puede no existir aún)"
            return 0
        }
        print_success "Backup creado: $BACKUP_FILE"
    else
        print_warning "MySQL no está corriendo, saltando backup"
    fi
}

# Función para despliegue fresh (primera vez)
deploy_fresh() {
    print_warning "MODO FRESH: Esto BORRARÁ TODOS LOS DATOS de la base de datos"
    read -p "¿Estás seguro? (escribe 'SI' para confirmar): " confirm
    
    if [ "$confirm" != "SI" ]; then
        print_info "Operación cancelada"
        exit 0
    fi
    
    print_info "Configurando modo fresh..."
    
    # Actualizar .env
    sed -i.bak 's/^MIGRATION_MODE=.*/MIGRATION_MODE=fresh/' .env
    sed -i.bak 's/^SEED_ON_BOOT=.*/SEED_ON_BOOT=true/' .env
    
    print_info "Deteniendo servicios..."
    docker-compose down
    
    print_info "Construyendo imágenes..."
    docker-compose build
    
    print_info "Iniciando servicios..."
    docker-compose up -d
    
    print_info "Esperando a que los servicios estén listos..."
    sleep 10
    
    print_info "Mostrando logs del backend..."
    docker-compose logs --tail 50 backend
    
    print_success "Despliegue fresh completado"
    print_warning "IMPORTANTE: Cambia MIGRATION_MODE=normal en .env para futuros despliegues"
}

# Función para despliegue normal
deploy_normal() {
    print_info "Modo normal: Manteniendo datos existentes"
    
    # Hacer backup antes de actualizar
    backup_database
    
    # Actualizar .env
    sed -i.bak 's/^MIGRATION_MODE=.*/MIGRATION_MODE=normal/' .env
    sed -i.bak 's/^SEED_ON_BOOT=.*/SEED_ON_BOOT=false/' .env
    
    print_info "Construyendo imágenes..."
    docker-compose build
    
    print_info "Reiniciando servicios..."
    docker-compose up -d
    
    print_info "Esperando a que los servicios estén listos..."
    sleep 5
    
    print_info "Mostrando logs del backend..."
    docker-compose logs --tail 30 backend
    
    print_success "Despliegue normal completado"
}

# Función para actualizar desde git
deploy_update() {
    print_info "Actualizando desde Git..."
    
    # Verificar si hay cambios sin commitear
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Hay cambios sin commitear. Haz commit o stash antes de actualizar."
        exit 1
    fi
    
    # Hacer backup antes de actualizar
    backup_database
    
    print_info "Haciendo pull de los cambios..."
    git pull origin main
    
    print_info "Reconstruyendo servicios..."
    docker-compose build
    
    print_info "Reiniciando servicios..."
    docker-compose up -d
    
    print_info "Esperando a que los servicios estén listos..."
    sleep 5
    
    print_info "Mostrando logs del backend..."
    docker-compose logs --tail 30 backend
    
    print_success "Actualización completada"
}

# Función para mostrar el estado
show_status() {
    print_info "Estado de los servicios:"
    docker-compose ps
    
    echo ""
    print_info "Últimos logs del backend:"
    docker-compose logs --tail 20 backend
}

# Menú principal
case "${1:-help}" in
    fresh)
        deploy_fresh
        ;;
    normal)
        deploy_normal
        ;;
    update)
        deploy_update
        ;;
    status)
        show_status
        ;;
    backup)
        backup_database
        ;;
    logs)
        docker-compose logs -f backend
        ;;
    help|*)
        echo "Uso: $0 [comando]"
        echo ""
        echo "Comandos disponibles:"
        echo "  fresh   - Despliegue fresh (BORRA TODOS LOS DATOS)"
        echo "  normal  - Despliegue normal (mantiene datos)"
        echo "  update  - Actualizar desde Git y redesplegar"
        echo "  status  - Mostrar estado de los servicios"
        echo "  backup  - Crear backup de la base de datos"
        echo "  logs    - Ver logs del backend en tiempo real"
        echo "  help    - Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  $0 fresh    # Primera instalación"
        echo "  $0 normal   # Despliegue regular"
        echo "  $0 update   # Actualizar desde Git"
        ;;
esac
