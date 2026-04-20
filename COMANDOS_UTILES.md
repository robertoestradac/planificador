# 🔧 Comandos Útiles para cPanel

Referencia rápida de comandos para administrar tu aplicación en el servidor.

---

## 🚀 ACTIVAR ENTORNO NODE.JS

Antes de ejecutar cualquier comando npm, activa el entorno virtual:

```bash
# Backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate

# Frontend
source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
```

---

## 📦 INSTALACIÓN Y ACTUALIZACIÓN

### Instalar dependencias

```bash
# Backend
cd /home/tuusuario/invitaciones-app/backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
npm install --production

# Frontend
cd /home/tuusuario/invitaciones-app/frontend
source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
npm install
```

### Actualizar dependencias

```bash
npm update
```

### Construir frontend

```bash
cd /home/tuusuario/invitaciones-app/frontend
source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
npm run build
```

---

## 🗄️ BASE DE DATOS

### Ejecutar migraciones

```bash
cd /home/tuusuario/invitaciones-app/backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
npm run migrate
```

### Ejecutar seed (datos de prueba)

```bash
npm run seed
```

### Migración fresh (CUIDADO: borra todos los datos)

```bash
npm run migrate:fresh
```

### Backup de base de datos

```bash
# Desde terminal SSH
mysqldump -u usuario -p nombre_base_datos > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
mysql -u usuario -p nombre_base_datos < backup_20240420_120000.sql
```

---

## 📊 LOGS Y MONITOREO

### Ver logs en tiempo real

```bash
# Backend
tail -f /home/tuusuario/logs/backend_error.log

# Frontend
tail -f /home/tuusuario/logs/frontend_error.log

# Logs de Node.js (si usas PM2)
pm2 logs invitaciones-backend
pm2 logs invitaciones-frontend
```

### Ver últimas 100 líneas de logs

```bash
tail -n 100 /home/tuusuario/logs/backend_error.log
```

### Buscar errores en logs

```bash
grep -i "error" /home/tuusuario/logs/backend_error.log
grep -i "failed" /home/tuusuario/logs/backend_error.log
```

---

## 🔄 REINICIAR APLICACIONES

### Desde cPanel

1. Ir a "Setup Node.js App"
2. Click en "Restart" junto a la aplicación

### Desde Terminal (si usas PM2)

```bash
# Reiniciar backend
pm2 restart invitaciones-backend

# Reiniciar frontend
pm2 restart invitaciones-frontend

# Reiniciar todas
pm2 restart all
```

---

## 🔍 VERIFICAR ESTADO

### Verificar que las aplicaciones estén corriendo

```bash
# Ver procesos Node.js
ps aux | grep node

# Si usas PM2
pm2 status
pm2 list
```

### Verificar puertos en uso

```bash
netstat -tuln | grep :4000  # Backend
netstat -tuln | grep :3000  # Frontend
```

### Probar conexión a la base de datos

```bash
mysql -u usuario -p -h localhost nombre_base_datos -e "SELECT 1;"
```

### Probar API

```bash
curl https://api.tudominio.com/api/v1/health
```

---

## 📁 GESTIÓN DE ARCHIVOS

### Ver espacio en disco

```bash
df -h
du -sh /home/tuusuario/invitaciones-app/*
```

### Limpiar archivos temporales

```bash
# Limpiar cache de npm
npm cache clean --force

# Limpiar logs antiguos
find /home/tuusuario/logs/ -name "*.log" -mtime +30 -delete

# Limpiar node_modules (si necesitas reinstalar)
rm -rf node_modules
npm install
```

### Comprimir carpeta para backup

```bash
tar -czf backup_app_$(date +%Y%m%d).tar.gz /home/tuusuario/invitaciones-app/
```

### Descomprimir backup

```bash
tar -xzf backup_app_20240420.tar.gz
```

---

## 🔐 PERMISOS

### Verificar permisos

```bash
ls -la /home/tuusuario/invitaciones-app/
```

### Corregir permisos (si es necesario)

```bash
# Archivos: 644
find /home/tuusuario/invitaciones-app/ -type f -exec chmod 644 {} \;

# Directorios: 755
find /home/tuusuario/invitaciones-app/ -type d -exec chmod 755 {} \;

# Scripts ejecutables: 755
chmod +x /home/tuusuario/invitaciones-app/scripts/*.sh
```

### Cambiar propietario (si es necesario)

```bash
chown -R tuusuario:tuusuario /home/tuusuario/invitaciones-app/
```

---

## 🔧 VARIABLES DE ENTORNO

### Ver variables de entorno

```bash
cat /home/tuusuario/invitaciones-app/backend/.env
```

