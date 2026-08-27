import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAdherenceSummary,
  getHealthTrends,
} from '../controllers/analyticsController.js';
import { validateAdherenceQuery } from '../validators/analyticsValidator.js';

const router = express.Router();

/**
 * Health Analytics RESTful endpoints
 *
 * GET /api/analytics/adherence
 * GET /api/analytics (alias)
 * GET /api/analytics/trends
 */
router.get('/adherence', protect, validateAdherenceQuery, getAdherenceSummary);
router.get('/', protect, validateAdherenceQuery, getAdherenceSummary);
router.get('/trends', protect, getHealthTrends);

export default router;
