const Joi = require('joi');

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).required(),
  role_id: Joi.string().uuid().required(),
  tenant_id: Joi.string().uuid().optional().allow(null, ''),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  role_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  password: Joi.string().min(8).optional(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required(),
});

module.exports = { createUserSchema, updateUserSchema, changePasswordSchema };
