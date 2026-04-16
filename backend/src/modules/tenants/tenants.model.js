const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const TenantsModel = {
  async create({ name, subdomain, custom_domain = null }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO tenants (id, name, subdomain, custom_domain) VALUES (?, ?, ?, ?)',
      [id, name, subdomain, custom_domain]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, subdomain, custom_domain, status, created_at, updated_at FROM tenants WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    return rows[0] || null;
  },

  async findBySubdomain(subdomain) {
    const [rows] = await pool.query(
      'SELECT id, name, subdomain, custom_domain, status, created_at FROM tenants WHERE subdomain = ? AND deleted_at IS NULL',
      [subdomain]
    );
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20, status = null } = {}) {
    const offset = (page - 1) * limit;
    const whereClause = status ? 'WHERE t.deleted_at IS NULL AND t.status = ?' : 'WHERE t.deleted_at IS NULL';
    const baseParams = status ? [status] : [];

    const query = `
      SELECT
        t.id, t.name, t.subdomain, t.custom_domain, t.status, t.created_at,
        owner.name  AS owner_name,
        owner.email AS owner_email,
        p.name      AS plan_name,
        p.price_usd AS plan_price
      FROM tenants t
      LEFT JOIN (
        SELECT u.tenant_id, u.name, u.email
        FROM users u
        JOIN roles r ON r.id = u.role_id AND r.name = 'Owner' AND r.is_global = 0
        WHERE u.deleted_at IS NULL
      ) owner ON owner.tenant_id = t.id
      LEFT JOIN subscriptions s
        ON s.tenant_id = t.id AND s.status = 'active' AND s.expires_at > NOW()
      LEFT JOIN plans p ON p.id = s.plan_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [...baseParams, limit, offset]);

    const countQuery = `SELECT COUNT(*) AS total FROM tenants WHERE deleted_at IS NULL${status ? ' AND status = ?' : ''}`;
    const [countRows] = await pool.query(countQuery, baseParams);

    return { data: rows, total: countRows[0].total, page, limit };
  },

  async update(id, fields) {
    const allowed = ['name', 'subdomain', 'custom_domain', 'status'];
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
    await pool.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async softDelete(id) {
    await pool.query('UPDATE tenants SET deleted_at = NOW() WHERE id = ?', [id]);
  },

  async getStats(tenantId) {
    const [[users]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    const [[events]] = await pool.query(
      'SELECT COUNT(*) AS total FROM events WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    const [[invitations]] = await pool.query(
      'SELECT COUNT(*) AS total FROM invitations WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    const [subscription] = await pool.query(
      `SELECT s.status, s.expires_at, p.name AS plan_name
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.tenant_id = ? AND s.status = 'active' ORDER BY s.expires_at DESC LIMIT 1`,
      [tenantId]
    );
    return {
      users: users.total,
      events: events.total,
      invitations: invitations.total,
      subscription: subscription[0] || null,
    };
  },
};

module.exports = TenantsModel;
