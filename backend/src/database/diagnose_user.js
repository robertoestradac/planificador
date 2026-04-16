const { pool } = require('./connection');

async function diagnoseUser(email) {
  try {
    console.log(`\n=== Diagnóstico para usuario: ${email} ===\n`);

    // 1. Get user info
    const [[user]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.tenant_id, u.status,
              r.id as role_id, r.name as role_name, r.is_global
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = ? AND u.deleted_at IS NULL`,
      [email]
    );

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log('✓ Usuario encontrado:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Nombre: ${user.name}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Tenant ID: ${user.tenant_id || 'N/A (global)'}`);
    console.log(`  - Status: ${user.status}`);
    console.log(`  - Role: ${user.role_name} (${user.is_global ? 'global' : 'tenant'})`);

    // 2. Check role permissions
    const [rolePerms] = await pool.query(
      `SELECT p.key_name, p.description
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.key_name`,
      [user.role_id]
    );

    console.log(`\n✓ Permisos del rol (${rolePerms.length} total):`);
    const eventPerms = rolePerms.filter(p => p.key_name.includes('event'));
    if (eventPerms.length > 0) {
      console.log('  Permisos de eventos:');
      eventPerms.forEach(p => console.log(`    - ${p.key_name}: ${p.description}`));
    } else {
      console.log('  ❌ NO tiene permisos de eventos');
    }

    // 3. Check subscription and plan
    if (user.tenant_id) {
      const [[sub]] = await pool.query(
        `SELECT s.id, s.status, s.starts_at, s.expires_at,
                p.id as plan_id, p.name as plan_name, p.price_usd,
                p.max_events, p.max_guests, p.max_users
         FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.tenant_id = ? AND s.status = 'active' AND s.expires_at > NOW()
         ORDER BY s.expires_at DESC LIMIT 1`,
        [user.tenant_id]
      );

      if (!sub) {
        console.log('\n❌ NO tiene suscripción activa');
        
        // Check if free plan exists
        const [[freePlan]] = await pool.query(
          'SELECT id, name FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1'
        );
        
        if (freePlan) {
          console.log(`\n💡 Plan gratuito disponible: ${freePlan.name} (${freePlan.id})`);
          console.log('   Puedes crear una suscripción con:');
          console.log(`   node src/database/check_subscriptions.js`);
        }
      } else {
        console.log(`\n✓ Suscripción activa:`);
        console.log(`  - Plan: ${sub.plan_name} ($${sub.price_usd})`);
        console.log(`  - Status: ${sub.status}`);
        console.log(`  - Expira: ${sub.expires_at}`);
        console.log(`  - Límites: ${sub.max_events || '∞'} eventos, ${sub.max_guests || '∞'} invitados, ${sub.max_users || '∞'} usuarios`);

        // Check plan permissions
        const [planPerms] = await pool.query(
          `SELECT p.key_name
           FROM plan_permissions pp
           JOIN permissions p ON p.id = pp.permission_id
           WHERE pp.plan_id = ?
           ORDER BY p.key_name`,
          [sub.plan_id]
        );

        console.log(`\n✓ Permisos del plan (${planPerms.length} total):`);
        const planEventPerms = planPerms.filter(p => p.key_name.includes('event'));
        if (planEventPerms.length > 0) {
          console.log('  Permisos de eventos:');
          planEventPerms.forEach(p => console.log(`    - ${p.key_name}`));
        } else {
          console.log('  ❌ El plan NO tiene permisos de eventos');
        }

        // Check usage
        const [[usage]] = await pool.query(
          `SELECT
             (SELECT COUNT(*) FROM events WHERE tenant_id = ? AND deleted_at IS NULL) as events_used,
             (SELECT COUNT(*) FROM invitations WHERE tenant_id = ? AND deleted_at IS NULL) as invitations_used,
             (SELECT COUNT(*) FROM users WHERE tenant_id = ? AND deleted_at IS NULL) as users_used`,
          [user.tenant_id, user.tenant_id, user.tenant_id]
        );

        console.log(`\n✓ Uso actual:`);
        console.log(`  - Eventos: ${usage.events_used} / ${sub.max_events || '∞'}`);
        console.log(`  - Invitaciones: ${usage.invitations_used} / ${sub.max_events || '∞'}`);
        console.log(`  - Usuarios: ${usage.users_used} / ${sub.max_users || '∞'}`);

        if (sub.max_events !== null && usage.events_used >= sub.max_events) {
          console.log('\n❌ LÍMITE DE EVENTOS ALCANZADO');
        }
      }
    }

    // 4. Summary
    console.log('\n=== RESUMEN ===');
    const isOwner = user.role_name === 'Owner' && user.tenant_id;
    const hasCreateEventPerm = rolePerms.some(p => p.key_name === 'create_event');
    
    if (isOwner) {
      console.log('✓ Usuario es Owner → Bypasea verificaciones de permisos');
    } else if (hasCreateEventPerm) {
      console.log('✓ Usuario tiene permiso create_event en su rol');
    } else {
      console.log('❌ Usuario NO tiene permiso create_event en su rol');
    }

    console.log('\n💡 Recomendaciones:');
    if (!isOwner && !hasCreateEventPerm) {
      console.log('  1. Asignar permiso create_event al rol del usuario');
      console.log('  2. O cambiar el rol del usuario a Owner');
    }
    if (user.tenant_id && !sub) {
      console.log('  3. Crear suscripción activa para el tenant');
    }
    console.log('  4. Reiniciar el backend server para aplicar cambios en authorize.js');

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

const email = process.argv[2] || 'owner@demo.com';
diagnoseUser(email)
  .then(() => {
    console.log('\n✓ Diagnóstico completo\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Error:', err.message);
    process.exit(1);
  });
