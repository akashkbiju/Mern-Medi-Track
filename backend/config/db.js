import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Do not exit process in dev environment if DB isn't available for the basic UI setup
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
