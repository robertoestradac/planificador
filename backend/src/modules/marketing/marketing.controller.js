const MarketingModel = require('./marketing.model');
const MarketingService = require('./marketing.service');

const MarketingController = {
  /* ═══════════════════════════════════════════════════════════
     EMAIL MARKETING CONFIG (Brevo, Mailchimp, SendGrid)
  ═══════════════════════════════════════════════════════════ */

  /**
   * GET /api/v1/admin/marketing/email-config
   * Get Email Marketing configuration (admin only)
   */
  async getEmailConfig(req, res) {
    try {
      const config = await MarketingModel.getEmailConfig();
      
      // Don't expose the full API key
      const safeConfig = {
        ...config,
        smtp_api_key: config.smtp_api_key 
          ? `${config.smtp_api_key.substring(0, 8)}...` 
          : null,
        is_configured: !!config.smtp_api_key,
      };
      
      res.json({ 
        success: true, 
        data: safeConfig 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * PUT /api/v1/admin/marketing/email-config
   * Update Email Marketing configuration (admin only)
   */
  async updateEmailConfig(req, res) {
    try {
      const { 
        smtp_provider, 
        smtp_api_key, 
        smtp_sender_name, 
        smtp_sender_email,
        smtp_enabled,
        smtp_list_id
      } = req.body;

      const config = await MarketingModel.updateEmailConfig({
        smtp_provider,
        smtp_api_key,
        smtp_sender_name,
        smtp_sender_email,
        smtp_enabled: smtp_enabled ? 1 : 0,
        smtp_list_id,
      });

      // Don't expose the full API key
      const safeConfig = {
        ...config,
        smtp_api_key: config.smtp_api_key 
          ? `${config.smtp_api_key.substring(0, 8)}...` 
          : null,
        is_configured: !!config.smtp_api_key,
      };

      res.json({ 
        success: true, 
        data: safeConfig,
        message: 'Configuración de email marketing actualizada' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * POST /api/v1/admin/marketing/email/test
   * Test email marketing connection (admin only)
   */
  async testEmailConnection(req, res) {
    try {
      const { provider, credentials } = req.body;

      if (!credentials || !credentials.api_key) {
        return res.status(400).json({
          success: false,
          message: 'API key es requerida para probar la conexión',
        });
      }

      const result = await MarketingService.testEmailConnection(provider || 'brevo', credentials);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /* ═══════════════════════════════════════════════════════════
     SMTP TRANSACTIONAL CONFIG (System emails)
  ═══════════════════════════════════════════════════════════ */

  /**
   * GET /api/v1/admin/marketing/smtp-config
   * Get SMTP transactional configuration (admin only)
   */
  async getSmtpConfig(req, res) {
    try {
      const config = await MarketingModel.getSmtpConfig();
      
      res.json({ 
        success: true, 
        data: {
          ...config,
          is_configured: !!config.host && !!config.user,
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * PUT /api/v1/admin/marketing/smtp-config
   * Update SMTP transactional configuration (admin only)
   */
  async updateSmtpConfig(req, res) {
    try {
      const { 
        host, 
        port, 
        secure,
        user, 
        password,
        from_email,
        from_name
      } = req.body;

      // Convert port to number if it's a string, or null if empty
      let portNumber = port;
      if (typeof port === 'string') {
        portNumber = port.trim() === '' ? null : parseInt(port, 10);
      }

      // Convert secure to boolean
      const secureBoolean = secure === true || secure === 1 || secure === '1';

      // Trim strings to remove extra spaces
      const cleanHost = host ? host.trim() : null;
      const cleanUser = user ? user.trim() : null;
      const cleanPassword = password ? password.trim() : null;
      const cleanFromEmail = from_email ? from_email.trim() : null;
      const cleanFromName = from_name ? from_name.trim() : null;

      const config = await MarketingModel.updateSmtpConfig({
        host: cleanHost || null,
        port: portNumber,
        secure: secureBoolean ? 1 : 0,
        user: cleanUser || null,
        password: cleanPassword || null,
        from_email: cleanFromEmail || null,
        from_name: cleanFromName || null,
      });

      res.json({ 
        success: true, 
        data: {
          ...config,
          is_configured: !!config.host && !!config.user,
        },
        message: 'Configuración SMTP actualizada' 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * POST /api/v1/admin/marketing/smtp/test
   * Test SMTP transactional connection (admin only)
   */
  async testSmtpConnection(req, res) {
    try {
      const { to } = req.body;

      if (!to) {
        return res.status(400).json({
          success: false,
          message: 'Email de destino es requerido',
        });
      }

      // Check if SMTP is configured
      const config = await MarketingModel.getSmtpConfig();
      if (!config.host || !config.user || !config.password) {
        return res.status(400).json({
          success: false,
          message: 'SMTP no está configurado completamente. Por favor configura host, usuario y contraseña primero.',
        });
      }

      const result = await MarketingService.testSmtpConnection(to);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /* ═══════════════════════════════════════════════════════════
     EMAIL CAMPAIGNS
  ═══════════════════════════════════════════════════════════ */

  /**
   * POST /api/v1/admin/marketing/email/send
   * Send email campaign (admin only)
   */
  async sendCampaign(req, res) {
    try {
      const { subject, html, recipients } = req.body;

      if (!subject || !html || !recipients || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Asunto, contenido y destinatarios son requeridos',
        });
      }

      // Create campaign record
      const campaign = await MarketingModel.createCampaign({
        tenant_id: req.user.tenant_id,
        subject,
        html_content: html,
        recipients,
        created_by: req.user.id,
      });

      // Send emails in background
      MarketingService.sendCampaign(campaign.id, subject, html, recipients)
        .catch(err => console.error('Campaign send error:', err));

      res.json({ 
        success: true, 
        message: 'Campaña creada. Los emails se enviarán en segundo plano.',
        data: { campaign_id: campaign.id }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * GET /api/v1/admin/marketing/campaigns
   * Get email campaigns (admin only)
   */
  async getCampaigns(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      const campaigns = await MarketingModel.getCampaigns({
        tenant_id: req.user.tenant_id,
        limit,
        offset,
      });

      res.json({ 
        success: true, 
        data: campaigns 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * GET /api/v1/admin/marketing/email/stats
   * Get email statistics (admin only)
   */
  async getEmailStats(req, res) {
    try {
      const stats = await MarketingModel.getEmailStats(req.user.tenant_id);

      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /* ═══════════════════════════════════════════════════════════
     BREVO SPECIFIC
  ═══════════════════════════════════════════════════════════ */

  /**
   * GET /api/v1/admin/marketing/templates
   * Get email templates from Brevo (admin only)
   */
  async getEmailTemplates(req, res) {
    try {
      const result = await MarketingService.getEmailTemplates();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },

  /**
   * GET /api/v1/admin/marketing/account
   * Get Brevo account information (admin only)
   */
  async getAccountInfo(req, res) {
    try {
      const result = await MarketingService.getAccountInfo();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  },
};

module.exports = MarketingController;
