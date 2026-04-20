#!/bin/bash

# Script para preparar los archivos para despliegue en cPanel
# Uso: bash scripts/prepare-deploy.sh

echo "🚀 Preparando archivos para despliegue en cPanel..."

# Crear directorio de despliegue
mkdir -p deploy
cd deploy

echo "📦 Preparando Backend..."
# Copiar backend (sin node_modules)
rsync -av --exclude='node_modules' --exclude='.env' --exclude='*.log' ../backend/ ./backend/

echo "📦 Preparando Frontend..."
# Copiar frontend (sin node_modules y .next)
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.env' ../frontend/ ./frontend/

echo "📝 Creando archivos de ejemplo..."
# Crear .env.example para backend
cat > ./backend/.env.production.example << 'EOF'
# Server
NODE_ENV=production
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario_cpanel_invitaciones_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=tu_usuario_cpanel_invitaciones_saas

# JWT (CAMBIA ESTOS VALORES)
JWT_ACCESS_SECRET=genera_una_clave_super_secreta_aqui
JWT_REFRESH_SECRET=genera_otra_clave_super_secreta_aqui
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=10

# App
APP_DOMAIN=tudominio.com
APP_PROTOCOL=https
EOF

# Crear .env.example para frontend
cat > ./frontend/.env.production.example << 'EOF'
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NODE_ENV=production
EOF

# Crear server.js para frontend
cat > ./frontend/server.js << 'EOF'
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
EOF

# Crear .htaccess para frontend
cat > ./frontend/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
EOF

# Crear .htaccess para backend
mkdir -p ./backend/public
cat > ./backend/public/.htaccess << 'EOF'
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]
EOF

echo "📦 Comprimiendo archivos..."
# Comprimir backend
cd backend
zip -r ../backend-deploy.zip . -x "*.git*" "*.log" "node_modules/*"
cd ..

# Comprimir frontend
cd frontend
zip -r ../frontend-deploy.zip . -x "*.git*" "*.log" "node_modules/*" ".next/*"
cd ..

echo "✅ Archivos preparados en la carpeta 'deploy/'"
echo ""
echo "📋 Próximos pasos:"
echo "1. Sube backend-deploy.zip y frontend-deploy.zip a tu servidor cPanel"
echo "2. Extrae los archivos en sus respectivas carpetas"
echo "3. Copia .env.production.example a .env y configura tus valores"
echo "4. Sigue la guía DEPLOY_CPANEL.md para completar el despliegue"
echo ""
echo "📦 Archivos creados:"
echo "   - deploy/backend-deploy.zip"
echo "   - deploy/frontend-deploy.zip"
echo "   - deploy/backend/.env.production.example"
echo "   - deploy/frontend/.env.production.example"
