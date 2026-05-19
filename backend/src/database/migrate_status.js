require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../config');

(async () => {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version    VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum   VARCHAR(64)  NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [rows] = await conn.query(
      'SELECT version, applied_at FROM schema_migrations ORDER BY version'
    );
    const applied = new Set(rows.map((r) => r.version));

    const dir = path.join(__dirname, 'migrations');
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
      : [];

    console.log('Versioned migrations status:\n');
    for (const file of files) {
      const version = file.replace(/\.sql$/i, '');
      const ok = applied.has(version);
      const ts = ok ? rows.find((r) => r.version === version).applied_at : '';
      console.log(`  ${ok ? '✅' : '⏳'}  ${version}${ok ? '  applied at ' + ts.toISOString() : '  (pending)'}`);
    }

    const orphaned = rows.map((r) => r.version)
      .filter((v) => !files.some((f) => f.replace(/\.sql$/i, '') === v));
    if (orphaned.length) {
      console.log('\n⚠️  Tracked but missing from disk:');
      orphaned.forEach((v) => console.log('   - ' + v));
    }
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
