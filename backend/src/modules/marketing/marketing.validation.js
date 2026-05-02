const Joi = require('joi');

const MarketingValidation = {
  // Email Marketing Config (Brevo, Mailchimp, etc.)
  updateEmailConfig: Joi.object({
    smtp_provider: Joi.string().valid('brevo', 'mailchimp', 'sendgrid', 'smtp').optional(),
    smtp_api_key: Joi.string().min(10).optional().allow(null, ''),
    smtp_sender_name: Joi.string().max(100).optional().allow(null, ''),
    smtp_sender_email: Joi.string().email().optional().allow(null, ''),
    smtp_enabled: Joi.boolean().optional(),
    smtp_list_id: Joi.string().optional().allow(null, ''),
  }),

  // SMTP Transactional Config
  updateSmtpConfig: Joi.object({
    host: Joi.string().optional().allow(null, ''),
    port: Joi.alternatives().try(
      Joi.number().integer().min(1).max(65535),
      Joi.string().pattern(/^\d+$/).custom((value, helpers) => {
        const num = parseInt(value, 10);
        if (num < 1 || num > 65535) {
          return helpers.error('any.invalid');
        }
        return num;
      }),
      Joi.string().allow('')
    ).optional(),
    secure: Joi.alternatives().try(
      Joi.boolean(),
      Joi.number().valid(0, 1)
    ).optional(),
    user: Joi.string().optional().allow(null, ''),
    password: Joi.string().optional().allow(null, ''),
    from_email: Joi.string().email().optional().allow(null, ''),
    from_name: Joi.string().max(100).optional().allow(null, ''),
  }),

  testConnection: Joi.object({
    smtp_api_key: Joi.string().min(10).required(),
  }),

  testSmtp: Joi.object({
    to: Joi.string().email().required(),
  }),

  sendTestEmail: Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).required(),
  }),

  sendCampaign: Joi.object({
    subject: Joi.string().min(1).max(255).required(),
    html: Joi.string().min(1).required(),
    recipients: Joi.array().items(Joi.string()).min(1).required(),
  }),
};

module.exports = MarketingValidation;
