# Deployment Guide — planificador.app

## Architecture

```
Internet → Traefik (TLS) → frontend (Next.js :3000)
                          → backend  (Express :4000)
                          
Docker Socket Proxy → Traefik (read-only Docker API)
MySQL 8 ← backend
mysql-backup (daily 03:00 UTC, 14-day retention)
```

## Prerequisites

- Server with Docker + Docker Compose v2
- GitHub repo with Actions secrets configured:
  - `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`

## First-time setup

```bash
# 1. Clone on the server
ssh user@server
cd /opt
git clone git@github.com:YOUR_USER/invitaciones.git planificador
cd planificador

# 2. Create .env from example
cp .env.example .env
nano .env
```

Fill in:
```env
DB_ROOT_PASSWORD=<strong random>
DB_USER=invitapp_user
DB_PASSWORD=<strong random>
DB_NAME=invitaciones_saas
JWT_ACCESS_SECRET=<64-char hex>
JWT_REFRESH_SECRET=<64-char hex>
ACME_EMAIL=your@email.com

# First boot only:
MIGRATION_MODE=fresh
SEED_ON_BOOT=true
ALLOW_FRESH_IN_PRODUCTION=true
ALLOW_SEED_IN_PRODUCTION=true
SEED_SUPERADMIN_EMAIL=admin@yourdomain.com
SEED_SUPERADMIN_PASSWORD=<strong password>
```

Generate secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# 3. Build and start
docker compose build
docker compose up -d

# 4. Check logs
docker compose logs -f backend
# Wait for "🚀 Starting server..."

# 5. IMMEDIATELY after first successful boot, lock down:
nano .env
# Change to:
#   MIGRATION_MODE=normal
#   SEED_ON_BOOT=false
#   ALLOW_FRESH_IN_PRODUCTION=false
#   ALLOW_SEED_IN_PRODUCTION=false
#   SEED_SUPERADMIN_PASSWORD=   (clear it)
```

## Ongoing deployments

Push to `main` → GitHub Actions runs CI (lint + build) → deploys via SSH:
```
git pull → docker compose build → docker compose up -d
```

No manual steps needed. If CI fails, deploy is blocked.

## Useful commands

```bash
# Status
docker compose ps

# Logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Run migrations manually
docker compose exec backend node src/database/migrate.js

# Check migration status
docker compose exec backend node src/database/migrate_status.js

# Create a new versioned migration
docker compose exec backend npm run migrate:make -- add_some_column

# Manual backup
docker compose exec mysql-backup /backup.sh

# List backups
docker compose exec mysql-backup ls -la /backup/

# Restore from backup (CAREFUL)
docker compose exec -T mysql mysql -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} < backup.sql.gz
```

## Backups

- **Automatic**: `mysql-backup` container runs daily at 03:00 UTC.
- **Retention**: 14 days (configurable via `DB_DUMP_KEEP_DAYS`).
- **Location**: Docker volume `mysql_backups`.
- **Recommendation**: Mount `mysql_backups` to a host path and sync to S3/external storage.

## Security notes

- Traefik does NOT have direct access to the Docker socket. It goes through `docker-socket-proxy` (read-only, containers endpoint only).
- `MIGRATION_MODE=fresh` and `SEED_ON_BOOT=true` are rejected in production unless their respective `ALLOW_*` flags are set.
- Seeded users are created with `must_change_password=1` — they must rotate on first login.
- CORS only allows origins listed in `CORS_ORIGIN` env var.
- Next.js image optimization only allows your API host and explicitly declared CDN hosts.
