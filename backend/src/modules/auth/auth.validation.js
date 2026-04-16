const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(6).required(),
  tenant_id: Joi.string().uuid().optional().allow(null, ''),
});

const registerSchema = Joi.object({
  name:         Joi.string().min(2).max(100).required(),
  email:        Joi.string().email().lowercase().trim().required(),
  password:     Joi.string().min(8).required(),
  company_name: Joi.string().min(2).max(255).required(),
  subdomain:    Joi.string().min(3).max(50).lowercase().regex(/^[a-z0-9-]+$/).optional().allow('', null),
  plan_id:      Joi.string().uuid().optional().allow(null, ''),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const logoutSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

module.exports = { loginSchema, registerSchema, refreshSchema, logoutSchema };
