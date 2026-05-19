const EventsModel = require('./events.model');
const AppError = require('../../utils/AppError');
const { assertCredit } = require('../../utils/credits');

const EventsService = {
  async create({ tenant_id, name, date, location, map_url, user }) {
    // All users (including Owner) must respect credit limits
    await assertCredit(tenant_id, 'events');
    
    return EventsModel.create({ tenant_id, name, date, location, map_url });
  },

  async getAll(tenantId, filters) {
    return EventsModel.findAllByTenant(tenantId, filters);
  },

  async getById(id, tenantId) {
    const event = await EventsModel.findById(id, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    return event;
  },

  async update(id, tenantId, data) {
    const event = await EventsModel.findById(id, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    return EventsModel.update(id, tenantId, data);
  },

  async delete(id, tenantId) {
    const event = await EventsModel.findById(id, tenantId);
    if (!event) throw new AppError('Event not found', 404);
    await EventsModel.softDelete(id, tenantId);
  },
};

module.exports = EventsService;
