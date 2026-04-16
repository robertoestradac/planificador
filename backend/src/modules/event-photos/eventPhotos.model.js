const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const create = async ({ invitation_id, uploader_name, photo_url, filename }) => {
  const id = uuidv4();
  await pool.execute(
    `INSERT INTO event_photos (id, invitation_id, uploader_name, photo_url, filename) VALUES (?, ?, ?, ?, ?)`,
    [id, invitation_id, uploader_name || null, photo_url, filename]
  );
  return { id, invitation_id, uploader_name, photo_url, filename };
};

const findByInvitation = async (invitation_id, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT id, invitation_id, uploader_name, photo_url, filename, created_at
     FROM event_photos
     WHERE invitation_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [invitation_id, String(limit), String(offset)]
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM event_photos WHERE invitation_id = ?`,
    [invitation_id]
  );
  return { photos: rows, total, page, limit };
};

const findById = async (id) => {
  const [rows] = await pool.execute(`SELECT * FROM event_photos WHERE id = ?`, [id]);
  return rows[0] || null;
};

const deleteById = async (id) => {
  const [result] = await pool.execute(`DELETE FROM event_photos WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

const findByEvent = async (event_id, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT ep.id, ep.invitation_id, ep.uploader_name, ep.photo_url, ep.filename, ep.created_at,
            i.title AS invitation_title
     FROM event_photos ep
     JOIN invitations i ON i.id = ep.invitation_id
     WHERE i.event_id = ? AND i.deleted_at IS NULL
     ORDER BY ep.created_at DESC
     LIMIT ? OFFSET ?`,
    [event_id, String(limit), String(offset)]
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) as total FROM event_photos ep
     JOIN invitations i ON i.id = ep.invitation_id
     WHERE i.event_id = ? AND i.deleted_at IS NULL`,
    [event_id]
  );
  return { photos: rows, total, page, limit };
};

module.exports = { create, findByInvitation, findByEvent, findById, deleteById };
