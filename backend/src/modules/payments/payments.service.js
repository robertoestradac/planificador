const PaymentsModel = require('./payments.model');
const AppError = require('../../utils/AppError');
const { getTenantCredits } = require('../../utils/credits');

const PaymentsService = {
  async create(data) {
    const { tenant_id, plan_id, amount } = data;
    if (!tenant_id || !plan_id || amount == null) {
      throw new AppError('tenant_id, plan_id y amount son requeridos', 400);
    }
    return PaymentsModel.create(data);
  },

  async getAll(filters) {
    return PaymentsModel.findAll(filters);
  },

  async getByTenant(tenantId, filters) {
    return PaymentsModel.findByTenant(tenantId, filters);
  },

  async getById(id) {
    const p = await PaymentsModel.findById(id);
    if (!p) throw new AppError('Pago no encontrado', 404);
    return p;
  },

  async update(id, fields) {
    const payment = await PaymentsModel.findById(id);
    if (!payment) throw new AppError('Pago no encontrado', 404);
    if (fields.amount != null) fields.amount = parseFloat(fields.amount);
    return PaymentsModel.update(id, fields);
  },

  async confirm(id, adminUserId) {
    const payment = await PaymentsModel.findById(id);
    if (!payment) throw new AppError('Pago no encontrado', 404);
    if (payment.status === 'confirmed') return payment;
    return PaymentsModel.updateStatus(id, { status: 'confirmed', confirmed_by: adminUserId });
  },

  async reject(id, adminUserId) {
    const payment = await PaymentsModel.findById(id);
    if (!payment) throw new AppError('Pago no encontrado', 404);
    if (payment.status === 'rejected') return payment;
    return PaymentsModel.updateStatus(id, { status: 'rejected', confirmed_by: adminUserId });
  },

  async reopen(id) {
    const payment = await PaymentsModel.findById(id);
    if (!payment) throw new AppError('Pago no encontrado', 404);
    return PaymentsModel.updateStatus(id, { status: 'pending', confirmed_by: null });
  },

  async getStats() {
    return PaymentsModel.getStats();
  },

  async getCredits(tenantId) {
    return getTenantCredits(tenantId);
  },
};

module.exports = PaymentsService;
