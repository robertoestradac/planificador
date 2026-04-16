const Joi = require('joi');

const createPaymentSchema = Joi.object({
  tenant_id: Joi.string().uuid().required(),
  plan_id:   Joi.string().uuid().required(),
  amount:    Joi.number().positive().required(),
  currency:  Joi.string().length(3).default('USD'),
  method:    Joi.string().valid('bank_transfer', 'payment_link').default('bank_transfer'),
  reference: Joi.string().max(255).optional().allow(null, ''),
  notes:     Joi.string().max(1000).optional().allow(null, ''),
});

module.exports = { createPaymentSchema };
