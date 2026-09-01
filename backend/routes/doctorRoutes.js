import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import {
  getPatientHealthRecords,
  getPatientHealthSummary,
  getPatientHealthAnalytics,
  getPatientContext,
} from '../controllers/doctorHealthController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateDoctorProfileValidator } from '../validators/doctorValidator.js';
import {
  doctorSearchValidator,
  doctorIdParamValidator,
} from '../validators/connectionValidator.js';
import {
  patientIdParamValidator,
  doctorHealthRecordsQueryValidator,
  doctorHealthAnalyticsQueryValidator,
} from '../validators/doctorHealthValidator.js';

const router = express.Router();

/**
 * Doctor Profile Management (Doctor Role Protected)
 * GET   /api/doctors/profile - Retrieve authenticated doctor's professional profile
 * PATCH /api/doctors/profile - Update permitted professional and contact information
 */
router.get('/profile', protect, authorizeRoles('doctor'), getDoctorProfile);
router.patch(
  '/profile',
  protect,
  authorizeRoles('doctor'),
  validate(updateDoctorProfileValidator),
  updateDoctorProfile
);

/**
 * Step 21: Doctor Connected-Patient Health Record Access (Doctor Role Protected)
 * Enforces 5-layer authorization chain:
 * JWT Auth -> Doctor Role -> Active Accounts -> Approved Connection -> healthRecords Permission -> Data
 * Note: Placed BEFORE /:doctorId so 'patients' is not treated as a doctor ID parameter.
 */
router.get(
  '/patients/:patientId/health-records',
  protect,
  authorizeRoles('doctor'),
  validate(doctorHealthRecordsQueryValidator),
  getPatientHealthRecords
);

router.get(
  '/patients/:patientId/health-summary',
  protect,
  authorizeRoles('doctor'),
  validate(patientIdParamValidator),
  getPatientHealthSummary
);

router.get(
  '/patients/:patientId/health-analytics',
  protect,
  authorizeRoles('doctor'),
  validate(doctorHealthAnalyticsQueryValidator),
  getPatientHealthAnalytics
);

router.get(
  '/patients/:patientId/context',
  protect,
  authorizeRoles('doctor'),
  validate(patientIdParamValidator),
  getPatientContext
);

/**
 * Doctor Discovery & Directory (Protected for authenticated users)
 * GET /api/doctors          - Search & list doctors
 * GET /api/doctors/:doctorId - View public doctor professional details
 */
router.get('/', protect, validate(doctorSearchValidator), getDoctors);
router.get('/:doctorId', protect, validate(doctorIdParamValidator), getDoctorById);

export default router;
