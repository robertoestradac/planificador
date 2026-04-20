# 💍 Invitaciones SaaS - Plataforma de Invitaciones Digitales

Sistema multi-tenant SaaS para crear, gestionar y enviar invitaciones digitales para eventos.

## 🚀 Características

- ✨ Creación de invitaciones digitales personalizadas
- 👥 Gestión de invitados y confirmaciones (RSVP)
- 📊 Dashboard con estadísticas en tiempo real
- 📱 Diseño responsive (móvil, tablet, desktop)
- 🎨 Plantillas personalizables
- 📧 Envío de invitaciones por WhatsApp y email
- 🔐 Sistema de autenticación y autorización
- 💳 Integración de pagos y planes de suscripción
- 📈 Analytics y reportes
- 🌐 Multi-tenant (múltiples organizadores)

## 📁 Estructura del Proyecto

```
.
├── backend/          # API REST con Node.js + Express
├── frontend/         # Aplicación web con Next.js + React
├── scripts/          # Scripts de despliegue y utilidades
├── DEPLOY_CPANEL.md  # Guía completa de despliegue en cPanel
├── DEPLOY_CHECKLIST.md  # Checklist para despliegue
└── COMANDOS_UTILES.md   # Comandos útiles para administración
```

## 🛠️ Tecnologías

### Backend
- Node.js + Express
- MySQL/MariaDB
- JWT para autenticación
- Multer para carga de archivos
- Winston para logging

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Axios para peticiones HTTP
- Zustand para estado global
- Recharts para gráficos

## 🚀 Inicio Rápido (Desarrollo Local)

### Requisitos Previos

- Node.js 18+ 
- MySQL/MariaDB
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd planificador
```

### 2. Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus credenciales de base de datos
npm run migrate
npm run seed
npm run dev
```

El backend estará corriendo en `http://localhost:4000`

### 3. Configurar Frontend

```bash
cd frontend
npm install
# Crea .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm run dev
```

El frontend estará corriendo en `http://localhost:3000`

## 📦 Despliegue en Producción

### Despliegue en cPanel

Para desplegar en un servidor con cPanel, sigue estos pasos:

1. **Lee la guía completa:** [DEPLOY_CPANEL.md](DEPLOY_CPANEL.md)
2. **Usa el checklist:** [DEPLOY_CHECKLIST.md](DEPLOY_CHECKLIST.md)
3. **Prepara los archivos:**
   ```bash
   # Linux/Mac
   bash scripts/prepare-deploy.sh
   
   # Windows
   scripts\prepare-deploy.bat
   ```
4. **Sube los archivos** al servidor
5. **Ejecuta la instalación** en el servidor:
   ```bash
   bash scripts/install-server.sh
   ```
6. **Configura en cPanel** siguiendo la guía

### Comandos Útiles

Para administrar tu aplicación en el servidor, consulta: [COMANDOS_UTILES.md](COMANDOS_UTILES.md)

## 📚 Documentación

- [Guía de Despliegue en cPanel](DEPLOY_CPANEL.md) - Paso a paso completo
- [Checklist de Despliegue](DEPLOY_CHECKLIST.md) - Lista verificable
- [Comandos Útiles](COMANDOS_UTILES.md) - Referencia rápida de comandos
- [Scripts de Despliegue](scripts/README.md) - Documentación de scripts

## 🔧 Scripts Disponibles

### Backend

```bash
npm run dev          # Modo desarrollo con nodemon
npm start            # Modo producción
npm run migrate      # Ejecutar migraciones
npm run migrate:fresh # Migración fresh (borra datos)
npm run seed         # Insertar datos de prueba
```

### Frontend

```bash
npm run dev          # Modo desarrollo
npm run build        # Construir para producción
npm start            # Servidor de producción
npm run lint         # Verificar código
```

## 🗄️ Base de Datos

El sistema usa MySQL/MariaDB con las siguientes tablas principales:

- `tenants` - Organizaciones/clientes
- `users` - Usuarios del sistema
- `events` - Eventos creados
- `invitations` - Invitaciones generadas
- `guests` - Invitados
- `rsvps` - Confirmaciones de asistencia
- `plans` - Planes de suscripción
- `subscriptions` - Suscripciones activas

## 🔐 Seguridad

- Autenticación con JWT (Access + Refresh tokens)
- Passwords hasheados con bcrypt
- Rate limiting en endpoints sensibles
- Validación de datos con Joi
- CORS configurado
- Helmet para headers de seguridad
- Variables de entorno para datos sensibles

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y propietario.

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación en este repositorio
- Consulta los logs del servidor
- Contacta al equipo de desarrollo

---

**Última actualización:** Abril 2026