const Joi = require('joi');

const createInvitationSchema = Joi.object({
  event_id: Joi.string().uuid().required(),
  template_id: Joi.string().uuid().optional().allow(null, ''),
  title: Joi.string().min(2).max(255).required(),
  slug: Joi.string().min(2).max(255).optional().allow(null, ''),
  builder_json: Joi.string().optional().allow(null, ''),
  html: Joi.string().optional().allow(null, ''),
  css: Joi.string().optional().allow(null, ''),
});

const updateInvitationSchema = Joi.object({
  title: Joi.string().min(2).max(255).optional(),
  slug: Joi.string().min(2).max(255).optional(),
  template_id: Joi.string().uuid().optional().allow(null, ''),
});

const saveBuilderSchema = Joi.object({
  builder_json: Joi.string().required(),
  html: Joi.string().optional().allow(null, ''),
  css: Joi.string().optional().allow(null, ''),
});

module.exports = { createInvitationSchema, updateInvitationSchema, saveBuilderSchema };
