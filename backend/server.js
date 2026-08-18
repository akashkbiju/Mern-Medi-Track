import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP Server
  const server = http.createServer(app);

  const PORT = env.PORT || 5000;

  // 3. Start Listening
  server.listen(PORT, () => {
    logger.info(`MediTrack+ API Server running in ${env.NODE_ENV} mode`);
    logger.info(`Server URL: http://localhost:${PORT}`);
    logger.info(`Health Endpoint: http://localhost:${PORT}/api/health`);
  });

  // 4. Graceful Shutdown Handlers
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 10s if connections linger
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
