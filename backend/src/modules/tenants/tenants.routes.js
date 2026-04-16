const { Router } = require('express');
const TenantsController = require('./tenants.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { createTenantSchema, updateTenantSchema } = require('./tenants.validation');

const router = Router();

router.use(authenticate);

// SaaS Admin routes
router.post('/',    authorize('manage_tenants'), validate(createTenantSchema), TenantsController.create);
router.get('/',     authorize('manage_tenants'),                               TenantsController.getAll);
router.get('/:id',  authorize('manage_tenants'),                               TenantsController.getById);
router.put('/:id',  authorize('manage_tenants'), validate(updateTenantSchema), TenantsController.update);
router.delete('/:id', authorize('manage_tenants'),                             TenantsController.delete);
router.patch('/:id/suspend',  authorize('manage_tenants'),                     TenantsController.suspend);
router.patch('/:id/activate', authorize('manage_tenants'),                     TenantsController.activate);
router.get('/:id/stats',      authorize('manage_tenants'),                     TenantsController.getStats);

module.exports = router;
