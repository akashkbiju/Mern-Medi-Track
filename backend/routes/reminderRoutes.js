import express from 'express';
import {
  getTodayReminders,
  getUpcomingReminders,
  getReminders,
  markReminderAsRead,
  processReminders,
} from '../controllers/reminderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  getRemindersValidator,
  upcomingRemindersValidator,
  reminderIdValidator,
  processRemindersValidator,
} from '../validators/reminderValidator.js';

const router = express.Router();

/**
 * Medication Reminders RESTful Endpoints
 * All endpoints require authenticated user session
 */

// GET /api/reminders/today - Retrieve today's medication reminders
router.get('/today', protect, getTodayReminders);

// GET /api/reminders/upcoming - Retrieve upcoming medication reminders within lookahead window
router.get('/upcoming', protect, validate(upcomingRemindersValidator), getUpcomingReminders);

// GET /api/reminders - Query reminder history with filters
router.get('/', protect, validate(getRemindersValidator), getReminders);

// PATCH /api/reminders/:id/read - Mark reminder as read
router.patch('/:id/read', protect, validate(reminderIdValidator), markReminderAsRead);

// POST /api/reminders/process - Trigger reminder synchronization/processing
router.post('/process', protect, validate(processRemindersValidator), processReminders);

export default router;
