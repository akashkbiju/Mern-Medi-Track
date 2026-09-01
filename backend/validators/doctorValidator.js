import { body, param } from 'express-validator';

// Password policy regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{};:'",.<>/\\|`~]).{8,}$/;

/**
 * Validation schema rules for Doctor registration
 */
export const doctorRegisterValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(PASSWORD_REGEX)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('specialization')
    .trim()
    .notEmpty()
    .withMessage('Medical specialization is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),

  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('Medical license number is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('License number must be between 2 and 50 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim(),

  body('hospital')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Hospital/Clinic name cannot exceed 150 characters'),

  body('experience')
    .optional({ checkFalsy: true })
    .isInt({ min: 0, max: 70 })
    .withMessage('Years of experience must be a non-negative integer up to 70'),

  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Professional bio cannot exceed 1000 characters'),

  body('consultationInfo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Consultation info cannot exceed 500 characters'),
];

/**
 * Validation schema rules for Doctor profile update
 */
export const updateDoctorProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .trim(),

  body('specialization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Specialization must be between 2 and 100 characters'),

  body('hospital')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Hospital name cannot exceed 150 characters'),

  body('experience')
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage('Years of experience must be a non-negative integer up to 70'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio cannot exceed 1000 characters'),

  body('consultationInfo')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Consultation information cannot exceed 500 characters'),
];

/**
 * Validation schema for Doctor connection request (future step placeholder)
 */
export const doctorConnectionValidator = [
  body('doctorId').isMongoId().withMessage('Invalid doctor ID format'),
];

export default {
  doctorRegisterValidator,
  updateDoctorProfileValidator,
  doctorConnectionValidator,
};
