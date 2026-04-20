# 🚀 Guía de Despliegue en cPanel - Paso a Paso

Esta guía te ayudará a desplegar tu aplicación de invitaciones SaaS en un servidor con cPanel.

## 📋 Requisitos Previos

- Acceso a cPanel con:
  - Node.js habilitado (versión 18 o superior)
  - MySQL/MariaDB
  - Acceso SSH (recomendado pero opcional)
  - Suficiente espacio en disco (mínimo 2GB)

---

## 🗂️ PARTE 1: Preparación de la Base de Datos

### 1.1 Crear la Base de Datos MySQL

1. **Accede a cPanel** → **MySQL® Databases**
2. **Crear nueva base de datos:**
   - Nombre: `invitaciones_saas` (o el que prefieras)
   - Click en "Create Database"
3. **Crear usuario de base de datos:**
   - Usuario: `invitaciones_user`
   - Contraseña: Genera una segura (guárdala)
   - Click en "Create User"
4. **Asignar usuario a la base de datos:**
   - Selecciona el usuario y la base de datos
   - Marca "ALL PRIVILEGES"
   - Click en "Make Changes"
5. **Anota estos datos:**
   ```
   DB_HOST: localhost (o el que te proporcione cPanel)
   DB_PORT: 3306
   DB_USER: tu_usuario_cpanel_invitaciones_user
   DB_PASSWORD: tu_contraseña
   DB_NAME: tu_usuario_cpanel_invitaciones_saas
   ```

---

## 📦 PARTE 2: Preparar los Archivos Localmente

### 2.1 Construir el Frontend

```bash
cd frontend
npm install
npm run build
```

Esto creará la carpeta `.next` con los archivos optimizados.

### 2.2 Preparar el Backend

El backend no necesita build, pero asegúrate de tener todas las dependencias:

```bash
cd backend
npm install --production
```

### 2.3 Crear archivo .env de producción

Crea `backend/.env.production` con estos valores (ajústalos a tu servidor):

```env
# Server
NODE_ENV=production
PORT=4000

# Database (usa los datos del paso 1.1)
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario_cpanel_invitaciones_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=tu_usuario_cpanel_invitaciones_saas

# JWT (CAMBIA ESTOS VALORES - genera claves únicas)
JWT_ACCESS_SECRET=tu_clave_super_secreta_access_cambiar_en_produccion_12345
JWT_REFRESH_SECRET=tu_clave_super_secreta_refresh_cambiar_en_produccion_67890
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS (usa tu dominio real)
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=10

# App (usa tu dominio real)
APP_DOMAIN=tudominio.com
APP_PROTOCOL=https
```

### 2.4 Crear archivo .env para el Frontend

Crea `frontend/.env.production` con:

```env
NEXT_PUBLIC_API_URL=https://tudominio.com:4000
```

O si usas un subdominio para el API:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

---

## 📤 PARTE 3: Subir Archivos a cPanel

### Opción A: Usando File Manager de cPanel

1. **Accede a cPanel** → **File Manager**
2. **Navega a tu directorio** (generalmente `public_html` o crea una carpeta nueva)
3. **Crea la estructura:**
   ```
   /home/tuusuario/
   ├── invitaciones-app/
   │   ├── backend/
   │   └── frontend/
   ```

4. **Sube los archivos:**
   - Comprime `backend/` en un ZIP (sin node_modules)
   - Comprime `frontend/` en un ZIP (sin node_modules y sin .next)
   - Sube ambos ZIPs
   - Extrae en sus respectivas carpetas

### Opción B: Usando FTP/SFTP (Recomendado)

1. **Usa FileZilla o WinSCP**
2. **Conecta con tus credenciales de cPanel**
3. **Sube las carpetas:**
   - `backend/` (sin node_modules)
   - `frontend/` (sin node_modules y sin .next)

### Opción C: Usando SSH (Más Rápido)

```bash
# Desde tu computadora local
scp -r backend/ usuario@tudominio.com:/home/tuusuario/invitaciones-app/
scp -r frontend/ usuario@tudominio.com:/home/tuusuario/invitaciones-app/
```

---

## ⚙️ PARTE 4: Configurar Node.js en cPanel

### 4.1 Configurar la Aplicación Backend

1. **Accede a cPanel** → **Setup Node.js App**
2. **Click en "Create Application"**
3. **Configura:**
   - **Node.js version:** 18.x o superior
   - **Application mode:** Production
   - **Application root:** `invitaciones-app/backend`
   - **Application URL:** Elige un dominio o subdominio (ej: `api.tudominio.com`)
   - **Application startup file:** `src/server.js`
   - **Environment variables:** Agrega las del archivo `.env.production`

4. **Click en "Create"**

5. **Instalar dependencias:**
   - En la misma pantalla, copia el comando que aparece
   - Accede a **Terminal** en cPanel
   - Ejecuta:
   ```bash
   cd /home/tuusuario/invitaciones-app/backend
   source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
   npm install --production
   ```

6. **Ejecutar migraciones:**
   ```bash
   npm run migrate
   npm run seed
   ```

7. **Iniciar la aplicación:**
   - Vuelve a **Setup Node.js App**
   - Click en el botón de "Restart" o "Start"

### 4.2 Configurar la Aplicación Frontend

1. **Accede a cPanel** → **Setup Node.js App**
2. **Click en "Create Application"**
3. **Configura:**
   - **Node.js version:** 18.x o superior
   - **Application mode:** Production
   - **Application root:** `invitaciones-app/frontend`
   - **Application URL:** Tu dominio principal (ej: `tudominio.com`)
   - **Application startup file:** `server.js` (lo crearemos)
   - **Environment variables:**
     ```
     NEXT_PUBLIC_API_URL=https://api.tudominio.com
     NODE_ENV=production
     PORT=3000
     ```

