const AuthService = require('./auth.service');
const { success, created } = require('../../utils/response');

const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return created(res, result, 'Account created successfully');
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const { email, password, tenant_id } = req.body;
      const result = await AuthService.login(email, password, tenant_id || null);
      return success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refresh_token } = req.body;
      const result = await AuthService.refresh(refresh_token);
      return success(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const { refresh_token } = req.body;
      await AuthService.logout(refresh_token);
      return success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  async logoutAll(req, res, next) {
    try {
      await AuthService.logoutAll(req.user.id);
      return success(res, null, 'All sessions terminated');
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await AuthService.me(req.user.id);
      return success(res, user);
    } catch (err) { next(err); }
  },

  async verifyLogin2FA(req, res, next) {
    try {
      const { temp_token, code } = req.body;
      const result = await AuthService.verifyLogin2FA(temp_token, code);
      return success(res, result, 'Login exitoso');
    } catch (err) { next(err); }
  },

  async setup2FA(req, res, next) {
    try {
      const result = await AuthService.setup2FA(req.user.id);
      return success(res, result);
    } catch (err) { next(err); }
  },

  async enable2FA(req, res, next) {
    try {
      const result = await AuthService.enable2FA(req.user.id, req.body.code);
      return success(res, result, '2FA activado correctamente');
    } catch (err) { next(err); }
  },

  async disable2FA(req, res, next) {
    try {
      const result = await AuthService.disable2FA(req.user.id, req.body.code);
      return success(res, result, '2FA desactivado');
    } catch (err) { next(err); }
  },

  async get2FAStatus(req, res, next) {
    try {
      const result = await AuthService.get2FAStatus(req.user.id);
      return success(res, result);
    } catch (err) { next(err); }
  },

  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.body;
      const result = await AuthService.verifyEmail(token);
      return success(res, result, result.message);
    } catch (err) { next(err); }
  },

  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendVerificationEmail(email);
      return success(res, result, result.message);
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;
