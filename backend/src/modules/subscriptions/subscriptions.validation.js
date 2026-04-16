const Joi = require('joi');

const createSubscriptionSchema = Joi.object({
  tenant_id: Joi.string().uuid().required(),
  plan_id: Joi.string().uuid().required(),
  duration_days: Joi.number().integer().min(1).optional().default(30),
  status: Joi.string().valid('active', 'trial', 'cancelled', 'expired').optional(),
});

const updateSubscriptionSchema = Joi.object({
  plan_id: Joi.string().uuid().optional(),
  starts_at: Joi.date().optional(),
  expires_at: Joi.date().optional(),
  status: Joi.string().valid('active', 'trial', 'cancelled', 'expired').optional(),
});

const renewSchema = Joi.object({
  plan_id: Joi.string().uuid().required(),
  duration_days: Joi.number().integer().min(1).optional().default(30),
});

module.exports = { createSubscriptionSchema, updateSubscriptionSchema, renewSchema };
