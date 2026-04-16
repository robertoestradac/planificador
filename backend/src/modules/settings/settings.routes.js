const { Router } = require('express');
const SettingsController = require('./settings.controller');
const authenticate = require('../../middlewares/authenticate');

const router = Router();

/* Public — needed for login page / invitation footer branding */
router.get('/', SettingsController.get);

/* Protected — SuperAdmin / Admin only */
router.put('/', authenticate, (req, res, next) => {
  const allowed = ['SuperAdmin', 'Admin'];
  if (!req.user || !allowed.includes(req.user.role_name)) {
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  next();
}, SettingsController.update);

module.exports = router;
