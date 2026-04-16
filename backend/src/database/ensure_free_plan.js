const { pool } = require('./connection');
const { v4: uuidv4 } = require('uuid');

async function ensureFreePlan() {
  try {
    // Check if free plan exists
    const [[freePlan]] = await pool.query(
      'SELECT id, name, price_usd, is_active FROM plans WHERE price_usd = 0 LIMIT 1'
    );

    if (freePlan) {
      console.log('✓ Free plan already exists:', freePlan);
      
      // Ensure it's active
      if (!freePlan.is_active) {
        await pool.query('UPDATE plans SET is_active = 1 WHERE id = ?', [freePlan.id]);
        console.log('✓ Free plan activated');
      }

      // Check permissions
      const [[permCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM plan_permissions WHERE plan_id = ?',
        [freePlan.id]
      );
      console.log(`✓ Free plan has ${permCount.count} permissions assigned`);

      return freePlan.id;
    }

    // Create free plan
    console.log('Creating free plan...');
    const planId = uuidv4();
    await pool.query(
      `INSERT INTO plans (id, name, description, price_usd, price_gtq, billing_cycle, 
        max_events, max_invitations, max_guests, max_users, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planId,
        'Gratuito',
        'Plan gratuito con funcionalidades básicas',
        0,
        0,
        'monthly',
        1,    // max_events
        3,    // max_invitations
        50,   // max_guests
        1,    // max_users
        1     // is_active
      ]
    );
    console.log('✓ Free plan created:', planId);

    // Assign all permissions to free plan
    const [permissions] = await pool.query('SELECT id FROM permissions');
    if (permissions.length > 0) {
      const values = permissions.map(p => [uuidv4(), planId, p.id]);
      await pool.query(
        'INSERT INTO plan_permissions (id, plan_id, permission_id) VALUES ?',
        [values]
      );
      console.log(`✓ Assigned ${permissions.length} permissions to free plan`);
    }

    // Ensure Owner role has all permissions
    const [[ownerRole]] = await pool.query(
      'SELECT id FROM roles WHERE name = ? AND is_global = 0 LIMIT 1',
      ['Owner']
    );

    if (ownerRole) {
      const [[rolePermCount]] = await pool.query(
        'SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?',
        [ownerRole.id]
      );
      
      if (rolePermCount.count === 0) {
        const values = permissions.map(p => [uuidv4(), ownerRole.id, p.id]);
        await pool.query(
          'INSERT INTO role_permissions (id, role_id, permission_id) VALUES ?',
          [values]
        );
        console.log(`✓ Assigned ${permissions.length} permissions to Owner role`);
      } else {
        console.log(`✓ Owner role already has ${rolePermCount.count} permissions`);
      }
    }

    return planId;
  } catch (error) {
    console.error('Error ensuring free plan:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

ensureFreePlan()
  .then(() => {
    console.log('\n✓ Free plan setup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Failed:', err.message);
    process.exit(1);
  });
