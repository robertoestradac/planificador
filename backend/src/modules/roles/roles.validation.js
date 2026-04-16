const Joi = require('joi');

const createRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  tenant_id: Joi.string().uuid().optional().allow(null, ''),
  is_global: Joi.number().valid(0, 1).optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
});

const setPermissionsSchema = Joi.object({
  permission_ids: Joi.array().items(Joi.string().uuid()).required(),
});

module.exports = { createRoleSchema, updateRoleSchema, setPermissionsSchema };
