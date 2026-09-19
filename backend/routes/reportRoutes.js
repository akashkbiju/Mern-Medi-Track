import express from 'express';
import { getReports, generateReport } from '../controllers/reportController.js';

const router = express.Router();

/**
 * Health Reports RESTful endpoints foundation
 * GET  /api/reports
 * POST /api/reports/generate
 */
router.get('/', getReports);
router.post('/generate', generateReport);

export default router;
