const SubscriptionsModel = require('./subscriptions.model');
const PlansModel = require('../plans/plans.model');
const AppError = require('../../utils/AppError');

const SubscriptionsService = {
  async create({ tenant_id, plan_id, duration_days = 30, status = 'active' }) {
    const plan = await PlansModel.findById(plan_id);
    if (!plan) throw new AppError('Plan not found', 404);
    if (!plan.is_active) throw new AppError('Plan is not active', 400);

    const starts_at = new Date();
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + duration_days);

    return SubscriptionsModel.create({ tenant_id, plan_id, starts_at, expires_at, status });
  },

  async getActiveByTenant(tenantId) {
    const sub = await SubscriptionsModel.findActiveByTenant(tenantId);
    if (!sub) throw new AppError('No active subscription found', 404);

    const usage = await SubscriptionsModel.getLimitsUsage(tenantId);
    return {
      ...sub,
      usage: {
        events: { used: usage.events_used, max: sub.max_events },
        users:  { used: usage.users_used,  max: sub.max_users },
        guests: { used: usage.guests_used, max: sub.max_guests },
      },
    };
  },

  async getAllByTenant(tenantId) {
    return SubscriptionsModel.findAllByTenant(tenantId);
  },

  async getAll(filters) {
    return SubscriptionsModel.findAll(filters);
  },

  async getById(id) {
    const sub = await SubscriptionsModel.findById(id);
    if (!sub) throw new AppError('Subscription not found', 404);
    return sub;
  },

  async update(id, data) {
    const sub = await SubscriptionsModel.findById(id);
    if (!sub) throw new AppError('Subscription not found', 404);
    return SubscriptionsModel.update(id, data);
  },

  async cancel(tenantId) {
    await SubscriptionsModel.cancelByTenant(tenantId);
  },

  async renew({ tenant_id, plan_id, duration_days = 30 }) {
    await SubscriptionsModel.cancelByTenant(tenant_id);
    return this.create({ tenant_id, plan_id, duration_days });
  },

  async getLimitsUsage(tenantId) {
    const sub = await SubscriptionsModel.findActiveByTenant(tenantId);
    if (!sub) throw new AppError('No active subscription', 404);
    const usage = await SubscriptionsModel.getLimitsUsage(tenantId);
    return {
      plan: { name: sub.plan_name, max_events: sub.max_events, max_guests: sub.max_guests, max_users: sub.max_users },
      usage: {
        events: { used: usage.events_used, max: sub.max_events, exceeded: sub.max_events !== null && usage.events_used >= sub.max_events },
        users:  { used: usage.users_used,  max: sub.max_users,  exceeded: sub.max_users  !== null && usage.users_used  >= sub.max_users  },
        guests: { used: usage.guests_used, max: sub.max_guests, exceeded: sub.max_guests !== null && usage.guests_used >= sub.max_guests },
      },
    };
  },
};

module.exports = SubscriptionsService;
