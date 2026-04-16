/**
 * migrate:fresh — drops the database and recreates it from scratch.
 * Equivalent to: DROP DATABASE + migrate + seed
 *
 * WARNING: destroys ALL data. Development use only.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../config');

async function fresh() {
  if (config.env === 'production') {
    console.error('migrate:fresh is not allowed in production.');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host:     config.db.host,
    port:     config.db.port,
    user:     config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  try {
    console.log(`Dropping database "${config.db.name}"...`);
    await conn.query(`DROP DATABASE IF EXISTS \`${config.db.name}\``);
    console.log('Database dropped.');
    await conn.end();

    // Run migrate then seed as child processes so they use their own connections
    const { execSync } = require('child_process');
    console.log('\nRunning migrate...');
    execSync('node src/database/migrate.js', { stdio: 'inherit', cwd: process.cwd() });

    console.log('\nRunning seed...');
    execSync('node src/database/seed.js', { stdio: 'inherit', cwd: process.cwd() });

    console.log('\nmigrate:fresh completed successfully.');
  } catch (err) {
    console.error('migrate:fresh failed:', err.message);
    process.exit(1);
  }
}

fresh();
