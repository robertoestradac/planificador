const { pool } = require('../../database/connection');

const DEFAULTS = {
  app_name:         'InvitApp',
  tagline:          'Plataforma de invitaciones digitales',
  logo_url:         null,
  app_url:          null,
  support_email:    null,
  footer_text:      'Hecha con ♥ por InvitApp',
  show_branding:    1,
  sales_whatsapp:   null,
};

const ALLOWED = ['app_name', 'tagline', 'logo_url', 'app_url', 'support_email', 'footer_text', 'show_branding', 'landing_content', 'sales_whatsapp'];

const SettingsModel = {
  async get() {
    const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    return rows[0] || { id: 1, ...DEFAULTS };
  },

  async upsert(fields) {
    const keys = [];
    const vals = [];
    for (const key of ALLOWED) {
      if (fields[key] !== undefined) {
        keys.push(key);
        vals.push(fields[key]);
      }
    }
    if (!keys.length) return this.get();

    const placeholders = vals.map(() => '?').join(', ');
    const onDuplicate  = keys.map(k => `${k} = VALUES(${k})`).join(', ');
    await pool.query(
      `INSERT INTO app_settings (id, ${keys.join(', ')}) VALUES (1, ${placeholders})
       ON DUPLICATE KEY UPDATE ${onDuplicate}`,
      vals
    );
    return this.get();
  },
};

module.exports = SettingsModel;
