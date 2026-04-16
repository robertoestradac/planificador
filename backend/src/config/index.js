require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

// Warn about insecure defaults in production
if (env === 'production') {
  const insecure = [];
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'change_me_access') {
    insecure.push('JWT_ACCESS_SECRET');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === 'change_me_refresh') {
    insecure.push('JWT_REFRESH_SECRET');
  }
  if (insecure.length) {
    console.error(`[FATAL] Insecure default values detected for: ${insecure.join(', ')}. Set proper secrets before running in production.`);
    process.exit(1);
  }
}

module.exports = {
  env,
  port: parseInt(process.env.PORT, 10) || 4000,

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'invitaciones_saas',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change_me_access',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change_me_refresh',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 10,
  },

  app: {
    domain: process.env.APP_DOMAIN || 'localhost',
    protocol: process.env.APP_PROTOCOL || 'http',
  },
};
