import express from 'express';
import { getPatientRecommendations } from '../controllers/doctorNoteController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { patientRecommendationsQueryValidator } from '../validators/doctorNoteValidator.js';

const router = express.Router();

/**
 * Step 22: Patient Doctor-Recommendations Access
 * GET /api/patients/me/doctor-recommendations
 * Strictly restricted to authenticated patients; returns only patient_visible recommendations
 * from currently approved connected physicians.
 */
router.get(
  '/me/doctor-recommendations',
  protect,
  authorizeRoles('patient'),
  validate(patientRecommendationsQueryValidator),
  getPatientRecommendations
);

export default router;