4. **Crear el archivo de inicio** (via Terminal o File Manager):

Crea `frontend/server.js`:

```javascript
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
```

5. **Instalar dependencias y construir:**
   ```bash
   cd /home/tuusuario/invitaciones-app/frontend
   source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
   npm install
   npm run build
   ```

6. **Iniciar la aplicación:**
   - Vuelve a **Setup Node.js App**
   - Click en "Restart"

---

## 🌐 PARTE 5: Configurar Dominios y SSL

### 5.1 Configurar Subdominios (Opcional pero Recomendado)

1. **Accede a cPanel** → **Subdomains**
2. **Crear subdominio para API:**
   - Subdomain: `api`
   - Document Root: `/home/tuusuario/invitaciones-app/backend/public` (crea esta carpeta)
   - Click "Create"

### 5.2 Instalar SSL (HTTPS)

1. **Accede a cPanel** → **SSL/TLS Status**
2. **Selecciona tus dominios:**
   - `tudominio.com`
   - `api.tudominio.com`
3. **Click en "Run AutoSSL"**
4. Espera a que se instalen los certificados

### 5.3 Configurar Proxy Reverso (Importante)

Necesitas crear archivos `.htaccess` para redirigir el tráfico a las aplicaciones Node.js:

**Para el Frontend** (`public_html/.htaccess`):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

**Para el API** (`public_html/api/.htaccess` o subdominio):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:4000/$1 [P,L]
```

---

## 🔧 PARTE 6: Configuración Final

### 6.1 Verificar que todo funcione

1. **Prueba el API:**
   ```
   https://api.tudominio.com/api/v1/health
   ```
   Deberías ver: `{"status":"ok"}`

2. **Prueba el Frontend:**
   ```
   https://tudominio.com
   ```
   Deberías ver la página de inicio

### 6.2 Crear el primer usuario administrador

Accede via SSH o Terminal de cPanel:

```bash
cd /home/tuusuario/invitaciones-app/backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
node src/database/seed.js
```

Esto creará un usuario de prueba. Anota las credenciales que aparezcan en la consola.

### 6.3 Configurar Cron Jobs (Opcional)

Si necesitas tareas programadas:

1. **Accede a cPanel** → **Cron Jobs**
2. **Agregar tarea:**
   - Comando: `cd /home/tuusuario/invitaciones-app/backend && node src/scripts/cleanup.js`
   - Frecuencia: Diaria a las 2 AM

---

## 🐛 PARTE 7: Solución de Problemas

### Problema: "Cannot find module"

**Solución:**
```bash
cd /ruta/a/tu/app
source /home/tuusuario/nodevenv/ruta/18/bin/activate
npm install
```

### Problema: "Port already in use"

**Solución:**
- Cambia el puerto en las variables de entorno
- O detén la aplicación anterior en "Setup Node.js App"

### Problema: "Database connection failed"

**Solución:**
- Verifica las credenciales en `.env`
- Asegúrate de usar el prefijo de usuario de cPanel
- Verifica que el usuario tenga permisos en la BD

### Problema: "502 Bad Gateway"

**Solución:**
- Verifica que la aplicación Node.js esté corriendo
- Revisa los logs en `/home/tuusuario/logs/`
- Reinicia la aplicación en "Setup Node.js App"

### Ver Logs

```bash
# Logs del backend
tail -f /home/tuusuario/logs/backend_error.log

# Logs del frontend
tail -f /home/tuusuario/logs/frontend_error.log
```

---

## 📊 PARTE 8: Monitoreo y Mantenimiento

### 8.1 Configurar PM2 (Recomendado)

PM2 mantiene tu aplicación corriendo y la reinicia si falla:

```bash
npm install -g pm2

# Backend
cd /home/tuusuario/invitaciones-app/backend
pm2 start src/server.js --name "invitaciones-backend"

# Frontend
cd /home/tuusuario/invitaciones-app/frontend
pm2 start server.js --name "invitaciones-frontend"

# Guardar configuración
pm2 save
pm2 startup
```

### 8.2 Backups Automáticos

1. **Accede a cPanel** → **Backup Wizard**
2. Configura backups automáticos diarios
3. Incluye:
   - Base de datos
   - Directorio de la aplicación
   - Archivos subidos por usuarios

---

## ✅ Checklist Final

- [ ] Base de datos creada y configurada
- [ ] Archivos subidos al servidor
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas (backend y frontend)
- [ ] Migraciones ejecutadas
- [ ] SSL instalado y funcionando
- [ ] Aplicaciones Node.js corriendo
- [ ] Proxy reverso configurado
- [ ] Usuario administrador creado
- [ ] Backups configurados
- [ ] Logs revisados sin errores

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en:
- **Frontend:** https://tudominio.com
- **API:** https://api.tudominio.com

**Credenciales de prueba** (si ejecutaste el seed):
- Email: admin@example.com
- Password: (revisa la salida del comando seed)

---

## 📞 Soporte Adicional

Si tienes problemas:
1. Revisa los logs en `/home/tuusuario/logs/`
2. Verifica que Node.js esté corriendo en "Setup Node.js App"
3. Asegúrate de que los puertos no estén bloqueados por el firewall
4. Contacta al soporte de tu hosting si necesitas ayuda con la configuración de cPanel

---

**Nota:** Esta guía asume que tu hosting soporta aplicaciones Node.js. Si no es así, considera usar servicios como:
- DigitalOcean
- Heroku
- Vercel (para el frontend)
- Railway
- Render
