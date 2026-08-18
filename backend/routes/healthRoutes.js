import express from 'express';
import {
  getHealthStatus,
  getHealthRecords,
  createHealthRecord,
} from '../controllers/healthController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { createHealthRecordValidator } from '../validators/healthValidator.js';

const router = express.Router();

/**
 * Health check & status endpoint
 * GET /api/health
 */
router.get('/', getHealthStatus);
router.get('/status', getHealthStatus);

/**
 * Health record tracking foundation
 * Mounted at /api/health-records
 */
router.get('/records', getHealthRecords);
router.post('/records', validate(createHealthRecordValidator), createHealthRecord);

export default router;
