const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const TemplatesModel = {
  async create({ name, preview_image, base_json, category, created_by }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO templates (id, name, preview_image, base_json, category, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, preview_image || null, base_json || null, category || null, created_by || null]
    );
    return this.findById(id);
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, preview_image, base_json, category, is_active, created_by, created_at, updated_at FROM templates WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ active_only = true, category = null } = {}) {
    let query = 'SELECT id, name, preview_image, category, is_active, created_at, (base_json IS NOT NULL AND base_json != \'\') AS has_content FROM templates WHERE 1=1';
    const params = [];
    if (active_only) { query += ' AND is_active = 1'; }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async update(id, fields) {
    const allowed = ['name', 'preview_image', 'base_json', 'category', 'is_active', 'created_by'];
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
    await pool.query(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM templates WHERE id = ?', [id]);
  },
};

module.exports = TemplatesModel;
