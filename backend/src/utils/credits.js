const { pool } = require('../database/connection');

/**
 * Returns tenant credits based on the SUM of all confirmed payments.
 * If no payments exist, falls back to the active subscription.
 * If neither exists, falls back to the free plan.
 *
 * NULL means unlimited.
 *
 * IMPORTANT: Invitations are tied to events (1 event = 1 invitation max).
 * The invitation limit is the same as the event limit.
 */
async function getTenantCredits(tenantId) {
  // 1. Sum from ALL confirmed payments
  const [[paymentsRow]] = await pool.query(
    `SELECT
       CASE WHEN SUM(CASE WHEN p.max_events IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
            ELSE COALESCE(SUM(p.max_events), 0) END AS total_events,
       CASE WHEN SUM(CASE WHEN p.max_guests IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
            ELSE COALESCE(SUM(p.max_guests), 0) END AS total_guests,
       CASE WHEN SUM(CASE WHEN p.max_users IS NULL THEN 1 ELSE 0 END) > 0 THEN NULL
            ELSE COALESCE(SUM(p.max_users), 0) END AS total_users,
       COUNT(*) AS payment_count
     FROM payments pm
     JOIN plans p ON p.id = pm.plan_id
     WHERE pm.tenant_id = ? AND pm.status = 'confirmed'`,
    [tenantId]
  );

  const hasPayments = (paymentsRow?.payment_count || 0) > 0;

  let total_events, total_guests, total_users;

  if (hasPayments) {
    // Payments are the source of truth for credits.
    // Parse to Number to avoid string concatenation bugs from MySQL.
    total_events = paymentsRow.total_events === null ? null : Number(paymentsRow.total_events);
    total_guests = paymentsRow.total_guests === null ? null : Number(paymentsRow.total_guests);
    total_users  = paymentsRow.total_users === null ? null : Number(paymentsRow.total_users);
  } else {
    // 2. Fallback: active subscription (for tenants that were assigned a plan
    //    before the payment-based system, or registered with a free plan)
    const [[sub]] = await pool.query(
      `SELECT p.max_events, p.max_guests, p.max_users
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.tenant_id = ? AND s.status = 'active' AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC LIMIT 1`,
      [tenantId]
    );

    if (sub) {
      total_events = sub.max_events === null ? null : Number(sub.max_events);
      total_guests = sub.max_guests === null ? null : Number(sub.max_guests);
      total_users  = sub.max_users === null ? null : Number(sub.max_users);
    } else {
      // 3. Fallback: free plan
      const [[freePlan]] = await pool.query(
        'SELECT max_events, max_guests, max_users FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1'
      );
      if (freePlan) {
        total_events = freePlan.max_events === null ? null : Number(freePlan.max_events);
        total_guests = freePlan.max_guests === null ? null : Number(freePlan.max_guests);
        total_users  = freePlan.max_users === null ? null : Number(freePlan.max_users);
      } else {
        total_events = 0;
        total_guests = 0;
        total_users = 0;
      }
    }
  }

  // 4. Get current usage
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
  if (!c) throw new AppError('Tipo de recurso invalido: ' + resourceType, 400);
  if (c.available === null) return; // unlimited
  if (c.available <= 0) {
    throw new AppError(
      'Limite alcanzado. Tienes ' + c.used + ' de ' + c.total + ' ' + resourceType + ' usados. Adquiere un nuevo plan para continuar.',
      403
    );
  }
}

module.exports = { getTenantCredits, assertCredit };
