const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const InvitationsModel = {
  async create({ tenant_id, event_id, template_id, title, slug, builder_json, html, css }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO invitations (id, tenant_id, event_id, template_id, title, slug, builder_json, html, css)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tenant_id, event_id, template_id || null, title, slug, builder_json || null, html || null, css || null]
    );
    return this.findById(id, tenant_id);
  },

  async findById(id, tenantId = null) {
    let query = `
      SELECT i.id, i.tenant_id, i.event_id, i.template_id, i.title, i.slug,
             i.builder_json, i.html, i.css, i.status, i.published_at,
             i.created_at, i.updated_at,
             e.name AS event_name, e.date AS event_date, e.location AS event_location, e.map_url AS event_map_url,
             t.name AS template_name
      FROM invitations i
      LEFT JOIN events e ON e.id = i.event_id
      LEFT JOIN templates t ON t.id = i.template_id
      WHERE i.id = ? AND i.deleted_at IS NULL
    `;
    const params = [id];
    if (tenantId) { query += ' AND i.tenant_id = ?'; params.push(tenantId); }
    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  },

  async findBySlug(slug) {
    const [rows] = await pool.query(
      `SELECT i.id, i.tenant_id, i.event_id, i.title, i.slug,
              i.builder_json, i.html, i.css, i.status, i.published_at,
              e.name AS event_name, e.date AS event_date,
              e.location AS event_location, e.map_url AS event_map_url
       FROM invitations i
       LEFT JOIN events e ON e.id = i.event_id
       WHERE i.slug = ? AND i.status = 'published' AND i.deleted_at IS NULL`,
      [slug]
    );
    return rows[0] || null;
  },

  async findAllByTenant(tenantId, { page = 1, limit = 20, status = null, event_id = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT i.id, i.event_id, i.template_id, i.title, i.slug, i.status, i.published_at, i.created_at,
             e.name AS event_name
      FROM invitations i
      LEFT JOIN events e ON e.id = i.event_id
      WHERE i.tenant_id = ? AND i.deleted_at IS NULL
    `;
    const params = [tenantId];
    if (status) { query += ' AND i.status = ?'; params.push(status); }
    if (event_id) { query += ' AND i.event_id = ?'; params.push(event_id); }
    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM invitations WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    return { data: rows, total, page, limit };
  },

  async update(id, tenantId, fields) {
    const allowed = ['title', 'slug', 'builder_json', 'html', 'css', 'status', 'published_at', 'template_id'];
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
      `UPDATE invitations SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    return this.findById(id, tenantId);
  },

  async softDelete(id, tenantId) {
    await pool.query(
      'UPDATE invitations SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
  },

  async countByTenant(tenantId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM invitations WHERE tenant_id = ? AND deleted_at IS NULL',
      [tenantId]
    );
    return total;
  },

  async slugExists(slug, excludeId = null) {
    let query = 'SELECT id FROM invitations WHERE slug = ? AND deleted_at IS NULL';
    const params = [slug];
    if (excludeId) { query += ' AND id != ?'; params.push(excludeId); }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  },
};

module.exports = InvitationsModel;
