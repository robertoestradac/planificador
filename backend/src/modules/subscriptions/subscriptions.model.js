const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const SubscriptionsModel = {
  async create({ tenant_id, plan_id, starts_at, expires_at, status = 'active' }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, plan_id, starts_at, expires_at, status]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT s.id, s.tenant_id, s.plan_id, s.starts_at, s.expires_at, s.status,
              s.created_at, s.updated_at,
              p.name AS plan_name, p.price_usd, p.price_gtq,
              p.max_events, p.max_guests, p.max_users
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findActiveByTenant(tenantId) {
    const [rows] = await pool.query(
      `SELECT s.id, s.tenant_id, s.plan_id, s.starts_at, s.expires_at, s.status,
              p.name AS plan_name, p.price_usd, p.price_gtq,
              p.max_events, p.max_guests, p.max_users
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.tenant_id = ? AND s.status = 'active' AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC LIMIT 1`,
      [tenantId]
    );
    return rows[0] || null;
  },

  async findAllByTenant(tenantId) {
    const [rows] = await pool.query(
      `SELECT s.id, s.plan_id, s.starts_at, s.expires_at, s.status, s.created_at,
              p.name AS plan_name, p.price_usd, p.price_gtq
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.tenant_id = ?
       ORDER BY s.created_at DESC`,
      [tenantId]
    );
    return rows;
  },

  async findAll({ page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT s.id, s.tenant_id, s.plan_id, s.starts_at, s.expires_at, s.status, s.created_at,
             t.name AS tenant_name, t.subdomain,
             p.name AS plan_name, p.price_usd
      FROM subscriptions s
      JOIN tenants t ON t.id = s.tenant_id
      JOIN plans p ON p.id = s.plan_id
      WHERE 1=1
    `;
    const params = [];
    if (status) { query += ' AND s.status = ?'; params.push(status); }
    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async update(id, fields) {
    const allowed = ['plan_id', 'starts_at', 'expires_at', 'status'];
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
    await pool.query(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async cancelByTenant(tenantId) {
    await pool.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE tenant_id = ? AND status = 'active'",
      [tenantId]
    );
  },

  async getLimitsUsage(tenantId) {
    const [
      [[events]],
      [[users]],
      [[guests]],
    ] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) AS total FROM events WHERE tenant_id = ? AND deleted_at IS NULL',
        [tenantId]
      ),
      pool.query(
        'SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND deleted_at IS NULL AND status = "active"',
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM guests g
         JOIN invitations i ON i.id = g.invitation_id
         WHERE i.tenant_id = ?`,
        [tenantId]
      ),
    ]);
    return {
      events_used: events.total,
      users_used:  users.total,
      guests_used: guests.total,
    };
  },
};

module.exports = SubscriptionsModel;
