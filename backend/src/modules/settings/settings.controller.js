const SettingsModel = require('./settings.model');

const SettingsController = {
  async get(req, res) {
    try {
      const raw = await SettingsModel.get();
      const settings = { ...raw };
      if (settings.landing_content && typeof settings.landing_content === 'string') {
        try { settings.landing_content = JSON.parse(settings.landing_content); } catch { settings.landing_content = null; }
      }
      res.json({ success: true, data: settings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const body = { ...req.body };
      if (body.landing_content && typeof body.landing_content === 'object') {
        body.landing_content = JSON.stringify(body.landing_content);
      }
      const raw = await SettingsModel.upsert(body);
      const settings = { ...raw };
      if (settings.landing_content && typeof settings.landing_content === 'string') {
        try { settings.landing_content = JSON.parse(settings.landing_content); } catch { settings.landing_content = null; }
      }
      res.json({ success: true, data: settings, message: 'Configuración actualizada' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = SettingsController;
