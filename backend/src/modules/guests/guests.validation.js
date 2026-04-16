const Joi = require('joi');

const createGuestSchema = Joi.object({
  invitation_id: Joi.string().uuid().required(),
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().max(50).optional().allow(null, ''),
  email: Joi.string().email().max(255).optional().allow(null, ''),
});

const createBulkSchema = Joi.object({
  invitation_id: Joi.string().uuid().required(),
  guests: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(255).required(),
      phone: Joi.string().max(50).optional().allow(null, ''),
      email: Joi.string().email().max(255).optional().allow(null, ''),
    })
  ).min(1).required(),
});

const updateGuestSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  phone: Joi.string().max(50).optional().allow(null, ''),
  email: Joi.string().email().max(255).optional().allow(null, ''),
  status: Joi.string().valid('pending', 'confirmed', 'declined').optional(),
});

const rsvpSchema = Joi.object({
  response: Joi.string().valid('confirmed', 'declined', 'maybe').required(),
  message: Joi.string().max(500).optional().allow(null, ''),
});

module.exports = { createGuestSchema, createBulkSchema, updateGuestSchema, rsvpSchema };
