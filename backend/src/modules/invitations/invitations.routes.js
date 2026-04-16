const { Router } = require('express');
const InvitationsController = require('./invitations.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createInvitationSchema, updateInvitationSchema, saveBuilderSchema } = require('./invitations.validation');

const router = Router();

// Public route — view published invitation by slug
router.get('/public/:slug', InvitationsController.getPublic);

router.use(authenticate);
router.use(attachTenant(true));

router.post('/',                    authorize('create_invitation'),  validate(createInvitationSchema),  InvitationsController.create);
router.get('/',                     authorize('create_invitation'),                                     InvitationsController.getAll);
router.get('/:id',                  authorize('create_invitation'),                                     InvitationsController.getById);
router.put('/:id',                  authorize('edit_invitation'),    validate(updateInvitationSchema),  InvitationsController.update);
router.delete('/:id',               authorize('delete_invitation'),                                     InvitationsController.delete);
router.patch('/:id/builder',        authorize('use_builder'),        validate(saveBuilderSchema),       InvitationsController.saveBuilder);
router.patch('/:id/publish',        authorize('publish_invitation'),                                    InvitationsController.publish);
router.patch('/:id/unpublish',      authorize('publish_invitation'),                                    InvitationsController.unpublish);

module.exports = router;
