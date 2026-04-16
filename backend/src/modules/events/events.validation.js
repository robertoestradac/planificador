const Joi = require('joi');

const createEventSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  date: Joi.date().iso().required(),
  location: Joi.string().max(500).optional().allow(null, ''),
  map_url: Joi.string().uri().max(500).optional().allow(null, ''),
});

const updateEventSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  date: Joi.date().iso().optional(),
  location: Joi.string().max(500).optional().allow(null, ''),
  map_url: Joi.string().uri().max(500).optional().allow(null, ''),
});

module.exports = { createEventSchema, updateEventSchema };
