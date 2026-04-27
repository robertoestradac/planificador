# Despliegue de Planificador.app

Guía completa para poner en producción la app en un VPS con Docker, Traefik y HTTPS automático (Let's Encrypt).

## Arquitectura

```
Internet :443
    │
    ▼
┌─────────────────────────────────────────┐
│ Traefik (puertos 80/443)                │
│  ├─ planificador.app   → frontend:3000  │
│  └─ api.planificador.app → backend:4000 │
└─────────────────────────────────────────┘
        │                  │
        ▼                  ▼
   [frontend]          [backend]
   Next.js             Express
                            │
                            ▼
                        [mysql]
                        volumen: mysql_data
```

**Servicios:**
- `traefik` — reverse proxy + HTTPS automático
- `frontend` — Next.js (puerto 3000 interno)
- `backend` — Express API (puerto 4000 interno)
- `mysql` — MySQL 8.0

**Volúmenes persistentes:**
- `mysql_data` — datos de la base
- `backend_uploads` — archivos subidos por usuarios
- `traefik_letsencrypt` — certificados TLS

---

## 1. Pre-requisitos en el VPS (Ubuntu 24.04)

### 1.1 Instalar Docker 27 LTS

> **Importante:** NO instales el último Docker (29+). Usa la 27 LTS, es la que probamos compatible con Traefik.

```bash
# Eliminar versiones viejas si existen
apt remove -y docker docker.io docker-engine containerd runc

# Instalar repo oficial de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Fijar versión 27.5.1
apt install -y \
  docker-ce=5:27.5.1-1~ubuntu.24.04~noble \
  docker-ce-cli=5:27.5.1-1~ubuntu.24.04~noble \
  containerd.io \
  docker-compose-plugin

# Verificar
docker version   # Server: 27.5.1, API: 1.47
```

### 1.2 Abrir puertos en el firewall

```bash
ufw allow 80
ufw allow 443
ufw reload
```

Si tu proveedor (Contabo, Hetzner, etc.) tiene firewall propio, abre 80 y 443 ahí también.

---

## 2. Configurar DNS

En tu proveedor de dominio crea **3 registros A** apuntando a la IP pública del VPS:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | `planificador.app` | IP del VPS |
| A | `www.planificador.app` | IP del VPS |
| A | `api.planificador.app` | IP del VPS |

Verifica que propaguen:

```bash
dig +short planificador.app
dig +short api.planificador.app
curl -4 ifconfig.me
# Las 3 IPs deben coincidir
```

---

## 3. Clonar el repositorio en el VPS

### Opción A: HTTPS con Personal Access Token

1. En GitHub: **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate**
2. Marca scope `repo` y copia el token (`ghp_...`).

```bash
git clone https://USUARIO:TOKEN@github.com/robertoestradac/planificador.git /opt/planificador
```

### Opción B: SSH (recomendado para `git pull` futuros)

```bash
ssh-keygen -t ed25519 -C "vps-planificador"
# Enter a todo (sin passphrase)
cat ~/.ssh/id_ed25519.pub
```

Copia la salida y pégala en GitHub: **Settings → SSH and GPG keys → New SSH key**.

```bash
git clone git@github.com:robertoestradac/planificador.git /opt/planificador
```

---

## 4. Configurar variables de entorno

Solo se usa **un** archivo `.env` en la raíz del proyecto. **NO** crees `backend/.env` ni `frontend/.env.local`; las variables se inyectan a los contenedores desde el `docker-compose.yml`.

```bash
cd /opt/planificador
cp .env.example .env
nano .env
```

Contenido:

```bash
# Email para Let's Encrypt
ACME_EMAIL=tu_email@gmail.com

# MySQL
DB_ROOT_PASSWORD=GeneraUnPasswordFuerte
DB_USER=planificador
DB_PASSWORD=OtroPasswordFuerte
DB_NAME=invitaciones_saas

# JWT (genera secretos largos)
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Solo en el primer deploy (siembra datos base)
SEED_ON_BOOT=true
```

Para generar secretos fuertes:

```bash
openssl rand -hex 64   # úsalo para JWT_ACCESS_SECRET
openssl rand -hex 64   # úsalo para JWT_REFRESH_SECRET
openssl rand -base64 24   # passwords de MySQL
```

> Evita caracteres como `&`, `$`, `#` en passwords sin comillas. Mejor solo letras y números.

---

## 5. Levantar la aplicación

```bash
cd /opt/planificador
docker compose up -d --build

# Esperar a que MySQL esté healthy y Traefik emita los certs
sleep 60

# Estado de los servicios
docker compose ps
```

Los 4 contenedores deben estar `Up`:

```
NAME       STATUS
backend    Up (healthy)
frontend   Up
mysql      Up (healthy)
traefik    Up
```

---

## 6. Verificar HTTPS

```bash
# Cert del frontend
echo | openssl s_client -connect planificador.app:443 -servername planificador.app 2>/dev/null \
  | openssl x509 -noout -issuer

# Cert del backend
echo | openssl s_client -connect api.planificador.app:443 -servername api.planificador.app 2>/dev/null \
  | openssl x509 -noout -issuer
```

Ambos deben decir:

```
issuer=C = US, O = Let's Encrypt, CN = R13
```

Si alguno dice `TRAEFIK DEFAULT CERT`, mira la sección de **Troubleshooting**.

Abre en el navegador:
- `https://planificador.app` → candado verde, app cargando
- `https://api.planificador.app/health` → JSON `{"success":true,...}`

---

## 7. Después del primer deploy

Edita el `.env` y desactiva el seed:

```bash
nano .env
# SEED_ON_BOOT=false
```

Aplica el cambio (sin rebuild):

```bash
docker compose up -d
```

---

## 8. Redeploy de cambios futuros

**En tu PC:**

```powershell
git add .
git commit -m "descripcion del cambio"
git push origin main
```

**En el VPS:**

```bash
cd /opt/planificador
git pull
docker compose up -d --build
```

Si solo cambiaste el frontend o el backend:

```bash
docker compose up -d --build frontend
docker compose up -d --build backend
```

---

## 9. Comandos útiles del día a día

```bash
# Logs en vivo
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f traefik

# Estado
docker compose ps

# Reinicio rápido
docker compose restart backend

# Rebuild completo
docker compose down
docker compose up -d --build

# Entrar al MySQL
docker exec -it mysql mysql -uroot -p

# Bash dentro del backend
docker exec -it backend sh
```

---

## 10. Backups

### Backup manual de la base de datos

```bash
docker exec mysql mysqldump -uroot -p"$DB_ROOT_PASSWORD" invitaciones_saas \
  > /backup/db_$(date +%F).sql
```

### Backup automático con cron

```bash
mkdir -p /backup
crontab -e
```

Agrega:

```cron
0 3 * * * cd /opt/planificador && docker exec mysql mysqldump -uroot -p$(grep DB_ROOT_PASSWORD .env | cut -d= -f2) invitaciones_saas > /backup/db_$(date +\%F).sql
0 4 * * 0 find /backup -name "db_*.sql" -mtime +30 -delete
```

Backup todos los días a las 3am, eliminando los de más de 30 días los domingos a las 4am.

### Restaurar un backup

```bash
docker exec -i mysql mysql -uroot -p"$DB_ROOT_PASSWORD" invitaciones_saas < /backup/db_2026-04-27.sql
```

---

## 11. Troubleshooting

### Cert sigue siendo `TRAEFIK DEFAULT CERT`

```bash
# Ver logs de Traefik
docker compose logs traefik | tail -60

# Ver routers que detectó
docker compose exec traefik wget -qO- http://localhost:8080/api/http/routers 2>/dev/null
```

Causas comunes:
- Frontend está `unhealthy` → Traefik lo ignora. Quita o arregla el `HEALTHCHECK` del Dockerfile.
- DNS no apunta al VPS aún. Verifica con `dig`.
- Puerto 443 cerrado. Verifica con `ufw status` y desde fuera con `Test-NetConnection`.
- Rate limit de Let's Encrypt (5 certs por dominio por semana). Espera o usa staging.

Para forzar reintento limpio:

```bash
docker compose down
docker volume rm planificador_traefik_letsencrypt
docker compose up -d
```

### Backend en loop de restart

```bash
docker compose logs backend | tail -50
```

Causas comunes:
- `Migration failed: ... IF NOT EXISTS ...` → MySQL 8 no soporta esa sintaxis. Ya está corregido en `migrate.js`.
- `Access denied for user` → password de DB cambió pero el volumen tiene los viejos. Borra `mysql_data` (perderás datos):

```bash
docker compose down
docker volume rm planificador_mysql_data
docker compose up -d --build
```

### MySQL: `Database is uninitialized and password option is not specified`

Falta el `.env` o `DB_ROOT_PASSWORD` está vacío.

```bash
cat .env | grep DB_ROOT_PASSWORD   # debe tener valor
docker compose down
docker volume rm planificador_mysql_data
docker compose up -d
```

### Traefik: `client version 1.24 is too old`

Tienes Docker muy nuevo (29+). Bájalo a 27.5.1 (ver paso 1.1).

---

## 12. Estructura del proyecto

```
/opt/planificador/
├── .env                  ← UNICO archivo de variables (NO subir a git)
├── .env.example          ← Plantilla
├── docker-compose.yml    ← Orquestación de servicios
├── DEPLOY.md             ← Este documento
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh     ← Espera MySQL + corre migraciones + arranca
│   ├── package.json
│   └── src/
│       └── database/
│           └── migrate.js  ← Migraciones (compatible MySQL 8)
└── frontend/
    ├── Dockerfile
    ├── public/
    └── src/
```

---

## 13. Notas finales

- **Renovación de certs**: Traefik renueva los certs Let's Encrypt automáticamente 30 días antes de que expiren. No tienes que hacer nada.
- **Logs persistentes**: Por defecto Docker rota los logs. Si necesitas logs de larga duración, monta un volumen para `/app/logs` en el backend.
- **Escalado**: La app está pensada para un solo nodo. Si necesitas escalar, considera mover MySQL fuera del compose (RDS, etc.) y agregar replicas del backend con un balanceador.
- **Monitoreo**: Considera agregar Uptime Kuma o un endpoint externo que pingee `https://api.planificador.app/health` cada 5 minutos.
