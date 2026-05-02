/**
 * Check email verification status of users
 * Run: node src/database/check_email_verification.js
 */

require('dotenv').config();
const { pool } = require('./connection');

async function checkEmailVerification() {
  try {
    console.log('🔍 Checking email verification status...\n');

    // Check all users
    const [users] = await pool.query(`
      SELECT 
        id,
        name,
        email,
        email_verified,
        email_verification_token,
        email_verification_expires,
        created_at,
        CASE 
          WHEN email_verified = 1 THEN '✅ Verificado'
          WHEN email_verification_expires IS NULL THEN '⚠️ Sin token'
          WHEN email_verification_expires < NOW() THEN '❌ Token expirado'
          ELSE '⏳ Pendiente'
        END as status
      FROM users
      ORDER BY created_at DESC
    `);

    console.log('📊 Estado de usuarios:\n');
    console.log('─'.repeat(120));
    console.log(
      'Nombre'.padEnd(20) + 
      'Email'.padEnd(30) + 
      'Verificado'.padEnd(15) + 
      'Token'.padEnd(20) + 
      'Estado'.padEnd(20)
    );
    console.log('─'.repeat(120));

    users.forEach(user => {
      const hasToken = user.email_verification_token ? 'Sí' : 'No';
      console.log(
        user.name.padEnd(20) + 
        user.email.padEnd(30) + 
        (user.email_verified ? 'Sí' : 'No').padEnd(15) + 
        hasToken.padEnd(20) + 
        user.status.padEnd(20)
      );
    });

    console.log('─'.repeat(120));
    console.log(`\n📈 Resumen:`);
    console.log(`   Total usuarios: ${users.length}`);
    console.log(`   Verificados: ${users.filter(u => u.email_verified).length}`);
    console.log(`   No verificados: ${users.filter(u => !u.email_verified).length}`);
    console.log(`   Con token pendiente: ${users.filter(u => !u.email_verified && u.email_verification_token).length}`);

    // Show details of unverified users
    const unverified = users.filter(u => !u.email_verified);
    if (unverified.length > 0) {
      console.log('\n⚠️ Usuarios no verificados:\n');
      unverified.forEach(user => {
        console.log(`   📧 ${user.email}`);
        console.log(`      - Nombre: ${user.name}`);
        console.log(`      - Token: ${user.email_verification_token ? user.email_verification_token.substring(0, 20) + '...' : 'Sin token'}`);
        console.log(`      - Expira: ${user.email_verification_expires || 'N/A'}`);
        console.log(`      - Creado: ${user.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEmailVerification();
