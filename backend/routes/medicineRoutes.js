import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicineController.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  createMedicineValidator,
  medicineIdValidator,
} from '../validators/medicineValidator.js';

const router = express.Router();

/**
 * Medicine management RESTful endpoints foundation
 * GET    /api/medicines
 * POST   /api/medicines
 * GET    /api/medicines/:id
 * PUT    /api/medicines/:id
 * DELETE /api/medicines/:id
 */
router.get('/', getMedicines);
router.post('/', validate(createMedicineValidator), createMedicine);
router.get('/:id', validate(medicineIdValidator), getMedicineById);
router.put('/:id', validate(medicineIdValidator), updateMedicine);
router.delete('/:id', validate(medicineIdValidator), deleteMedicine);

export default router;
