import express from 'express';
import { getReminders, logMedication } from '../controllers/reminderController.js';

const router = express.Router();

/**
 * Medication Reminders & Logs RESTful endpoints foundation
 * GET  /api/reminders
 * POST /api/reminders/log
 */
router.get('/', getReminders);
router.post('/log', logMedication);

export default router;
