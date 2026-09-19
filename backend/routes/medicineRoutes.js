import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  activateMedicine,
} from '../controllers/medicineController.js';
import {
  getTodaySchedule,
  getDailySchedule,
  getUpcomingSchedule,
  getMedicineSchedule,
} from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createMedicineValidator,
  updateMedicineValidator,
  medicineIdValidator,
} from '../validators/medicineValidator.js';
import {
  dateQueryValidator,
  medicineScheduleValidator,
} from '../validators/scheduleValidator.js';

const router = express.Router();

/**
 * Medicine Management RESTful Endpoints
 * All routes require authenticated patient/user session
 */

// Schedule Routes (Must precede /:id to prevent routing collisions)
// GET /api/medicines/schedule/today - Retrieve today's medication schedule
router.get('/schedule/today', protect, getTodaySchedule);

// GET /api/medicines/schedule/daily?date=YYYY-MM-DD - Retrieve schedule for date
router.get('/schedule/daily', protect, validate(dateQueryValidator), getDailySchedule);

// GET /api/medicines/schedule/upcoming - Retrieve next 24 hours schedule
router.get('/schedule/upcoming', protect, getUpcomingSchedule);

// GET /api/medicines/:id/schedule?date=YYYY-MM-DD - Retrieve schedule for specific medicine
router.get(
  '/:id/schedule',
  protect,
  validate(medicineScheduleValidator),
  getMedicineSchedule
);

// Standard Medicine CRUD Routes
// GET /api/medicines - List user medicines with optional status/search filters
router.get('/', protect, getMedicines);

// POST /api/medicines - Create new medicine for authenticated user
router.post('/', protect, validate(createMedicineValidator), createMedicine);

// GET /api/medicines/:id - Retrieve single medicine by ID
router.get('/:id', protect, validate(medicineIdValidator), getMedicineById);

// PUT /api/medicines/:id - Update existing medicine
router.put(
  '/:id',
  protect,
  validate(medicineIdValidator),
  validate(updateMedicineValidator),
  updateMedicine
);

// PATCH /api/medicines/:id/deactivate - Soft-deactivate medicine
router.patch('/:id/deactivate', protect, validate(medicineIdValidator), deactivateMedicine);

// PATCH /api/medicines/:id/activate - Reactivate inactive medicine
router.patch('/:id/activate', protect, validate(medicineIdValidator), activateMedicine);

export default router;

