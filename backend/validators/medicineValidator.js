import { body, param } from 'express-validator';

/**
 * Validation schema rules for Medicine management endpoints
 */
export const createMedicineValidator = [
  body('name').trim().notEmpty().withMessage('Medicine name is required'),
  body('dosage.amount').notEmpty().withMessage('Dosage amount is required'),
  body('dosage.unit')
    .isIn(['mg', 'ml', 'tablet', 'capsule', 'drop', 'puff', 'application'])
    .withMessage('Invalid dosage unit'),
  body('frequency.type')
    .isIn(['daily', 'specific_days', 'as_needed'])
    .withMessage('Invalid frequency type'),
];

export const medicineIdValidator = [
  param('id').isMongoId().withMessage('Invalid medicine ID format'),
];

export default { createMedicineValidator, medicineIdValidator };
