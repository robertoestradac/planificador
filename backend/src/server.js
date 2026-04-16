const app = require('./app');
const config = require('./config');
const { testConnection, pool } = require('./database/connection');
const logger = require('./utils/logger');

const PORT = config.port;

async function start() {
  await testConnection();

  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.env} mode on port ${PORT}`);
    logger.info(`API base: http://localhost:${PORT}/api/v1`);
    logger.info(`Health:   http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await pool.end();
        logger.info('Database pool closed.');
      } catch (err) {
        logger.error('Error closing DB pool:', err.message);
      }
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
