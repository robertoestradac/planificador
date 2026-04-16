const { Router } = require('express');
const ctrl        = require('./planner.controller');
const authenticate  = require('../../middlewares/authenticate');
const authorize     = require('../../middlewares/authorize');
const attachTenant  = require('../../middlewares/attachTenant');

const router = Router();

router.use(authenticate);
router.use(attachTenant(true));

router.get('/alerts',                    ctrl.getActiveAlerts);
router.put('/alerts/:entryId/dismiss',   authorize('use_planner'), ctrl.dismissAlert);

module.exports = router;
