const Joi = require('joi');

const createTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  preview_image: Joi.string().uri().max(500).optional().allow(null, ''),
  base_json: Joi.string().optional().allow(null, ''),
  category: Joi.string().max(100).optional().allow(null, ''),
  is_active: Joi.number().valid(0, 1).optional(),
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  preview_image: Joi.string().uri().max(500).optional().allow(null, ''),
  base_json: Joi.string().optional().allow(null, ''),
  category: Joi.string().max(100).optional().allow(null, ''),
  is_active: Joi.number().valid(0, 1).optional(),
});

module.exports = { createTemplateSchema, updateTemplateSchema };
