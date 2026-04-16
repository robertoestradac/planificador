const TemplatesService = require('./templates.service');
const { success, created } = require('../../utils/response');

const TemplatesController = {
  async create(req, res, next) {
    try {
      const template = await TemplatesService.create({ ...req.body, created_by: req.user?.id || null });
      return created(res, template, 'Template created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const { active_only, category } = req.query;
      const templates = await TemplatesService.getAll({
        active_only: active_only !== 'false',
        category: category || null,
      });
      return success(res, templates);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const template = await TemplatesService.getById(req.params.id);
      return success(res, template);
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const template = await TemplatesService.update(req.params.id, req.body);
      return success(res, template, 'Template updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await TemplatesService.delete(req.params.id);
      return success(res, null, 'Template deleted');
    } catch (err) { next(err); }
  },

  async saveBuilder(req, res, next) {
    try {
      const { base_json } = req.body;
      const template = await TemplatesService.update(req.params.id, { base_json });
      return success(res, template, 'Template builder saved');
    } catch (err) { next(err); }
  },
};

module.exports = TemplatesController;
