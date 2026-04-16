const { pool } = require('../database/connection');
const { forbidden, unauthorized } = require('../utils/response');

// ── In-memory permission cache (TTL: 5 min) ────────────────────
// Evita queries repetidas al validar permisos en cada request
const permCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function cacheGet(key) {
  const entry = permCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { permCache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key, value) {
  permCache.set(key, { value, ts: Date.now() });
}

// Limpia entradas expiradas cada 10 min para no acumular memoria
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of permCache) {
    if (now - v.ts > CACHE_TTL_MS) permCache.delete(k);
  }
}, 10 * 60 * 1000).unref();

/**
 * RBAC middleware — validates:
 * 1. User is authenticated
 * 2. Role is active and has the permission
 * 3. Active plan includes the permission (tenant users only)
 *
 * Optimizaciones:
 * - Las queries de usuario + subscription se ejecutan en paralelo
 * - Los permisos de rol y plan se cachean 5 min en memoria
 */
const authorize = (...permissionKeys) => async (req, res, next) => {
  try {
    if (!req.user) return unauthorized(res, 'Authentication required');

    const userId    = req.user.id;
    const tenantId  = req.user.tenant_id || null;

    // ── 1. Fetch user + plan resolution en paralelo ─────────────
    // Plan resolution order:
    //   1. Latest confirmed payment  →  plan_id from payments
    //   2. Active subscription       →  plan_id from subscriptions
    //   3. Free plan                 →  plan where price_usd = 0
    //   4. None found               →  403
    const planQuery = tenantId
      ? pool.query(
          `SELECT plan_id, 'payment' AS source FROM payments
             WHERE tenant_id = ? AND status = 'confirmed'
             ORDER BY confirmed_at DESC LIMIT 1`,
          [tenantId]
        )
      : Promise.resolve([[]]);

    const [[userRows], [planRows]] = await Promise.all([
      pool.query(
        `SELECT u.id, u.tenant_id, u.role_id, u.status,
                r.name AS role_name, r.is_global
         FROM users u
         JOIN roles r ON r.id = u.role_id
         WHERE u.id = ? AND u.deleted_at IS NULL`,
        [userId]
      ),
      planQuery,
    ]);

    if (!userRows.length) return unauthorized(res, 'User not found');

    const user = userRows[0];
    if (user.status !== 'active') return forbidden(res, 'User account is inactive');

    // SuperAdmin bypasses all checks
    if (user.role_name === 'SuperAdmin') return next();

    // Owner bypasses role permission checks (has full access within their tenant)
    const isOwner = user.role_name === 'Owner' && !!tenantId;

    // ── 2. Role permissions (con cache) ───────────────────────
    const roleCacheKey = `role:${user.role_id}`;
    let rolePermKeys = cacheGet(roleCacheKey);
    if (!rolePermKeys) {
      const [rolePerms] = await pool.query(
        `SELECT p.key_name FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
         WHERE rp.role_id = ?`,
        [user.role_id]
      );
      rolePermKeys = rolePerms.map(p => p.key_name);
      cacheSet(roleCacheKey, rolePermKeys);
    }

    if (!isOwner) {
      for (const key of permissionKeys) {
        if (!rolePermKeys.includes(key)) {
          return forbidden(res, `Permission denied: ${key}`);
        }
      }
    }

    // ── 3. Plan permissions para usuarios de tenant (con cache) ─
    // Owner bypasses plan permission checks (has full access within their tenant)
    if (tenantId && !isOwner) {
      let resolvedPlanId = planRows[0]?.plan_id || null;

      // Fallback 1: active subscription
      if (!resolvedPlanId) {
        const [subRows] = await pool.query(
          `SELECT plan_id FROM subscriptions
           WHERE tenant_id = ? AND status = 'active' AND expires_at > NOW()
           ORDER BY expires_at DESC LIMIT 1`,
          [tenantId]
        );
        resolvedPlanId = subRows[0]?.plan_id || null;
      }

      // Fallback 2: free plan (price_usd = 0)
      if (!resolvedPlanId) {
        const [freePlans] = await pool.query(
          `SELECT id FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1`
        );
        resolvedPlanId = freePlans[0]?.id || null;
      }

      if (!resolvedPlanId) {
        return forbidden(res, 'No tienes un plan activo. Adquiere un plan para continuar.');
      }

      const planCacheKey = `plan:${resolvedPlanId}`;
      let planPermKeys = cacheGet(planCacheKey);
      if (!planPermKeys) {
        const [planPerms] = await pool.query(
          `SELECT p.key_name FROM plan_permissions pp
           JOIN permissions p ON p.id = pp.permission_id
           WHERE pp.plan_id = ?`,
          [resolvedPlanId]
        );
        planPermKeys = planPerms.map(p => p.key_name);
        cacheSet(planCacheKey, planPermKeys);
      }

      for (const key of permissionKeys) {
        if (!planPermKeys.includes(key)) {
          return forbidden(res, `Your current plan does not include: ${key}. Please upgrade.`);
        }
      }

      req.subscription = { plan_id: resolvedPlanId };
    } else if (tenantId && isOwner) {
      // For Owners, still resolve the plan for display purposes but don't check permissions
      let resolvedPlanId = planRows[0]?.plan_id || null;

      if (!resolvedPlanId) {
        const [subRows] = await pool.query(
          `SELECT plan_id FROM subscriptions
           WHERE tenant_id = ? AND status = 'active' AND expires_at > NOW()
           ORDER BY expires_at DESC LIMIT 1`,
          [tenantId]
        );
        resolvedPlanId = subRows[0]?.plan_id || null;
      }

      if (!resolvedPlanId) {
        const [freePlans] = await pool.query(
          `SELECT id FROM plans WHERE price_usd = 0 AND is_active = 1 LIMIT 1`
        );
        resolvedPlanId = freePlans[0]?.id || null;
      }

      if (resolvedPlanId) {
        req.subscription = { plan_id: resolvedPlanId };
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

/** Invalida el cache de un rol (llamar al modificar permisos del rol) */
authorize.invalidateRoleCache = (roleId) => permCache.delete(`role:${roleId}`);
/** Invalida el cache de un plan (llamar al modificar permisos del plan) */
authorize.invalidatePlanCache = (planId) => permCache.delete(`plan:${planId}`);
/** Limpia todo el cache (útil tras migraciones de permisos) */
authorize.clearCache = () => permCache.clear();

module.exports = authorize;
