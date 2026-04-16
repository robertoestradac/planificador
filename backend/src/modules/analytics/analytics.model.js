const { pool } = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

const AnalyticsModel = {
  async recordView({ invitation_id, ip, device, country }) {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO invitation_views (id, invitation_id, ip, device, country) VALUES (?, ?, ?, ?, ?)',
      [id, invitation_id, ip || null, device || null, country || null]
    );
    return id;
  },

  async getViewsByInvitation(invitationId, { days = 30 } = {}) {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS views
       FROM invitation_views
       WHERE invitation_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [invitationId, days]
    );
    return rows;
  },

  async getViewSummary(invitationId) {
    // Consolida total + today en una sola query
    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*) AS total_views,
         SUM(DATE(created_at) = CURDATE()) AS today_views
       FROM invitation_views WHERE invitation_id = ?`,
      [invitationId]
    );

    // byDevice y byCountry en paralelo
    const [[byDevice], [byCountry]] = await Promise.all([
      pool.query(
        `SELECT device, COUNT(*) AS count FROM invitation_views
         WHERE invitation_id = ? GROUP BY device ORDER BY count DESC`,
        [invitationId]
      ),
      pool.query(
        `SELECT country, COUNT(*) AS count FROM invitation_views
         WHERE invitation_id = ? GROUP BY country ORDER BY count DESC LIMIT 10`,
        [invitationId]
      ),
    ]);

    return {
      total_views: summary.total_views,
      today_views: summary.today_views || 0,
      by_device: byDevice,
      by_country: byCountry,
    };
  },

  async getTenantDashboard(tenantId) {
    // Consolida los 3 COUNTs de invitaciones en una sola query
    const invitationsQuery = pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'published') AS published
       FROM invitations
       WHERE tenant_id = ? AND deleted_at IS NULL`,
      [tenantId]
    );

    // Todas las queries restantes en paralelo
    const [
      [[eventsRow]],
      [[invRow]],
      [[viewsRow]],
      [[guestsRow]],
      [[confirmedRow]],
      [viewsTrend],
    ] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) AS total FROM events WHERE tenant_id = ? AND deleted_at IS NULL',
        [tenantId]
      ),
      invitationsQuery,
      pool.query(
        `SELECT COUNT(*) AS total FROM invitation_views iv
         JOIN invitations i ON i.id = iv.invitation_id
         WHERE i.tenant_id = ?`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM guests g
         JOIN invitations i ON i.id = g.invitation_id
         WHERE i.tenant_id = ?`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total FROM guests g
         JOIN invitations i ON i.id = g.invitation_id
         WHERE i.tenant_id = ? AND g.status = 'confirmed'`,
        [tenantId]
      ),
      pool.query(
        `SELECT DATE(iv.created_at) AS date, COUNT(*) AS views
         FROM invitation_views iv
         JOIN invitations i ON i.id = iv.invitation_id
         WHERE i.tenant_id = ? AND iv.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY DATE(iv.created_at)
         ORDER BY date ASC`,
        [tenantId]
      ),
    ]);

    return {
      events:                eventsRow.total,
      invitations:           invRow.total,
      published_invitations: invRow.published || 0,
      total_views:           viewsRow.total,
      total_guests:          guestsRow.total,
      confirmed_guests:      confirmedRow.total,
      views_trend:           viewsTrend,
    };
  },

  async getGlobalStats() {
    const [
      [[tenantsRow]],
      [[usersRow]],
      [[eventsRow]],
      [[invitationsRow]],
      [[viewsRow]],
      [[guestsRow]],
      [planDist],
      [newTenants],
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM tenants WHERE deleted_at IS NULL AND status = 'active'"),
      pool.query('SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) AS total FROM events WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) AS total FROM invitations WHERE deleted_at IS NULL'),
      pool.query('SELECT COUNT(*) AS total FROM invitation_views'),
      pool.query('SELECT COUNT(*) AS total FROM guests'),
      pool.query(
        `SELECT p.name AS plan_name, COUNT(s.id) AS count
         FROM subscriptions s JOIN plans p ON p.id = s.plan_id
         WHERE s.status = 'active' GROUP BY p.name`
      ),
      pool.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count
         FROM tenants WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND deleted_at IS NULL
         GROUP BY DATE(created_at) ORDER BY date ASC`
      ),
    ]);

    return {
      tenants:          tenantsRow.total,
      users:            usersRow.total,
      events:           eventsRow.total,
      invitations:      invitationsRow.total,
      total_views:      viewsRow.total,
      total_guests:     guestsRow.total,
      plan_distribution: planDist,
      new_tenants_trend: newTenants,
    };
  },
};

module.exports = AnalyticsModel;
