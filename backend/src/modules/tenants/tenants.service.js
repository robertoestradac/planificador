const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../../database/connection');
const TenantsModel = require('./tenants.model');
const AppError = require('../../utils/AppError');
const attachTenant = require('../../middlewares/attachTenant');
const { getPlanExpirationDate } = require('../../utils/planHelpers');

const TenantsService = {
  async create(data) {
    const { name, subdomain, custom_domain = null, owner_name, owner_email, owner_password, plan_id } = data;

    const existing = await TenantsModel.findBySubdomain(subdomain);
    if (existing) throw new AppError('Subdomain already taken', 409);

    const hasOwner = !!(owner_name && owner_email && owner_password);
    const hasPlan  = !!plan_id;

    // Simple create — no owner, no plan
    if (!hasOwner && !hasPlan) {
      return TenantsModel.create({ name, subdomain, custom_domain });
    }

    // Pre-validate before opening a transaction
    if (hasOwner) {
      const [[emailCheck]] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [owner_email]
      );
      if (emailCheck) throw new AppError('El email del owner ya está en uso', 409);
    }

    if (hasPlan) {
      const [[plan]] = await pool.query('SELECT id FROM plans WHERE id = ? AND is_active = 1', [plan_id]);
      if (!plan) throw new AppError('Plan inválido', 400);
    }

    let ownerRole = null;
    if (hasOwner) {
      const [[role]] = await pool.query('SELECT id FROM roles WHERE name = ? AND is_global = 0 LIMIT 1', ['Owner']);
      if (!role) throw new AppError('Rol Owner no configurado', 500);
      ownerRole = role;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const tenantId = uuidv4();
      await conn.query(
        'INSERT INTO tenants (id, name, subdomain, custom_domain, status) VALUES (?, ?, ?, ?, ?)',
        [tenantId, name, subdomain, custom_domain, 'active']
      );

      if (hasOwner) {
        const passwordHash = await bcrypt.hash(owner_password, 12);
        await conn.query(
          'INSERT INTO users (id, tenant_id, role_id, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), tenantId, ownerRole.id, owner_name, owner_email, passwordHash, 'active']
        );
      }

      if (hasPlan) {
        // ✅ Get plan with duration_months
        const [[plan]] = await conn.query(
          'SELECT id, duration_months FROM plans WHERE id = ? AND is_active = 1',
          [plan_id]
        );
        if (!plan) throw new AppError('Invalid plan', 400);

        const now = new Date();
        // ✅ Calculate expiration based on plan's duration_months
        const expires = getPlanExpirationDate(plan, now);
        await conn.query(
          'INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), tenantId, plan_id, now, expires, 'active']
        );
      }

      await conn.commit();
      return TenantsModel.findById(tenantId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async getById(id) {
    const tenant = await TenantsModel.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    return tenant;
  },

  async getAll(filters) {
    return TenantsModel.findAll(filters);
  },

  async update(id, data) {
    const { owner_name, owner_email, owner_password, plan_id, ...tenantData } = data;

    const tenant = await TenantsModel.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);

    if (tenantData.subdomain && tenantData.subdomain !== tenant.subdomain) {
      const existing = await TenantsModel.findBySubdomain(tenantData.subdomain);
      if (existing) throw new AppError('Subdomain already taken', 409);
    }

    // Update tenant fields
    const updated = await TenantsModel.update(id, tenantData);
    attachTenant.invalidateCache(id, tenant.subdomain);

    // Update owner user (find user with Owner role in this tenant)
    if (owner_name || owner_email || owner_password) {
      const [[ownerUser]] = await pool.query(
        `SELECT u.id, u.email FROM users u
         JOIN roles r ON r.id = u.role_id AND r.name = 'Owner' AND r.is_global = 0
         WHERE u.tenant_id = ? AND u.deleted_at IS NULL LIMIT 1`,
        [id]
      );
      if (ownerUser) {
        const ownerFields = {};
        if (owner_name)  ownerFields.name  = owner_name;
        if (owner_email && owner_email !== ownerUser.email) {
          const [[dup]] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL', [owner_email, ownerUser.id]
          );
          if (dup) throw new AppError('El email del owner ya está en uso', 409);
          ownerFields.email = owner_email;
        }
        if (owner_password) ownerFields.password_hash = await bcrypt.hash(owner_password, 12);
        if (Object.keys(ownerFields).length) {
          const sets = Object.keys(ownerFields).map(k => `${k} = ?`).join(', ');
          await pool.query(`UPDATE users SET ${sets} WHERE id = ?`, [...Object.values(ownerFields), ownerUser.id]);
        }
      }
    }

    // Add plan credits via confirmed payment (stacks with existing credits)
    if (plan_id) {
      const [[plan]] = await pool.query(
        'SELECT id, duration_months, price_usd FROM plans WHERE id = ? AND is_active = 1',
        [plan_id]
      );
      if (!plan) throw new AppError('Plan invalido', 400);

      // Create a confirmed payment so credits stack
      const paymentId = uuidv4();
      await pool.query(
        `INSERT INTO payments (id, tenant_id, plan_id, amount, currency, method, status, confirmed_at)
         VALUES (?, ?, ?, ?, 'USD', 'admin_assigned', 'confirmed', NOW())`,
        [paymentId, id, plan_id, plan.price_usd || 0]
      );

      // Ensure there's an active subscription (for permission resolution)
      const [[activeSub]] = await pool.query(
        `SELECT id FROM subscriptions WHERE tenant_id = ? AND status = 'active' AND expires_at > NOW()
         ORDER BY expires_at DESC LIMIT 1`,
        [id]
      );
      if (!activeSub) {
        // No active subscription — create one
        const now = new Date();
        const expires = getPlanExpirationDate(plan, now);
        await pool.query(
          'INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), id, plan_id, now, expires, 'active']
        );
      }
    }

    return updated;
  },

  async suspend(id) {
    const tenant = await TenantsModel.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    const updated = await TenantsModel.update(id, { status: 'suspended' });
    attachTenant.invalidateCache(id, tenant.subdomain);
    return updated;
  },

  async activate(id) {
    const tenant = await TenantsModel.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    const updated = await TenantsModel.update(id, { status: 'active' });
    attachTenant.invalidateCache(id, tenant.subdomain);
    return updated;
  },

  async delete(id) {
    const tenant = await TenantsModel.findById(id);
    if (!tenant) throw new AppError('Tenant not found', 404);
    await TenantsModel.softDelete(id);
    attachTenant.invalidateCache(id, tenant.subdomain);
  },

  async getStats(tenantId) {
    return TenantsModel.getStats(tenantId);
  },

  /**
   * Manually verify the owner's email (admin action — bypasses email flow)
   */
  async verifyOwnerEmail(tenantId) {
    const [[owner]] = await pool.query(
      `SELECT u.id, u.email, u.email_verified
       FROM users u
       JOIN roles r ON r.id = u.role_id AND r.name = 'Owner' AND r.is_global = 0
       WHERE u.tenant_id = ? AND u.deleted_at IS NULL LIMIT 1`,
      [tenantId]
    );
    if (!owner) throw new AppError('Este tenant no tiene un owner', 404);
    if (owner.email_verified) throw new AppError('El email del owner ya está verificado', 400);

    await pool.query(
      'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?',
      [owner.id]
    );
    return { verified: true, email: owner.email };
  },

  /**
   * Resend verification email to the tenant owner
   */
  async resendOwnerVerification(tenantId) {
    const [[owner]] = await pool.query(
      `SELECT u.id, u.name, u.email, u.email_verified
       FROM users u
       JOIN roles r ON r.id = u.role_id AND r.name = 'Owner' AND r.is_global = 0
       WHERE u.tenant_id = ? AND u.deleted_at IS NULL LIMIT 1`,
      [tenantId]
    );
    if (!owner) throw new AppError('Este tenant no tiene un owner', 404);
    if (owner.email_verified) throw new AppError('El email del owner ya está verificado', 400);

    const AuthService = require('../auth/auth.service');
    await AuthService.resendVerificationEmail(owner.email);
    return { sent: true, email: owner.email };
  },
};

module.exports = TenantsService;
