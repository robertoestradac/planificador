const PlansService = require('./plans.service');
const { success, created } = require('../../utils/response');

const PlansController = {
  async create(req, res, next) {
    try {
      const plan = await PlansService.create(req.body);
      return created(res, plan, 'Plan created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const active_only = req.query.active_only === 'true';
      const plans = await PlansService.getAll({ active_only });
      return success(res, plans);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const plan = await PlansService.getById(req.params.id);
      return success(res, plan);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const plan = await PlansService.update(req.params.id, req.body);
      return success(res, plan, 'Plan updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await PlansService.delete(req.params.id);
      return success(res, null, 'Plan deleted');
    } catch (err) { next(err); }
  },

  async setPermissions(req, res, next) {
    try {
      const perms = await PlansService.setPermissions(req.params.id, req.body.permission_ids);
      return success(res, perms, 'Plan permissions updated');
    } catch (err) { next(err); }
  },

  async addPermission(req, res, next) {
    try {
      const perms = await PlansService.addPermission(req.params.id, req.params.permId);
      return success(res, perms, 'Permission added to plan');
    } catch (err) { next(err); }
  },

  async removePermission(req, res, next) {
    try {
      const perms = await PlansService.removePermission(req.params.id, req.params.permId);
      return success(res, perms, 'Permission removed from plan');
    } catch (err) { next(err); }
  },
};

module.exports = PlansController;
