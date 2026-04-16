#!/bin/sh
set -e

echo "⏳ Waiting for database to be ready..."
# Simple retry loop — wait for MySQL to accept connections
MAX_RETRIES=30
RETRY=0
until node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  }).then(c => { c.end(); process.exit(0); }).catch(() => process.exit(1));
" 2>/dev/null; do
  RETRY=$((RETRY + 1))
  if [ "$RETRY" -ge "$MAX_RETRIES" ]; then
    echo "❌ Database not reachable after ${MAX_RETRIES} attempts. Exiting."
    exit 1
  fi
  echo "  Retry ${RETRY}/${MAX_RETRIES}..."
  sleep 2
done

echo "✅ Database is ready."

# Run migrations (idempotent — uses CREATE TABLE IF NOT EXISTS)
echo "🔄 Running database migrations..."
node src/database/migrate.js

# Run seed if SEED_ON_BOOT is set (first deploy only)
if [ "$SEED_ON_BOOT" = "true" ]; then
  echo "🌱 Seeding database..."
  node src/database/seed.js
fi

echo "🚀 Starting server..."
exec node src/server.js
