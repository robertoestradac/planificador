# 🚀 Guía: Subir a GitHub y Desplegar con Docker

## 📋 Tabla de contenidos
1. [Preparar el proyecto](#1-preparar-el-proyecto)
2. [Subir a GitHub](#2-subir-a-github)
3. [Desplegar en servidor](#3-desplegar-en-servidor)
4. [Migración Fresh vs Normal](#4-migración-fresh-vs-normal)

---

## 1. Preparar el proyecto

### Verificar archivos sensibles
Asegúrate de que los archivos con información sensible NO se suban a GitHub:

```bash
# Verificar que estos archivos están en .gitignore
cat .gitignore | grep -E "\.env$|\.env\.local|\.env\.production"
```

### Limpiar archivos temporales
```bash
# Ya está hecho, pero por si acaso:
git status
```

---

## 2. Subir a GitHub

### Opción A: Nuevo repositorio

```bash
# 1. Inicializar git (si no está inicializado)
git init

# 2. Agregar todos los archivos
git add .

# 3. Hacer el primer commit
git commit -m "Initial commit: Plataforma SaaS de Invitaciones"

# 4. Crear repositorio en GitHub
# Ve a https://github.com/new y crea un repositorio llamado "invitaciones-saas"

# 5. Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/invitaciones-saas.git

# 6. Subir el código
git branch -M main
git push -u origin main
```

### Opción B: Repositorio existente

```bash
# 1. Verificar el estado
git status

# 2. Agregar cambios
git add .

# 3. Commit
git commit -m "Fix: Solución de imágenes 404 y limpieza del proyecto"

# 4. Push
git push origin main
```

---

## 3. Desplegar en servidor

### 3.1. Conectar al servidor

```bash
# SSH al servidor
ssh usuario@tu-servidor.com
```

### 3.2. Primera vez (instalación inicial)

```bash
# 1. Instalar Docker y Docker Compose (si no están instalados)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar

# 2. Clonar el repositorio
cd /opt  # o donde quieras instalar
git clone https://github.com/TU_USUARIO/invitaciones-saas.git
cd invitaciones-saas

# 3. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores reales

# IMPORTANTE: Configurar para primera instalación
# En el archivo .env:
MIGRATION_MODE=fresh
SEED_ON_BOOT=true

# 4. Iniciar servicios
docker-compose up -d

# 5. Ver logs para verificar
docker-compose logs -f backend

# 6. Esperar a que todo esté listo (verás "🚀 Starting server...")
# Presiona Ctrl+C para salir de los logs

# 7. IMPORTANTE: Cambiar MIGRATION_MODE después del primer despliegue
nano .env
# Cambiar a:
MIGRATION_MODE=normal
SEED_ON_BOOT=false
```

### 3.3. Actualizaciones posteriores

```bash
# 1. Ir al directorio del proyecto
cd /opt/invitaciones-saas

# 2. Hacer pull de los cambios
git pull origin main

# 3. Reconstruir y reiniciar servicios
docker-compose build
docker-compose up -d

# 4. Ver logs
docker-compose logs -f backend
```

---

## 4. Migración Fresh vs Normal

### 🔴 MIGRATION_MODE=fresh

**¿Cuándo usar?**
- Primera instalación
- Cuando quieres resetear TODA la base de datos
- Cuando tienes datos duplicados o corruptos

**⚠️ ADVERTENCIA:** Esto **BORRARÁ TODOS LOS DATOS** de la base de datos.

**Qué hace:**
1. Elimina la base de datos completa
2. Crea la base de datos desde cero
3. Ejecuta todas las migraciones
4. Ejecuta los seeds (datos iniciales)

**Cómo usar:**
```bash
# En el archivo .env
MIGRATION_MODE=fresh
SEED_ON_BOOT=true

# Reiniciar el backend
docker-compose restart backend
```

### 🟢 MIGRATION_MODE=normal (recomendado)

**¿Cuándo usar?**
- Actualizaciones normales
- Cuando quieres mantener los datos existentes
- Despliegues de producción regulares

**Qué hace:**
1. Ejecuta solo las migraciones nuevas
2. Mantiene todos los datos existentes
3. Agrega nuevas tablas/columnas si es necesario

**Cómo usar:**
```bash
# En el archivo .env
MIGRATION_MODE=normal
SEED_ON_BOOT=false

# Reiniciar el backend
docker-compose restart backend
```

---

## 5. Solución al problema de datos duplicados

Si tienes datos duplicados en la base de datos:

### Opción 1: Migración Fresh (BORRA TODO)

```bash
# 1. Hacer backup primero (IMPORTANTE)
docker exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Cambiar a modo fresh
nano .env
# Cambiar a:
MIGRATION_MODE=fresh
SEED_ON_BOOT=true

# 3. Reiniciar backend
docker-compose restart backend

# 4. Verificar logs
docker-compose logs -f backend

# 5. Volver a modo normal
nano .env
# Cambiar a:
MIGRATION_MODE=normal
SEED_ON_BOOT=false
```

### Opción 2: Limpiar datos duplicados manualmente

```bash
# 1. Conectar a MySQL
docker exec -it mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME}

# 2. Ver datos duplicados (ejemplo con roles)
SELECT name, COUNT(*) as count FROM roles GROUP BY name HAVING count > 1;

# 3. Eliminar duplicados (ejemplo)
DELETE r1 FROM roles r1
INNER JOIN roles r2 
WHERE r1.id > r2.id AND r1.name = r2.name;

# 4. Salir
exit;
```

---

## 6. Comandos útiles

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo MySQL
docker-compose logs -f mysql

# Últimas 100 líneas
docker-compose logs --tail 100 backend
```

### Verificar estado
```bash
# Ver contenedores corriendo
docker-compose ps

# Ver uso de recursos
docker stats

# Ver volúmenes
docker volume ls
```

### Backup de base de datos
```bash
# Crear backup
docker exec mysql mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup-$(date +%Y%m%d-%H%M%S).sql

# Restaurar backup
docker exec -i mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < backup-20260501-120000.sql
```

### Limpiar todo (⚠️ CUIDADO)
```bash
# Detener y eliminar contenedores
docker-compose down

# Detener y eliminar contenedores + volúmenes (BORRA DATOS)
docker-compose down -v

# Limpiar imágenes no usadas
docker system prune -a
```

---

## 7. Troubleshooting

### El backend no inicia
```bash
# Ver logs detallados
docker-compose logs backend

# Verificar que MySQL está listo
docker-compose logs mysql | grep "ready for connections"

# Reiniciar servicios
docker-compose restart
```

### Error de conexión a base de datos
```bash
# Verificar variables de entorno
docker exec backend env | grep DB_

# Verificar que MySQL está corriendo
docker-compose ps mysql

# Probar conexión manualmente
docker exec backend node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }).then(() => console.log('✅ Connected')).catch(e => console.error('❌', e.message));
"
```

### Imágenes no se muestran
```bash
# Verificar volumen de uploads
docker exec backend ls -lh /app/uploads

# Verificar permisos
docker exec backend ls -la /app/uploads

# Ajustar permisos si es necesario
docker exec backend chmod -R 755 /app/uploads
```

### Certificados SSL no se generan
```bash
# Ver logs de Traefik
docker-compose logs traefik

# Verificar que los dominios apuntan al servidor
nslookup planificador.app
nslookup api.planificador.app

# Verificar puertos abiertos
sudo netstat -tlnp | grep -E ':(80|443)'
```

---

## 8. Checklist de despliegue

- [ ] Código subido a GitHub
- [ ] Variables de entorno configuradas en `.env`
- [ ] `MIGRATION_MODE=fresh` para primera instalación
- [ ] `SEED_ON_BOOT=true` para primera instalación
- [ ] Dominios apuntando al servidor
- [ ] Puertos 80 y 443 abiertos en firewall
- [ ] Docker y Docker Compose instalados
- [ ] Servicios iniciados con `docker-compose up -d`
- [ ] Logs verificados sin errores
- [ ] Aplicación accesible en el navegador
- [ ] `MIGRATION_MODE=normal` después de primera instalación
- [ ] `SEED_ON_BOOT=false` después de primera instalación
- [ ] Backup configurado (opcional pero recomendado)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f`
2. Verifica las variables de entorno: `docker exec backend env`
3. Consulta la sección de Troubleshooting
4. Revisa la documentación de Docker Compose

---

**¡Listo!** Tu aplicación debería estar corriendo en producción. 🎉
