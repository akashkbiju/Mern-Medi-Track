import express from 'express';
import {
  getDoctors,
  connectDoctor,
  getDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  updateDoctorProfileValidator,
  doctorConnectionValidator,
} from '../validators/doctorValidator.js';

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
 * Doctor Connectivity RESTful endpoints foundation (Future Step 20)
 * GET  /api/doctors
 * POST /api/doctors/connect
 */
router.get('/', getDoctors);
router.post('/connect', validate(doctorConnectionValidator), connectDoctor);

export default router;
