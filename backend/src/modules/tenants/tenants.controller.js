const TenantsService = require('./tenants.service');
const { success, created } = require('../../utils/response');

const TenantsController = {
  async create(req, res, next) {
    try {
      const tenant = await TenantsService.create(req.body);
      return created(res, tenant, 'Tenant created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const result = await TenantsService.getAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const tenant = await TenantsService.getById(req.params.id);
      return success(res, tenant);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const tenant = await TenantsService.update(req.params.id, req.body);
      return success(res, tenant, 'Tenant updated');
    } catch (err) { next(err); }
  },

  async suspend(req, res, next) {
    try {
      const tenant = await TenantsService.suspend(req.params.id);
      return success(res, tenant, 'Tenant suspended');
    } catch (err) { next(err); }
  },

  async activate(req, res, next) {
    try {
      const tenant = await TenantsService.activate(req.params.id);
      return success(res, tenant, 'Tenant activated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await TenantsService.delete(req.params.id);
      return success(res, null, 'Tenant deleted');
    } catch (err) { next(err); }
  },

  async getStats(req, res, next) {
    try {
      const tenantId = req.params.id || req.tenantId;
      const stats = await TenantsService.getStats(tenantId);
      return success(res, stats);
    } catch (err) { next(err); }
  },
};

module.exports = TenantsController;
