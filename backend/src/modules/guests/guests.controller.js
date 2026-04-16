const GuestsService = require('./guests.service');
const { success, created } = require('../../utils/response');

const GuestsController = {
  async create(req, res, next) {
    try {
      const guest = await GuestsService.create(req.body, req.tenantId);
      return created(res, guest, 'Guest added');
    } catch (err) { next(err); }
  },

  async createBulk(req, res, next) {
    try {
      const ids = await GuestsService.createBulk(req.body.invitation_id, req.body.guests, req.tenantId);
      return created(res, { created: ids.length }, `${ids.length} guests added`);
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await GuestsService.getAll(req.params.invitationId, req.tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        status: status || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const guest = await GuestsService.getById(req.params.id, req.tenantId);
      return success(res, guest);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const guest = await GuestsService.update(req.params.id, req.body, req.tenantId);
      return success(res, guest, 'Guest updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await GuestsService.delete(req.params.id, req.tenantId);
      return success(res, null, 'Guest removed');
    } catch (err) { next(err); }
  },

  // Public RSVP submission
  async submitRsvp(req, res, next) {
    try {
      const guest = await GuestsService.submitRsvp(req.params.guestId, req.body);
      return success(res, guest, 'RSVP submitted successfully');
    } catch (err) { next(err); }
  },

  async getRsvpStats(req, res, next) {
    try {
      const stats = await GuestsService.getRsvpStats(req.params.invitationId, req.tenantId);
      return success(res, stats);
    } catch (err) { next(err); }
  },
};

module.exports = GuestsController;
