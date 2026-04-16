const GuestsModel = require('./guests.model');
const InvitationsModel = require('../invitations/invitations.model');
const AppError = require('../../utils/AppError');
const { assertCredit } = require('../../utils/credits');

const GuestsService = {
  async create({ invitation_id, name, phone, email }, tenantId) {
    const inv = await InvitationsModel.findById(invitation_id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);

    await assertCredit(tenantId, 'guests');
    return GuestsModel.create({ invitation_id, name, phone, email });
  },

  async createBulk(invitation_id, guests, tenantId) {
    const inv = await InvitationsModel.findById(invitation_id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);

    await assertCredit(tenantId, 'guests');
    return GuestsModel.createBulk(invitation_id, guests);
  },

  async getAll(invitation_id, tenantId, filters) {
    const inv = await InvitationsModel.findById(invitation_id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return GuestsModel.findAllByInvitation(invitation_id, filters);
  },

  async getById(id, tenantId) {
    const guest = await GuestsModel.findById(id);
    if (!guest) throw new AppError('Guest not found', 404);
    // Verify guest belongs to tenant via invitation
    const inv = await InvitationsModel.findById(guest.invitation_id, tenantId);
    if (!inv) throw new AppError('Guest not found', 404);
    return guest;
  },

  async update(id, data, tenantId) {
    const guest = await GuestsModel.findById(id);
    if (!guest) throw new AppError('Guest not found', 404);
    const inv = await InvitationsModel.findById(guest.invitation_id, tenantId);
    if (!inv) throw new AppError('Guest not found', 404);
    return GuestsModel.update(id, data);
  },

  async delete(id, tenantId) {
    const guest = await GuestsModel.findById(id);
    if (!guest) throw new AppError('Guest not found', 404);
    const inv = await InvitationsModel.findById(guest.invitation_id, tenantId);
    if (!inv) throw new AppError('Guest not found', 404);
    await GuestsModel.delete(id);
  },

  async submitRsvp(guestId, { response, message }) {
    const guest = await GuestsModel.findById(guestId);
    if (!guest) throw new AppError('Guest not found', 404);
    return GuestsModel.upsertRsvp(guestId, { response, message });
  },

  async getRsvpStats(invitation_id, tenantId) {
    const inv = await InvitationsModel.findById(invitation_id, tenantId);
    if (!inv) throw new AppError('Invitation not found', 404);
    return GuestsModel.getRsvpStats(invitation_id);
  },
};

module.exports = GuestsService;
