const { pool } = require('../database/connection');
const { unauthorized, forbidden } = require('../utils/response');
const config = require('../config');

// ── In-memory tenant cache (TTL: 10 min) ────────────────────
// Evita query a la BD en cada request autenticado
const tenantCache = new Map();
const TENANT_TTL_MS = 10 * 60 * 1000; // 10 minutos

function tenantCacheGet(key) {
  const entry = tenantCache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > TENANT_TTL_MS) { tenantCache.delete(key); return undefined; }
  return entry.value; // puede ser null (tenant no encontrado)
}

function tenantCacheSet(key, value) {
  tenantCache.set(key, { value, ts: Date.now() });
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of tenantCache) {
    if (now - v.ts > TENANT_TTL_MS) tenantCache.delete(k);
  }
}, 15 * 60 * 1000).unref();

/**
 * Extrae el tenant de:
 * 1. JWT payload (req.user.tenant_id) — para rutas autenticadas
 * 2. Subdomain header (x-tenant-subdomain) — para rutas públicas
 * 3. Subdomain del Host header
 */
const attachTenant = (required = true) => async (req, res, next) => {
  try {
    let tenant = null;

    // 1. Desde JWT autenticado — prioridad máxima
    if (req.user?.tenant_id) {
      const tenantId = req.user.tenant_id;
      const cacheKey = `id:${tenantId}`;
      const cached = tenantCacheGet(cacheKey);

      if (cached !== undefined) {
        tenant = cached;
      } else {
        const [rows] = await pool.query(
          'SELECT id, name, subdomain, custom_domain, status FROM tenants WHERE id = ? AND deleted_at IS NULL',
          [tenantId]
        );
        tenant = rows[0] || null;
        tenantCacheSet(cacheKey, tenant);
      }
    }

    // 2. Desde header o subdomain del Host (rutas públicas)
    if (!tenant) {
      let subdomain = req.headers['x-tenant-subdomain'] || null;

      if (!subdomain) {
        const host = req.headers.host || '';
        const appDomain = config.app.domain;
        if (host.endsWith(`.${appDomain}`)) {
          subdomain = host.replace(`.${appDomain}`, '').split(':')[0];
        }
      }

      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const cacheKey = `sub:${subdomain}`;
        const cached = tenantCacheGet(cacheKey);

        if (cached !== undefined) {
          tenant = cached;
        } else {
          const [rows] = await pool.query(
            'SELECT id, name, subdomain, custom_domain, status FROM tenants WHERE subdomain = ? AND deleted_at IS NULL',
            [subdomain]
          );
          tenant = rows[0] || null;
          tenantCacheSet(cacheKey, tenant);
        }
      }
    }

    if (!tenant) {
      if (required) return forbidden(res, 'Tenant not found');
      return next();
    }

    if (tenant.status === 'suspended') {
      return forbidden(res, 'Tenant account is suspended');
    }

    req.tenant   = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (err) {
    next(err);
  }
};

/** Invalida el cache de un tenant (llamar al actualizar el tenant) */
attachTenant.invalidateCache = (tenantId, subdomain) => {
  if (tenantId)  tenantCache.delete(`id:${tenantId}`);
  if (subdomain) tenantCache.delete(`sub:${subdomain}`);
};

module.exports = attachTenant;
