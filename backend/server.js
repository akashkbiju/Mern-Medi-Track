import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

// Load env vars
dotenv.config();

const startServer = async () => {
  // Connect to database first
  await connectDB();

  const PORT = process.env.PORT || 5000;

  // Start Express server after DB connection attempt
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
