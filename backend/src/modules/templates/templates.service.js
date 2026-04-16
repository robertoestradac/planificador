const TemplatesModel = require('./templates.model');
const AppError = require('../../utils/AppError');

const TemplatesService = {
  async create(data) {
    return TemplatesModel.create(data);
  },

  async getAll(filters) {
    return TemplatesModel.findAll(filters);
  },

  async getById(id) {
    const template = await TemplatesModel.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    return template;
  },

  async update(id, data) {
    const template = await TemplatesModel.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    return TemplatesModel.update(id, data);
  },

  async delete(id) {
    const template = await TemplatesModel.findById(id);
    if (!template) throw new AppError('Template not found', 404);
    await TemplatesModel.delete(id);
  },
};

module.exports = TemplatesService;
