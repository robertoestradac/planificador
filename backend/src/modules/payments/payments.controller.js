const PaymentsService = require('./payments.service');
const { success, created } = require('../../utils/response');

const PaymentsController = {
  async create(req, res, next) {
    try {
      const payment = await PaymentsService.create(req.body);
      return created(res, payment, 'Pago registrado');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, tenant_id, status, method } = req.query;
      const result = await PaymentsService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        tenant_id: tenant_id || null,
        status: status || null,
        method: method || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getMyPayments(req, res, next) {
    try {
      if (!req.user.tenant_id) return success(res, { data: [], total: 0 });
      const { page, limit } = req.query;
      const result = await PaymentsService.getByTenant(req.user.tenant_id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const payment = await PaymentsService.getById(req.params.id);
      return success(res, payment);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const payment = await PaymentsService.update(req.params.id, req.body);
      return success(res, payment, 'Pago actualizado');
    } catch (err) { next(err); }
  },

  async confirm(req, res, next) {
    try {
      const payment = await PaymentsService.confirm(req.params.id, req.user.id);
      return success(res, payment, 'Pago confirmado');
    } catch (err) { next(err); }
  },

  async reject(req, res, next) {
    try {
      const payment = await PaymentsService.reject(req.params.id, req.user.id);
      return success(res, payment, 'Pago rechazado');
    } catch (err) { next(err); }
  },

  async reopen(req, res, next) {
    try {
      const payment = await PaymentsService.reopen(req.params.id);
      return success(res, payment, 'Pago reabierto');
    } catch (err) { next(err); }
  },

  async getStats(req, res, next) {
    try {
      const stats = await PaymentsService.getStats();
      return success(res, stats);
    } catch (err) { next(err); }
  },

  async getMyCredits(req, res, next) {
    try {
      if (!req.user.tenant_id) return success(res, null);
      const credits = await PaymentsService.getCredits(req.user.tenant_id);
      return success(res, credits);
    } catch (err) { next(err); }
  },

  async getTenantCredits(req, res, next) {
    try {
      const credits = await PaymentsService.getCredits(req.params.tenantId);
      return success(res, credits);
    } catch (err) { next(err); }
  },
};

module.exports = PaymentsController;
