import { query, param, body } from 'express-validator';

const ALLOWED_TYPES = [
  'medication_reminder',
  'missed_medication',
  'health_alert',
  'doctor_request',
  'doctor_approved',
  'doctor_rejected',
  'report_ready',
  'system',
];

/**
 * Validation rules for notification listing
 */
export const getNotificationsValidator = [
  query('page')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Page must be an integer greater than or equal to 1'),

  query('limit')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),

  query('read')
    .optional({ checkFalsy: true })
    .isBoolean()
    .withMessage('read must be a boolean (true or false)'),

  query('type')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Type must be one of: ${ALLOWED_TYPES.join(', ')}`),
];

/**
 * Validation rules for notification ID parameter
 */
export const notificationIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid notification ID format'),
];

/**
 * Validation rules for notification preferences update
 */
export const updatePreferencesValidator = [
  body('medicationReminders')
    .optional()
    .isBoolean()
    .withMessage('medicationReminders must be a boolean'),

  body('missedMedication')
    .optional()
    .isBoolean()
    .withMessage('missedMedication must be a boolean'),

  body('healthAlerts')
    .optional()
    .isBoolean()
    .withMessage('healthAlerts must be a boolean'),

  body('doctorUpdates')
    .optional()
    .isBoolean()
    .withMessage('doctorUpdates must be a boolean'),

  body('reportReady')
    .optional()
    .isBoolean()
    .withMessage('reportReady must be a boolean'),

  body('email')
    .optional()
    .isBoolean()
    .withMessage('email must be a boolean'),

  body('push')
    .optional()
    .isBoolean()
    .withMessage('push must be a boolean'),
];

export default {
  getNotificationsValidator,
  notificationIdValidator,
  updatePreferencesValidator,
};
