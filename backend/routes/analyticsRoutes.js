import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAdherenceSummary,
  getHealthAnalytics,
  getHealthSummary,
  getHealthTrends,
} from '../controllers/analyticsController.js';
import {
  validateAdherenceQuery,
  validateHealthAnalyticsQuery,
} from '../validators/analyticsValidator.js';

const router = express.Router();

/**
 * Health & Adherence Analytics RESTful endpoints
 *
 * GET /api/analytics/adherence
 * GET /api/analytics/health
 * GET /api/analytics/health/summary
 * GET /api/analytics/trends (alias to /health)
 * GET /api/analytics (alias to /adherence)
 */
router.get('/adherence', protect, validateAdherenceQuery, getAdherenceSummary);
router.get('/health/summary', protect, validateHealthAnalyticsQuery, getHealthSummary);
router.get('/health', protect, validateHealthAnalyticsQuery, getHealthAnalytics);
router.get('/trends', protect, validateHealthAnalyticsQuery, getHealthTrends);
router.get('/', protect, validateAdherenceQuery, getAdherenceSummary);

export default router;

