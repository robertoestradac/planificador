const RolesModel = require('./roles.model');
const AppError = require('../../utils/AppError');
const authorize = require('../../middlewares/authorize');

const RolesService = {
  async create({ tenant_id, name, is_global = 0 }) {
    return RolesModel.create({ tenant_id, name, is_global });
  },

  async getAll(filters) {
    return RolesModel.findAll(filters);
  },

  async getById(id) {
    const role = await RolesModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return role;
  },

  async update(id, data) {
    const role = await RolesModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    if (role.is_global) throw new AppError('Cannot modify global roles', 403);
    return RolesModel.update(id, data);
  },

  async delete(id) {
    const role = await RolesModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    if (role.is_global) throw new AppError('Cannot delete global roles', 403);
    await RolesModel.delete(id);
    authorize.invalidateRoleCache(id);
  },

  async getPermissions(id) {
    const role = await RolesModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    return RolesModel.getPermissions(id);
  },

  async setPermissions(id, permissionIds) {
    const role = await RolesModel.findById(id);
    if (!role) throw new AppError('Role not found', 404);
    await RolesModel.setPermissions(id, permissionIds);
    authorize.invalidateRoleCache(id);
    return RolesModel.getPermissions(id);
  },

  async addPermission(roleId, permissionId) {
    const role = await RolesModel.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    await RolesModel.addPermission(roleId, permissionId);
    authorize.invalidateRoleCache(roleId);
    return RolesModel.getPermissions(roleId);
  },

  async removePermission(roleId, permissionId) {
    const role = await RolesModel.findById(roleId);
    if (!role) throw new AppError('Role not found', 404);
    await RolesModel.removePermission(roleId, permissionId);
    authorize.invalidateRoleCache(roleId);
    return RolesModel.getPermissions(roleId);
  },
};

module.exports = RolesService;
