const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const AuthModel = require('./auth.model');
const { pool } = require('../../database/connection');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const config = require('../../config');
const MarketingService = require('../marketing/marketing.service');
const { getPlanExpirationDate } = require('../../utils/planHelpers');

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
   * Creates: tenant → assigns plan → creates owner user → sends verification email → returns tokens.
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
      const [[found]] = await pool.query('SELECT id, duration_months FROM plans WHERE id = ? AND is_active = 1', [plan_id]);
      if (!found) throw new AppError('Invalid plan selected', 400);
      plan = found;
    } else {
      // Auto-assign free plan if no plan specified
      const [[freePlan]] = await pool.query('SELECT id, duration_months FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1');
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
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

      await conn.query(
        `INSERT INTO users (id, tenant_id, role_id, name, email, password_hash, 
         email_verified, email_verification_token, email_verification_expires, status) 
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [userId, tenantId, ownerRole.id, name, email, passwordHash, verificationToken, verificationExpires, 'active']
      );

      if (plan) {
        const now = new Date();
        // ✅ Calculate expiration based on plan's duration_months
        const expires = getPlanExpirationDate(plan, now);
        await conn.query(
          'INSERT INTO subscriptions (id, tenant_id, plan_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), tenantId, plan_id, now, expires, 'active']
        );
      }

      await conn.commit();

      // Send verification email (async, don't wait)
      this.sendVerificationEmail(email, name, verificationToken).catch(err => {
        console.error('Failed to send verification email:', err);
      });

      // DO NOT return tokens for tenant users - they must verify email first
      return {
        success: true,
        message: 'Cuenta creada exitosamente. Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
        email: email,
        requiresVerification: true,
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

    // Check if email is verified (ONLY for tenant users, NOT for global admins)
    if (!user.is_global && !user.email_verified) {
      throw new AppError('Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada.', 403);
    }

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

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email, name, token) {
    try {
      const verificationUrl = `${config.app.frontendUrl}/verify-email?token=${token}`;
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu email</title>
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:40px 40px 30px;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">
                        ✉️ Verifica tu Email
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                        Hola <strong>${name}</strong>,
                      </p>
                      
                      <p style="margin:0 0 20px;color:#374151;font-size:16px;line-height:1.6;">
                        ¡Bienvenido! Gracias por registrarte. Para completar tu registro y activar todas las funciones de tu cuenta, por favor verifica tu dirección de email.
                      </p>
                      
                      <p style="margin:0 0 30px;color:#374151;font-size:16px;line-height:1.6;">
                        Haz clic en el botón de abajo para verificar tu email:
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:0 0 30px;">
                            <a href="${verificationUrl}" 
                               style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 6px rgba(99,102,241,0.3);">
                              Verificar Email
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
                        O copia y pega este enlace en tu navegador:
                      </p>
                      
                      <p style="margin:0 0 30px;padding:12px;background-color:#f3f4f6;border-radius:8px;word-break:break-all;">
                        <a href="${verificationUrl}" style="color:#6366f1;text-decoration:none;font-size:13px;">
                          ${verificationUrl}
                        </a>
                      </p>
                      
                      <div style="border-top:1px solid #e5e7eb;padding-top:20px;margin-top:20px;">
                        <p style="margin:0 0 10px;color:#6b7280;font-size:14px;line-height:1.6;">
                          ⏰ <strong>Este enlace expira en 24 horas.</strong>
                        </p>
                        <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
                          🔒 Si no creaste esta cuenta, puedes ignorar este email.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#f9fafb;padding:30px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                      <p style="margin:0 0 10px;color:#9ca3af;font-size:13px;">
                        Este es un email automático, por favor no respondas.
                      </p>
                      <p style="margin:0;color:#9ca3af;font-size:13px;">
                        © ${new Date().getFullYear()} InvitApp. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await MarketingService.sendTransactionalEmail({
        to: email,
        subject: '✉️ Verifica tu email - InvitApp',
        html,
        text: `Hola ${name},\n\nGracias por registrarte. Por favor verifica tu email haciendo clic en el siguiente enlace:\n\n${verificationUrl}\n\nEste enlace expira en 24 horas.\n\nSi no creaste esta cuenta, puedes ignorar este email.`,
      });

      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw error;
    }
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    const user = await AuthModel.findUserByVerificationToken(token);
    
    if (!user) {
      throw new AppError('Token de verificación inválido o expirado', 400);
    }

    if (user.email_verified) {
      return { 
        success: true, 
        message: 'Email ya verificado anteriormente',
        already_verified: true 
      };
    }

    // Check if token expired
    if (user.email_verification_expires && new Date() > new Date(user.email_verification_expires)) {
      throw new AppError('El token de verificación ha expirado. Por favor solicita uno nuevo.', 400);
    }

    await AuthModel.verifyEmail(user.id);

    return { 
      success: true, 
      message: '¡Email verificado exitosamente! Ya puedes iniciar sesión.',
      already_verified: false 
    };
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email) {
    const user = await AuthModel.findUserByEmail(email);
    
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (user.email_verified) {
      throw new AppError('Este email ya está verificado', 400);
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    await AuthModel.setVerificationToken(user.id, verificationToken, verificationExpires);

    // Send email
    await this.sendVerificationEmail(user.email, user.name, verificationToken);

    return { 
      success: true, 
      message: 'Email de verificación reenviado. Por favor revisa tu bandeja de entrada.' 
    };
  },
};

module.exports = AuthService;
