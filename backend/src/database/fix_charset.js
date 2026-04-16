/**
 * fix_charset.js
 * Converts the database and all tables/columns to utf8mb4_unicode_ci.
 * Run once: node src/database/fix_charset.js
 */
const { pool } = require('./connection');

async function fixCharset() {
  const conn = await pool.getConnection();
  try {
    const dbName = process.env.DB_NAME || 'invitaciones_saas';

    console.log(`\n🔧 Fixing charset for database: ${dbName}\n`);

    // 1. Fix the database default charset
    await conn.query(
      `ALTER DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ Database charset updated');

    // 2. Get all tables
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [dbName]
    );

    // 3. Convert each table
    for (const { TABLE_NAME } of tables) {
      await conn.query(
        `ALTER TABLE \`${TABLE_NAME}\`
         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
      console.log(`  ✅ ${TABLE_NAME}`);
    }

    console.log('\n✅ All tables converted to utf8mb4_unicode_ci\n');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

fixCharset();
