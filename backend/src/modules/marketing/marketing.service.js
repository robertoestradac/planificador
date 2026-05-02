const brevo = require('@getbrevo/brevo');
const nodemailer = require('nodemailer');
const MarketingModel = require('./marketing.model');
const logger = require('../../utils/logger');

const MarketingService = {
  /* ═══════════════════════════════════════════════════════════
     EMAIL MARKETING (Brevo, Mailchimp, SendGrid)
  ═══════════════════════════════════════════════════════════ */

  /**
   * Get Brevo API instance for marketing
   */
  async getBrevoClient() {
    const config = await MarketingModel.getEmailConfig();
    
    if (!config.smtp_api_key) {
      throw new Error('Brevo API key not configured');
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      config.smtp_api_key
    );

    return apiInstance;
  },

  /**
   * Test email marketing connection
   */
  async testEmailConnection(provider, credentials) {
    try {
      if (provider === 'brevo') {
        const apiInstance = new brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(
          brevo.TransactionalEmailsApiApiKeys.apiKey,
          credentials.api_key
        );

        const accountApi = new brevo.AccountApi();
        accountApi.setApiKey(
          brevo.AccountApiApiKeys.apiKey,
          credentials.api_key
        );

        const account = await accountApi.getAccount();
        
        return {
          success: true,
          message: 'Conexión exitosa con Brevo',
          data: {
            email: account.email,
            firstName: account.firstName,
            lastName: account.lastName,
            companyName: account.companyName,
          },
        };
      }

      // Add support for other providers here (Mailchimp, SendGrid, etc.)
      return {
        success: false,
        message: `Proveedor ${provider} no soportado aún`,
      };
    } catch (error) {
      logger.error('Email marketing connection test failed:', error);
      return {
        success: false,
        message: 'Error al conectar: ' + (error.message || 'Error desconocido'),
      };
    }
  },

  /**
   * Send email campaign
   */
  async sendCampaign(campaignId, subject, html, recipientGroups) {
    try {
      const config = await MarketingModel.getEmailConfig();
      
      if (!config.smtp_enabled) {
        throw new Error('Email marketing is not enabled');
      }

      // Get recipients based on groups
      const recipients = await this.getRecipients(recipientGroups);
      
      if (recipients.length === 0) {
        throw new Error('No recipients found');
      }

      await MarketingModel.updateCampaignStatus(campaignId, 'sending');

      const apiInstance = await this.getBrevoClient();
      let sentCount = 0;
      let failedCount = 0;

      // Send emails in batches
      for (const recipient of recipients) {
        try {
          const sendSmtpEmail = new brevo.SendSmtpEmail();
          sendSmtpEmail.subject = subject;
          sendSmtpEmail.htmlContent = html;
          sendSmtpEmail.sender = {
            name: config.smtp_sender_name,
            email: config.smtp_sender_email,
          };
          sendSmtpEmail.to = [{ email: recipient.email, name: recipient.name }];

          await apiInstance.sendTransacEmail(sendSmtpEmail);
          sentCount++;
        } catch (error) {
          logger.error(`Failed to send to ${recipient.email}:`, error);
          failedCount++;
        }
      }

      await MarketingModel.updateCampaignStatus(campaignId, 'sent', {
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date(),
      });

      logger.info(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);
      
      return {
        success: true,
        sent_count: sentCount,
        failed_count: failedCount,
      };
    } catch (error) {
      logger.error('Failed to send campaign:', error);
      await MarketingModel.updateCampaignStatus(campaignId, 'failed');
      throw error;
    }
  },

  /**
   * Get recipients based on groups
   */
  async getRecipients(groups) {
    const { pool } = require('../../database/connection');
    const recipients = [];

    for (const group of groups) {
      if (group === 'all_users') {
        const [users] = await pool.query(
          'SELECT email, name FROM users WHERE status = "active" AND email IS NOT NULL'
        );
        recipients.push(...users);
      } else if (group === 'all_guests') {
        const [guests] = await pool.query(
          'SELECT email, name FROM guests WHERE email IS NOT NULL'
        );
        recipients.push(...guests);
      }
    }

    // Remove duplicates
    const uniqueRecipients = [];
    const seen = new Set();
    for (const recipient of recipients) {
      if (!seen.has(recipient.email)) {
        seen.add(recipient.email);
        uniqueRecipients.push(recipient);
      }
    }

    return uniqueRecipients;
  },

  /**
   * Get email templates from Brevo
   */
  async getEmailTemplates() {
    try {
      const config = await MarketingModel.getEmailConfig();
      
      if (!config.smtp_api_key) {
        throw new Error('Brevo API key not configured');
      }

      const apiInstance = new brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(
        brevo.TransactionalEmailsApiApiKeys.apiKey,
        config.smtp_api_key
      );

      const templates = await apiInstance.getSmtpTemplates();
      
      return {
        success: true,
        data: templates.templates || [],
      };
    } catch (error) {
      logger.error('Failed to get Brevo templates:', error);
      throw error;
    }
  },

  /**
   * Get account information from Brevo
   */
  async getAccountInfo() {
    try {
      const config = await MarketingModel.getEmailConfig();
      
      if (!config.smtp_api_key) {
        throw new Error('Brevo API key not configured');
      }

      const accountApi = new brevo.AccountApi();
      accountApi.setApiKey(
        brevo.AccountApiApiKeys.apiKey,
        config.smtp_api_key
      );

      const account = await accountApi.getAccount();
      
      return {
        success: true,
        data: {
          email: account.email,
          firstName: account.firstName,
          lastName: account.lastName,
          companyName: account.companyName,
          plan: account.plan,
        },
      };
    } catch (error) {
      logger.error('Failed to get Brevo account info:', error);
      throw error;
    }
  },

  /* ═══════════════════════════════════════════════════════════
     SMTP TRANSACTIONAL (System emails)
  ═══════════════════════════════════════════════════════════ */

  /**
   * Get SMTP transporter for system emails
   */
  async getSmtpTransporter() {
    const config = await MarketingModel.getSmtpConfig();
    
    if (!config.host || !config.user) {
      throw new Error('SMTP no está configurado. Por favor configura el host y usuario primero.');
    }

    if (!config.password) {
      throw new Error('La contraseña SMTP es requerida.');
    }

    const port = config.port || 587;
    
    // Determine secure settings based on port
    // Port 465 = SSL direct (secure: true)
    // Port 587, 2525, 25 = STARTTLS (secure: false, requireTLS: true)
    const isSecurePort = port === 465;
    const useSecure = config.secure === 1 || config.secure === true;
    
    return nodemailer.createTransport({
      host: config.host,
      port: port,
      secure: isSecurePort || useSecure, // true for 465, false for other ports
      requireTLS: !isSecurePort, // Use STARTTLS for non-465 ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      // Add debug logging
      logger: false,
      debug: false,
    });
  },

  /**
   * Test SMTP transactional connection
   */
  async testSmtpConnection(toEmail) {
    try {
      const transporter = await this.getSmtpTransporter();
      const config = await MarketingModel.getSmtpConfig();

      // Verify connection
      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email}>`,
        to: toEmail,
        subject: 'Test de conexión SMTP',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
            <h2 style="color:#6366f1">✅ Conexión SMTP exitosa</h2>
            <p>Este es un correo de prueba para verificar la configuración SMTP.</p>
            <p style="color:#6b7280;font-size:14px">Enviado desde: ${config.from_email}</p>
          </div>
        `,
      });

      return {
        success: true,
        message: `Correo de prueba enviado exitosamente a ${toEmail}`,
      };
    } catch (error) {
      logger.error('SMTP connection test failed:', error);
      return {
        success: false,
        message: 'Error de conexión SMTP: ' + (error.message || 'Error desconocido'),
      };
    }
  },

  /**
   * Send transactional email (for system use)
   */
  async sendTransactionalEmail({ to, subject, html, text }) {
    try {
      const transporter = await this.getSmtpTransporter();
      const config = await MarketingModel.getSmtpConfig();

      const info = await transporter.sendMail({
        from: `"${config.from_name}" <${config.from_email}>`,
        to,
        subject,
        html,
        text,
      });

      logger.info('Transactional email sent:', info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Failed to send transactional email:', error);
      throw error;
    }
  },
};

module.exports = MarketingService;
