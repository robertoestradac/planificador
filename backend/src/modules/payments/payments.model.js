const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const PaymentsModel = {
  async create({ tenant_id, plan_id, amount, currency = 'USD', method = 'bank_transfer', reference = null, notes = null }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO payments (id, tenant_id, plan_id, amount, currency, method, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenant_id, plan_id, amount, currency, method, reference, notes]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT pm.*, p.name AS plan_name, p.max_events, p.max_invitations, p.max_guests,
              t.name AS tenant_name, t.subdomain,
              u.name AS confirmed_by_name
       FROM payments pm
       JOIN plans p  ON p.id  = pm.plan_id
       JOIN tenants t ON t.id = pm.tenant_id
       LEFT JOIN users u ON u.id = pm.confirmed_by
       WHERE pm.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ page = 1, limit = 20, tenant_id = null, status = null, method = null } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (tenant_id) { conditions.push('pm.tenant_id = ?'); params.push(tenant_id); }
    if (status)    { conditions.push('pm.status = ?');    params.push(status); }
    if (method)    { conditions.push('pm.method = ?');    params.push(method); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT pm.*, p.name AS plan_name, p.price_usd,
              t.name AS tenant_name, t.subdomain,
              u.name AS confirmed_by_name
       FROM payments pm
       JOIN plans p   ON p.id  = pm.plan_id
       JOIN tenants t ON t.id  = pm.tenant_id
       LEFT JOIN users u ON u.id = pm.confirmed_by
       ${where}
       ORDER BY pm.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM payments pm ${where}`, params
    );

    return { data: rows, total, page, limit };
  },

  async findByTenant(tenantId, { page = 1, limit = 20 } = {}) {
    return this.findAll({ tenant_id: tenantId, page, limit });
  },

  async update(id, fields) {
    const allowed = ['plan_id', 'amount', 'currency', 'method', 'reference', 'notes'];
    const updates = [];
    const values  = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!updates.length) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE payments SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async updateStatus(id, { status, confirmed_by = null }) {
    await pool.query(
      `UPDATE payments SET status = ?, confirmed_by = ?, confirmed_at = ?
       WHERE id = ?`,
      [status, confirmed_by, status === 'confirmed' ? new Date() : null, id]
    );
    return this.findById(id);
  },

  async getStats() {
    const [[row]] = await pool.query(
      `SELECT
         COUNT(*)                                                        AS total,
         SUM(status = 'pending')                                         AS pending,
         SUM(status = 'confirmed')                                       AS confirmed,
         SUM(status = 'rejected')                                        AS rejected,
         COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount END),0) AS total_confirmed_amount,
         COALESCE(SUM(CASE WHEN status = 'confirmed'
                            AND MONTH(confirmed_at) = MONTH(NOW())
                            AND YEAR(confirmed_at)  = YEAR(NOW())
                           THEN amount END), 0)                         AS amount_this_month
       FROM payments`
    );
    return row;
  },
};

module.exports = PaymentsModel;
