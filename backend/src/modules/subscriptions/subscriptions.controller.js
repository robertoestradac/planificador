const SubscriptionsService = require('./subscriptions.service');
const { success, created } = require('../../utils/response');

const SubscriptionsController = {
  async create(req, res, next) {
    try {
      const sub = await SubscriptionsService.create(req.body);
      return created(res, sub, 'Subscription created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await SubscriptionsService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const sub = await SubscriptionsService.getById(req.params.id);
      return success(res, sub);
    } catch (err) { next(err); }
  },

  async getMySubscription(req, res, next) {
    try {
      const sub = await SubscriptionsService.getActiveByTenant(req.tenantId);
      return success(res, sub);
    } catch (err) { next(err); }
  },

  async getMyHistory(req, res, next) {
    try {
      const subs = await SubscriptionsService.getAllByTenant(req.tenantId);
      return success(res, subs);
    } catch (err) { next(err); }
  },

  async getLimitsUsage(req, res, next) {
    try {
      const usage = await SubscriptionsService.getLimitsUsage(req.tenantId);
      return success(res, usage);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const sub = await SubscriptionsService.update(req.params.id, req.body);
      return success(res, sub, 'Subscription updated');
    } catch (err) { next(err); }
  },

  async cancel(req, res, next) {
    try {
      await SubscriptionsService.cancel(req.tenantId);
      return success(res, null, 'Subscription cancelled');
    } catch (err) { next(err); }
  },

  async renew(req, res, next) {
    try {
      const sub = await SubscriptionsService.renew({
        tenant_id: req.tenantId,
        plan_id: req.body.plan_id,
        duration_days: req.body.duration_days || 30,
      });
      return created(res, sub, 'Subscription renewed');
    } catch (err) { next(err); }
  },
};

module.exports = SubscriptionsController;
