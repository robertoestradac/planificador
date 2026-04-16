const { Router } = require('express');
const SubscriptionsController = require('./subscriptions.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createSubscriptionSchema, updateSubscriptionSchema, renewSchema } = require('./subscriptions.validation');

const router = Router();

router.use(authenticate);

// Tenant-scoped routes
router.get('/my',        attachTenant(true),  SubscriptionsController.getMySubscription);
router.get('/my/history', attachTenant(true), SubscriptionsController.getMyHistory);
router.get('/my/usage',   attachTenant(true), SubscriptionsController.getLimitsUsage);
router.post('/my/cancel', attachTenant(true), SubscriptionsController.cancel);
router.post('/my/renew',  attachTenant(true), validate(renewSchema), SubscriptionsController.renew);

// SaaS Admin routes
router.get('/',     authorize('manage_tenants'),                                                    SubscriptionsController.getAll);
router.get('/:id',  authorize('manage_tenants'),                                                    SubscriptionsController.getById);
router.post('/',    authorize('manage_tenants'), validate(createSubscriptionSchema),                 SubscriptionsController.create);
router.put('/:id',  authorize('manage_tenants'), validate(updateSubscriptionSchema),                 SubscriptionsController.update);

module.exports = router;
