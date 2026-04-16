const Joi = require('joi');

const createPlanSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  price_usd: Joi.number().min(0).required(),
  price_gtq: Joi.number().min(0).required(),
  max_events: Joi.number().integer().min(1).allow(null).optional(),
  max_guests: Joi.number().integer().min(1).allow(null).optional(),
  max_users: Joi.number().integer().min(1).allow(null).optional(),
  duration_months: Joi.number().integer().min(1).max(12).default(1).optional(),
  is_active: Joi.number().valid(0, 1).optional(),
});

const updatePlanSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  price_usd: Joi.number().min(0).optional(),
  price_gtq: Joi.number().min(0).optional(),
  max_events: Joi.number().integer().min(1).allow(null).optional(),
  max_guests: Joi.number().integer().min(1).allow(null).optional(),
  max_users: Joi.number().integer().min(1).allow(null).optional(),
  duration_months: Joi.number().integer().min(1).max(12).optional(),
  is_active: Joi.number().valid(0, 1).optional(),
});

const setPermissionsSchema = Joi.object({
  permission_ids: Joi.array().items(Joi.string().uuid()).required(),
});

module.exports = { createPlanSchema, updatePlanSchema, setPermissionsSchema };
