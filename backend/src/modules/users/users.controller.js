const UsersService = require('./users.service');
const { success, created } = require('../../utils/response');

const UsersController = {
  async create(req, res, next) {
    try {
      const tenant_id = req.body.tenant_id || req.tenantId || null;
      const user = await UsersService.create({ ...req.body, tenant_id }, req.user);
      return created(res, user, 'User created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { page, limit, status } = req.query;
      const result = await UsersService.getAllByTenant(tenantId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        status: status || null,
      });
      return success(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const user = await UsersService.getById(req.params.id, req.tenantId);
      return success(res, user);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const user = await UsersService.update(req.params.id, req.body, req.tenantId);
      return success(res, user, 'User updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await UsersService.delete(req.params.id, req.tenantId);
      return success(res, null, 'User deleted');
    } catch (err) { next(err); }
  },

  async changePassword(req, res, next) {
    try {
      await UsersService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
      return success(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  },
};

module.exports = UsersController;
