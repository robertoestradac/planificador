const { Router } = require('express');
const RolesController = require('./roles.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createRoleSchema, updateRoleSchema, setPermissionsSchema } = require('./roles.validation');

const router = Router();

router.use(authenticate);
router.use(attachTenant(false));

router.post('/',    authorize('manage_roles'), validate(createRoleSchema), RolesController.create);
router.get('/',     authenticate,                                           RolesController.getAll);
router.get('/:id',  authenticate,                                           RolesController.getById);
router.put('/:id',  authorize('manage_roles'), validate(updateRoleSchema),  RolesController.update);
router.delete('/:id', authorize('manage_roles'),                            RolesController.delete);

router.get('/:id/permissions',                authenticate,                 RolesController.getPermissions);
router.put('/:id/permissions',  authorize('manage_roles'), validate(setPermissionsSchema), RolesController.setPermissions);
router.post('/:id/permissions/:permId',  authorize('manage_roles'),         RolesController.addPermission);
router.delete('/:id/permissions/:permId', authorize('manage_roles'),        RolesController.removePermission);

module.exports = router;
