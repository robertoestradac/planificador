const Joi = require('joi');

const guestFields = {
  name:                 Joi.string().min(2).max(255),
  phone:                Joi.string().max(50).allow(null, ''),
  email:                Joi.string().email().max(255).allow(null, ''),
  party_size:           Joi.number().integer().min(1).max(50),
  group_name:           Joi.string().max(100).allow(null, ''),
  dietary_restrictions: Joi.string().max(500).allow(null, ''),
  notes:                Joi.string().max(2000).allow(null, ''),
};

const createGuestSchema = Joi.object({
  invitation_id:        Joi.string().uuid().required(),
  name:                 guestFields.name.required(),
  phone:                guestFields.phone.optional(),
  email:                guestFields.email.optional(),
  party_size:           guestFields.party_size.optional(),
  group_name:           guestFields.group_name.optional(),
  dietary_restrictions: guestFields.dietary_restrictions.optional(),
  notes:                guestFields.notes.optional(),
});

const createBulkSchema = Joi.object({
  invitation_id: Joi.string().uuid().required(),
  skip_duplicates: Joi.boolean().optional(),
  guests: Joi.array().items(
    Joi.object({
      name:                 guestFields.name.required(),
      phone:                guestFields.phone.optional(),
      email:                guestFields.email.optional(),
      party_size:           guestFields.party_size.optional(),
      group_name:           guestFields.group_name.optional(),
      dietary_restrictions: guestFields.dietary_restrictions.optional(),
      notes:                guestFields.notes.optional(),
    })
  ).min(1).max(1000).required(),
});

const updateGuestSchema = Joi.object({
  name:                 guestFields.name.optional(),
  phone:                guestFields.phone.optional(),
  email:                guestFields.email.optional(),
  party_size:           guestFields.party_size.optional(),
  group_name:           guestFields.group_name.optional(),
  dietary_restrictions: guestFields.dietary_restrictions.optional(),
  notes:                guestFields.notes.optional(),
  status:               Joi.string().valid('pending', 'confirmed', 'declined').optional(),
}).min(1);

const rsvpSchema = Joi.object({
  response:             Joi.string().valid('confirmed', 'declined', 'maybe').required(),
  message:              Joi.string().max(500).optional().allow(null, ''),
  party_size_confirmed: Joi.number().integer().min(0).max(50).optional(),
});

const checkInSchema = Joi.object({
  checked_in: Joi.boolean().required(),
});

const sentSchema = Joi.object({
  sent: Joi.boolean().required(),
});

const bulkActionSchema = Joi.object({
  ids:    Joi.array().items(Joi.string().uuid()).min(1).max(500).required(),
  action: Joi.string().valid(
    'delete', 'confirm', 'decline', 'reset',
    'check_in', 'check_out',
    'mark_sent', 'mark_unsent'
  ).required(),
});

module.exports = {
  createGuestSchema,
  createBulkSchema,
  updateGuestSchema,
  rsvpSchema,
  checkInSchema,
  sentSchema,
  bulkActionSchema,
};
