const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_FIELDS = [
  'name', 'phone', 'email', 'status',
  'party_size', 'group_name', 'dietary_restrictions', 'notes',
];
const SORT_COLUMNS = {
  name:               'g.name',
  status:             'g.status',
  group_name:         'g.group_name',
  created_at:         'g.created_at',
  confirmed_at:       'r.confirmed_at',
  party_size:         'g.party_size',
  table_number:       'pst.table_number',
  invitation_sent_at: 'g.invitation_sent_at',
};

const GuestsModel = {
  async create({ invitation_id, name, phone, email, party_size, group_name, dietary_restrictions, notes }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO guests (id, invitation_id, name, phone, email, party_size, group_name, dietary_restrictions, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, invitation_id, name,
        phone || null, email || null,
        party_size ?? 1,
        group_name || null,
        dietary_restrictions || null,
        notes || null,
      ]
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
          `INSERT INTO guests (id, invitation_id, name, phone, email, party_size, group_name, dietary_restrictions, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, invitation_id, g.name,
            g.phone || null, g.email || null,
            g.party_size ?? 1,
            g.group_name || null,
            g.dietary_restrictions || null,
            g.notes || null,
          ]
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
      `SELECT g.id, g.invitation_id, g.name, g.phone, g.email, g.status,
              g.party_size, g.group_name, g.dietary_restrictions, g.notes,
              g.checked_in, g.checked_in_at,
              g.invitation_sent_at,
              g.created_at, g.updated_at,
              r.response AS rsvp_response, r.message AS rsvp_message,
              r.party_size_confirmed AS rsvp_party_size,
              r.confirmed_at AS rsvp_confirmed_at,
              i.slug AS invitation_slug, i.title AS invitation_title,
              pst.table_number AS table_number,
              pst.is_bride_table AS is_bride_table,
              ps.seat_index AS seat_index
       FROM guests g
       LEFT JOIN rsvps r       ON r.guest_id      = g.id
       LEFT JOIN invitations i ON i.id            = g.invitation_id
       LEFT JOIN plan_seat_assignments psa ON psa.guest_id = g.id
       LEFT JOIN plan_seats ps             ON ps.id        = psa.seat_id
       LEFT JOIN plan_seating_tables pst   ON pst.id       = ps.table_id
       WHERE g.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findAllByInvitation(invitationId, filters = {}) {
    const {
      page = 1, limit = 50,
      status = null, group_name = null,
      has_email = null, has_phone = null,
      checked_in = null,
      has_table = null,
      sent = null,
      search = null,
      sort_by = 'created_at', sort_dir = 'desc',
    } = filters;
    const offset = (page - 1) * limit;

    const where = ['g.invitation_id = ?'];
    const params = [invitationId];
    if (status)                           { where.push('g.status = ?'); params.push(status); }
    if (group_name)                       { where.push('g.group_name = ?'); params.push(group_name); }
    if (has_email === true  || has_email === 'true')  where.push("g.email IS NOT NULL AND g.email <> ''");
    if (has_email === false || has_email === 'false') where.push("(g.email IS NULL OR g.email = '')");
    if (has_phone === true  || has_phone === 'true')  where.push("g.phone IS NOT NULL AND g.phone <> ''");
    if (has_phone === false || has_phone === 'false') where.push("(g.phone IS NULL OR g.phone = '')");
    if (checked_in === true  || checked_in === 'true')  where.push('g.checked_in = 1');
    if (checked_in === false || checked_in === 'false') where.push('g.checked_in = 0');
    if (has_table === true  || has_table === 'true')  where.push('pst.table_number IS NOT NULL');
    if (has_table === false || has_table === 'false') where.push('pst.table_number IS NULL');
    if (sent === true  || sent === 'true')  where.push('g.invitation_sent_at IS NOT NULL');
    if (sent === false || sent === 'false') where.push('g.invitation_sent_at IS NULL');
    if (search) {
      where.push('(g.name LIKE ? OR g.email LIKE ? OR g.phone LIKE ? OR g.group_name LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const sortCol = SORT_COLUMNS[sort_by] || 'g.created_at';
    const sortDir = String(sort_dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const baseJoins = `
      FROM guests g
      LEFT JOIN rsvps r       ON r.guest_id = g.id
      LEFT JOIN invitations i ON i.id       = g.invitation_id
      LEFT JOIN plan_seat_assignments psa ON psa.guest_id = g.id
      LEFT JOIN plan_seats ps             ON ps.id        = psa.seat_id
      LEFT JOIN plan_seating_tables pst   ON pst.id       = ps.table_id
    `;

    const query = `
      SELECT g.id, g.name, g.phone, g.email, g.status,
             g.party_size, g.group_name, g.dietary_restrictions, g.notes,
             g.checked_in, g.checked_in_at,
             g.invitation_sent_at,
             g.created_at,
             r.response AS rsvp_response, r.message AS rsvp_message,
             r.party_size_confirmed AS rsvp_party_size,
             r.confirmed_at AS rsvp_confirmed_at,
             i.slug AS invitation_slug,
             pst.table_number AS table_number,
             pst.is_bride_table AS is_bride_table,
             ps.seat_index AS seat_index
      ${baseJoins}
      WHERE ${where.join(' AND ')}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT ? OFFSET ?
    `;
    const listParams = [...params, Number(limit), Number(offset)];
    const [rows] = await pool.query(query, listParams);

    const countQuery = `SELECT COUNT(DISTINCT g.id) AS total ${baseJoins} WHERE ${where.join(' AND ')}`;
    const [[{ total }]] = await pool.query(countQuery, params);

    return { data: rows, total, page: Number(page), limit: Number(limit) };
  },

  async findAllByInvitationRaw(invitationId) {
    // Full dump for export (no pagination)
    const [rows] = await pool.query(
      `SELECT g.id, g.name, g.phone, g.email, g.status,
              g.party_size, g.group_name, g.dietary_restrictions, g.notes,
              g.checked_in, g.checked_in_at,
              g.invitation_sent_at,
              g.created_at,
              r.response AS rsvp_response, r.message AS rsvp_message,
              r.confirmed_at AS rsvp_confirmed_at,
              pst.table_number AS table_number,
              ps.seat_index AS seat_index
       FROM guests g
       LEFT JOIN rsvps r ON r.guest_id = g.id
       LEFT JOIN plan_seat_assignments psa ON psa.guest_id = g.id
       LEFT JOIN plan_seats ps             ON ps.id        = psa.seat_id
       LEFT JOIN plan_seating_tables pst   ON pst.id       = ps.table_id
       WHERE g.invitation_id = ?
       ORDER BY g.created_at DESC`,
      [invitationId]
    );
    return rows;
  },

  async update(id, fields) {
    const updates = [];
    const values = [];
    for (const key of ALLOWED_FIELDS) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key] === '' ? null : fields[key]);
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

  async deleteMany(ids) {
    if (!ids || !ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `DELETE FROM guests WHERE id IN (${placeholders})`,
      ids
    );
    return result.affectedRows || 0;
  },

  async countByInvitation(invitationId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM guests WHERE invitation_id = ?',
      [invitationId]
    );
    return total;
  },

  async findDuplicate(invitationId, { email, phone, excludeId = null }) {
    const conditions = [];
    const params = [invitationId];
    if (email) { conditions.push('email = ?'); params.push(email); }
    if (phone) { conditions.push('phone = ?'); params.push(phone); }
    if (!conditions.length) return null;
    let q = `SELECT id, name, email, phone FROM guests
             WHERE invitation_id = ? AND (${conditions.join(' OR ')})`;
    if (excludeId) { q += ' AND id <> ?'; params.push(excludeId); }
    q += ' LIMIT 1';
    const [rows] = await pool.query(q, params);
    return rows[0] || null;
  },

  async getGroups(invitationId) {
    const [rows] = await pool.query(
      `SELECT group_name, COUNT(*) AS count, SUM(party_size) AS total_seats,
              SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
       FROM guests
       WHERE invitation_id = ? AND group_name IS NOT NULL AND group_name <> ''
       GROUP BY group_name
       ORDER BY count DESC`,
      [invitationId]
    );
    return rows;
  },

  // RSVP
  async upsertRsvp(guestId, { response, message, party_size_confirmed }) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO rsvps (id, guest_id, response, message, party_size_confirmed, confirmed_at)
       VALUES (?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         response = VALUES(response),
         message = VALUES(message),
         party_size_confirmed = VALUES(party_size_confirmed),
         confirmed_at = NOW()`,
      [id, guestId, response, message || null, party_size_confirmed ?? null]
    );
    const statusMap = { confirmed: 'confirmed', declined: 'declined', maybe: 'pending' };
    await pool.query(
      'UPDATE guests SET status = ? WHERE id = ?',
      [statusMap[response] || 'pending', guestId]
    );
    return this.findById(guestId);
  },

  async getRsvpStats(invitationId) {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(party_size), 0) AS total_seats,
              SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
              SUM(CASE WHEN status = 'declined'  THEN 1 ELSE 0 END) AS declined,
              SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN checked_in = 1       THEN 1 ELSE 0 END) AS checked_in,
              SUM(CASE WHEN invitation_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS sent,
              COALESCE(SUM(CASE WHEN status = 'confirmed' THEN party_size ELSE 0 END), 0) AS confirmed_seats
       FROM guests
       WHERE invitation_id = ?`,
      [invitationId]
    );

    // response_rate = (confirmed + declined) / total
    const answered = Number(totals.confirmed) + Number(totals.declined);
    const total    = Number(totals.total) || 0;
    const responseRate = total > 0 ? Math.round((answered / total) * 100) : 0;

    return {
      total: Number(totals.total),
      confirmed: Number(totals.confirmed),
      declined: Number(totals.declined),
      pending: Number(totals.pending),
      checked_in: Number(totals.checked_in),
      sent: Number(totals.sent),
      not_sent: Number(totals.total) - Number(totals.sent),
      total_seats: Number(totals.total_seats),
      confirmed_seats: Number(totals.confirmed_seats),
      response_rate: responseRate,
    };
  },

  async getTimeline(invitationId) {
    const [rows] = await pool.query(
      `SELECT DATE(r.confirmed_at) AS date,
              SUM(CASE WHEN r.response = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
              SUM(CASE WHEN r.response = 'declined'  THEN 1 ELSE 0 END) AS declined,
              SUM(CASE WHEN r.response = 'maybe'     THEN 1 ELSE 0 END) AS maybe
       FROM rsvps r
       JOIN guests g ON g.id = r.guest_id
       WHERE g.invitation_id = ?
       GROUP BY DATE(r.confirmed_at)
       ORDER BY DATE(r.confirmed_at) ASC`,
      [invitationId]
    );
    return rows.map(r => ({
      date: r.date,
      confirmed: Number(r.confirmed),
      declined: Number(r.declined),
      maybe: Number(r.maybe),
    }));
  },

  async setCheckIn(id, checkedIn) {
    await pool.query(
      'UPDATE guests SET checked_in = ?, checked_in_at = ? WHERE id = ?',
      [checkedIn ? 1 : 0, checkedIn ? new Date() : null, id]
    );
    return this.findById(id);
  },

  async setSent(id, sent) {
    await pool.query(
      'UPDATE guests SET invitation_sent_at = ? WHERE id = ?',
      [sent ? new Date() : null, id]
    );
    return this.findById(id);
  },

  async setSentMany(ids, sent) {
    if (!ids || !ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE guests SET invitation_sent_at = ? WHERE id IN (${placeholders})`,
      [sent ? new Date() : null, ...ids]
    );
    return result.affectedRows;
  },

  async updateStatusMany(ids, status) {
    if (!ids || !ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const [result] = await pool.query(
      `UPDATE guests SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    );
    return result.affectedRows || 0;
  },
};

module.exports = GuestsModel;
