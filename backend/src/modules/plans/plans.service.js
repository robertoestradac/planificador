const PlansModel = require('./plans.model');
const AppError = require('../../utils/AppError');
const authorize = require('../../middlewares/authorize');

const PlansService = {
  async create(data) {
    return PlansModel.create(data);
  },

  async getAll({ active_only = false } = {}) {
    const plans = await PlansModel.findAll({ active_only });
    for (const plan of plans) {
      plan.permissions = await PlansModel.getPermissions(plan.id);
    }
    return plans;
  },

  async getById(id) {
    const plan = await PlansModel.findById(id);
    if (!plan) throw new AppError('Plan not found', 404);
    plan.permissions = await PlansModel.getPermissions(id);
    return plan;
  },

  async update(id, data) {
    const plan = await PlansModel.findById(id);
    if (!plan) throw new AppError('Plan not found', 404);
    return PlansModel.update(id, data);
  },

  async delete(id) {
    const plan = await PlansModel.findById(id);
    if (!plan) throw new AppError('Plan not found', 404);
    await PlansModel.delete(id);
    authorize.invalidatePlanCache(id);
  },

  async setPermissions(id, permissionIds) {
    const plan = await PlansModel.findById(id);
    if (!plan) throw new AppError('Plan not found', 404);
    await PlansModel.setPermissions(id, permissionIds);
    authorize.invalidatePlanCache(id);
    return PlansModel.getPermissions(id);
  },

  async addPermission(planId, permissionId) {
    const plan = await PlansModel.findById(planId);
    if (!plan) throw new AppError('Plan not found', 404);
    await PlansModel.addPermission(planId, permissionId);
    authorize.invalidatePlanCache(planId);
    return PlansModel.getPermissions(planId);
  },

  async removePermission(planId, permissionId) {
    const plan = await PlansModel.findById(planId);
    if (!plan) throw new AppError('Plan not found', 404);
    await PlansModel.removePermission(planId, permissionId);
    authorize.invalidatePlanCache(planId);
    return PlansModel.getPermissions(planId);
  },
};

module.exports = PlansService;
