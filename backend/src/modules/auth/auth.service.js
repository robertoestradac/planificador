const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const AuthModel = require('./auth.model');
const { pool } = require('../../database/connection');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const config = require('../../config');

const TEMP_2FA_SECRET = config.jwt.accessSecret + '_2fa';
const signTemp2FAToken = (userId) => jwt.sign({ id: userId, purpose: '2fa_pending' }, TEMP_2FA_SECRET, { expiresIn: '5m' });
const verifyTemp2FAToken = (token) => jwt.verify(token, TEMP_2FA_SECRET);

const buildTokenPayload = (user) => ({
  id: user.id,
  tenant_id: user.tenant_id || null,
  role_id: user.role_id,
  role_name: user.role_name,
  is_global: user.is_global,
  name: user.name,
  email: user.email,
});

const getRefreshExpiry = () => {
  const days = parseInt(config.jwt.refreshExpires, 10) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const AuthService = {
  /**
   * Register a new tenant + owner user.
   * Creates: tenant → assigns plan → creates owner user → returns tokens.
   */
  async register({ name, email, password, company_name, subdomain, plan_id }) {
    const existing = await AuthModel.findUserByEmail(email);
    if (existing) throw new AppError('Email already in use', 409);

    // Auto-generate subdomain from company_name if not provided
    let finalSubdomain = subdomain || company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    // Ensure uniqueness by appending a numeric suffix if taken
    let candidate = finalSubdomain;
    let attempt = 0;
    while (true) {
      const [[taken]] = await pool.query('SELECT id FROM tenants WHERE subdomain = ? AND deleted_at IS NULL', [candidate]);
      if (!taken) { finalSubdomain = candidate; break; }
      attempt++;
      candidate = finalSubdomain + '-' + attempt;
    }

    let plan = null;
    if (plan_id) {
      const [[found]] = await pool.query('SELECT id FROM plans WHERE id = ? AND is_active = 1', [plan_id]);
      if (!found) throw new AppError('Invalid plan selected', 400);
      plan = found;
    } else {
      // Auto-assign free plan if no plan specified
      const [[freePlan]] = await pool.query('SELECT id FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1');
      if (freePlan) {
        plan = freePlan;
        plan_id = freePlan.id;
      }
    }

    const [[ownerRole]] = await pool.query('SELECT id FROM roles WHERE name = ? AND is_global = 0 LIMIT 1', ['Owner']);
    if (!ownerRole) throw new AppError('Owner role not configured', 500);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const tenantId = uuidv4();
      await conn.query(
        'INSERT INTO tenants (id, name, subdomain, status) VALUES (?, ?, ?, ?)',
        [tenantId, company_name, finalSubdomain, 'active']
      );

      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);
      await conn.query(
        'INSERT INTO users (id, tenant_id, role_id, name, email, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, tenantId, ownerRole.id, name, email, passwordHash, 'active']
      );

      if (plan) {
        const now = new Date();
        const expires = new Date(now);
        expires.setFullYear(expires.getFullYear() + 1);
        await conn.query(
          'INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), tenantId, plan_id, now, expires, 'active']
        );
      }

      await conn.commit();

      const user = { id: userId, tenant_id: tenantId, role_id: ownerRole.id, role_name: 'Owner', is_global: 0, name, email };
      const payload = buildTokenPayload(user);
      const accessToken = signAccessToken(payload);
      const refreshToken = signRefreshToken({ id: userId });
      await AuthModel.saveRefreshToken(userId, refreshToken, getRefreshExpiry());

      return {
        accessToken, refreshToken,
        user: { id: userId, name, email, role: 'Owner', tenant_id: tenantId },
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async login(email, password, tenantId = null) {
    const user = await AuthModel.findUserByEmail(email, tenantId);
    if (!user) throw new AppError('Invalid credentials', 401);
    if (user.status !== 'active') throw new AppError('Account is inactive or suspended', 403);

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw new AppError('Invalid credentials', 401);

    if (user.totp_enabled && user.totp_secret) {
      const tempToken = signTemp2FAToken(user.id);
      return { require2fa: true, temp_token: tempToken };
    }

    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });
    await AuthModel.saveRefreshToken(user.id, refreshToken, getRefreshExpiry());

    return {
      accessToken, refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role_name, tenant_id: user.tenant_id },
    };
  },

  async verifyLogin2FA(tempToken, totpCode) {
    let decoded;
    try { decoded = verifyTemp2FAToken(tempToken); } catch {
      throw new AppError('Token expirado o inválido', 401);
    }
    if (decoded.purpose !== '2fa_pending') throw new AppError('Token inválido', 401);

    const user = await AuthModel.findUserById(decoded.id);
    if (!user) throw new AppError('Usuario no encontrado', 401);
    if (!user.totp_secret) throw new AppError('2FA no configurado', 400);

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret, encoding: 'base32',
      token: totpCode, window: 1,
    });
    if (!valid) throw new AppError('Código 2FA incorrecto', 401);

    const payload = buildTokenPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });
    await AuthModel.saveRefreshToken(user.id, refreshToken, getRefreshExpiry());

    return {
      accessToken, refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role_name, tenant_id: user.tenant_id },
    };
  },

  async setup2FA(userId) {
    const user = await AuthModel.findUserById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);

    const secret = speakeasy.generateSecret({ name: `InvitApp (${user.email})`, length: 20 });
    await AuthModel.setTotpSecret(userId, secret.base32);

    const otpauthUrl = secret.otpauth_url;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { qr: qrDataUrl, secret: secret.base32 };
  },

  async enable2FA(userId, totpCode) {
    const user = await AuthModel.findUserById(userId);
    if (!user || !user.totp_secret) throw new AppError('Primero inicia la configuración 2FA', 400);
    if (user.totp_enabled) throw new AppError('2FA ya está activado', 400);

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret, encoding: 'base32',
      token: totpCode, window: 1,
    });
    if (!valid) throw new AppError('Código incorrecto', 400);

    await AuthModel.enableTotp(userId);
    return { enabled: true };
  },

  async disable2FA(userId, totpCode) {
    const user = await AuthModel.findUserById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    if (!user.totp_enabled) throw new AppError('2FA no está activado', 400);

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret, encoding: 'base32',
      token: totpCode, window: 1,
    });
    if (!valid) throw new AppError('Código incorrecto', 400);

    await AuthModel.disableTotp(userId);
    return { enabled: false };
  },

  async get2FAStatus(userId) {
    const user = await AuthModel.findUserById(userId);
    if (!user) throw new AppError('Usuario no encontrado', 404);
    return { enabled: !!user.totp_enabled };
  },

  async refresh(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const storedToken = await AuthModel.findRefreshToken(token);
    if (!storedToken) throw new AppError('Refresh token revoked or not found', 401);

    await AuthModel.revokeRefreshToken(token);

    const user = await AuthModel.findUserById(decoded.id);
    if (!user) throw new AppError('User not found', 401);
    if (user.status !== 'active') throw new AppError('Account is inactive', 403);

    const payload = buildTokenPayload(user);
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken({ id: user.id });
    await AuthModel.saveRefreshToken(user.id, newRefreshToken, getRefreshExpiry());

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(token) {
    await AuthModel.revokeRefreshToken(token);
  },

  async logoutAll(userId) {
    await AuthModel.revokeAllUserTokens(userId);
  },

  async me(userId) {
    const user = await AuthModel.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    return {
      id: user.id, name: user.name, email: user.email,
      role: user.role_name, tenant_id: user.tenant_id, is_global: user.is_global,
      totp_enabled: !!user.totp_enabled,
    };
  },
};

module.exports = AuthService;
