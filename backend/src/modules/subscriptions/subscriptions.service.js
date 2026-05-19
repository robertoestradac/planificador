const SubscriptionsModel = require('./subscriptions.model');
const PlansModel = require('../plans/plans.model');
const AppError = require('../../utils/AppError');
const { getPlanExpirationDate } = require('../../utils/planHelpers');

const SubscriptionsService = {
  async create({ tenant_id, plan_id, status = 'active' }) {
    const plan = await PlansModel.findById(plan_id);
    if (!plan) throw new AppError('Plan not found', 404);
    if (!plan.is_active) throw new AppError('Plan is not active', 400);

    const starts_at = new Date();
    // ✅ Calculate expiration based on plan's duration_months
    const expires_at = getPlanExpirationDate(plan, starts_at);

    return SubscriptionsModel.create({ tenant_id, plan_id, starts_at, expires_at, status });
  },

  async getActiveByTenant(tenantId) {
    const sub = await SubscriptionsModel.findActiveByTenant(tenantId);
    if (!sub) throw new AppError('No active subscription found', 404);

    // Use the centralized credits utility which sums all confirmed payments
    // + active subscription to support stacking (buying same plan multiple times)
    const { getTenantCredits } = require('../../utils/credits');
    const credits = await getTenantCredits(tenantId);

    return {
      ...sub,
      usage: {
        events: { used: credits.events.used, max: credits.events.total },
        users:  { used: credits.users.used,  max: credits.users.total },
        guests: { used: credits.guests.used, max: credits.guests.total },
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

  async renew({ tenant_id, plan_id }) {
    await SubscriptionsModel.cancelByTenant(tenant_id);
    return this.create({ tenant_id, plan_id });
  },

  async getLimitsUsage(tenantId) {
    const sub = await SubscriptionsModel.findActiveByTenant(tenantId);
    if (!sub) throw new AppError('No active subscription', 404);

    // Use centralized credits (supports stacking)
    const { getTenantCredits } = require('../../utils/credits');
    const credits = await getTenantCredits(tenantId);

    return {
      plan: { name: sub.plan_name, max_events: credits.events.total, max_guests: credits.guests.total, max_users: credits.users.total },
      usage: {
        events: { used: credits.events.used, max: credits.events.total, exceeded: credits.events.total !== null && credits.events.used >= credits.events.total },
        users:  { used: credits.users.used,  max: credits.users.total,  exceeded: credits.users.total  !== null && credits.users.used  >= credits.users.total  },
        guests: { used: credits.guests.used, max: credits.guests.total, exceeded: credits.guests.total !== null && credits.guests.used >= credits.guests.total },
      },
    };
  },
};

module.exports = SubscriptionsService;
