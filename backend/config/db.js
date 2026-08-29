import mongoose from 'mongoose';
import { env } from './env.js';

let isConnecting = false;

/**
 * Connect to MongoDB with graceful error recovery and auto-retry
 */
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (isConnecting) {
    return null;
  }

  try {
    if (!env.MONGODB_URI) {
      console.warn('[DB WARNING] MongoDB URI is not configured in environment variables.');
      return null;
    }

    if (env.MONGODB_URI === 'your_mongodb_connection_string') {
      console.warn('[DB WARNING] MongoDB URI is still set to the default placeholder.');
      return null;
    }

    isConnecting = true;
    console.log('[DB INFO] Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnecting = false;
    console.log(`[DB SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`[DB ERROR] MongoDB Connection Failed: ${error.message}`);
    console.log('[DB INFO] Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
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
