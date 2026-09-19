import { query, param, body } from 'express-validator';
import { isValidDateString } from '../utils/dateTime.js';

/**
 * Validation rules for querying user reminders
 */
export const getRemindersValidator = [
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

  query('isRead')
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage('isRead must be a boolean (true or false)'),

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
 * Validation rules for upcoming reminders query
 */
export const upcomingRemindersValidator = [
  query('hours')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 168 })
    .withMessage('Hours lookahead must be an integer between 1 and 168 (7 days)'),
];

/**
 * Validation rules for reminder ID parameter
 */
export const reminderIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid reminder ID format'),
];

/**
 * Validation rules for manual processing trigger
 */
export const processRemindersValidator = [
  body('lookaheadMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('lookaheadMinutes must be between 1 and 1440'),

  body('recoveryMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('recoveryMinutes must be between 1 and 1440'),
];

export default {
  getRemindersValidator,
  upcomingRemindersValidator,
  reminderIdValidator,
  processRemindersValidator,
};
