const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

// Route modules
const authRoutes         = require('./modules/auth/auth.routes');
const tenantsRoutes      = require('./modules/tenants/tenants.routes');
const usersRoutes        = require('./modules/users/users.routes');
const rolesRoutes        = require('./modules/roles/roles.routes');
const permissionsRoutes  = require('./modules/permissions/permissions.routes');
const plansRoutes        = require('./modules/plans/plans.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const templatesRoutes    = require('./modules/templates/templates.routes');
const eventsRoutes       = require('./modules/events/events.routes');
const invitationsRoutes  = require('./modules/invitations/invitations.routes');
const guestsRoutes       = require('./modules/guests/guests.routes');
const analyticsRoutes    = require('./modules/analytics/analytics.routes');
const uploadRoutes       = require('./modules/upload/upload.routes');
const eventPhotosRoutes  = require('./modules/event-photos/eventPhotos.routes');
const plannerRoutes      = require('./modules/planner/planner.routes');
const dashboardRoutes    = require('./modules/planner/dashboard.routes');
const settingsRoutes     = require('./modules/settings/settings.routes');
const paymentsRoutes     = require('./modules/payments/payments.routes');
const path = require('path');

const app = express();

// ── Security ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.set('trust proxy', 1);

// ── Static files will be served below after CORS ──

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.origin.includes(origin) || config.env === 'development') {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Subdomain'],
}));

// ── Static Files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Body parsing & compression ────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Force UTF-8 on all JSON responses ─────────────────────────
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return originalJson(body);
  };
  next();
});

// ── HTTP logging ──────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// ── Global rate limit ─────────────────────────────────────────
app.use(rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 2000 : config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.env === 'development' && req.ip === '::1',
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const { pool } = require('./database/connection');
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'API is running', db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, message: 'Database unavailable', timestamp: new Date().toISOString() });
  }
});

// ── Cache flush (dev/admin only) ──────────────────────────────
app.post('/admin/cache/clear', (req, res) => {
  if (config.env === 'production') return res.status(403).json({ success: false, message: 'Not allowed in production' });
  const authorize = require('./middlewares/authorize');
  const attachTenant = require('./middlewares/attachTenant');
  authorize.clearCache();
  attachTenant.invalidateCache();
  res.json({ success: true, message: 'Permission and tenant cache cleared' });
});

// ── API Routes ────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/tenants`,       tenantsRoutes);
app.use(`${API}/users`,         usersRoutes);
app.use(`${API}/roles`,         rolesRoutes);
app.use(`${API}/permissions`,   permissionsRoutes);
app.use(`${API}/plans`,         plansRoutes);
app.use(`${API}/subscriptions`, subscriptionsRoutes);
app.use(`${API}/templates`,     templatesRoutes);
app.use(`${API}/events`,        eventsRoutes);
app.use(`${API}/invitations`,   invitationsRoutes);
app.use(`${API}/guests`,        guestsRoutes);
app.use(`${API}/analytics`,     analyticsRoutes);
app.use(`${API}/upload`,        uploadRoutes);
app.use(`${API}/event-photos`,  eventPhotosRoutes);
app.use(`${API}/planner`,       plannerRoutes);
app.use(`${API}/dashboard`,     dashboardRoutes);
app.use(`${API}/settings`,      settingsRoutes);
app.use(`${API}/payments`,      paymentsRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use(errorHandler);

module.exports = app;
