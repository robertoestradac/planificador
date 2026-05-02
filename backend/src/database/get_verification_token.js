/**
 * Get verification token for a user
 * Run: node src/database/get_verification_token.js EMAIL
 */

require('dotenv').config();
const { pool } = require('./connection');

async function getVerificationToken() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Debes proporcionar un email');
    console.log('\nUso: node src/database/get_verification_token.js EMAIL');
    console.log('Ejemplo: node src/database/get_verification_token.js usuario@example.com\n');
    process.exit(1);
  }

  try {
    console.log(`🔍 Buscando usuario: ${email}\n`);

    const [users] = await pool.query(`
      SELECT 
        id,
        name,
        email,
        email_verified,
        email_verification_token,
        email_verification_expires,
        created_at
      FROM users
      WHERE email = ?
    `, [email]);

    if (users.length === 0) {
      console.error(`❌ Usuario no encontrado: ${email}\n`);
      process.exit(1);
    }

    const user = users[0];

    console.log('📋 Información del usuario:\n');
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Verificado: ${user.email_verified ? '✅ Sí' : '❌ No'}`);
    console.log(`   Creado: ${user.created_at || 'N/A'}`);
    console.log('');

    if (user.email_verified) {
      console.log('✅ Este usuario ya está verificado. No necesita token.\n');
      process.exit(0);
    }

    if (!user.email_verification_token) {
      console.log('⚠️ Este usuario no tiene token de verificación.');
      console.log('\n💡 Opciones:');
      console.log('   1. Solicitar reenvío del email de verificación');
      console.log('   2. Verificar manualmente con SQL:\n');
      console.log(`      UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE email = '${email}';\n`);
      process.exit(1);
    }

    const now = new Date();
    const expires = new Date(user.email_verification_expires);
    const isExpired = expires < now;

    console.log('🔑 Token de verificación:\n');
    console.log(`   ${user.email_verification_token}`);
    console.log('');
    console.log(`   Expira: ${user.email_verification_expires}`);
    console.log(`   Estado: ${isExpired ? '❌ Expirado' : '✅ Válido'}`);
    console.log('');

    if (isExpired) {
      console.log('⚠️ El token ha expirado. Solicita un reenvío del email.\n');
      process.exit(1);
    }

    const config = require('../config');
    const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${user.email_verification_token}`;

    console.log('🔗 Link de verificación:\n');
    console.log(`   ${verificationUrl}`);
    console.log('');

    console.log('📧 Para verificar por API:\n');
    console.log(`   curl -X POST http://localhost:4000/api/v1/auth/verify-email \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"token":"${user.email_verification_token}"}'`);
    console.log('');

    console.log('💡 O verifica manualmente en BD:\n');
    console.log(`   UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE email = '${email}';`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

getVerificationToken();
