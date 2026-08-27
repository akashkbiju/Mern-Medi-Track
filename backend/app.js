import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';

// Middleware
import { apiLimiter } from './middleware/rateLimitMiddleware.js';
import { notFound } from './middleware/notFoundMiddleware.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Route Handlers
import healthRoutes from './routes/healthRoutes.js';
import healthRecordRoutes from './routes/healthRecordRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import medicationLogRoutes from './routes/medicationLogRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';

const app = express();

// 1. Security Headers Middleware
app.use(helmet());

// 2. CORS Configuration
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body & Cookie Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// 4. Rate Limiting Middleware
app.use('/api', apiLimiter);

// 5. API Routing Layer (/api)
app.use('/api/health', healthRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/medication-logs', medicationLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/doctors', doctorRoutes);

// 6. 404 Catch-All Middleware for unmatched routes
app.use(notFound);

// 7. Global Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
