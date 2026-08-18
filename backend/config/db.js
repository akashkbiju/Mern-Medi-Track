import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB with graceful error recovery
 */
export const connectDB = async () => {
  try {
    if (!env.MONGODB_URI) {
      console.warn('[DB WARNING] MongoDB URI is not configured in environment variables.');
      return null;
    }

    if (env.MONGODB_URI === 'your_mongodb_connection_string') {
      console.warn('[DB WARNING] MongoDB URI is still set to the default placeholder.');
      return null;
    }

    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[DB SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[DB ERROR] MongoDB Connection Failed: ${error.message}`);
    // In production, exit if database fails to connect
    if (env.isProduction) {
      process.exit(1);
    }
    return null;
  }
};

/**
 * Helper to get current connection state string
 */
export const getDBConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

export default connectDB;
