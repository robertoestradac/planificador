const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const AuthModel = {
  async findUserByEmail(email, tenantId = null) {
    let query = `
      SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.password_hash,
             u.email_verified, u.totp_secret, u.totp_enabled, u.status,
             r.name AS role_name, r.is_global
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = ? AND u.deleted_at IS NULL
    `;
    const params = [email];

    if (tenantId !== null) {
      query += ' AND u.tenant_id = ?';
      params.push(tenantId);
    }

    query += ' ORDER BY u.tenant_id IS NULL DESC LIMIT 1';

    const [rows] = await pool.query(query, params);
    return rows[0] || null;
  },

  async findUserById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.status,
              u.totp_secret, u.totp_enabled,
              r.name AS role_name, r.is_global
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0] || null;
  },

  async saveRefreshToken(userId, token, expiresAt) {
    const id = uuidv4();
    const tokenHash = hashToken(token);
    await pool.query(
      'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
      [id, userId, tokenHash, expiresAt]
    );
    return id;
  },

  async findRefreshToken(token) {
    const tokenHash = hashToken(token);
    const [rows] = await pool.query(
      `SELECT id, user_id, expires_at, revoked
       FROM refresh_tokens
       WHERE token_hash = ? AND revoked = 0 AND expires_at > NOW()`,
      [tokenHash]
    );
    return rows[0] || null;
  },

  async revokeRefreshToken(token) {
    const tokenHash = hashToken(token);
    await pool.query(
      'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?',
      [tokenHash]
    );
  },

  async revokeAllUserTokens(userId) {
    await pool.query(
      'UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?',
      [userId]
    );
  },

  async cleanExpiredTokens() {
    await pool.query('DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = 1');
  },

  async setTotpSecret(userId, secret) {
    await pool.query('UPDATE users SET totp_secret = ? WHERE id = ?', [secret, userId]);
  },

  async enableTotp(userId) {
    await pool.query('UPDATE users SET totp_enabled = 1 WHERE id = ?', [userId]);
  },

  async disableTotp(userId) {
    await pool.query('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?', [userId]);
  },

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  async setVerificationToken(userId, token, expiresAt) {
    await pool.query(
      'UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?',
      [token, expiresAt, userId]
    );
  },

  async findUserByVerificationToken(token) {
    const [rows] = await pool.query(
      `SELECT u.id, u.tenant_id, u.role_id, u.name, u.email, u.email_verified,
              u.email_verification_expires, u.status,
              r.name AS role_name, r.is_global
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email_verification_token = ? 
       AND u.deleted_at IS NULL`,
      [token]
    );
    return rows[0] || null;
  },

  async verifyEmail(userId) {
    await pool.query(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
      [userId]
    );
  },

  async isEmailVerified(userId) {
    const [rows] = await pool.query(
      'SELECT email_verified FROM users WHERE id = ?',
      [userId]
    );
    return rows[0]?.email_verified === 1;
  },
};

module.exports = AuthModel;
