const AnalyticsService = require('./analytics.service');
const { success } = require('../../utils/response');

const AnalyticsController = {
  async recordView(req, res, next) {
    try {
      const { invitation_id } = req.body;
      // x-forwarded-for can be a comma-separated list; take the first (client) IP
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
      const device = req.headers['user-agent'] || null;
      await AnalyticsService.recordView({ invitation_id, ip, device, country: null });
      return success(res, null, 'View recorded');
    } catch (err) { next(err); }
  },

  async getViewsByInvitation(req, res, next) {
    try {
      const { days } = req.query;
      const data = await AnalyticsService.getViewsByInvitation(
        req.params.invitationId,
        req.tenantId,
        { days: parseInt(days) || 30 }
      );
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getViewSummary(req, res, next) {
    try {
      const data = await AnalyticsService.getViewSummary(req.params.invitationId, req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getTenantDashboard(req, res, next) {
    try {
      const data = await AnalyticsService.getTenantDashboard(req.tenantId);
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getGlobalStats(req, res, next) {
    try {
      const data = await AnalyticsService.getGlobalStats();
      return success(res, data);
    } catch (err) { next(err); }
  },
};

module.exports = AnalyticsController;
