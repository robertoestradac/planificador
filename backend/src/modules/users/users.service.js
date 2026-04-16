const bcrypt = require('bcryptjs');
const UsersModel = require('./users.model');
const { pool } = require('../../database/connection');
const AppError = require('../../utils/AppError');

const UsersService = {
  async create({ tenant_id, role_id, name, email, password }, requestingUser) {
    // Check plan user limit
    if (tenant_id) {
      const [subRows] = await pool.query(
        `SELECT s.plan_id, p.max_users FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.tenant_id = ? AND s.status = 'active' AND s.expires_at > NOW()
         ORDER BY s.expires_at DESC LIMIT 1`,
        [tenant_id]
      );
      if (subRows.length && subRows[0].max_users !== null) {
        const currentCount = await UsersModel.countByTenant(tenant_id);
        if (currentCount >= subRows[0].max_users) {
          throw new AppError(
            `User limit reached for your plan (max: ${subRows[0].max_users}). Please upgrade.`,
            403
          );
        }
      }
    }

    const existing = await UsersModel.findByEmail(email, tenant_id);
    if (existing) throw new AppError('Email already in use', 409);

    const password_hash = await bcrypt.hash(password, 12);
    return UsersModel.create({ tenant_id, role_id, name, email, password_hash });
  },

  async getById(id, tenantId = null) {
    const user = await UsersModel.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (tenantId && user.tenant_id !== tenantId) throw new AppError('User not found', 404);
    return user;
  },

  async getAllByTenant(tenantId, filters) {
    return UsersModel.findAllByTenant(tenantId, filters);
  },

  async update(id, data, tenantId = null) {
    const user = await UsersModel.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (tenantId && user.tenant_id !== tenantId) throw new AppError('User not found', 404);

    const fields = {};
    if (data.name) fields.name = data.name;
    if (data.role_id) fields.role_id = data.role_id;
    if (data.status) fields.status = data.status;
    if (data.password) fields.password_hash = await bcrypt.hash(data.password, 12);

    if (data.email && data.email !== user.email) {
      const existing = await UsersModel.findByEmail(data.email, user.tenant_id);
      if (existing) throw new AppError('Email already in use', 409);
      fields.email = data.email;
    }

    return UsersModel.update(id, fields);
  },

  async delete(id, tenantId = null) {
    const user = await UsersModel.findById(id);
    if (!user) throw new AppError('User not found', 404);
    if (tenantId && user.tenant_id !== tenantId) throw new AppError('User not found', 404);
    await UsersModel.softDelete(id);
  },

  async changePassword(id, currentPassword, newPassword) {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
    if (!rows.length) throw new AppError('User not found', 404);

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) throw new AppError('Current password is incorrect', 400);

    const password_hash = await bcrypt.hash(newPassword, 12);
    await UsersModel.update(id, { password_hash });
  },
};

module.exports = UsersService;
