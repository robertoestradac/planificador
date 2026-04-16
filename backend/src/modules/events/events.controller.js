const EventsService = require('./events.service');
const { success, created } = require('../../utils/response');

const EventsController = {
  async create(req, res, next) {
    try {
      const event = await EventsService.create({
        ...req.body,
        tenant_id: req.tenantId,
        user: req.user // Pass user info for Owner bypass
      });
      return created(res, event, 'Event created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await EventsService.getAll(req.tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const event = await EventsService.getById(req.params.id, req.tenantId);
      return success(res, event);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const event = await EventsService.update(req.params.id, req.tenantId, req.body);
      return success(res, event, 'Event updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await EventsService.delete(req.params.id, req.tenantId);
      return success(res, null, 'Event deleted');
    } catch (err) { next(err); }
  },
};

module.exports = EventsController;
