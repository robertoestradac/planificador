const GuestsService = require('./guests.service');
const { success, created } = require('../../utils/response');

function toCsv(rows) {
  const headers = [
    'id','name','email','phone','status',
    'party_size','group_name','dietary_restrictions','notes',
    'table_number','seat_index',
    'invitation_sent_at',
    'checked_in','checked_in_at','created_at',
    'rsvp_response','rsvp_message','rsvp_confirmed_at',
  ];
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => escape(r[h])).join(','));
  return lines.join('\r\n');
}

const GuestsController = {
  async create(req, res, next) {
    try {
      const guest = await GuestsService.create(req.body, req.tenantId);
      return created(res, guest, 'Guest added');
    } catch (err) { next(err); }
  },

  async createBulk(req, res, next) {
    try {
      const { invitation_id, guests, skip_duplicates } = req.body;
      const result = await GuestsService.createBulk(
        invitation_id, guests, req.tenantId,
        { skip_duplicates: skip_duplicates !== false }
      );
      return created(res, result, `${result.created} guests added`);
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const {
        page, limit, status, group_name,
        has_email, has_phone, checked_in, has_table, sent,
        search, sort_by, sort_dir,
      } = req.query;
      const result = await GuestsService.getAll(req.params.invitationId, req.tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50,
        status:       status || null,
        group_name:   group_name || null,
        has_email:    has_email  === undefined ? null : has_email,
        has_phone:    has_phone  === undefined ? null : has_phone,
        checked_in:   checked_in === undefined ? null : checked_in,
        has_table:    has_table  === undefined ? null : has_table,
        sent:         sent       === undefined ? null : sent,
        search:       search  || null,
        sort_by:      sort_by || 'created_at',
        sort_dir:     sort_dir || 'desc',
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async exportCsv(req, res, next) {
    try {
      const rows = await GuestsService.exportAll(req.params.invitationId, req.tenantId);
      const csv = toCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="guests-${req.params.invitationId}.csv"`);
      // Prepend BOM so Excel detects UTF-8
      res.send('\uFEFF' + csv);
    } catch (err) { next(err); }
  },

  async getGroups(req, res, next) {
    try {
      const groups = await GuestsService.getGroups(req.params.invitationId, req.tenantId);
      return success(res, groups);
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

  async bulkAction(req, res, next) {
    try {
      const { ids, action } = req.body;
      const result = await GuestsService.bulkAction(ids, action, req.tenantId);
      return success(res, result, `Bulk action '${action}' applied`);
    } catch (err) { next(err); }
  },

  async checkIn(req, res, next) {
    try {
      const guest = await GuestsService.setCheckIn(req.params.id, !!req.body.checked_in, req.tenantId);
      return success(res, guest, req.body.checked_in ? 'Checked in' : 'Checked out');
    } catch (err) { next(err); }
  },

  async markSent(req, res, next) {
    try {
      const guest = await GuestsService.setSent(req.params.id, !!req.body.sent, req.tenantId);
      return success(res, guest, req.body.sent ? 'Marcada como enviada' : 'Marcada como no enviada');
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

  async getTimeline(req, res, next) {
    try {
      const timeline = await GuestsService.getTimeline(req.params.invitationId, req.tenantId);
      return success(res, timeline);
    } catch (err) { next(err); }
  },
};

module.exports = GuestsController;
