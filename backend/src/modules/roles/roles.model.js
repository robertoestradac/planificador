const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const RolesModel = {
  async create({ tenant_id = null, name, is_global = 0 }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO roles (id, tenant_id, name, is_global) VALUES (?, ?, ?, ?)',
      [id, tenant_id, name, is_global]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, tenant_id, name, is_global, created_at, updated_at FROM roles WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ tenant_id = null, include_global = true } = {}) {
    let query = 'SELECT id, tenant_id, name, is_global, created_at FROM roles WHERE 1=1';
    const params = [];

    if (tenant_id) {
      query += include_global
        ? ' AND (tenant_id = ? OR is_global = 1)'
        : ' AND tenant_id = ?';
      params.push(tenant_id);
    } else {
      query += ' AND is_global = 1';
    }

    query += ' ORDER BY is_global DESC, name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async update(id, { name }) {
    await pool.query('UPDATE roles SET name = ? WHERE id = ?', [name, id]);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM roles WHERE id = ?', [id]);
  },

  async getPermissions(roleId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.key_name, p.description
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.key_name`,
      [roleId]
    );
    return rows;
  },

  async setPermissions(roleId, permissionIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      for (const permId of permissionIds) {
        await conn.query(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]
        );
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async addPermission(roleId, permissionId) {
    await pool.query(
      'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permissionId]
    );
  },

  async removePermission(roleId, permissionId) {
    await pool.query(
      'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?',
      [roleId, permissionId]
    );
  },
};

module.exports = RolesModel;
