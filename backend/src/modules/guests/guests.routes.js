const { Router } = require('express');
const GuestsController = require('./guests.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createGuestSchema, createBulkSchema, updateGuestSchema, rsvpSchema } = require('./guests.validation');

const router = Router();

// Public RSVP route
router.post('/rsvp/:guestId', validate(rsvpSchema), GuestsController.submitRsvp);

router.use(authenticate);
router.use(attachTenant(true));

// Per-invitation guest management
router.get('/invitation/:invitationId',       authorize('manage_guests'), GuestsController.getAll);
router.get('/invitation/:invitationId/stats', authorize('manage_guests'), GuestsController.getRsvpStats);

router.post('/',      authorize('manage_guests'), validate(createGuestSchema), GuestsController.create);
router.post('/bulk',  authorize('manage_guests'), validate(createBulkSchema),  GuestsController.createBulk);
router.get('/:id',    authorize('manage_guests'),                               GuestsController.getById);
router.put('/:id',    authorize('manage_guests'), validate(updateGuestSchema),  GuestsController.update);
router.delete('/:id', authorize('manage_guests'),                               GuestsController.delete);

module.exports = router;
