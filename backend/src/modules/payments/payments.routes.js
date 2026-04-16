const router = require('express').Router();
const PaymentsController = require('./payments.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize    = require('../../middlewares/authorize');
const validate     = require('../../middlewares/validate');
const { createPaymentSchema } = require('./payments.validation');

// ── Tenant routes ──────────────────────────────────────────────
router.get('/my',          authenticate, PaymentsController.getMyPayments);
router.get('/my/credits',  authenticate, PaymentsController.getMyCredits);

// ── Admin routes ───────────────────────────────────────────────
router.get   ('/stats',               authenticate, authorize('manage_tenants'), PaymentsController.getStats);
router.get   ('/',                    authenticate, authorize('manage_tenants'), PaymentsController.getAll);
router.post  ('/',                    authenticate, authorize('manage_tenants'), validate(createPaymentSchema), PaymentsController.create);
router.get   ('/:id',                 authenticate, authorize('manage_tenants'), PaymentsController.getById);
router.patch ('/:id',                 authenticate, authorize('manage_tenants'), PaymentsController.update);
router.patch ('/:id/confirm',         authenticate, authorize('manage_tenants'), PaymentsController.confirm);
router.patch ('/:id/reject',          authenticate, authorize('manage_tenants'), PaymentsController.reject);
router.patch ('/:id/pending',         authenticate, authorize('manage_tenants'), PaymentsController.reopen);
router.get   ('/tenant/:tenantId/credits', authenticate, authorize('manage_tenants'), PaymentsController.getTenantCredits);

module.exports = router;
