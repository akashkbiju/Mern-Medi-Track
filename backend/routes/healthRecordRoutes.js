import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
} from '../controllers/healthRecordController.js';
import {
  validateCreateHealthRecord,
  validateUpdateHealthRecord,
  validateHealthRecordQuery,
  validateRecordId,
} from '../validators/healthValidator.js';

const router = express.Router();

// All health records routes are protected (authenticated user only)
router.use(protect);

/**
 * Health Records Endpoints
 * Base path: /api/health-records
 */
router
  .route('/')
  .get(validateHealthRecordQuery, getHealthRecords)
  .post(validateCreateHealthRecord, createHealthRecord);

// Backward compatibility alias for /records
router
  .route('/records')
  .get(validateHealthRecordQuery, getHealthRecords)
  .post(validateCreateHealthRecord, createHealthRecord);

router
  .route('/:id')
  .get(validateRecordId, getHealthRecordById)
  .patch(validateRecordId, validateUpdateHealthRecord, updateHealthRecord)
  .put(validateRecordId, validateUpdateHealthRecord, updateHealthRecord)
  .delete(validateRecordId, deleteHealthRecord);

export default router;
