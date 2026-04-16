const PermissionsModel = require('./permissions.model');
const AppError = require('../../utils/AppError');

const PermissionsService = {
  async getAll() {
    return PermissionsModel.findAll();
  },

  async getById(id) {
    const perm = await PermissionsModel.findById(id);
    if (!perm) throw new AppError('Permission not found', 404);
    return perm;
  },

  async create({ key_name, description }) {
    const existing = await PermissionsModel.findByKey(key_name);
    if (existing) throw new AppError('Permission key already exists', 409);
    return PermissionsModel.create({ key_name, description });
  },

  async update(id, data) {
    const perm = await PermissionsModel.findById(id);
    if (!perm) throw new AppError('Permission not found', 404);
    if (data.key_name && data.key_name !== perm.key_name) {
      const existing = await PermissionsModel.findByKey(data.key_name);
      if (existing) throw new AppError('Permission key already exists', 409);
    }
    return PermissionsModel.update(id, data);
  },

  async delete(id) {
    const perm = await PermissionsModel.findById(id);
    if (!perm) throw new AppError('Permission not found', 404);
    await PermissionsModel.delete(id);
  },
};

module.exports = PermissionsService;
