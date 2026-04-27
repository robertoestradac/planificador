require('dotenv').config();
const { pool } = require('./connection');

async function checkUserRole() {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, r.is_global
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = 'roberto.estrada.c@gmail.com'
    `);
    
    console.log('Usuario:', JSON.stringify(users, null, 2));
    
    const [superAdminRole] = await pool.query(`
      SELECT id, name FROM roles WHERE name = 'SuperAdmin' AND is_global = 1
    `);
    
    console.log('\nRol SuperAdmin:', JSON.stringify(superAdminRole, null, 2));
    
    if (users.length > 0 && superAdminRole.length > 0) {
      const user = users[0];
      const correctRole = superAdminRole[0];
      
      if (user.role_id !== correctRole.id) {
        console.log('\n⚠️  El usuario tiene el rol incorrecto. Corrigiendo...');
        await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [correctRole.id, user.id]);
        console.log('✅ Rol actualizado a SuperAdmin');
      } else {
        console.log('\n✅ El usuario ya tiene el rol SuperAdmin correcto');
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserRole();
