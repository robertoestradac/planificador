const { Router } = require('express');
const EventsController = require('./events.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');
const validate = require('../../middlewares/validate');
const { createEventSchema, updateEventSchema } = require('./events.validation');

const router = Router();

router.use(authenticate);
router.use(attachTenant(true));

router.post('/',      authorize('create_event'), validate(createEventSchema), EventsController.create);
router.get('/',       authorize('create_event'),                               EventsController.getAll);
router.get('/:id',    authorize('create_event'),                               EventsController.getById);
router.put('/:id',    authorize('edit_event'),   validate(updateEventSchema),  EventsController.update);
router.delete('/:id', authorize('delete_event'),                               EventsController.delete);

module.exports = router;
