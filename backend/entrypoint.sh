#!/bin/sh
set -e

echo "🔧 Backend entrypoint starting..."

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL..."
until nc -z -v -w30 ${DB_HOST:-mysql} ${DB_PORT:-3306}; do
  echo "Waiting for MySQL connection..."
  sleep 2
done
echo "✅ MySQL is ready!"

# Run migrations based on mode
if [ "$MIGRATION_MODE" = "fresh" ]; then
  echo "🔄 Running FRESH migration (drops all tables)..."
  npm run migrate:fresh
elif [ "$MIGRATION_MODE" = "normal" ]; then
  echo "🔄 Running normal migration..."
  npm run migrate
else
  echo "⚠️  MIGRATION_MODE not set, running normal migration..."
  npm run migrate
fi

# Run seed if enabled
if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed
else
  echo "⏭️  Skipping seed (SEED_ON_BOOT not enabled)"
fi

echo "🚀 Starting server..."
exec node src/server.js
