import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

// Load env vars
dotenv.config();

// Connect to database (Optional for early UI dev if MONGODB_URI is not yet set)
if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'your_mongodb_connection_string') {
  connectDB();
} else {
  console.log('MongoDB connection skipped: MONGODB_URI is not set to a valid string yet.');
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
