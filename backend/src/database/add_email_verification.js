/**
 * Add email verification fields to users table
 * Run: node src/database/add_email_verification.js
 */

require('dotenv').config();
const { pool } = require('./connection');

async function addEmailVerification() {
  try {
    console.log('🔧 Adding email verification fields to users table...');

    // Check if columns already exist
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('email_verified', 'email_verification_token', 'email_verification_expires')
    `, [process.env.DB_NAME || 'invitapp']);

    const existingColumns = columns.map(c => c.COLUMN_NAME);

    if (existingColumns.length === 3) {
      console.log('✅ Email verification fields already exist');
      return;
    }

    // Add columns if they don't exist
    if (!existingColumns.includes('email_verified')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 
        AFTER password_hash
      `);
      console.log('✅ Added email_verified column');
    }

    if (!existingColumns.includes('email_verification_token')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_token VARCHAR(255) NULL 
        AFTER email_verified
      `);
      console.log('✅ Added email_verification_token column');
    }

    if (!existingColumns.includes('email_verification_expires')) {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN email_verification_expires DATETIME NULL 
        AFTER email_verification_token
      `);
      console.log('✅ Added email_verification_expires column');
    }

    // Add index for verification token
    const [indexes] = await pool.query(`
      SHOW INDEX FROM users WHERE Key_name = 'idx_verification_token'
    `);

    if (indexes.length === 0) {
      await pool.query(`
        ALTER TABLE users 
        ADD INDEX idx_verification_token (email_verification_token)
      `);
      console.log('✅ Added index for verification token');
    }

    // Mark existing users as verified (they registered before this feature)
    const [result] = await pool.query(`
      UPDATE users 
      SET email_verified = 1 
      WHERE email_verified = 0
    `);
    console.log(`✅ Marked ${result.affectedRows} existing users as verified`);

    console.log('\n🎉 Email verification migration completed successfully!');
    console.log('\n📋 New fields added:');
    console.log('   - email_verified (TINYINT)');
    console.log('   - email_verification_token (VARCHAR)');
    console.log('   - email_verification_expires (DATETIME)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

addEmailVerification();
