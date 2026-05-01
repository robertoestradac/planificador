# 🎉 Plataforma SaaS de Invitaciones

Sistema multi-tenant para gestión de eventos e invitaciones digitales.

## 🏗️ Arquitectura

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Node.js + Express
- **Base de datos**: MySQL 8.0
- **Proxy reverso**: Traefik v3.5 con SSL automático
- **Contenedores**: Docker + Docker Compose

## 🚀 Inicio rápido

### Desarrollo local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Producción con Docker

#### Primera instalación (con migrate fresh)

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/invitaciones-saas.git
cd invitaciones-saas

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores

# 3. Desplegar con migrate fresh (borra datos existentes)
chmod +x deploy.sh
./deploy.sh fresh
```

#### Actualizaciones posteriores

```bash
# Actualizar desde Git
./deploy.sh update

# O despliegue normal (sin actualizar código)
./deploy.sh normal
```

#### Comandos del script de despliegue

```bash
./deploy.sh fresh    # Primera instalación (BORRA DATOS)
./deploy.sh normal   # Despliegue normal (mantiene datos)
./deploy.sh update   # Actualizar desde Git
./deploy.sh status   # Ver estado de servicios
./deploy.sh backup   # Crear backup de BD
./deploy.sh logs     # Ver logs en tiempo real
```

## 🌐 Dominios

- **Frontend**: https://planificador.app
- **API**: https://api.planificador.app

## 📁 Estructura del proyecto

```
.
├── backend/              # API REST con Express
│   ├── src/
│   │   ├── modules/     # Módulos de negocio
│   │   ├── middlewares/ # Autenticación, autorización, etc.
│   │   ├── database/    # Migraciones y seeds
│   │   └── config/      # Configuración
│   └── uploads/         # Archivos subidos (persistidos en volumen)
│
├── frontend/            # Aplicación Next.js
│   ├── src/
│   │   ├── app/        # App Router
│   │   ├── components/ # Componentes React
│   │   └── lib/        # Utilidades y API client
│   └── public/         # Archivos estáticos
│
├── docker-compose.yml  # Orquestación de servicios
├── deploy.sh          # Script de despliegue
└── GUIA-GITHUB-DEPLOY.md  # Guía detallada
```

## 🔧 Comandos útiles

### Docker

```bash
# Reconstruir servicios
docker-compose build

# Reiniciar un servicio
docker-compose restart backend

# Ver logs de un servicio
docker-compose logs -f backend

# Ejecutar comando en contenedor
docker exec -it backend sh

# Limpiar todo
docker-compose down -v
```

### Base de datos

```bash
# Ejecutar migraciones normales
docker exec backend node src/database/migrate.js

# Ejecutar migrate fresh (BORRA TODO)
docker exec backend node src/database/migrate_fresh.js

# Ejecutar seeds
docker exec backend node src/database/seed.js

# Acceder a MySQL
docker exec -it mysql mysql -u root -p

# Backup
docker exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup.sql

# Restaurar
docker exec -i mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < backup.sql
```

## 📦 Volúmenes persistentes

- `mysql_data`: Base de datos MySQL
- `backend_uploads`: Archivos subidos (imágenes, etc.)
- `traefik_letsencrypt`: Certificados SSL

## 🔐 Variables de entorno

Ver `.env.example` para la lista completa de variables requeridas.

### Principales:

- `DB_ROOT_PASSWORD`: Contraseña root de MySQL
- `JWT_ACCESS_SECRET`: Secret para tokens de acceso
- `JWT_REFRESH_SECRET`: Secret para tokens de refresh
- `ACME_EMAIL`: Email para certificados SSL
- `MIGRATION_MODE`: `fresh` (borra todo) o `normal` (mantiene datos)
- `SEED_ON_BOOT`: `true` para ejecutar seeds en el inicio

## 🔄 Migraciones

### Modo Fresh (⚠️ BORRA TODOS LOS DATOS)

Usa esto cuando:
- Es la primera instalación
- Tienes datos duplicados o corruptos
- Quieres resetear completamente la base de datos

```bash
# Opción 1: Usar el script
./deploy.sh fresh

# Opción 2: Manual
# En .env: MIGRATION_MODE=fresh
docker-compose restart backend
```

### Modo Normal (recomendado para producción)

Usa esto cuando:
- Actualizas la aplicación
- Quieres mantener los datos existentes
- Despliegues regulares

```bash
# Opción 1: Usar el script
./deploy.sh normal

# Opción 2: Manual
# En .env: MIGRATION_MODE=normal
docker-compose restart backend
```

## 🛠️ Desarrollo

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Ejecutar migraciones
node src/database/migrate.js

# Ejecutar seeds
node src/database/seed.js

# Migrate fresh (desarrollo)
node src/database/migrate_fresh.js
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start
```

## 📚 Documentación adicional

- [Guía completa de GitHub y Deploy](GUIA-GITHUB-DEPLOY.md)
- [Documentación de la API](backend/README.md) (si existe)
- [Documentación del Frontend](frontend/README.md) (si existe)

## 🐛 Troubleshooting

### Datos duplicados en la base de datos

```bash
# Solución: Usar migrate fresh
./deploy.sh fresh
```

### Imágenes no se muestran (404)

```bash
# Verificar volumen
docker exec backend ls -lh /app/uploads

# Ajustar permisos
docker exec backend chmod -R 755 /app/uploads
```

### Backend no inicia

```bash
# Ver logs
docker-compose logs backend

# Verificar MySQL
docker-compose logs mysql | grep "ready for connections"

# Reiniciar
docker-compose restart
```

## 📝 Licencia

Propietario - Todos los derechos reservados
