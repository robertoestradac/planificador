const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const EventsModel = {
  async create({ tenant_id, name, date, location, map_url }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO events (id, tenant_id, name, date, location, map_url) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tenant_id, name, date, location || null, map_url || null]
    );
    return this.findById(id);
  },

  async findById(id, tenantId = null) {
    let query = `
      SELECT id, tenant_id, name, date, location, map_url, created_at, updated_at
      FROM events WHERE id = ? AND deleted_at IS NULL
    `;
    const params = [id];
    if (tenantId) { query += ' AND tenant_id = ?'; params.push(tenantId); }
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  },

  async findAllByTenant(tenantId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT id, tenant_id, name, date, location, map_url, created_at
       FROM events WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY date DESC LIMIT ? OFFSET ?`,
      [tenantId, limit, offset]
    );
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM events WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    return { data: rows, total, page, limit };
  },

  async update(id, tenantId, fields) {
    const allowed = ['name', 'date', 'location', 'map_url'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!updates.length) return this.findById(id, tenantId);
    values.push(id, tenantId);
    await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    return this.findById(id, tenantId);
  },

  async softDelete(id, tenantId) {
    await pool.query(
      'UPDATE events SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
  },

  async countByTenant(tenantId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM events WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    return total;
  },
};

module.exports = EventsModel;
