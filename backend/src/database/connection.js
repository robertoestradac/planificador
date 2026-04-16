const mysql = require('mysql2/promise');
const config = require('../config');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: '+00:00',
  charset: 'utf8mb4',
  // Force UTF-8 on every new connection
  multipleStatements: false,
});

// Run SET NAMES on every new connection from the pool
pool.on('connection', (connection) => {
  connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
  connection.query("SET CHARACTER SET utf8mb4");
  logger.info('New DB connection established');
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('Database connected successfully');
    conn.release();
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
