const InvitationsService = require('./invitations.service');
const { success, created } = require('../../utils/response');

const InvitationsController = {
  async create(req, res, next) {
    try {
      const inv = await InvitationsService.create({
        ...req.body,
        tenant_id: req.tenantId,
        user: req.user // Pass user info for Owner bypass
      });
      return created(res, inv, 'Invitation created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, status, event_id } = req.query;
      const result = await InvitationsService.getAll(req.tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || null,
        event_id: event_id || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const inv = await InvitationsService.getById(req.params.id, req.tenantId);
      return success(res, inv);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const inv = await InvitationsService.update(req.params.id, req.tenantId, req.body);
      return success(res, inv, 'Invitation updated');
    } catch (err) { next(err); }
  },

  async saveBuilder(req, res, next) {
    try {
      const inv = await InvitationsService.saveBuilder(req.params.id, req.tenantId, req.body);
      return success(res, inv, 'Builder content saved');
    } catch (err) { next(err); }
  },

  async publish(req, res, next) {
    try {
      const inv = await InvitationsService.publish(req.params.id, req.tenantId);
      return success(res, inv, 'Invitation published');
    } catch (err) { next(err); }
  },

  async unpublish(req, res, next) {
    try {
      const inv = await InvitationsService.unpublish(req.params.id, req.tenantId);
      return success(res, inv, 'Invitation unpublished');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await InvitationsService.delete(req.params.id, req.tenantId);
      return success(res, null, 'Invitation deleted');
    } catch (err) { next(err); }
  },

  // Public: view by slug
  async getPublic(req, res, next) {
    try {
      const inv = await InvitationsService.getBySlug(req.params.slug);
      return success(res, inv);
    } catch (err) { next(err); }
  },
};

module.exports = InvitationsController;
