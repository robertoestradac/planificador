const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const PlansModel = {
  async create({ name, price_usd, price_gtq, max_events, max_guests, max_users, duration_months = 1 }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO plans (id, name, price_usd, price_gtq, max_events, max_guests, max_users, duration_months) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, price_usd, price_gtq, max_events ?? null, max_guests ?? null, max_users ?? null, duration_months]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, price_usd, price_gtq, max_events, max_guests, max_users, duration_months, is_active, created_at, updated_at FROM plans WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ active_only = false } = {}) {
    let query = 'SELECT id, name, price_usd, price_gtq, max_events, max_guests, max_users, duration_months, is_active, created_at FROM plans';
    if (active_only) query += ' WHERE is_active = 1';
    query += ' ORDER BY price_usd ASC';
    const [rows] = await pool.query(query);
    return rows;
  },

  async update(id, fields) {
    const allowed = ['name', 'price_usd', 'price_gtq', 'max_events', 'max_guests', 'max_users', 'duration_months', 'is_active'];
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
    await pool.query(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM plans WHERE id = ?', [id]);
  },

  async getPermissions(planId) {
    const [rows] = await pool.query(
      `SELECT p.id, p.key_name, p.description
       FROM plan_permissions pp
       JOIN permissions p ON p.id = pp.permission_id
       WHERE pp.plan_id = ?
       ORDER BY p.key_name`,
      [planId]
    );
    return rows;
  },

  async setPermissions(planId, permissionIds) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM plan_permissions WHERE plan_id = ?', [planId]);
      for (const permId of permissionIds) {
        await conn.query(
          'INSERT IGNORE INTO plan_permissions (plan_id, permission_id) VALUES (?, ?)',
          [planId, permId]
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

  async addPermission(planId, permissionId) {
    await pool.query(
      'INSERT IGNORE INTO plan_permissions (plan_id, permission_id) VALUES (?, ?)',
      [planId, permissionId]
    );
  },

  async removePermission(planId, permissionId) {
    await pool.query(
      'DELETE FROM plan_permissions WHERE plan_id = ? AND permission_id = ?',
      [planId, permissionId]
    );
  },
};

module.exports = PlansModel;
