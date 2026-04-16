const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const GuestsModel = {
  async create({ invitation_id, name, phone, email }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO guests (id, invitation_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
      [id, invitation_id, name, phone || null, email || null]
    );
    return this.findById(id);
  },

  async createBulk(invitation_id, guests) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const created = [];
      for (const g of guests) {
        const id = uuidv4();
        await conn.query(
          'INSERT INTO guests (id, invitation_id, name, phone, email) VALUES (?, ?, ?, ?, ?)',
          [id, invitation_id, g.name, g.phone || null, g.email || null]
        );
        created.push(id);
      }
      await conn.commit();
      return created;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT g.id, g.invitation_id, g.name, g.phone, g.email, g.status, g.created_at, g.updated_at,
              r.response AS rsvp_response, r.message AS rsvp_message, r.confirmed_at AS rsvp_confirmed_at
       FROM guests g
       LEFT JOIN rsvps r ON r.guest_id = g.id
       WHERE g.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findAllByInvitation(invitationId, { page = 1, limit = 50, status = null } = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT g.id, g.name, g.phone, g.email, g.status, g.created_at,
             r.response AS rsvp_response, r.confirmed_at AS rsvp_confirmed_at
      FROM guests g
      LEFT JOIN rsvps r ON r.guest_id = g.id
      WHERE g.invitation_id = ?
    `;
    const params = [invitationId];
    if (status) { query += ' AND g.status = ?'; params.push(status); }
    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM guests WHERE invitation_id = ?',
      [invitationId]
    );
    return { data: rows, total, page, limit };
  },

  async update(id, fields) {
    const allowed = ['name', 'phone', 'email', 'status'];
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
    await pool.query(`UPDATE guests SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    await pool.query('DELETE FROM guests WHERE id = ?', [id]);
  },

  async countByInvitation(invitationId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM guests WHERE invitation_id = ?',
      [invitationId]
    );
    return total;
  },

  // RSVP
  async upsertRsvp(guestId, { response, message }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO rsvps (id, guest_id, response, message, confirmed_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE response = VALUES(response), message = VALUES(message), confirmed_at = NOW()`,
      [id, guestId, response, message || null]
    );
    // Update guest status
    const statusMap = { confirmed: 'confirmed', declined: 'declined', maybe: 'pending' };
    await pool.query('UPDATE guests SET status = ? WHERE id = ?', [statusMap[response] || 'pending', guestId]);
    return this.findById(guestId);
  },

  async getRsvpStats(invitationId) {
    const [rows] = await pool.query(
      `SELECT r.response, COUNT(*) AS count
       FROM rsvps r
       JOIN guests g ON g.id = r.guest_id
       WHERE g.invitation_id = ?
       GROUP BY r.response`,
      [invitationId]
    );
    const stats = { confirmed: 0, declined: 0, maybe: 0, pending: 0 };
    for (const row of rows) {
      stats[row.response] = row.count;
    }
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM guests WHERE invitation_id = ?',
      [invitationId]
    );
    stats.total = total;
    stats.pending = total - rows.reduce((acc, r) => acc + r.count, 0);
    return stats;
  },
};

module.exports = GuestsModel;
