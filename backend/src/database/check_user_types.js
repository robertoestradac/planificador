/**
 * Check user types (Global Admin vs Tenant Users)
 * Run: node src/database/check_user_types.js
 */

require('dotenv').config();
const { pool } = require('./connection');

async function checkUserTypes() {
  try {
    console.log('🔍 Verificando tipos de usuarios...\n');

    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.tenant_id,
        u.email_verified,
        r.name as role_name,
        r.is_global,
        CASE 
          WHEN r.is_global = 1 THEN '👑 Admin Global'
          ELSE '👤 Usuario Tenant'
        END as user_type,
        CASE 
          WHEN r.is_global = 1 THEN 'No requiere'
          WHEN u.email_verified = 1 THEN '✅ Verificado'
          ELSE '❌ No verificado'
        END as verification_status
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.deleted_at IS NULL
      ORDER BY r.is_global DESC, u.created_at DESC
    `);

    console.log('📊 Usuarios en el sistema:\n');
    console.log('─'.repeat(130));
    console.log(
      'Nombre'.padEnd(20) + 
      'Email'.padEnd(35) + 
      'Rol'.padEnd(20) + 
      'Tipo'.padEnd(20) + 
      'Verificación'.padEnd(20)
    );
    console.log('─'.repeat(130));

    users.forEach(user => {
      console.log(
        user.name.padEnd(20) + 
        user.email.padEnd(35) + 
        user.role_name.padEnd(20) + 
        user.user_type.padEnd(20) + 
        user.verification_status.padEnd(20)
      );
    });

    console.log('─'.repeat(130));

    const globalAdmins = users.filter(u => u.is_global === 1);
    const tenantUsers = users.filter(u => u.is_global === 0);
    const verifiedTenants = tenantUsers.filter(u => u.email_verified === 1);
    const unverifiedTenants = tenantUsers.filter(u => u.email_verified === 0);

    console.log('\n📈 Resumen:\n');
    console.log(`   👑 Administradores Globales: ${globalAdmins.length}`);
    console.log(`      - No requieren verificación de email`);
    console.log(`      - Pueden iniciar sesión siempre\n`);
    
    console.log(`   👤 Usuarios Tenant: ${tenantUsers.length}`);
    console.log(`      - ✅ Verificados: ${verifiedTenants.length}`);
    console.log(`      - ❌ No verificados: ${unverifiedTenants.length}`);
    console.log(`      - Deben verificar email para iniciar sesión\n`);

    if (globalAdmins.length > 0) {
      console.log('👑 Administradores Globales:\n');
      globalAdmins.forEach(admin => {
        console.log(`   - ${admin.name} (${admin.email})`);
        console.log(`     Rol: ${admin.role_name}`);
        console.log(`     Login: ✅ Permitido sin verificación\n`);
      });
    }

    if (unverifiedTenants.length > 0) {
      console.log('⚠️ Usuarios Tenant No Verificados:\n');
      unverifiedTenants.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
        console.log(`     Rol: ${user.role_name}`);
        console.log(`     Login: ❌ Bloqueado hasta verificar email\n`);
      });
    }

    console.log('💡 Reglas de Verificación:\n');
    console.log('   1. Administradores Globales (is_global = 1):');
    console.log('      - NO requieren verificación de email');
    console.log('      - Pueden iniciar sesión inmediatamente');
    console.log('      - Ejemplo: SuperAdmin\n');
    
    console.log('   2. Usuarios Tenant (is_global = 0):');
    console.log('      - SÍ requieren verificación de email');
    console.log('      - Deben verificar antes de iniciar sesión');
    console.log('      - Ejemplo: Owner, Manager, Viewer\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserTypes();
