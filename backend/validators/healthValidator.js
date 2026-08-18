import { body, param } from 'express-validator';

/**
 * Validation schema rules for Health tracking endpoints
 */
export const createHealthRecordValidator = [
  body('recordType')
    .isIn([
      'blood_pressure',
      'blood_sugar',
      'heart_rate',
      'weight',
      'temperature',
      'oxygen_saturation',
      'cholesterol',
    ])
    .withMessage('Invalid health record type'),
  body('value').notEmpty().withMessage('Health parameter value is required'),
];

export const healthRecordIdValidator = [
  param('id').isMongoId().withMessage('Invalid health record ID format'),
];

export default { createHealthRecordValidator, healthRecordIdValidator };
