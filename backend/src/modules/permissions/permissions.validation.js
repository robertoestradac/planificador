const Joi = require('joi');

const createPermissionSchema = Joi.object({
  key_name: Joi.string().pattern(/^[a-z_]+$/).min(3).max(100).required(),
  description: Joi.string().min(3).max(255).required(),
});

const updatePermissionSchema = Joi.object({
  key_name: Joi.string().pattern(/^[a-z_]+$/).min(3).max(100).optional(),
  description: Joi.string().min(3).max(255).optional(),
});

module.exports = { createPermissionSchema, updatePermissionSchema };
