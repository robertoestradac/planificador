/**
 * dataCache.js
 * Cache en memoria del lado del cliente para datos del dashboard.
 *
 * Propósito:
 * - Evitar la latencia de "primera carga" cuando el usuario navega entre páginas
 * - Prefetch de datos al hacer hover en los links del sidebar
 * - Los datos se sirven inmediatamente desde cache; en background se revalida si expiraron
 *
 * TTL por defecto: 60 segundos (stale-while-revalidate)
 */

import api from './api';

const DEFAULT_TTL_MS = 60_000; // 60 s

const store = new Map();
const inflight = new Map(); // deduplicación de requests concurrentes

/**
 * Obtiene datos del cache o los fetches si no existen/expiraron.
 * @param {string} key - Clave única (normalmente el path del endpoint)
 * @param {() => Promise<any>} fetcher - Función que realiza el request
 * @param {number} ttl - Time-to-live en ms
 */
async function get(key, fetcher, ttl = DEFAULT_TTL_MS) {
  const cached = store.get(key);
  const now    = Date.now();

  // 1. Cache hit y aún fresco → retornar inmediatamente
  if (cached && now - cached.ts < ttl) {
    return cached.data;
  }

  // 2. Ya hay un fetch en vuelo para esta key → esperar ese mismo
  if (inflight.has(key)) {
    return inflight.get(key);
  }

  // 3. Cache stale o miss → fetch
  const promise = fetcher().then((data) => {
    store.set(key, { data, ts: Date.now() });
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    // Si hay datos stale disponibles, retornarlos en lugar de fallar
    const stale = store.get(key);
    if (stale) return stale.data;
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}

/** Invalida una entrada específica del cache */
function invalidate(key) {
  store.delete(key);
}

/** Invalida todas las entradas que comienzan con un prefijo */
function invalidatePrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/** Limpia todo el cache (útil en logout) */
function clear() {
  store.clear();
  inflight.clear();
}

// ── Helpers pre-definidos para las rutas más comunes ──────────────

const fetchers = {
  /** Datos del dashboard de analytics */
  dashboard: () =>
    get('/analytics/dashboard', () =>
      api.get('analytics/dashboard').then(r => r.data.data).catch(() => null)
    ),

  /** Suscripción activa del tenant — nunca lanza, retorna null si no hay */
  subscription: () =>
    get('/subscriptions/my', () =>
      api.get('subscriptions/my')
        .then(r => r.data.data)
        .catch(() => null)
    ),

  /** Lista de eventos del tenant (primera página) */
  events: () =>
    get('/events', () =>
      api.get('events').then(r => r.data.data?.data || []).catch(() => [])
    ),

  /** Lista de invitaciones del tenant */
  invitations: () =>
    get('/invitations', () =>
      api.get('invitations').then(r => r.data.data?.data || []).catch(() => [])
    ),

  /** Templates disponibles */
  templates: () =>
    get('/templates', () =>
      api.get('templates').then(r => r.data.data || []).catch(() => [])
    ),

  /** Planes disponibles */
  plans: () =>
    get('/plans', () =>
      api.get('plans?active_only=true').then(r => r.data.data || []).catch(() => [])
    ),

  /** Usuarios del equipo */
  users: () =>
    get('/users', () =>
      api.get('users').then(r => r.data.data?.data || []).catch(() => [])
    ),

  /** Roles disponibles */
  roles: () =>
    get('/roles', () =>
      api.get('roles').then(r => r.data.data || []).catch(() => [])
    ),
};

/**
 * Mapa de prefetch: qué datos precargar para cada ruta del sidebar.
 * Se ejecuta al hacer hover sobre el link.
 */
export const PREFETCH_MAP = {
  '/dashboard':              [fetchers.dashboard, fetchers.subscription],
  '/dashboard/events':       [fetchers.events],
  '/dashboard/templates':    [fetchers.templates, fetchers.subscription],
  '/dashboard/invitations':  [fetchers.invitations, fetchers.events, fetchers.templates],
  '/dashboard/guests':       [fetchers.invitations],
  '/dashboard/analytics':    [fetchers.dashboard],
  '/dashboard/subscription': [fetchers.subscription, fetchers.plans],
  '/dashboard/team':         [fetchers.users, fetchers.roles],
};

/** Ejecuta el prefetch para una ruta del sidebar */
export function prefetchRoute(href) {
  const fns = PREFETCH_MAP[href];
  if (!fns) return;
  // Fire-and-forget, no awaitar
  fns.forEach(fn => fn().catch(() => {}));
}

const dataCache = { get, invalidate, invalidatePrefix, clear, fetchers };
export default dataCache;
