import express from 'express';
import {
  getTodayLogs,
  getLogs,
  getLogById,
  markTaken,
  markSkipped,
  processMissed,
} from '../controllers/medicationLogController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  getLogsValidator,
  logIdValidator,
  actionNoteValidator,
  processMissedValidator,
} from '../validators/medicationLogValidator.js';

const router = express.Router();

/**
 * Medication Logs RESTful Endpoints
 * All endpoints require authenticated user session
 */

// GET /api/medication-logs/today - Retrieve today's medication logs with completion progress
router.get('/today', protect, getTodayLogs);

// GET /api/medication-logs - Query medication logs history with filters
router.get('/', protect, validate(getLogsValidator), getLogs);

// GET /api/medication-logs/:id - Retrieve a single medication log
router.get('/:id', protect, validate(logIdValidator), getLogById);

// PATCH /api/medication-logs/:id/taken - Mark dose as taken
router.patch('/:id/taken', protect, validate(actionNoteValidator), markTaken);

// PATCH /api/medication-logs/:id/skipped - Mark dose as skipped
router.patch('/:id/skipped', protect, validate(actionNoteValidator), markSkipped);

// POST /api/medication-logs/process-missed - Automated missed check trigger
router.post('/process-missed', protect, validate(processMissedValidator), processMissed);

export default router;
