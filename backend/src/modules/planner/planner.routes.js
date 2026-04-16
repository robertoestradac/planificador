const { Router } = require('express');
const ctrl        = require('./planner.controller');
const authenticate  = require('../../middlewares/authenticate');
const authorize     = require('../../middlewares/authorize');
const attachTenant  = require('../../middlewares/attachTenant');

const router = Router();

router.use(authenticate);
router.use(attachTenant(true));

// ── Plans ──────────────────────────────────────────────────────
router.get('/',                          authorize('use_planner'), ctrl.getAll);
router.get('/by-event/:eventId',         authorize('use_planner'), ctrl.getByEvent);
router.get('/:planId',                   authorize('use_planner'), ctrl.getById);
router.post('/',                         authorize('use_planner'), ctrl.create);
router.put('/:planId',                   authorize('use_planner'), ctrl.update);
router.delete('/:planId',               authorize('use_planner'), ctrl.delete);

// ── Tasks ──────────────────────────────────────────────────────
router.get('/:planId/tasks',             authorize('use_planner'), ctrl.getTasks);
router.post('/:planId/tasks',            authorize('use_planner'), ctrl.createTask);
router.put('/:planId/tasks/:taskId',     authorize('use_planner'), ctrl.updateTask);
router.delete('/:planId/tasks/:taskId',  authorize('use_planner'), ctrl.deleteTask);

// ── Budget ─────────────────────────────────────────────────────
router.get('/:planId/budget',            authorize('use_planner'), ctrl.getBudget);
router.post('/:planId/budget',           authorize('use_planner'), ctrl.createBudgetItem);
router.put('/:planId/budget/:itemId',    authorize('use_planner'), ctrl.updateBudgetItem);
router.delete('/:planId/budget/:itemId', authorize('use_planner'), ctrl.deleteBudgetItem);

// ── Vendors ────────────────────────────────────────────────────
router.get('/:planId/vendors',              authorize('use_planner'), ctrl.getVendors);
router.post('/:planId/vendors',             authorize('use_planner'), ctrl.createVendor);
router.put('/:planId/vendors/:vendorId',    authorize('use_planner'), ctrl.updateVendor);
router.delete('/:planId/vendors/:vendorId', authorize('use_planner'), ctrl.deleteVendor);

// ── Timeline ───────────────────────────────────────────────────
router.get('/:planId/timeline',             authorize('use_planner'), ctrl.getTimeline);
router.post('/:planId/timeline',            authorize('use_planner'), ctrl.createTimelineItem);
router.put('/:planId/timeline/:itemId',     authorize('use_planner'), ctrl.updateTimelineItem);
router.delete('/:planId/timeline/:itemId',  authorize('use_planner'), ctrl.deleteTimelineItem);

// ── Calendar ───────────────────────────────────────────────────
router.get('/:planId/calendar',              authorize('use_planner'), ctrl.getCalendarEntries);
router.post('/:planId/calendar',             authorize('use_planner'), ctrl.createCalendarEntry);
router.put('/:planId/calendar/:entryId',     authorize('use_planner'), ctrl.updateCalendarEntry);
router.delete('/:planId/calendar/:entryId',  authorize('use_planner'), ctrl.deleteCalendarEntry);

// ── Seating ────────────────────────────────────────────────────
router.get('/:planId/seating/tables',                                        authorize('use_planner'), ctrl.getSeatingTables);
router.post('/:planId/seating/tables',                                       authorize('use_planner'), ctrl.createSeatingTable);
router.put('/:planId/seating/tables/:tableId',                               authorize('use_planner'), ctrl.updateSeatingTable);
router.delete('/:planId/seating/tables/:tableId',                            authorize('use_planner'), ctrl.deleteSeatingTable);
router.post('/:planId/seating/tables/:tableId/seats/:seatId/assign',         authorize('use_planner'), ctrl.assignSeat);
router.delete('/:planId/seating/tables/:tableId/seats/:seatId/assign',       authorize('use_planner'), ctrl.unassignSeat);

module.exports = router;
