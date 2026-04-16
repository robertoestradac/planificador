const Joi = require('joi');

const createTenantSchema = Joi.object({
  name:           Joi.string().min(2).max(255).required(),
  subdomain:      Joi.string().pattern(/^[a-z0-9-]+$/).min(3).max(100).required(),
  custom_domain:  Joi.string().max(255).optional().allow(null, ''),
  plan_id:        Joi.string().uuid().optional().allow(null, ''),
  owner_name:     Joi.string().min(2).max(255).optional().allow(null, ''),
  owner_email:    Joi.string().email().optional().allow(null, ''),
  owner_password: Joi.string().min(8).max(255).optional().allow(null, ''),
});

const updateTenantSchema = Joi.object({
  name:           Joi.string().min(2).max(255).optional(),
  subdomain:      Joi.string().pattern(/^[a-z0-9-]+$/).min(3).max(100).optional(),
  custom_domain:  Joi.string().max(255).optional().allow(null, ''),
  status:         Joi.string().valid('active', 'suspended', 'pending').optional(),
  plan_id:        Joi.string().uuid().optional().allow(null, ''),
  owner_name:     Joi.string().min(2).max(255).optional().allow(null, ''),
  owner_email:    Joi.string().email().optional().allow(null, ''),
  owner_password: Joi.string().min(8).max(255).optional().allow(null, ''),
});

module.exports = { createTenantSchema, updateTenantSchema };
