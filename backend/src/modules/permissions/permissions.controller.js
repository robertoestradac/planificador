const PermissionsService = require('./permissions.service');
const { success, created } = require('../../utils/response');

const PermissionsController = {
  async getAll(req, res, next) {
    try {
      const perms = await PermissionsService.getAll();
      return success(res, perms);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const perm = await PermissionsService.getById(req.params.id);
      return success(res, perm);
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const perm = await PermissionsService.create(req.body);
      return created(res, perm, 'Permission created');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const perm = await PermissionsService.update(req.params.id, req.body);
      return success(res, perm, 'Permission updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await PermissionsService.delete(req.params.id);
      return success(res, null, 'Permission deleted');
    } catch (err) { next(err); }
  },
};

module.exports = PermissionsController;
