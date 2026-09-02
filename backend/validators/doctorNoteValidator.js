import { body, param, query } from 'express-validator';
import mongoose from 'mongoose';

const ALLOWED_TYPES = ['note', 'recommendation'];
const ALLOWED_VISIBILITIES = ['doctor_private', 'patient_visible'];
const ALLOWED_PRIORITIES = ['normal', 'important', 'urgent'];

/**
 * Validates that a string does not contain executable markup, raw script tags,
 * or dangerous event handler attributes.
 */
const noExecutableMarkup = (value) => {
  if (typeof value !== 'string') return true;
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b/gi,
    /<embed\b/gi,
    /<object\b/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      throw new Error('Arbitrary HTML or executable scripts are not permitted');
    }
  }
  return true;
};

export const patientIdParamValidator = [
  param('patientId')
    .notEmpty()
    .withMessage('Patient ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid patient ID format'),
];

export const noteIdParamValidator = [
  param('noteId')
    .notEmpty()
    .withMessage('Note ID is required')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid note ID format'),
];

export const doctorNoteParamsValidator = [
  ...patientIdParamValidator,
  ...noteIdParamValidator,
];

export const createDoctorNoteValidator = [
  ...patientIdParamValidator,
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters')
    .custom(noExecutableMarkup),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters')
    .custom(noExecutableMarkup),
  body('type')
    .optional()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('visibility')
    .optional()
    .isIn(ALLOWED_VISIBILITIES)
    .withMessage(`Visibility must be one of: ${ALLOWED_VISIBILITIES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`),
];

export const updateDoctorNoteValidator = [
  ...doctorNoteParamsValidator,
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Title cannot exceed 150 characters')
    .custom(noExecutableMarkup),
  body('content')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Content cannot be empty if provided')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters')
    .custom(noExecutableMarkup),
  body('type')
    .optional()
    .isIn(ALLOWED_TYPES)
    .withMessage(`Type must be one of: ${ALLOWED_TYPES.join(', ')}`),
  body('visibility')
    .optional()
    .isIn(ALLOWED_VISIBILITIES)
    .withMessage(`Visibility must be one of: ${ALLOWED_VISIBILITIES.join(', ')}`),
  body('priority')
    .optional()
    .isIn(ALLOWED_PRIORITIES)
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}`),
];

export const doctorNotesQueryValidator = [
  ...patientIdParamValidator,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('type')
    .optional()
    .isIn([...ALLOWED_TYPES, 'all'])
    .withMessage(`Type must be one of: ${ALLOWED_TYPES.join(', ')}, all`),
  query('visibility')
    .optional()
    .isIn([...ALLOWED_VISIBILITIES, 'all'])
    .withMessage(`Visibility must be one of: ${ALLOWED_VISIBILITIES.join(', ')}, all`),
  query('priority')
    .optional()
    .isIn([...ALLOWED_PRIORITIES, 'all'])
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}, all`),
];

export const patientRecommendationsQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('priority')
    .optional()
    .isIn([...ALLOWED_PRIORITIES, 'all'])
    .withMessage(`Priority must be one of: ${ALLOWED_PRIORITIES.join(', ')}, all`),
];
