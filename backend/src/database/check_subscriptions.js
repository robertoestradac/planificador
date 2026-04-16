const { pool } = require('./connection');
const { v4: uuidv4 } = require('uuid');

async function checkSubscriptions() {
  try {
    // Get all tenants without active subscriptions
    const [tenantsWithoutSub] = await pool.query(`
      SELECT t.id, t.name, t.subdomain, u.email as owner_email
      FROM tenants t
      LEFT JOIN subscriptions s ON s.tenant_id = t.id AND s.status = 'active' AND s.expires_at > NOW()
      LEFT JOIN users u ON u.tenant_id = t.id AND u.role_id = (SELECT id FROM roles WHERE name = 'Owner' LIMIT 1)
      WHERE t.deleted_at IS NULL
        AND s.id IS NULL
      GROUP BY t.id
    `);

    console.log(`Found ${tenantsWithoutSub.length} tenants without active subscriptions\n`);

    if (tenantsWithoutSub.length === 0) {
      console.log('✓ All tenants have active subscriptions');
      return;
    }

    // Get free plan
    const [[freePlan]] = await pool.query(
      'SELECT id FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1'
    );

    if (!freePlan) {
      console.error('✗ No free plan found! Run ensure_free_plan.js first');
      return;
    }

    console.log('Free plan ID:', freePlan.id);
    console.log('\nTenants without subscriptions:');
    
    for (const tenant of tenantsWithoutSub) {
      console.log(`\n- ${tenant.name} (${tenant.subdomain})`);
      console.log(`  Owner: ${tenant.owner_email || 'N/A'}`);
      
      // Create subscription for this tenant
      const now = new Date();
      const expires = new Date(now);
      expires.setFullYear(expires.getFullYear() + 1);
      
      await pool.query(
        `INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), tenant.id, freePlan.id, now, expires, 'active']
      );
      
      console.log('  ✓ Created free plan subscription');
    }

    console.log('\n✓ All tenants now have subscriptions');

  } catch (error) {
    console.error('Error checking subscriptions:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

checkSubscriptions()
  .then(() => {
    console.log('\n✓ Subscription check complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Failed:', err.message);
    process.exit(1);
  });
