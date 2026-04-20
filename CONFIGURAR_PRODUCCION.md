# ⚙️ Guía Rápida: Configurar Archivos de Producción

Esta guía te ayudará a configurar tus archivos `.env` de producción de forma rápida y segura.

---

## 🎯 Opción 1: Configuración Automática (Recomendado)

### Paso 1: Ejecutar el script configurador

```bash
node scripts/configure-production.js
```

El script te pedirá:
1. Tu dominio (ej: midominio.com)
2. Host de base de datos (generalmente: localhost)
3. Usuario de base de datos (con prefijo de cPanel)
4. Contraseña de base de datos
5. Nombre de base de datos (con prefijo de cPanel)
6. Si quieres usar subdominio para el API

### Paso 2: Verificar los archivos generados

El script creará:
- `backend/.env.production`
- `frontend/.env.production`

### Paso 3: Subir al servidor

Sube estos archivos a sus respectivas carpetas en el servidor y renómbralos a `.env`

---

## 🔧 Opción 2: Configuración Manual

### Paso 1: Generar claves JWT seguras

```bash
node scripts/generate-jwt-secrets.js
```

Copia las claves generadas.

### Paso 2: Editar backend/.env.production

Abre `backend/.env.production` y reemplaza:

```env
# Base de datos (con prefijo de cPanel)
DB_USER=tuusuario_invitaciones_user
DB_PASSWORD=tu_contraseña_segura
DB_NAME=tuusuario_invitaciones_saas

# JWT (pega las claves generadas)
JWT_ACCESS_SECRET=clave_generada_access
JWT_REFRESH_SECRET=clave_generada_refresh

# Dominio
CORS_ORIGIN=https://tudominio.com,https://www.tudominio.com
APP_DOMAIN=tudominio.com
```

### Paso 3: Editar frontend/.env.production

Abre `frontend/.env.production` y reemplaza:

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

---

## 📋 Información que Necesitas Tener Lista

Antes de configurar, ten a mano:

### 1. Información de cPanel
- [ ] Usuario de cPanel: `_________________`
- [ ] Dominio principal: `_________________`

### 2. Base de Datos MySQL
- [ ] Nombre de la BD (con prefijo): `_________________`
- [ ] Usuario de la BD (con prefijo): `_________________`
- [ ] Contraseña de la BD: `_________________`
- [ ] Host: `localhost` (generalmente)

### 3. Configuración de Dominio
- [ ] Dominio principal: `_________________`
- [ ] Subdominio para API: `api.tudominio.com` (recomendado)
- [ ] O usar puerto: `tudominio.com:4000`

---

## 🔍 Ejemplo Completo

### Ejemplo de backend/.env.production

```env
# Server
NODE_ENV=production
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=miusuario_invitaciones_user
DB_PASSWORD=MiContraseñaSegura123!
DB_NAME=miusuario_invitaciones_saas

# JWT
JWT_ACCESS_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS
CORS_ORIGIN=https://midominio.com,https://www.midominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=10

# App
APP_DOMAIN=midominio.com
APP_PROTOCOL=https
```

### Ejemplo de frontend/.env.production

```env
# API URL
NEXT_PUBLIC_API_URL=https://api.midominio.com

# Environment
NODE_ENV=production
PORT=3000
```

---

## ⚠️ Puntos Importantes

### Prefijos de cPanel

En cPanel, los nombres de base de datos y usuarios llevan un prefijo:

```
Si tu usuario de cPanel es: miusuario
Y creaste una BD llamada: invitaciones_saas
El nombre completo será: miusuario_invitaciones_saas
```

### Claves JWT

- ✅ Usa claves diferentes para desarrollo y producción
- ✅ Genera claves aleatorias y largas (mínimo 32 caracteres)
- ✅ Guárdalas en un lugar seguro
- ❌ NO uses las mismas claves de desarrollo
- ❌ NO subas las claves a Git
- ❌ NO compartas las claves

### URL del API

Tienes 3 opciones:

**Opción A - Subdominio (RECOMENDADO):**
```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```
- Más profesional
- Mejor para CORS
- Requiere configurar subdominio en cPanel

**Opción B - Puerto:**
```env
NEXT_PUBLIC_API_URL=https://tudominio.com:4000
```
- Más simple
- Requiere que el puerto 4000 esté abierto

**Opción C - Proxy Reverso:**
```env
NEXT_PUBLIC_API_URL=https://tudominio.com
```
- Requiere configurar .htaccess
- El frontend y backend comparten dominio

---

## ✅ Verificación

Después de configurar, verifica:

### 1. Sintaxis correcta
```bash
# Verificar que no haya errores de sintaxis
cat backend/.env.production
cat frontend/.env.production
```

### 2. Variables requeridas

Backend debe tener:
- [ ] NODE_ENV=production
- [ ] PORT=4000
- [ ] DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- [ ] JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
- [ ] CORS_ORIGIN
- [ ] APP_DOMAIN, APP_PROTOCOL

Frontend debe tener:
- [ ] NEXT_PUBLIC_API_URL
- [ ] NODE_ENV=production

### 3. Valores correctos

- [ ] No hay valores de ejemplo (TU_DOMINIO, TU_USUARIO, etc.)
- [ ] Las URLs usan https:// (no http://)
- [ ] Los nombres de BD incluyen el prefijo de cPanel
- [ ] Las claves JWT son únicas y seguras

---

## 🚀 Después de Configurar

1. **Sube los archivos al servidor:**
   ```bash
   # Via SCP
   scp backend/.env.production usuario@servidor:/ruta/backend/.env
   scp frontend/.env.production usuario@servidor:/ruta/frontend/.env
   ```

2. **O usa File Manager de cPanel:**
   - Sube los archivos
   - Renombra `.env.production` a `.env`

3. **Ejecuta las migraciones:**
   ```bash
   cd /ruta/backend
   npm run migrate
   ```

4. **Construye el frontend:**
   ```bash
   cd /ruta/frontend
   npm run build
   ```

5. **Reinicia las aplicaciones en cPanel**

---

## 🆘 Solución de Problemas

### Error: "Cannot connect to database"

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica el nombre de usuario (debe incluir prefijo de cPanel)
2. Verifica el nombre de la BD (debe incluir prefijo de cPanel)
3. Verifica la contraseña
4. Verifica que el usuario tenga permisos en la BD

### Error: "CORS policy"

**Causa:** CORS_ORIGIN no incluye tu dominio

**Solución:**
1. Verifica que CORS_ORIGIN tenga tu dominio completo
2. Usa https:// (no http://)
3. Incluye www y sin www si es necesario
4. Reinicia el backend después de cambiar

### Error: "API not found" o 404

**Causa:** NEXT_PUBLIC_API_URL incorrecta

**Solución:**
1. Verifica que la URL del API sea correcta
2. Prueba acceder a: https://tu-api-url/api/v1/health
3. Debe responder: `{"status":"ok"}`
4. Reconstruye el frontend después de cambiar

---

## 📞 Ayuda Adicional

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica que las aplicaciones estén corriendo
3. Consulta DEPLOY_CPANEL.md para más detalles
4. Usa COMANDOS_UTILES.md para comandos de diagnóstico

---

**Última actualización:** Abril 2026
