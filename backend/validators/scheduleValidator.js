import { query, param } from 'express-validator';
import { isValidDateString } from '../utils/dateTime.js';

/**
 * Validation rules for schedule date query parameter (?date=YYYY-MM-DD)
 */
export const dateQueryValidator = [
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
];

/**
 * Validation rules for getting schedule of a specific medicine
 */
export const medicineScheduleValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid medicine ID format'),
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
];

export default {
  dateQueryValidator,
  medicineScheduleValidator,
};
