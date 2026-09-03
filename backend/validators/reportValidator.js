import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

const ALLOWED_TYPES = ['weekly', 'monthly', 'custom'];

export const reportIdParamValidator = [
  param('id')
    .notEmpty()
    .withMessage('Report ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid report ID format'),
];

export const generateReportValidator = [
  body('reportType')
    .notEmpty()
    .withMessage('Report type is required')
    .isIn(ALLOWED_TYPES)
    .withMessage(`Report type must be one of: ${ALLOWED_TYPES.join(', ')}`),

  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((val, { req }) => {
      if (req.body.reportType === 'custom' && !val) {
        throw new Error('Start date is required for custom report type');
      }
      return true;
    }),

  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((val, { req }) => {
      if (req.body.reportType === 'custom' && !val) {
        throw new Error('End date is required for custom report type');
      }
      if (req.body.startDate && val) {
        const start = new Date(req.body.startDate);
        const end = new Date(val);
        if (start.getTime() > end.getTime()) {
          throw new Error('Start date cannot be after end date');
        }
      }
      return true;
    }),
];

export const reportQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
  query('reportType')
    .optional()
    .isIn([...ALLOWED_TYPES, 'all'])
    .withMessage(`Report type must be one of: ${ALLOWED_TYPES.join(', ')}, all`),
];
