#!/bin/sh
set -e

echo "🔧 Backend entrypoint starting..."

# ── Wait for MySQL ─────────────────────────────────────────────
echo "⏳ Waiting for MySQL..."
until nc -z -v -w30 "${DB_HOST:-mysql}" "${DB_PORT:-3306}"; do
  echo "Waiting for MySQL connection..."
  sleep 2
done
echo "✅ MySQL is ready!"

# ── Migrations ─────────────────────────────────────────────────
# `fresh` borra TODA la BD. Solo se permite si:
#   1. NODE_ENV != production, O
#   2. ALLOW_FRESH_IN_PRODUCTION=true (escape hatch para reset deliberado)
if [ "$MIGRATION_MODE" = "fresh" ]; then
  if [ "$NODE_ENV" = "production" ] && [ "$ALLOW_FRESH_IN_PRODUCTION" != "true" ]; then
    echo "🛑 Refusing to run MIGRATION_MODE=fresh in production."
    echo "   This would DROP ALL TABLES and erase user data."
    echo "   If you really want to reset the database, set ALLOW_FRESH_IN_PRODUCTION=true."
    exit 1
  fi
  echo "🔄 Running FRESH migration (drops all tables)..."
  npm run migrate:fresh
elif [ "$MIGRATION_MODE" = "normal" ] || [ -z "$MIGRATION_MODE" ]; then
  echo "🔄 Running normal migration..."
  npm run migrate
else
  echo "⚠️  Unknown MIGRATION_MODE='$MIGRATION_MODE', defaulting to normal."
  npm run migrate
fi

# ── Seed ───────────────────────────────────────────────────────
# El seed solo recrea el SuperAdmin / demo si no existen, pero igual
# bloqueamos `SEED_ON_BOOT=true` en producción salvo escape hatch explícito.
if [ "$SEED_ON_BOOT" = "true" ]; then
  if [ "$NODE_ENV" = "production" ] && [ "$ALLOW_SEED_IN_PRODUCTION" != "true" ]; then
    echo "🛑 Refusing to run SEED_ON_BOOT=true in production."
    echo "   To re-run the seed in production, set ALLOW_SEED_IN_PRODUCTION=true once."
    exit 1
  fi
  echo "🌱 Seeding database..."
  npm run seed
else
  echo "⏭️  Skipping seed (SEED_ON_BOOT not enabled)"
fi

echo "🚀 Starting server..."
exec "$@"
