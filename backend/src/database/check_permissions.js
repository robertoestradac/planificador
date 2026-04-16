const { pool } = require('./connection');

async function checkPermissions() {
  try {
    // Get free plan
    const [[freePlan]] = await pool.query(
      'SELECT id, name FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1'
    );

    if (!freePlan) {
      console.error('✗ No free plan found!');
      return;
    }

    console.log('Free plan:', freePlan.name, '(' + freePlan.id + ')');

    // Get Owner role
    const [[ownerRole]] = await pool.query(
      'SELECT id, name FROM roles WHERE name = ? AND is_global = 0 LIMIT 1',
      ['Owner']
    );

    if (!ownerRole) {
      console.error('✗ Owner role not found!');
      return;
    }

    console.log('Owner role:', ownerRole.name, '(' + ownerRole.id + ')');

    // Check specific permissions
    const permissionsToCheck = [
      'view_analytics',
      'view_events',
      'view_invitations',
      'view_guests',
      'view_users',
      'use_planner'
    ];

    console.log('\nChecking permissions:\n');

    for (const permKey of permissionsToCheck) {
      const [[perm]] = await pool.query(
        'SELECT id, key_name FROM permissions WHERE key_name = ?',
        [permKey]
      );

      if (!perm) {
        console.log(`✗ ${permKey}: NOT FOUND IN SYSTEM`);
        continue;
      }

      // Check if in free plan
      const [[inPlan]] = await pool.query(
        'SELECT 1 FROM plan_permissions WHERE plan_id = ? AND permission_id = ?',
        [freePlan.id, perm.id]
      );

      // Check if in Owner role
      const [[inRole]] = await pool.query(
        'SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [ownerRole.id, perm.id]
      );

      const planStatus = inPlan ? '✓' : '✗';
      const roleStatus = inRole ? '✓' : '✗';

      console.log(`${permKey}:`);
      console.log(`  ${planStatus} Free Plan`);
      console.log(`  ${roleStatus} Owner Role`);
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkPermissions()
  .then(() => {
    console.log('\n✓ Permission check complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Failed:', err.message);
    process.exit(1);
  });
