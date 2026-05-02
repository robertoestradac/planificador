const { Router } = require('express');
const MarketingController = require('./marketing.controller');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');
const MarketingValidation = require('./marketing.validation');

const router = Router();

// Middleware to check if user is SuperAdmin or Admin
const requireAdmin = (req, res, next) => {
  const allowed = ['SuperAdmin', 'Admin'];
  if (!req.user || !allowed.includes(req.user.role_name)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

/* ═══════════════════════════════════════════════════════════
   EMAIL MARKETING ROUTES (Brevo, Mailchimp, SendGrid)
═══════════════════════════════════════════════════════════ */

// Email Marketing Configuration
router.get('/email-config', MarketingController.getEmailConfig);
router.put(
  '/email-config', 
  validate(MarketingValidation.updateEmailConfig), 
  MarketingController.updateEmailConfig
);

// Test email marketing connection
router.post(
  '/email/test', 
  MarketingController.testEmailConnection
);

// Send email campaign
router.post(
  '/email/send', 
  validate(MarketingValidation.sendCampaign), 
  MarketingController.sendCampaign
);

// Get campaigns
router.get('/campaigns', MarketingController.getCampaigns);

// Get email statistics
router.get('/email/stats', MarketingController.getEmailStats);

// Brevo specific routes
router.get('/templates', MarketingController.getEmailTemplates);
router.get('/account', MarketingController.getAccountInfo);

/* ═══════════════════════════════════════════════════════════
   SMTP TRANSACTIONAL ROUTES (System emails)
═══════════════════════════════════════════════════════════ */

// SMTP Configuration
router.get('/smtp-config', MarketingController.getSmtpConfig);
router.put(
  '/smtp-config', 
  validate(MarketingValidation.updateSmtpConfig), 
  MarketingController.updateSmtpConfig
);

// Test SMTP connection
router.post(
  '/smtp/test', 
  validate(MarketingValidation.testSmtp), 
  MarketingController.testSmtpConnection
);

module.exports = router;
