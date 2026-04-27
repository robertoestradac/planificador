require('dotenv').config();
const { pool } = require('./connection');

async function fixSuperAdmin() {
  try {
    console.log('🔧 Corrigiendo usuario SuperAdmin...\n');

    // Verificar el usuario actual
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.tenant_id, r.name as role_name
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = 'roberto.estrada.c@gmail.com'
    `);

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    const user = users[0];
    console.log('Usuario actual:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role_name}`);
    console.log(`   Tenant ID: ${user.tenant_id || 'NULL'}`);

    if (user.tenant_id !== null) {
      console.log('\n⚠️  El usuario SuperAdmin tiene un tenant_id asignado.');
      console.log('   Los usuarios globales (SuperAdmin, Admin, Support) deben tener tenant_id = NULL');
      console.log('\n🔧 Corrigiendo...');
      
      await pool.query('UPDATE users SET tenant_id = NULL WHERE id = ?', [user.id]);
      console.log('✅ tenant_id actualizado a NULL');
    } else {
      console.log('\n✅ El tenant_id ya es NULL (correcto)');
    }

    console.log('\n✅ Usuario SuperAdmin configurado correctamente');
    console.log('\n📋 Credenciales de login:');
    console.log('   Email: roberto.estrada.c@gmail.com');
    console.log('   Password: roberto@140682');
    console.log('   URL: /adminsis\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixSuperAdmin();
