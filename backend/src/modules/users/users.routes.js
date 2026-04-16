const { Router } = require('express');
const UsersController = require('./users.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createUserSchema, updateUserSchema, changePasswordSchema } = require('./users.validation');

const router = Router();

router.use(authenticate);
router.use(attachTenant(false));

router.post('/',     authorize('manage_users'), validate(createUserSchema), UsersController.create);
router.get('/',      authorize('manage_users'),                             UsersController.getAll);
router.get('/:id',   authorize('manage_users'),                             UsersController.getById);
router.put('/:id',   authorize('manage_users'), validate(updateUserSchema), UsersController.update);
router.delete('/:id', authorize('manage_users'),                            UsersController.delete);
router.patch('/me/password', validate(changePasswordSchema),                UsersController.changePassword);

module.exports = router;
