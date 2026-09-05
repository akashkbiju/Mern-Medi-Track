import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'MediTrack+ API is running'
  });
});

// Placeholder for future routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/medicines', medicineRoutes);
// app.use('/api/reminders', reminderRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/doctors', doctorRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
