#!/bin/bash

# Script de instalación rápida para servidor cPanel
# Ejecutar después de subir los archivos al servidor
# Uso: bash install-server.sh

echo "🚀 Instalación de Invitaciones SaaS en cPanel"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar errores
error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Función para mostrar éxito
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencias
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "No se encontraron las carpetas backend y frontend. Asegúrate de estar en el directorio raíz de la aplicación."
fi

echo "📍 Directorio actual: $(pwd)"
echo ""

# Preguntar por la configuración
read -p "¿Deseas configurar el backend? (s/n): " config_backend
read -p "¿Deseas configurar el frontend? (s/n): " config_frontend

# Configurar Backend
if [ "$config_backend" = "s" ] || [ "$config_backend" = "S" ]; then
    echo ""
    echo "🔧 Configurando Backend..."
    echo "=========================="
    
    cd backend
    
    # Verificar si existe .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env
            warning "Se creó .env desde .env.production.example"
            warning "IMPORTANTE: Edita backend/.env con tus credenciales reales"
        else
            error "No se encontró .env ni .env.production.example"
        fi
    else
        success ".env ya existe"
    fi
    
    # Instalar dependencias
    echo ""
    echo "📦 Instalando dependencias del backend..."
    
    # Detectar si hay un entorno virtual de Node.js
    if [ -n "$NODEJS_VERSION" ]; then
        success "Usando Node.js del entorno virtual de cPanel"
    fi
    
    npm install --production || error "Falló la instalación de dependencias del backend"
    success "Dependencias del backend instaladas"
    
    # Ejecutar migraciones
    echo ""
    read -p "¿Deseas ejecutar las migraciones de base de datos? (s/n): " run_migrations
    
    if [ "$run_migrations" = "s" ] || [ "$run_migrations" = "S" ]; then
        echo "🗄️  Ejecutando migraciones..."
        npm run migrate || warning "Las migraciones fallaron. Verifica la configuración de la base de datos."
        
        read -p "¿Deseas ejecutar el seed (datos de prueba)? (s/n): " run_seed
        if [ "$run_seed" = "s" ] || [ "$run_seed" = "S" ]; then
            npm run seed || warning "El seed falló"
        fi
    fi
    
    cd ..
    success "Backend configurado"
fi

# Configurar Frontend
if [ "$config_frontend" = "s" ] || [ "$config_frontend" = "S" ]; then
    echo ""
    echo "🔧 Configurando Frontend..."
    echo "==========================="
    
    cd frontend
    
    # Verificar si existe .env
    if [ ! -f ".env.production" ]; then
        if [ -f ".env.production.example" ]; then
            cp .env.production.example .env.production
            warning "Se creó .env.production desde .env.production.example"
            warning "IMPORTANTE: Edita frontend/.env.production con tu URL del API"
        else
            error "No se encontró .env.production ni .env.production.example"
        fi
    else
        success ".env.production ya existe"
    fi
    
    # Verificar si existe server.js
    if [ ! -f "server.js" ]; then
        warning "No se encontró server.js. Creando uno básico..."
        cat > server.js << 'SERVERJS'
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
SERVERJS
        success "server.js creado"
    fi
    
    # Instalar dependencias
    echo ""
    echo "📦 Instalando dependencias del frontend..."
    npm install || error "Falló la instalación de dependencias del frontend"
    success "Dependencias del frontend instaladas"
    
    # Build
    echo ""
    read -p "¿Deseas construir el frontend ahora? (s/n): " build_frontend
    
    if [ "$build_frontend" = "s" ] || [ "$build_frontend" = "S" ]; then
        echo "🏗️  Construyendo frontend (esto puede tardar varios minutos)..."
        npm run build || error "Falló la construcción del frontend"
        success "Frontend construido exitosamente"
    fi
    
    cd ..
    success "Frontend configurado"
fi

# Resumen final
echo ""
echo "=============================================="
echo "🎉 Instalación completada"
echo "=============================================="
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Edita los archivos .env con tus credenciales reales:"
echo "   - backend/.env (base de datos, JWT, dominio)"
echo "   - frontend/.env.production (URL del API)"
echo ""
echo "2. Configura las aplicaciones Node.js en cPanel:"
echo "   - Backend: Setup Node.js App → Application root: $(pwd)/backend"
echo "   - Frontend: Setup Node.js App → Application root: $(pwd)/frontend"
echo ""
echo "3. Configura SSL/HTTPS en cPanel"
echo ""
echo "4. Configura los archivos .htaccess para proxy reverso"
echo ""
echo "5. Inicia las aplicaciones desde 'Setup Node.js App' en cPanel"
echo ""
echo "📖 Consulta DEPLOY_CPANEL.md para más detalles"
echo ""
