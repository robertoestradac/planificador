const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const PermissionsModel = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, key_name, description, created_at FROM permissions ORDER BY key_name'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, key_name, description, created_at FROM permissions WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByKey(key_name) {
    const [rows] = await pool.query(
      'SELECT id, key_name, description FROM permissions WHERE key_name = ?',
      [key_name]
    );
    return rows[0] || null;
  },

  async create({ key_name, description }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO permissions (id, key_name, description) VALUES (?, ?, ?)',
      [id, key_name, description]
    );
    return this.findById(id);
  },

  async update(id, { key_name, description }) {
    const updates = [];
    const values = [];
    if (key_name) { updates.push('key_name = ?'); values.push(key_name); }
    if (description) { updates.push('description = ?'); values.push(description); }
    if (!updates.length) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE permissions SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM permissions WHERE id = ?', [id]);
  },
};

module.exports = PermissionsModel;
