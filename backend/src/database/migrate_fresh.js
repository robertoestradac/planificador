/**
 * migrate:fresh — drops the database and recreates it from scratch.
 * Equivalent to: DROP DATABASE + migrate + seed
 *
 * WARNING: destroys ALL data.
 * Only runs if MIGRATION_MODE=fresh is explicitly set.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

async function fresh() {
  // Check if MIGRATION_MODE is explicitly set to 'fresh'
  if (process.env.MIGRATION_MODE !== 'fresh') {
    console.error('❌ migrate:fresh requires MIGRATION_MODE=fresh in .env');
    console.error('   This is a safety measure to prevent accidental data loss.');
    process.exit(1);
  }

  console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
  console.log(`   Database: ${config.db.name}`);
  console.log(`   Environment: ${config.env}`);
  
  const conn = await mysql.createConnection({
    host:     config.db.host,
    port:     config.db.port,
    user:     config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    console.log(`\n🗑️  Dropping database "${config.db.name}"...`);
    await conn.query(`DROP DATABASE IF EXISTS \`${config.db.name}\``);
    console.log('✅ Database dropped.');
    await conn.end();

    // Run migrate then seed as child processes so they use their own connections
    const { execSync } = require('child_process');
    console.log('\n🔄 Running migrate...');
    execSync('node src/database/migrate.js', { stdio: 'inherit', cwd: process.cwd() });

    console.log('\n🌱 Running seed...');
    execSync('node src/database/seed.js', { stdio: 'inherit', cwd: process.cwd() });

    console.log('\n✅ migrate:fresh completed successfully.');
    console.log('⚠️  Remember to set MIGRATION_MODE=normal for future deployments!');
  } catch (err) {
    console.error('❌ migrate:fresh failed:', err.message);
    process.exit(1);
  }
}

fresh();
