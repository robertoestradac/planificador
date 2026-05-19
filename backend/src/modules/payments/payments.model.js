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

  /**
   * Historial completo del tenant: pagos reales + suscripciones de planes
   * de pago que aún no tienen un pago registrado.
   *
   * Reglas:
   *  - Pagos reales se muestran tal cual (con su status real)
   *  - Suscripciones a plan gratuito (price_usd = 0) NO se incluyen
   *  - Suscripciones a plan de pago sin pago asociado se muestran como
   *    pagos sintéticos en estado "confirmed" (la suscripción está activa,
   *    así que el plan fue otorgado por el admin sin registro de pago)
   *
   * Los pagos sintéticos llevan id con prefijo "sub:" para que el frontend
   * los pueda distinguir si lo necesita.
   */
  async findHistoryByTenant(tenantId, { page = 1, limit = 50 } = {}) {
    // 1. Pagos reales del tenant
    const [paymentRows] = await pool.query(
      `SELECT pm.id, pm.tenant_id, pm.plan_id, pm.amount, pm.currency,
              pm.method, pm.reference, pm.notes, pm.status,
              pm.created_at, pm.confirmed_at,
              p.name AS plan_name, p.price_usd, p.max_events, p.max_guests,
              u.name AS confirmed_by_name,
              'payment' AS source
       FROM payments pm
       JOIN plans p ON p.id = pm.plan_id
       LEFT JOIN users u ON u.id = pm.confirmed_by
       WHERE pm.tenant_id = ?`,
      [tenantId]
    );

    // 2. Suscripciones a plan de pago (price_usd > 0) sin NINGUN pago del mismo plan
    const [subRows] = await pool.query(
      `SELECT s.id, s.tenant_id, s.plan_id,
              p.price_usd AS amount, 'USD' AS currency,
              'admin_assigned' AS method,
              NULL AS reference, NULL AS notes,
              CASE WHEN s.status = 'active' THEN 'confirmed' ELSE s.status END AS status,
              COALESCE(s.created_at, s.starts_at) AS created_at,
              COALESCE(s.created_at, s.starts_at) AS confirmed_at,
              p.name AS plan_name, p.price_usd, p.max_events, p.max_guests,
              NULL AS confirmed_by_name,
              'subscription' AS source
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.tenant_id = ?
         AND p.price_usd > 0
         AND NOT EXISTS (
           SELECT 1 FROM payments pm
           WHERE pm.tenant_id = s.tenant_id
             AND pm.plan_id = s.plan_id
             AND pm.status = 'confirmed'
         )`,
      [tenantId]
    );

    // 3. Marcar el id de las suscripciones para distinguirlas en el frontend
    const synthetic = subRows.map((r) => ({ ...r, id: `sub:${r.id}` }));

    // 4. Combinar y ordenar por fecha desc
    const combined = [...paymentRows, ...synthetic].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // 5. Paginar en memoria (volúmenes pequeños por tenant)
    const offset = (page - 1) * limit;
    const sliced = combined.slice(offset, offset + limit);

    return { data: sliced, total: combined.length, page, limit };
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
