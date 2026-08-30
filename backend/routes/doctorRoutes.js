import {
  getDoctors,
  getDoctorById,
  getDoctorProfile,
  updateDoctorProfile,
} from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateDoctorProfileValidator } from '../validators/doctorValidator.js';
import {
  doctorSearchValidator,
  doctorIdParamValidator,
} from '../validators/connectionValidator.js';

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
 * Doctor Discovery & Directory (Protected for authenticated users)
 * GET /api/doctors          - Search & list doctors
 * GET /api/doctors/:doctorId - View public doctor professional details
 */
router.get('/', protect, validate(doctorSearchValidator), getDoctors);
router.get('/:doctorId', protect, validate(doctorIdParamValidator), getDoctorById);

export default router;
