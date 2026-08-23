import { body, param } from 'express-validator';
import {
  TIME_REGEX,
  ALLOWED_DOSAGE_UNITS,
  FREQUENCY_TIMES_MAP,
  validateSchedule,
} from '../services/medicineService.js';

/**
 * Validation rules for creating a new Medicine
 */
export const createMedicineValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Medicine name must be between 1 and 100 characters'),

  body('genericName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Generic name cannot exceed 100 characters'),

  body('dosage')
    .notEmpty()
    .withMessage('Dosage amount is required')
    .isFloat({ min: 0.001, max: 100000 })
    .withMessage('Dosage must be a positive number between 0.001 and 100000'),

  body('dosageUnit')
    .trim()
    .notEmpty()
    .withMessage('Dosage unit is required')
    .custom((val) => {
      const normalized = String(val).trim().toLowerCase();
      if (!ALLOWED_DOSAGE_UNITS.includes(normalized)) {
        throw new Error(
          `Dosage unit must be one of: ${ALLOWED_DOSAGE_UNITS.join(', ')}`
        );
      }
      return true;
    }),

  body('frequency')
    .trim()
    .notEmpty()
    .withMessage('Medication frequency is required')
    .isIn(['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'custom'])
    .withMessage('Invalid frequency option specified'),

  body('times')
    .isArray({ min: 1 })
    .withMessage('Medication times must be a non-empty array')
    .custom((times, { req }) => {
      const frequency = req.body.frequency;
      const scheduleResult = validateSchedule(frequency, times);
      if (!scheduleResult.valid) {
        throw new Error(scheduleResult.error);
      }
      return true;
    }),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),

  body('endDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate) {
        const start = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
          throw new Error('End date cannot be earlier than start date');
        }
      }
      return true;
    }),

  body('instructions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions cannot exceed 500 characters'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  // Anti-mass assignment protections: reject client attempts to set ownership or internal state
  body('user').custom((val) => {
    if (val !== undefined) {
      throw new Error('Medicine ownership cannot be specified in the request body');
    }
    return true;
  }),
  body('userId').custom((val) => {
    if (val !== undefined) {
      throw new Error('User ID cannot be specified in the request body');
    }
    return true;
  }),
  body('_id').custom((val) => {
    if (val !== undefined) {
      throw new Error('Document ID cannot be specified in the request body');
    }
    return true;
  }),
  body('createdAt').custom((val) => {
    if (val !== undefined) {
      throw new Error('Creation timestamp cannot be modified manually');
    }
    return true;
  }),
];

/**
 * Validation rules for updating an existing Medicine
 */
export const updateMedicineValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medicine name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Medicine name must be between 1 and 100 characters'),

  body('genericName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Generic name cannot exceed 100 characters'),

  body('dosage')
    .optional()
    .isFloat({ min: 0.001, max: 100000 })
    .withMessage('Dosage must be a positive number between 0.001 and 100000'),

  body('dosageUnit')
    .optional()
    .trim()
    .custom((val) => {
      const normalized = String(val).trim().toLowerCase();
      if (!ALLOWED_DOSAGE_UNITS.includes(normalized)) {
        throw new Error(`Dosage unit must be one of: ${ALLOWED_DOSAGE_UNITS.join(', ')}`);
      }
      return true;
    }),

  body('frequency')
    .optional()
    .trim()
    .isIn(['once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'custom'])
    .withMessage('Invalid frequency option specified'),

  body('times')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Medication times must be a non-empty array')
    .custom((times, { req }) => {
      if (req.body.frequency) {
        const scheduleResult = validateSchedule(req.body.frequency, times);
        if (!scheduleResult.valid) {
          throw new Error(scheduleResult.error);
        }
      }
      return true;
    }),

  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),

  body('endDate')
    .optional({ nullable: true })
    .custom((endDate, { req }) => {
      if (endDate !== null && endDate !== '' && endDate !== undefined) {
        const d = new Date(endDate);
        if (isNaN(d.getTime())) {
          throw new Error('End date must be a valid date');
        }
        if (req.body.startDate) {
          const start = new Date(req.body.startDate);
          if (!isNaN(start.getTime()) && d < start) {
            throw new Error('End date cannot be earlier than start date');
          }
        }
      }
      return true;
    }),

  body('instructions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Instructions cannot exceed 500 characters'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),

  // Anti-mass assignment protections
  body('user').custom((val) => {
    if (val !== undefined) {
      throw new Error('Medicine ownership cannot be modified in the request body');
    }
    return true;
  }),
  body('_id').custom((val) => {
    if (val !== undefined) {
      throw new Error('Document ID cannot be modified');
    }
    return true;
  }),
];

/**
 * URL parameter validator for medicine ID
 */
export const medicineIdValidator = [
  param('id').isMongoId().withMessage('Invalid medicine ID format'),
];

export default {
  createMedicineValidator,
  updateMedicineValidator,
  medicineIdValidator,
};
