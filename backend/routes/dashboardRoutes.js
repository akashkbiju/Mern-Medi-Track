import express from 'express';
import {
  getPatientDashboard,
  getDoctorDashboard,
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

/**
 * Step 25: Dashboard Integration Endpoints
 */

// Patient Dashboard
router.get('/patient', protect, authorizeRoles('patient'), getPatientDashboard);

// Doctor Dashboard
router.get('/doctor', protect, authorizeRoles('doctor'), getDoctorDashboard);

export default router;
