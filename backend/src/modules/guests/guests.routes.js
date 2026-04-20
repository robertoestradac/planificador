const { Router } = require('express');
const GuestsController = require('./guests.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const {
  createGuestSchema,
  createBulkSchema,
  updateGuestSchema,
  rsvpSchema,
  checkInSchema,
  sentSchema,
  bulkActionSchema,
} = require('./guests.validation');

const router = Router();

// Public RSVP route (no auth)
router.post('/rsvp/:guestId', validate(rsvpSchema), GuestsController.submitRsvp);

router.use(authenticate);
router.use(attachTenant(true));

// Per-invitation guest management
router.get('/invitation/:invitationId',          authorize('manage_guests'), GuestsController.getAll);
router.get('/invitation/:invitationId/stats',    authorize('manage_guests'), GuestsController.getRsvpStats);
router.get('/invitation/:invitationId/timeline', authorize('manage_guests'), GuestsController.getTimeline);
router.get('/invitation/:invitationId/groups',   authorize('manage_guests'), GuestsController.getGroups);
router.get('/invitation/:invitationId/export',   authorize('manage_guests'), GuestsController.exportCsv);

router.post('/',      authorize('manage_guests'), validate(createGuestSchema), GuestsController.create);
router.post('/bulk',  authorize('manage_guests'), validate(createBulkSchema),  GuestsController.createBulk);
router.post('/bulk-action', authorize('manage_guests'), validate(bulkActionSchema), GuestsController.bulkAction);

router.get('/:id',    authorize('manage_guests'),                               GuestsController.getById);
router.put('/:id',    authorize('manage_guests'), validate(updateGuestSchema),  GuestsController.update);
router.patch('/:id/check-in', authorize('manage_guests'), validate(checkInSchema), GuestsController.checkIn);
router.patch('/:id/sent',     authorize('manage_guests'), validate(sentSchema),    GuestsController.markSent);
router.delete('/:id', authorize('manage_guests'),                               GuestsController.delete);

module.exports = router;
