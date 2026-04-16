const { pool } = require('./connection');
const { v4: uuidv4 } = require('uuid');

async function fixOwnerPermissions() {
  try {
    // Get Owner role
    const [[ownerRole]] = await pool.query(
      'SELECT id, name FROM roles WHERE name = ? AND is_global = 0 LIMIT 1',
      ['Owner']
    );

    if (!ownerRole) {
      console.error('✗ Owner role not found!');
      return;
    }

    console.log('Owner role ID:', ownerRole.id);

    // Get all permissions
    const [allPermissions] = await pool.query('SELECT id, key_name FROM permissions');
    console.log(`Total permissions in system: ${allPermissions.length}`);

    // Get current Owner permissions
    const [currentPerms] = await pool.query(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?',
      [ownerRole.id]
    );
    
    const currentPermIds = new Set(currentPerms.map(p => p.permission_id));
    console.log(`Owner currently has: ${currentPermIds.size} permissions`);

    // Find missing permissions
    const missingPerms = allPermissions.filter(p => !currentPermIds.has(p.id));
    
    if (missingPerms.length === 0) {
      console.log('✓ Owner role already has all permissions');
      return;
    }

    console.log(`\nAdding ${missingPerms.length} missing permissions to Owner role:`);
    missingPerms.forEach(p => console.log(`  - ${p.key_name}`));

    // Add missing permissions
    const values = missingPerms.map(p => [uuidv4(), ownerRole.id, p.id]);
    await pool.query(
      'INSERT INTO role_permissions (id, role_id, permission_id) VALUES ?',
      [values]
    );

    console.log(`\n✓ Added ${missingPerms.length} permissions to Owner role`);
    console.log(`✓ Owner now has all ${allPermissions.length} permissions`);

  } catch (error) {
    console.error('Error fixing Owner permissions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixOwnerPermissions()
  .then(() => {
    console.log('\n✓ Owner permissions fixed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Failed:', err.message);
    process.exit(1);
  });
