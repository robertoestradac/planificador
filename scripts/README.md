# 📜 Scripts de Despliegue

Esta carpeta contiene scripts útiles para facilitar el despliegue de la aplicación en cPanel.

## 📁 Archivos

### 1. `prepare-deploy.sh` (Linux/Mac)
Script para preparar los archivos localmente antes de subirlos al servidor.

**Uso:**
```bash
bash scripts/prepare-deploy.sh
```

**Qué hace:**
- Copia los archivos del backend y frontend (sin node_modules)
- Crea archivos .env.production.example
- Crea server.js para el frontend
- Crea archivos .htaccess
- Comprime todo en archivos ZIP listos para subir

**Resultado:**
- `deploy/backend-deploy.zip`
- `deploy/frontend-deploy.zip`

---

### 2. `prepare-deploy.bat` (Windows)
Versión para Windows del script anterior.

**Uso:**
```cmd
scripts\prepare-deploy.bat
```

**Nota:** Después de ejecutar, debes comprimir manualmente las carpetas `deploy\backend` y `deploy\frontend`.

---

### 3. `install-server.sh`
Script para ejecutar EN EL SERVIDOR después de subir los archivos.

**Uso:**
```bash
# Después de subir los archivos al servidor
cd /home/tuusuario/invitaciones-app
bash scripts/install-server.sh
```

**Qué hace:**
- Crea archivos .env desde los ejemplos
- Instala dependencias de Node.js
- Ejecuta migraciones de base de datos (opcional)
- Construye el frontend (opcional)
- Muestra instrucciones finales

---

### 4. `exclude.txt`
Lista de archivos y carpetas a excluir al copiar (usado por prepare-deploy.bat).

---

## 🚀 Flujo de Trabajo Recomendado

### Paso 1: Preparar localmente (en tu computadora)

**Linux/Mac:**
```bash
bash scripts/prepare-deploy.sh
```

**Windows:**
```cmd
scripts\prepare-deploy.bat
```

### Paso 2: Subir al servidor

Sube los archivos ZIP generados a tu servidor cPanel usando:
- File Manager de cPanel
- FTP/SFTP (FileZilla, WinSCP)
- SSH/SCP

### Paso 3: Extraer en el servidor

En cPanel File Manager o via SSH:
```bash
cd /home/tuusuario/invitaciones-app
unzip backend-deploy.zip -d backend/
unzip frontend-deploy.zip -d frontend/
```

### Paso 4: Ejecutar instalación en el servidor

```bash
cd /home/tuusuario/invitaciones-app
bash scripts/install-server.sh
```

### Paso 5: Configurar en cPanel

1. Edita los archivos .env con tus credenciales reales
2. Configura las aplicaciones Node.js en "Setup Node.js App"
3. Configura SSL/HTTPS
4. Inicia las aplicaciones

---

## 📖 Documentación Completa

Para instrucciones detalladas paso a paso, consulta:
- **DEPLOY_CPANEL.md** - Guía completa de despliegue

---

## 🆘 Solución de Problemas

### Error: "Permission denied"
```bash
chmod +x scripts/*.sh
```

### Error: "npm: command not found"
Asegúrate de activar el entorno virtual de Node.js en cPanel:
```bash
source /home/tuusuario/nodevenv/ruta/18/bin/activate
```

### Error: "Database connection failed"
Verifica las credenciales en `backend/.env`:
- DB_HOST
- DB_USER (incluye el prefijo de cPanel)
- DB_PASSWORD
- DB_NAME (incluye el prefijo de cPanel)

---

## 💡 Consejos

1. **Siempre haz backup** antes de desplegar
2. **Prueba en local** antes de subir a producción
3. **Usa variables de entorno** para configuración sensible
4. **Revisa los logs** si algo falla
5. **Mantén las dependencias actualizadas** pero con cuidado

---

## 🔐 Seguridad

**IMPORTANTE:** Nunca subas archivos .env con credenciales reales al repositorio Git.

Los scripts crean archivos `.env.example` que debes:
1. Copiar a `.env`
2. Editar con tus credenciales reales
3. Mantener privados (están en .gitignore)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa DEPLOY_CPANEL.md
2. Verifica los logs del servidor
3. Contacta al soporte de tu hosting