### Editar variables de entorno

```bash
nano /home/tuusuario/invitaciones-app/backend/.env
# o
vi /home/tuusuario/invitaciones-app/backend/.env
```

### Verificar que se carguen correctamente

```bash
cd /home/tuusuario/invitaciones-app/backend
node -e "require('dotenv').config(); console.log(process.env.DB_HOST);"
```

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Aplicación no inicia

```bash
# 1. Verificar logs
tail -f /home/tuusuario/logs/backend_error.log

# 2. Verificar que el puerto no esté en uso
netstat -tuln | grep :4000

# 3. Matar proceso si es necesario
kill -9 $(lsof -t -i:4000)

# 4. Reiniciar desde cPanel
```

### Error de base de datos

```bash
# 1. Verificar conexión
mysql -u usuario -p -h localhost nombre_base_datos

# 2. Verificar credenciales en .env
cat /home/tuusuario/invitaciones-app/backend/.env | grep DB_

# 3. Verificar permisos del usuario en MySQL
mysql -u root -p -e "SHOW GRANTS FOR 'usuario'@'localhost';"
```

### Error "Cannot find module"

```bash
# Reinstalar dependencias
cd /home/tuusuario/invitaciones-app/backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
rm -rf node_modules package-lock.json
npm install --production
```

### Frontend no carga

```bash
# 1. Verificar que se haya construido
ls -la /home/tuusuario/invitaciones-app/frontend/.next/

# 2. Reconstruir si es necesario
cd /home/tuusuario/invitaciones-app/frontend
source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
npm run build

# 3. Verificar variables de entorno
cat /home/tuusuario/invitaciones-app/frontend/.env.production
```

---

## 📊 PM2 (Gestor de Procesos)

### Instalar PM2

```bash
npm install -g pm2
```

### Iniciar aplicaciones con PM2

```bash
# Backend
cd /home/tuusuario/invitaciones-app/backend
pm2 start src/server.js --name "invitaciones-backend" --env production

# Frontend
cd /home/tuusuario/invitaciones-app/frontend
pm2 start server.js --name "invitaciones-frontend" --env production
```

### Comandos PM2

```bash
# Ver estado
pm2 status
pm2 list

# Ver logs
pm2 logs
pm2 logs invitaciones-backend
pm2 logs invitaciones-frontend --lines 100

# Reiniciar
pm2 restart invitaciones-backend
pm2 restart all

# Detener
pm2 stop invitaciones-backend
pm2 stop all

# Eliminar
pm2 delete invitaciones-backend

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### Monitoreo con PM2

```bash
# Dashboard en tiempo real
pm2 monit

# Información detallada
pm2 show invitaciones-backend
```

---

## 🔄 ACTUALIZAR APLICACIÓN

### Proceso completo de actualización

```bash
# 1. Hacer backup
cd /home/tuusuario
tar -czf backup_antes_actualizar_$(date +%Y%m%d).tar.gz invitaciones-app/
mysqldump -u usuario -p nombre_base_datos > db_backup_$(date +%Y%m%d).sql

# 2. Subir nuevos archivos (via FTP/SSH)

# 3. Actualizar backend
cd /home/tuusuario/invitaciones-app/backend
source /home/tuusuario/nodevenv/invitaciones-app/backend/18/bin/activate
npm install --production
npm run migrate

# 4. Actualizar frontend
cd /home/tuusuario/invitaciones-app/frontend
source /home/tuusuario/nodevenv/invitaciones-app/frontend/18/bin/activate
npm install
npm run build

# 5. Reiniciar aplicaciones
pm2 restart all
# o desde cPanel: Setup Node.js App → Restart
```

---

## 📞 INFORMACIÓN DEL SISTEMA

### Ver versión de Node.js

```bash
node --version
npm --version
```

### Ver información del servidor

```bash
uname -a
cat /etc/os-release
```

### Ver uso de recursos

```bash
# CPU y memoria
top
htop  # si está disponible

# Memoria
free -h

# Disco
df -h
```

---

## 💡 TIPS

1. **Siempre haz backup antes de cambios importantes**
2. **Usa PM2 para mantener las apps corriendo**
3. **Revisa los logs regularmente**
4. **Mantén las dependencias actualizadas**
5. **Documenta cualquier cambio que hagas**

---

## 🔗 Enlaces Útiles

- Documentación de Node.js: https://nodejs.org/docs/
- Documentación de PM2: https://pm2.keymetrics.io/docs/
- Documentación de Next.js: https://nextjs.org/docs
- Documentación de Express: https://expressjs.com/

---

**Última actualización:** Abril 2026
