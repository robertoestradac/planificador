/**
 * Clean extra spaces from SMTP configuration
 * Run this if re-saving in UI doesn't work
 */

const { pool } = require('./connection');

async function cleanSmtpSpaces() {
  try {
    console.log('🧹 Cleaning SMTP configuration...');
    
    // Get current config
    const [rows] = await pool.query('SELECT * FROM smtp_config WHERE id = 1');
    
    if (rows.length === 0) {
      console.log('❌ No SMTP configuration found');
      return;
    }
    
    const current = rows[0];
    console.log('\n📋 Current configuration:');
    console.log(`Host: "${current.host}" (length: ${current.host?.length || 0})`);
    console.log(`User: "${current.user}" (length: ${current.user?.length || 0})`);
    console.log(`Password: "${current.password}" (length: ${current.password?.length || 0})`);
    console.log(`From Email: "${current.from_email}" (length: ${current.from_email?.length || 0})`);
    console.log(`From Name: "${current.from_name}" (length: ${current.from_name?.length || 0})`);
    
    // Clean spaces
    const [result] = await pool.query(`
      UPDATE smtp_config 
      SET 
        host = TRIM(host),
        user = TRIM(user),
        password = TRIM(password),
        from_email = TRIM(from_email),
        from_name = TRIM(from_name)
      WHERE id = 1
    `);
    
    // Get cleaned config
    const [cleanedRows] = await pool.query('SELECT * FROM smtp_config WHERE id = 1');
    const cleaned = cleanedRows[0];
    
    console.log('\n✅ Cleaned configuration:');
    console.log(`Host: "${cleaned.host}" (length: ${cleaned.host?.length || 0})`);
    console.log(`User: "${cleaned.user}" (length: ${cleaned.user?.length || 0})`);
    console.log(`Password: "${cleaned.password}" (length: ${cleaned.password?.length || 0})`);
    console.log(`From Email: "${cleaned.from_email}" (length: ${cleaned.from_email?.length || 0})`);
    console.log(`From Name: "${cleaned.from_name}" (length: ${cleaned.from_name?.length || 0})`);
    
    console.log(`\n✨ Updated ${result.affectedRows} row(s)`);
    console.log('🎉 SMTP configuration cleaned successfully!');
    console.log('\n💡 Now restart your backend server and test the connection.');
    
  } catch (error) {
    console.error('❌ Error cleaning SMTP config:', error.message);
  } finally {
    await pool.end();
  }
}

cleanSmtpSpaces();
