import { param, query } from 'express-validator';
import mongoose from 'mongoose';

const ALLOWED_RECORD_METRICS = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature'];
const ALLOWED_ANALYTICS_METRICS = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature', 'all'];
const ALLOWED_PERIODS = ['7d', '30d', '90d', 'custom'];

export const patientIdParamValidator = [
  param('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid patient ID format'),
];

export const doctorHealthRecordsQueryValidator = [
  ...patientIdParamValidator,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date string (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date string (YYYY-MM-DD)'),
  query('metric')
    .optional()
    .isIn(ALLOWED_RECORD_METRICS)
    .withMessage(`Metric must be one of: ${ALLOWED_RECORD_METRICS.join(', ')}`),
  query('type')
    .optional()
    .isIn(ALLOWED_RECORD_METRICS)
    .withMessage(`Type must be one of: ${ALLOWED_RECORD_METRICS.join(', ')}`),
];

export const doctorHealthAnalyticsQueryValidator = [
  ...patientIdParamValidator,
  query('metric')
    .optional()
    .isIn(ALLOWED_ANALYTICS_METRICS)
    .withMessage(`Metric must be one of: ${ALLOWED_ANALYTICS_METRICS.join(', ')}`),
  query('period')
    .optional()
    .isIn(ALLOWED_PERIODS)
    .withMessage(`Period must be one of: ${ALLOWED_PERIODS.join(', ')}`),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date string (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date string (YYYY-MM-DD)'),
];
