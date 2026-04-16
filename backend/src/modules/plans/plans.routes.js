const { Router } = require('express');
const PlansController = require('./plans.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { createPlanSchema, updatePlanSchema, setPermissionsSchema } = require('./plans.validation');

const router = Router();

// Public: list active plans (for pricing page)
router.get('/public', PlansController.getAll);

router.use(authenticate);

router.get('/',     PlansController.getAll);
router.get('/:id',  PlansController.getById);
router.post('/',    authorize('manage_plans'), validate(createPlanSchema),    PlansController.create);
router.put('/:id',  authorize('manage_plans'), validate(updatePlanSchema),    PlansController.update);
router.delete('/:id', authorize('manage_plans'),                              PlansController.delete);

router.put('/:id/permissions',  authorize('manage_plans'), validate(setPermissionsSchema), PlansController.setPermissions);
router.post('/:id/permissions/:permId',   authorize('manage_plans'),          PlansController.addPermission);
router.delete('/:id/permissions/:permId', authorize('manage_plans'),          PlansController.removePermission);

module.exports = router;
