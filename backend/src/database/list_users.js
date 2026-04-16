const { pool } = require('./connection');

async function listUsers() {
  try {
    const [users] = await pool.query(
      `SELECT u.id, u.name, u.email, u.status,
              r.name as role_name, r.is_global,
              t.name as tenant_name, t.subdomain
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN tenants t ON t.id = u.tenant_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC`
    );

    console.log(`\n=== Usuarios en el sistema (${users.length} total) ===\n`);

    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name} (${u.email})`);
      console.log(`   Role: ${u.role_name} ${u.is_global ? '(global)' : '(tenant)'}`);
      console.log(`   Tenant: ${u.tenant_name || 'N/A'} ${u.subdomain ? `(${u.subdomain})` : ''}`);
      console.log(`   Status: ${u.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

listUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
