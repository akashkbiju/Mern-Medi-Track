import mongoose from 'mongoose';
import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { startReminderScheduler, stopReminderScheduler } from './services/reminderScheduler.js';

const startServer = async () => {
  const PORT = env.PORT || 5000;

  // 1. Create HTTP Server
  const server = http.createServer(app);

  // 2. Start Listening immediately on 0.0.0.0 so Render detects open port instantly
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`MediTrack+ API Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`Server URL: http://0.0.0.0:${PORT}`);
    logger.info(`Health Endpoint: http://localhost:${PORT}/api/health`);
  });

  // 3. When MongoDB connects (immediately or on retry), initialize the reminder scheduler
  mongoose.connection.once('open', async () => {
    try {
      await startReminderScheduler();
    } catch (err) {
      logger.error(`[ReminderScheduler] Startup error: ${err.message}`);
    }
  });

  // 4. Initiate MongoDB Connection in background
  connectDB().catch((err) => {
    logger.error(`Initial MongoDB connection failed: ${err.message}`);
  });

  // 5. Graceful Shutdown Handlers
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    stopReminderScheduler();
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
