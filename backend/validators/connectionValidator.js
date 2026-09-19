import { body, param, query } from 'express-validator';

/**
 * Validation schema for patient sending connection request
 */
export const sendConnectionRequestValidator = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID format'),
];

/**
 * Validation schema for connection ID parameter (:id)
 */
export const connectionIdParamValidator = [
  param('id')
    .notEmpty()
    .withMessage('Connection ID is required')
    .isMongoId()
    .withMessage('Invalid connection ID format'),
];

/**
 * Validation schema for doctor ID parameter (:doctorId)
 */
export const doctorIdParamValidator = [
  param('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isMongoId()
    .withMessage('Invalid doctor ID format'),
];

/**
 * Validation schema for doctor discovery search queries
 */
export const doctorSearchValidator = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),

  query('specialization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Specialization query cannot exceed 100 characters'),

  query('hospital')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Hospital query cannot exceed 150 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50')
    .toInt(),
];

export default {
  sendConnectionRequestValidator,
  connectionIdParamValidator,
  doctorIdParamValidator,
  doctorSearchValidator,
};
