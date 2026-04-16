const { Router } = require('express');
const AnalyticsController = require('./analytics.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const attachTenant = require('../../middlewares/attachTenant');

const router = Router();

// Public: record a view (called from public invitation page)
router.post('/view', AnalyticsController.recordView);

router.use(authenticate);

// Tenant dashboard
router.get('/dashboard', attachTenant(true), authorize('view_analytics'), AnalyticsController.getTenantDashboard);

// Per-invitation analytics
router.get('/invitation/:invitationId',         attachTenant(true), authorize('view_analytics'), AnalyticsController.getViewsByInvitation);
router.get('/invitation/:invitationId/summary', attachTenant(true), authorize('view_analytics'), AnalyticsController.getViewSummary);

// SaaS Admin global stats
router.get('/global', authorize('view_global_stats'), AnalyticsController.getGlobalStats);

module.exports = router;
