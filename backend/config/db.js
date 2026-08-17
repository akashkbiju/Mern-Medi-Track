import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn("MongoDB connection skipped: MONGODB_URI is not set in the environment variables.");
      return null;
    }

    if (process.env.MONGODB_URI === 'your_mongodb_connection_string') {
      console.warn("MongoDB connection skipped: MONGODB_URI is still set to the default placeholder.");
      return null;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Handle the failure gracefully without crashing the app, unless in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};
