# ✅ Checklist de Despliegue en cPanel

Imprime esta lista y marca cada paso a medida que lo completes.

---

## 📋 ANTES DE EMPEZAR

- [ ] Tengo acceso a cPanel
- [ ] Mi hosting soporta Node.js 18+
- [ ] Tengo acceso a MySQL/MariaDB
- [ ] Tengo un dominio configurado
- [ ] He leído DEPLOY_CPANEL.md

---

## 🗄️ PARTE 1: BASE DE DATOS

- [ ] Crear base de datos MySQL en cPanel
  - Nombre: `_________________`
- [ ] Crear usuario de base de datos
  - Usuario: `_________________`
  - Contraseña: `_________________`
- [ ] Asignar usuario a la base de datos con ALL PRIVILEGES
- [ ] Anotar credenciales completas (con prefijo de cPanel)

---

## 📦 PARTE 2: PREPARAR ARCHIVOS

- [ ] Ejecutar script de preparación:
  - [ ] Linux/Mac: `bash scripts/prepare-deploy.sh`
  - [ ] Windows: `scripts\prepare-deploy.bat`
- [ ] Verificar que se crearon los archivos ZIP
- [ ] Tener listos para subir:
  - [ ] backend-deploy.zip
  - [ ] frontend-deploy.zip

---

## 📤 PARTE 3: SUBIR AL SERVIDOR

- [ ] Conectar a cPanel File Manager / FTP / SSH
- [ ] Crear estructura de carpetas:
  ```
  /home/tuusuario/invitaciones-app/
  ```
- [ ] Subir backend-deploy.zip
- [ ] Subir frontend-deploy.zip
- [ ] Extraer backend-deploy.zip en carpeta backend/
- [ ] Extraer frontend-deploy.zip en carpeta frontend/
- [ ] Subir scripts/install-server.sh

---

## ⚙️ PARTE 4: CONFIGURAR BACKEND

- [ ] Acceder a Terminal en cPanel
- [ ] Navegar a la carpeta del backend
- [ ] Copiar .env.production.example a .env
- [ ] Editar backend/.env con credenciales reales:
  - [ ] DB_HOST
  - [ ] DB_USER (con prefijo de cPanel)
  - [ ] DB_PASSWORD
  - [ ] DB_NAME (con prefijo de cPanel)
  - [ ] JWT_ACCESS_SECRET (generar clave única)
  - [ ] JWT_REFRESH_SECRET (generar clave única)
  - [ ] CORS_ORIGIN (tu dominio)
  - [ ] APP_DOMAIN (tu dominio)
  - [ ] APP_PROTOCOL (https)
- [ ] Ir a "Setup Node.js App" en cPanel
- [ ] Crear aplicación Node.js para backend:
  - [ ] Node.js version: 18.x
  - [ ] Application mode: Production
  - [ ] Application root: invitaciones-app/backend
  - [ ] Application URL: api.tudominio.com
  - [ ] Application startup file: src/server.js
- [ ] Copiar comando de activación del entorno virtual
- [ ] En Terminal, activar entorno y ejecutar:
  - [ ] `npm install --production`
  - [ ] `npm run migrate`
  - [ ] `npm run seed` (opcional)
- [ ] Iniciar aplicación backend en "Setup Node.js App"
- [ ] Verificar que esté corriendo (status: Running)

---

## 🎨 PARTE 5: CONFIGURAR FRONTEND

- [ ] Copiar .env.production.example a .env.production
- [ ] Editar frontend/.env.production:
  - [ ] NEXT_PUBLIC_API_URL (URL de tu API)
- [ ] Verificar que existe frontend/server.js
- [ ] Ir a "Setup Node.js App" en cPanel
- [ ] Crear aplicación Node.js para frontend:
  - [ ] Node.js version: 18.x
  - [ ] Application mode: Production
  - [ ] Application root: invitaciones-app/frontend
  - [ ] Application URL: tudominio.com
  - [ ] Application startup file: server.js
- [ ] En Terminal, activar entorno y ejecutar:
  - [ ] `npm install`
  - [ ] `npm run build`
