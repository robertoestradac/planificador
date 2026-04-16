const { getTenantCredits } = require('./src/utils/credits');
const { pool } = require('./src/database/connection');

async function testCredits() {
  try {
    // Get tenant ID for owner@demo.com
    const [[user]] = await pool.query(
      'SELECT tenant_id, name FROM users WHERE email = ?',
      ['owner@demo.com']
    );

    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }

    console.log(`\n=== Testing Credits for ${user.name} ===\n`);
    console.log(`Tenant ID: ${user.tenant_id}\n`);

    const credits = await getTenantCredits(user.tenant_id);

    console.log('Credits Result:');
    console.log(JSON.stringify(credits, null, 2));

    console.log('\n=== Analysis ===');
    console.log(`Events: ${credits.events.used}/${credits.events.total} (${credits.events.available} available)`);
    console.log(`Invitations: ${credits.invitations.used}/${credits.invitations.total} (${credits.invitations.available} available)`);
    console.log(`Guests: ${credits.guests.used}/${credits.guests.total} (${credits.guests.available} available)`);
    console.log(`Users: ${credits.users.used}/${credits.users.total} (${credits.users.available} available)`);

    if (credits.events.available > 0) {
      console.log('\n✓ User CAN create events');
    } else {
      console.log('\n❌ User CANNOT create events (limit reached)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testCredits();
