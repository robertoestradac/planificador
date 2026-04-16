const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const UsersModel = {
  async create({ tenant_id, role_id, name, email, password_hash }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, tenant_id, role_id, name, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id || null, role_id, name, email, password_hash]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.status, u.created_at, u.updated_at,
              r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async findByEmail(email, tenantId = null) {
    const [rows] = await pool.query(
      `SELECT id FROM users WHERE email = ? AND tenant_id ${tenantId ? '= ?' : 'IS NULL'} AND deleted_at IS NULL`,
      tenantId ? [email, tenantId] : [email]
    );
    return rows[0] || null;
  },

  async findAllByTenant(tenantId, { page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT u.id, u.name, u.email, u.status, u.created_at,
             r.name AS role_name, r.id AS role_id
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.tenant_id = ? AND u.deleted_at IS NULL
    `;
    const params = [tenantId];

    if (status) { query += ' AND u.status = ?'; params.push(status); }
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND deleted_at IS NULL' + (status ? ' AND status = ?' : ''),
      status ? [tenantId, status] : [tenantId]
    );
    return { data: rows, total, page, limit };
  },

  async update(id, fields) {
    const allowed = ['name', 'email', 'role_id', 'status', 'password_hash'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (!updates.length) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async softDelete(id) {
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = ?', [id]);
  },

  async countByTenant(tenantId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND deleted_at IS NULL AND status = "active"',
      [tenantId]
    );
    return total;
  },
};

module.exports = UsersModel;
