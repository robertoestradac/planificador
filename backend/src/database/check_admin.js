require('dotenv').config();
const { pool } = require('./connection');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    console.log('🔍 Verificando usuario SuperAdmin...\n');

    // Buscar el usuario SuperAdmin
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.password_hash, u.status, u.tenant_id,
             r.name AS role_name, r.is_global
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = 'roberto.estrada.c@gmail.com'
    `);

    if (users.length === 0) {
      console.log('❌ No se encontró el usuario SuperAdmin con email: roberto.estrada.c@gmail.com');
      console.log('\n💡 Ejecuta el seeder para crear el usuario:');
      console.log('   node backend/src/database/seed.js\n');
      process.exit(1);
    }

    const user = users[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role_name}`);
    console.log(`   Global: ${user.is_global ? 'Sí' : 'No'}`);
    console.log(`   Tenant ID: ${user.tenant_id || 'NULL (usuario global)'}`);
    console.log(`   Estado: ${user.status}`);

    // Verificar la contraseña
    const testPassword = 'roberto@140682';
    const passwordMatch = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log(`\n🔐 Verificación de contraseña:`);
    console.log(`   Contraseña de prueba: ${testPassword}`);
    console.log(`   Resultado: ${passwordMatch ? '✅ CORRECTA' : '❌ INCORRECTA'}`);

    if (!passwordMatch) {
      console.log('\n⚠️  La contraseña no coincide. Regenerando hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
      console.log('✅ Contraseña actualizada correctamente');
    }

    // Verificar el rol SuperAdmin
    const [roles] = await pool.query(`
      SELECT id, name, is_global
      FROM roles
      WHERE name = 'SuperAdmin' AND is_global = 1
    `);

    if (roles.length === 0) {
      console.log('\n❌ No se encontró el rol SuperAdmin');
      process.exit(1);
    }

    console.log(`\n✅ Rol SuperAdmin configurado correctamente`);

    // Verificar permisos del rol
    const [perms] = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions
      WHERE role_id = ?
    `, [roles[0].id]);

    console.log(`   Permisos asignados: ${perms[0].count}`);

    console.log('\n✅ Todo está configurado correctamente');
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

checkAdmin();
