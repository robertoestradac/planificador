# 🚀 Pasos Rápidos: GitHub + Deploy con Migrate Fresh

## 📤 1. Subir a GitHub

```bash
# Verificar estado
git status

# Agregar todos los archivos
git add .

# Commit
git commit -m "feat: Sistema completo con migrate fresh y scripts de deploy"

# Si es un repositorio nuevo:
git remote add origin https://github.com/TU_USUARIO/invitaciones-saas.git
git branch -M main

# Push
git push -u origin main
```

## 🖥️ 2. Desplegar en servidor (Primera vez)

```bash
# 1. Conectar al servidor
ssh usuario@tu-servidor.com

# 2. Clonar repositorio
cd /opt
git clone https://github.com/TU_USUARIO/invitaciones-saas.git
cd invitaciones-saas

# 3. Configurar variables de entorno
cp .env.example .env
nano .env

# Configurar estos valores importantes:
# MIGRATION_MODE=fresh
# SEED_ON_BOOT=true
# DB_ROOT_PASSWORD=tu_password_seguro
# JWT_ACCESS_SECRET=tu_secret_seguro
# JWT_REFRESH_SECRET=tu_secret_seguro
# ACME_EMAIL=tu-email@example.com

# 4. Hacer el script ejecutable
chmod +x deploy.sh

# 5. Desplegar con migrate fresh
./deploy.sh fresh

# 6. Ver logs para verificar
docker-compose logs -f backend
# Espera a ver: "🚀 Starting server..."
# Presiona Ctrl+C para salir

# 7. IMPORTANTE: Cambiar a modo normal para futuros deploys
nano .env
# Cambiar a:
# MIGRATION_MODE=normal
# SEED_ON_BOOT=false
```

## 🔄 3. Actualizaciones futuras

```bash
# En el servidor
cd /opt/invitaciones-saas

# Actualizar desde GitHub
./deploy.sh update

# O si solo quieres redesplegar sin actualizar código
./deploy.sh normal
```

## ✅ 4. Verificar que todo funciona

```bash
# Ver estado de servicios
./deploy.sh status

# Ver logs en tiempo real
./deploy.sh logs

# Probar en el navegador
# Frontend: https://planificador.app
# API: https://api.planificador.app/health
```

## 🆘 Si tienes datos duplicados

```bash
# Hacer backup primero
./deploy.sh backup

# Ejecutar migrate fresh (BORRA TODO)
./deploy.sh fresh

# Volver a modo normal
nano .env
# MIGRATION_MODE=normal
# SEED_ON_BOOT=false
```

## 📝 Comandos útiles

```bash
# Ver estado
./deploy.sh status

# Crear backup
./deploy.sh backup

# Ver logs
./deploy.sh logs

# Reiniciar servicios
docker-compose restart

# Ver todos los contenedores
docker-compose ps

# Acceder a MySQL
docker exec -it mysql mysql -u root -p
```

---

**¡Listo!** Tu aplicación está en GitHub y desplegada con migrate fresh. 🎉
