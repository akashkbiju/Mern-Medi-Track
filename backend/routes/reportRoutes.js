import express from 'express';
import {
  generateReport,
  getReports,
  getLatestReport,
  getReportById,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  generateReportValidator,
  reportIdParamValidator,
  reportQueryValidator,
} from '../validators/reportValidator.js';

const router = express.Router();

/**
 * Step 23: Automatic Health Report Generation Endpoints
 */

// Generate structured report (patient only)
router.post(
  '/generate',
  protect,
  authorizeRoles('patient'),
  validate(generateReportValidator),
  generateReport
);

// Get paginated list of reports (patient only)
router.get(
  '/',
  protect,
  authorizeRoles('patient'),
  validate(reportQueryValidator),
  getReports
);

// Get latest generated report (patient only)
router.get('/latest', protect, authorizeRoles('patient'), getLatestReport);

// Get single report by ID (patient owner OR approved doctor with reports: true)
router.get('/:id', protect, validate(reportIdParamValidator), getReportById);

export default router;
