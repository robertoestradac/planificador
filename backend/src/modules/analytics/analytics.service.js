const AnalyticsModel = require('./analytics.model');
const InvitationsModel = require('../invitations/invitations.model');
const AppError = require('../../utils/AppError');

const AnalyticsService = {
  async recordView({ invitation_id, ip, device, country }) {
    return AnalyticsModel.recordView({ invitation_id, ip, device, country });
  },

  async getViewsByInvitation(invitationId, tenantId, filters) {
    const inv = await InvitationsModel.findById(invitationId, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return AnalyticsModel.getViewsByInvitation(invitationId, filters);
  },

  async getViewSummary(invitationId, tenantId) {
    const inv = await InvitationsModel.findById(invitationId, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return AnalyticsModel.getViewSummary(invitationId);
  },

  async getTenantDashboard(tenantId) {
    return AnalyticsModel.getTenantDashboard(tenantId);
  },

  async getGlobalStats() {
    return AnalyticsModel.getGlobalStats();
  },
};

module.exports = AnalyticsService;
