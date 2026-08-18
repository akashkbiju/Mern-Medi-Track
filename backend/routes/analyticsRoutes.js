import express from 'express';
import {
  getAdherenceAnalytics,
  getHealthTrends,
} from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * Health Analytics RESTful endpoints foundation
 * GET /api/analytics
 * GET /api/analytics/trends
 */
router.get('/', getAdherenceAnalytics);
router.get('/trends', getHealthTrends);

export default router;
