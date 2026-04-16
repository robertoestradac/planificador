const { pool } = require('../database/connection');

/**
 * Returns tenant credits based on active subscription or confirmed payments.
 * Priority: 1. Active subscription, 2. Confirmed payments
 * NULL means unlimited (any plan in the stack had null for that field).
 * 
 * IMPORTANT: Invitations are tied to events (1 event = 1 invitation max).
 * The invitation limit is the same as the event limit.
 */
async function getTenantCredits(tenantId) {
  // First, try to get limits from active subscription
  const [[sub]] = await pool.query(
    `SELECT p.max_events, p.max_guests, p.max_users
     FROM subscriptions s
     JOIN plans p ON p.id = s.plan_id
     WHERE s.tenant_id = ? AND s.status = 'active' AND s.expires_at > NOW()
     ORDER BY s.expires_at DESC LIMIT 1`,
    [tenantId]
  );

  let total_events = 0;
  let total_guests = 0;
  let total_users = 0;

  if (sub) {
    // Use subscription limits
    total_events = sub.max_events;
    total_guests = sub.max_guests;
    total_users = sub.max_users;
  } else {
    // Fallback: sum from confirmed payments (for one-time purchases)
    const [[row]] = await pool.query(
      `SELECT
         CASE WHEN SUM(CASE WHEN p.max_events IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
              ELSE COALESCE(SUM(p.max_events), 0) END AS total_events,
         CASE WHEN SUM(CASE WHEN p.max_guests IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
              ELSE COALESCE(SUM(p.max_guests), 0) END AS total_guests,
         CASE WHEN SUM(CASE WHEN p.max_users IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
              ELSE COALESCE(SUM(p.max_users), 0) END AS total_users
       FROM payments pm
       JOIN plans p ON p.id = pm.plan_id
       WHERE pm.tenant_id = ? AND pm.status = 'confirmed'`,
      [tenantId]
    );

    if (row) {
      total_events = row.total_events;
      total_guests = row.total_guests;
      total_users = row.total_users;
    }
  }

  // Get current usage
  const [[used]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM events WHERE tenant_id = ? AND deleted_at IS NULL) AS events_used,
       (SELECT COUNT(*) FROM invitations WHERE tenant_id = ? AND deleted_at IS NULL) AS invitations_used,
       (SELECT COUNT(*) FROM guests g JOIN invitations i ON i.id = g.invitation_id WHERE i.tenant_id = ?) AS guests_used,
       (SELECT COUNT(*) FROM users WHERE tenant_id = ? AND deleted_at IS NULL) AS users_used`,
    [tenantId, tenantId, tenantId, tenantId]
  );

  // Invitations limit = Events limit (1 invitation per event)
  const total_invitations = total_events;
  const invitations_available = total_invitations === null ? null : Math.max(0, total_invitations - used.invitations_used);

  return {
    events: {
      total: total_events,
      used: used.events_used,
      available: total_events === null ? null : Math.max(0, total_events - used.events_used)
    },
    invitations: {
      total: total_invitations,
      used: used.invitations_used,
      available: invitations_available
    },
    guests: {
      total: total_guests,
      used: used.guests_used,
      available: total_guests === null ? null : Math.max(0, total_guests - used.guests_used)
    },
    users: {
      total: total_users,
      used: used.users_used,
      available: total_users === null ? null : Math.max(0, total_users - used.users_used)
    },
  };
}

/**
 * Throws if a tenant has no available credit for the given resource type.
 * resourceType: 'events' | 'invitations' | 'guests' | 'users'
 */
async function assertCredit(tenantId, resourceType) {
  const AppError = require('./AppError');
  const credits = await getTenantCredits(tenantId);
  const c = credits[resourceType];
  if (!c) throw new AppError(`Tipo de recurso inválido: ${resourceType}`, 400);
  if (c.available === null) return; // unlimited
  if (c.available <= 0) {
    throw new AppError(
      `Límite alcanzado. Tienes ${c.used} de ${c.total} ${resourceType} usados. Adquiere un nuevo plan para continuar.`,
      403
    );
  }
}

module.exports = { getTenantCredits, assertCredit };
