const { pool } = require('../../database/connection');

const DEFAULTS_MARKETING = {
  smtp_provider: 'brevo',
  smtp_api_key: null,
  smtp_sender_name: null,
  smtp_sender_email: null,
  smtp_enabled: 0,
  smtp_list_id: null,
};

const DEFAULTS_SMTP = {
  host: null,
  port: 587,
  secure: 0,
  user: null,
  password: null,
  from_email: null,
  from_name: null,
};

const ALLOWED_MARKETING = [
  'smtp_provider',
  'smtp_api_key',
  'smtp_sender_name',
  'smtp_sender_email',
  'smtp_enabled',
  'smtp_list_id'
];

const ALLOWED_SMTP = [
  'host',
  'port',
  'secure',
  'user',
  'password',
  'from_email',
  'from_name'
];

const MarketingModel = {
  /**
   * Get Email Marketing configuration (Brevo, Mailchimp, etc.)
   */
  async getEmailConfig() {
    const [rows] = await pool.query(
      'SELECT * FROM marketing_settings WHERE id = 1'
    );
    return rows[0] || { id: 1, ...DEFAULTS_MARKETING };
  },

  /**
   * Update Email Marketing configuration
   */
  async updateEmailConfig(fields) {
    const keys = [];
    const vals = [];
    
    for (const key of ALLOWED_MARKETING) {
      if (fields[key] !== undefined) {
        keys.push(key);
        vals.push(fields[key]);
      }
    }
    
    if (!keys.length) return this.getEmailConfig();

    const placeholders = vals.map(() => '?').join(', ');
    const onDuplicate = keys.map(k => `${k} = VALUES(${k})`).join(', ');
    
    await pool.query(
      `INSERT INTO marketing_settings (id, ${keys.join(', ')}) 
       VALUES (1, ${placeholders})
       ON DUPLICATE KEY UPDATE ${onDuplicate}`,
      vals
    );
    
    return this.getEmailConfig();
  },

  /**
   * Get SMTP Transactional configuration
   */
  async getSmtpConfig() {
    const [rows] = await pool.query(
      'SELECT * FROM smtp_config WHERE id = 1'
    );
    return rows[0] || { id: 1, ...DEFAULTS_SMTP };
  },

  /**
   * Update SMTP Transactional configuration
   */
  async updateSmtpConfig(fields) {
    const keys = [];
    const vals = [];
    
    for (const key of ALLOWED_SMTP) {
      if (fields[key] !== undefined) {
        keys.push(key);
        vals.push(fields[key]);
      }
    }
    
    if (!keys.length) return this.getSmtpConfig();

    const placeholders = vals.map(() => '?').join(', ');
    const onDuplicate = keys.map(k => `${k} = VALUES(${k})`).join(', ');
    
    await pool.query(
      `INSERT INTO smtp_config (id, ${keys.join(', ')}) 
       VALUES (1, ${placeholders})
       ON DUPLICATE KEY UPDATE ${onDuplicate}`,
      vals
    );
    
    return this.getSmtpConfig();
  },

  /**
   * Get public email config (without sensitive data)
   */
  async getPublicEmailConfig() {
    const config = await this.getEmailConfig();
    return {
      smtp_provider: config.smtp_provider,
      smtp_sender_name: config.smtp_sender_name,
      smtp_sender_email: config.smtp_sender_email,
      smtp_enabled: config.smtp_enabled,
      is_configured: !!config.smtp_api_key,
    };
  },

  /**
   * Create email campaign
   */
  async createCampaign({ tenant_id, subject, html_content, recipients, created_by }) {
    const id = require('uuid').v4();
    await pool.query(
      `INSERT INTO email_campaigns (id, tenant_id, subject, html_content, recipients, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tenant_id, subject, html_content, JSON.stringify(recipients), created_by]
    );
    return this.getCampaignById(id);
  },

  /**
   * Get campaign by ID
   */
  async getCampaignById(id) {
    const [rows] = await pool.query(
      'SELECT * FROM email_campaigns WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    const campaign = rows[0];
    if (campaign.recipients) {
      try {
        campaign.recipients = JSON.parse(campaign.recipients);
      } catch {
        campaign.recipients = [];
      }
    }
    return campaign;
  },

  /**
   * Get campaigns with pagination
   */
  async getCampaigns({ tenant_id, limit = 10, offset = 0 }) {
    const [rows] = await pool.query(
      `SELECT * FROM email_campaigns 
       WHERE tenant_id = ? OR tenant_id IS NULL
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [tenant_id, limit, offset]
    );
    return rows.map(campaign => {
      if (campaign.recipients) {
        try {
          campaign.recipients = JSON.parse(campaign.recipients);
        } catch {
          campaign.recipients = [];
        }
      }
      return campaign;
    });
  },

  /**
   * Update campaign status
   */
  async updateCampaignStatus(id, status, { sent_count, failed_count, sent_at } = {}) {
    const updates = ['status = ?'];
    const values = [status];

    if (sent_count !== undefined) {
      updates.push('sent_count = ?');
      values.push(sent_count);
    }
    if (failed_count !== undefined) {
      updates.push('failed_count = ?');
      values.push(failed_count);
    }
    if (sent_at !== undefined) {
      updates.push('sent_at = ?');
      values.push(sent_at);
    }

    values.push(id);

    await pool.query(
      `UPDATE email_campaigns SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  },

  /**
   * Get email statistics
   */
  async getEmailStats(tenant_id) {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_campaigns,
        SUM(sent_count) as total_sent,
        SUM(failed_count) as total_failed
       FROM email_campaigns
       WHERE tenant_id = ? OR tenant_id IS NULL`,
      [tenant_id]
    );
    return stats[0] || { total_campaigns: 0, sent_campaigns: 0, total_sent: 0, total_failed: 0 };
  },
};

module.exports = MarketingModel;
