import { query, param, body } from 'express-validator';
import { isValidDateString } from '../utils/dateTime.js';

/**
 * Validation rules for querying medication logs
 */
export const getLogsValidator = [
  query('date')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((val) => {
      if (!isValidDateString(val)) {
        throw new Error('Invalid calendar date provided');
      }
      return true;
    }),

  query('startDate')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format')
    .custom((val) => {
      if (!isValidDateString(val)) {
        throw new Error('Invalid calendar start date provided');
      }
      return true;
    }),

  query('endDate')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((val) => {
      if (!isValidDateString(val)) {
        throw new Error('Invalid calendar end date provided');
      }
      return true;
    }),

  query('status')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(['pending', 'taken', 'missed', 'skipped'])
    .withMessage('Status must be one of: pending, taken, missed, skipped'),

  query('medicineId')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid medicine ID format'),

  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than or equal to 1'),

  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
];

/**
 * Validation rules for MedicationLog ID parameter
 */
export const logIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid medication log ID format'),
];

/**
 * Validation rules for action note payload (e.g. taken/skipped note)
 */
export const actionNoteValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid medication log ID format'),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
];

/**
 * Validation rules for manual missed processing trigger
 */
export const processMissedValidator = [
  body('graceMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('graceMinutes must be an integer between 1 and 1440 minutes'),
];

export default {
  getLogsValidator,
  logIdValidator,
  actionNoteValidator,
  processMissedValidator,
};
