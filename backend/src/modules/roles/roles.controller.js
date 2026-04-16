const RolesService = require('./roles.service');
const { success, created } = require('../../utils/response');

const RolesController = {
  async create(req, res, next) {
    try {
      const tenant_id = req.body.tenant_id || req.tenantId || null;
      const role = await RolesService.create({ ...req.body, tenant_id });
      return created(res, role, 'Role created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const roles = await RolesService.getAll({
        tenant_id: req.tenantId || null,
        include_global: req.query.include_global !== 'false',
      });
      return success(res, roles);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const role = await RolesService.getById(req.params.id);
      return success(res, role);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const role = await RolesService.update(req.params.id, req.body);
      return success(res, role, 'Role updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await RolesService.delete(req.params.id);
      return success(res, null, 'Role deleted');
    } catch (err) { next(err); }
  },

  async getPermissions(req, res, next) {
    try {
      const perms = await RolesService.getPermissions(req.params.id);
      return success(res, perms);
    } catch (err) { next(err); }
  },

  async setPermissions(req, res, next) {
    try {
      const perms = await RolesService.setPermissions(req.params.id, req.body.permission_ids);
      return success(res, perms, 'Permissions updated');
    } catch (err) { next(err); }
  },

  async addPermission(req, res, next) {
    try {
      const perms = await RolesService.addPermission(req.params.id, req.params.permId);
      return success(res, perms, 'Permission added');
    } catch (err) { next(err); }
  },

  async removePermission(req, res, next) {
    try {
      const perms = await RolesService.removePermission(req.params.id, req.params.permId);
      return success(res, perms, 'Permission removed');
    } catch (err) { next(err); }
  },
};

module.exports = RolesController;
