@echo off
REM Script para preparar los archivos para despliegue en cPanel (Windows)
REM Uso: scripts\prepare-deploy.bat

echo 🚀 Preparando archivos para despliegue en cPanel...

REM Crear directorio de despliegue
if not exist deploy mkdir deploy

echo 📦 Preparando Backend...
REM Copiar backend (sin node_modules)
xcopy /E /I /Y /EXCLUDE:scripts\exclude.txt backend deploy\backend

echo 📦 Preparando Frontend...
REM Copiar frontend (sin node_modules y .next)
xcopy /E /I /Y /EXCLUDE:scripts\exclude.txt frontend deploy\frontend

echo 📝 Creando archivos de configuración...

REM Crear .env.example para backend
(
echo # Server
echo NODE_ENV=production
echo PORT=4000
echo.
echo # Database
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_USER=tu_usuario_cpanel_invitaciones_user
echo DB_PASSWORD=tu_contraseña_segura
echo DB_NAME=tu_usuario_cpanel_invitaciones_saas
echo.
echo # JWT ^(CAMBIA ESTOS VALORES^)
echo JWT_ACCESS_SECRET=genera_una_clave_super_secreta_aqui
echo JWT_REFRESH_SECRET=genera_otra_clave_super_secreta_aqui
echo JWT_ACCESS_EXPIRES=15m
echo JWT_REFRESH_EXPIRES=7d
echo.
echo # CORS
echo CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX=100
echo LOGIN_RATE_LIMIT_MAX=10
echo.
echo # App
echo APP_DOMAIN=tudominio.com
echo APP_PROTOCOL=https
) > deploy\backend\.env.production.example

REM Crear .env.example para frontend
(
echo NEXT_PUBLIC_API_URL=https://api.tudominio.com
echo NODE_ENV=production
) > deploy\frontend\.env.production.example

echo ✅ Archivos preparados en la carpeta 'deploy\'
echo.
echo 📋 Próximos pasos:
echo 1. Comprime manualmente las carpetas deploy\backend y deploy\frontend
echo 2. Sube los archivos ZIP a tu servidor cPanel
echo 3. Extrae los archivos en sus respectivas carpetas
echo 4. Copia .env.production.example a .env y configura tus valores
echo 5. Sigue la guía DEPLOY_CPANEL.md para completar el despliegue
echo.
pause
