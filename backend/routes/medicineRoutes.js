import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  activateMedicine,
} from '../controllers/medicineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createMedicineValidator,
  updateMedicineValidator,
  medicineIdValidator,
} from '../validators/medicineValidator.js';

const router = express.Router();

/**
 * Medicine Management RESTful Endpoints
 * All routes require authenticated patient/user session
 */

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
