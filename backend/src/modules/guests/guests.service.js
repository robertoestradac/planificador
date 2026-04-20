const GuestsModel = require('./guests.model');
const InvitationsModel = require('../invitations/invitations.model');
const AppError = require('../../utils/AppError');
const { assertCredit } = require('../../utils/credits');

async function assertInvitationOwnership(invitation_id, tenantId) {
  const inv = await InvitationsModel.findById(invitation_id, tenantId);
  if (!inv) throw new AppError('Invitation not found', 404);
  return inv;
}

async function loadGuestForTenant(id, tenantId) {
  const guest = await GuestsModel.findById(id);
  if (!guest) throw new AppError('Guest not found', 404);
  const inv = await InvitationsModel.findById(guest.invitation_id, tenantId);
  if (!inv) throw new AppError('Guest not found', 404);
  return guest;
}

const GuestsService = {
  async create(data, tenantId) {
    await assertInvitationOwnership(data.invitation_id, tenantId);
    await assertCredit(tenantId, 'guests');

    // Duplicate check (warning, non-blocking unless explicitly requested)
    if (data.email || data.phone) {
      const dup = await GuestsModel.findDuplicate(data.invitation_id, {
        email: data.email || null,
        phone: data.phone || null,
      });
      if (dup) {
        const err = new AppError('Duplicate guest', 409);
        err.details = { existing: dup };
        throw err;
      }
    }

    return GuestsModel.create(data);
  },

  async createBulk(invitation_id, guests, tenantId, { skip_duplicates = true } = {}) {
    await assertInvitationOwnership(invitation_id, tenantId);
    await assertCredit(tenantId, 'guests');

    const skipped = [];
    const toInsert = [];
    if (skip_duplicates) {
      for (const g of guests) {
        if (g.email || g.phone) {
          const dup = await GuestsModel.findDuplicate(invitation_id, {
            email: g.email || null, phone: g.phone || null,
          });
          if (dup) { skipped.push({ guest: g, reason: 'duplicate', match: dup }); continue; }
        }
        toInsert.push(g);
      }
    } else {
      toInsert.push(...guests);
    }

    const ids = toInsert.length ? await GuestsModel.createBulk(invitation_id, toInsert) : [];
    return { created: ids.length, skipped: skipped.length, skipped_rows: skipped };
  },

  async getAll(invitation_id, tenantId, filters) {
    await assertInvitationOwnership(invitation_id, tenantId);
    return GuestsModel.findAllByInvitation(invitation_id, filters);
  },

  async exportAll(invitation_id, tenantId) {
    await assertInvitationOwnership(invitation_id, tenantId);
    return GuestsModel.findAllByInvitationRaw(invitation_id);
  },

  async getGroups(invitation_id, tenantId) {
    await assertInvitationOwnership(invitation_id, tenantId);
    return GuestsModel.getGroups(invitation_id);
  },

  async getById(id, tenantId) {
    return loadGuestForTenant(id, tenantId);
  },

  async update(id, data, tenantId) {
    await loadGuestForTenant(id, tenantId);
    return GuestsModel.update(id, data);
  },

  async delete(id, tenantId) {
    await loadGuestForTenant(id, tenantId);
    await GuestsModel.delete(id);
  },

  async bulkAction(ids, action, tenantId) {
    // Verify ownership of every id (one tenant-scoped query per id is expensive
    // but bulk sizes are capped at 500 and the check keeps data integrity).
    for (const id of ids) {
      const guest = await GuestsModel.findById(id);
      if (!guest) throw new AppError(`Guest ${id} not found`, 404);
      const inv = await InvitationsModel.findById(guest.invitation_id, tenantId);
      if (!inv) throw new AppError('Unauthorized guest in bulk action', 403);
    }

    switch (action) {
      case 'delete':    return { affected: await GuestsModel.deleteMany(ids) };
      case 'confirm':   return { affected: await GuestsModel.updateStatusMany(ids, 'confirmed') };
      case 'decline':   return { affected: await GuestsModel.updateStatusMany(ids, 'declined') };
      case 'reset':     return { affected: await GuestsModel.updateStatusMany(ids, 'pending') };
      case 'check_in':
      case 'check_out': {
        const on = action === 'check_in';
        let affected = 0;
        for (const id of ids) { await GuestsModel.setCheckIn(id, on); affected++; }
        return { affected };
      }
      case 'mark_sent':   return { affected: await GuestsModel.setSentMany(ids, true) };
      case 'mark_unsent': return { affected: await GuestsModel.setSentMany(ids, false) };
      default: throw new AppError('Unknown bulk action', 400);
    }
  },

  async submitRsvp(guestId, { response, message, party_size_confirmed }) {
    const guest = await GuestsModel.findById(guestId);
    if (!guest) throw new AppError('Guest not found', 404);
    return GuestsModel.upsertRsvp(guestId, { response, message, party_size_confirmed });
  },

  async getRsvpStats(invitation_id, tenantId) {
    await assertInvitationOwnership(invitation_id, tenantId);
    return GuestsModel.getRsvpStats(invitation_id);
  },

  async getTimeline(invitation_id, tenantId) {
    await assertInvitationOwnership(invitation_id, tenantId);
    return GuestsModel.getTimeline(invitation_id);
  },

  async setCheckIn(id, checkedIn, tenantId) {
    await loadGuestForTenant(id, tenantId);
    return GuestsModel.setCheckIn(id, checkedIn);
  },

  async setSent(id, sent, tenantId) {
    await loadGuestForTenant(id, tenantId);
    return GuestsModel.setSent(id, sent);
  },
};

module.exports = GuestsService;
