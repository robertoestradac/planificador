const { Router } = require('express');
const AuthController = require('./auth.controller');
const validate = require('../../middlewares/validate');
const authenticate = require('../../middlewares/authenticate');
const { loginSchema, registerSchema, refreshSchema, logoutSchema } = require('./auth.validation');
const rateLimit = require('express-rate-limit');
const config = require('../../config');

const router = Router();

const loginLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.loginMax,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login',    loginLimiter, validate(loginSchema),   AuthController.login);
router.post('/refresh',  validate(refreshSchema),               AuthController.refresh);
router.post('/logout',   validate(logoutSchema),                AuthController.logout);
router.post('/logout-all', authenticate,                        AuthController.logoutAll);
router.get('/me',        authenticate,                          AuthController.me);

router.post('/2fa/verify-login', AuthController.verifyLogin2FA);
router.get('/2fa/status',        authenticate, AuthController.get2FAStatus);
router.post('/2fa/setup',        authenticate, AuthController.setup2FA);
router.post('/2fa/enable',       authenticate, AuthController.enable2FA);
router.post('/2fa/disable',      authenticate, AuthController.disable2FA);

// Email verification routes
router.post('/verify-email',     AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);

module.exports = router;