- [ ] Iniciar aplicación frontend en "Setup Node.js App"
- [ ] Verificar que esté corriendo (status: Running)

---

## 🌐 PARTE 6: DOMINIOS Y SSL

- [ ] Configurar subdominio para API (opcional):
  - [ ] Crear subdominio: api.tudominio.com
  - [ ] Document root: invitaciones-app/backend/public
- [ ] Instalar SSL/TLS:
  - [ ] Ir a "SSL/TLS Status"
  - [ ] Seleccionar dominios
  - [ ] Ejecutar AutoSSL
  - [ ] Verificar certificados instalados
- [ ] Configurar archivos .htaccess:
  - [ ] Crear/editar .htaccess para frontend
  - [ ] Crear/editar .htaccess para backend/API
  - [ ] Verificar redirección HTTPS

---

## 🧪 PARTE 7: PRUEBAS

- [ ] Probar API:
  - [ ] Abrir: https://api.tudominio.com/api/v1/health
  - [ ] Debe responder: `{"status":"ok"}`
- [ ] Probar Frontend:
  - [ ] Abrir: https://tudominio.com
  - [ ] Debe cargar la página de inicio
- [ ] Probar login:
  - [ ] Ir a /login
  - [ ] Intentar iniciar sesión con usuario de prueba
  - [ ] Verificar que funcione el dashboard
- [ ] Probar funcionalidades principales:
  - [ ] Crear evento
  - [ ] Agregar invitados
  - [ ] Enviar invitación de prueba
  - [ ] Ver página pública de invitación

---

## 🔧 PARTE 8: CONFIGURACIÓN FINAL

- [ ] Configurar backups automáticos:
  - [ ] Ir a "Backup Wizard"
  - [ ] Configurar backup diario
  - [ ] Incluir base de datos
  - [ ] Incluir archivos de la aplicación
- [ ] Configurar monitoreo (opcional):
  - [ ] Instalar PM2 para mantener apps corriendo
  - [ ] Configurar alertas de caída
- [ ] Revisar logs:
  - [ ] Backend: sin errores críticos
  - [ ] Frontend: sin errores críticos
- [ ] Documentar credenciales:
  - [ ] Usuario admin creado
  - [ ] Credenciales guardadas en lugar seguro

---

## 📊 PARTE 9: POST-DESPLIEGUE

- [ ] Cambiar contraseña del usuario admin de prueba
- [ ] Crear usuarios reales
- [ ] Configurar email (si aplica)
- [ ] Configurar pagos (si aplica)
- [ ] Probar en diferentes dispositivos:
  - [ ] Desktop
  - [ ] Tablet
  - [ ] Móvil
- [ ] Probar en diferentes navegadores:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

---

## 🎉 COMPLETADO

- [ ] Aplicación funcionando correctamente
- [ ] SSL/HTTPS activo
- [ ] Backups configurados
- [ ] Documentación actualizada
- [ ] Credenciales guardadas de forma segura

---

## 📝 NOTAS

Espacio para anotar información importante:

**Dominio principal:**
```
_________________________________________________
```

**Dominio API:**
```
_________________________________________________
```

**Usuario cPanel:**
```
_________________________________________________
```

**Base de datos:**
```
Nombre: _________________________________________
Usuario: ________________________________________
```

**Rutas en servidor:**
```
Backend: ________________________________________
Frontend: _______________________________________
```

**Puertos:**
```
Backend: ________________________________________
Frontend: _______________________________________
```

**Problemas encontrados y soluciones:**
```
_________________________________________________
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## 🆘 EN CASO DE PROBLEMAS

1. [ ] Revisar logs en /home/tuusuario/logs/
2. [ ] Verificar que las apps estén corriendo en "Setup Node.js App"
3. [ ] Verificar credenciales en archivos .env
4. [ ] Revisar permisos de archivos y carpetas
5. [ ] Contactar soporte del hosting si es necesario

---

**Fecha de despliegue:** ___________________

**Desplegado por:** ___________________

**Versión:** ___________________
