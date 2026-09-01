import { body } from 'express-validator';

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
const ALLOWED_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say', ''];

/**
 * Validation rules for PUT /api/users/profile
 */
export const updateProfileValidator = [
  body('fullName')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Please enter a valid phone number (e.g. +1234567890 or 10 digits)'),

  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .custom((value) => {
      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        throw new Error('Please provide a valid date for date of birth');
      }
      if (dob > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),

  body('gender')
    .optional()
    .custom((value) => {
      if (value && !ALLOWED_GENDERS.includes(value)) {
        throw new Error("Gender must be 'male', 'female', 'other', or 'prefer_not_to_say'");
      }
      return true;
    }),

  body('emergencyContact')
    .optional()
    .custom((contact) => {
      if (contact !== null && typeof contact !== 'object') {
        throw new Error('Emergency contact must be an object');
      }
      return true;
    }),

  body('emergencyContact.name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact name cannot exceed 100 characters'),

  body('emergencyContact.relationship')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Relationship cannot exceed 50 characters'),

  body('emergencyContact.phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Please enter a valid emergency contact phone number'),

  body('profileImage')
    .optional({ checkFalsy: true })
    .isString()
    .withMessage('Profile image must be a valid string'),

  // Reject unauthorized / privileged field tampering attempts explicitly
  body('role').custom((val) => {
    if (val !== undefined) {
      throw new Error('Modifying user role is strictly unauthorized');
    }
    return true;
  }),
  body('email').custom((val) => {
    if (val !== undefined) {
      throw new Error('Email address cannot be modified via profile update');
    }
    return true;
  }),
  body('isActive').custom((val) => {
    if (val !== undefined) {
      throw new Error('Modifying active status is strictly unauthorized');
    }
    return true;
  }),
  body('password').custom((val) => {
    if (val !== undefined) {
      throw new Error('Password cannot be changed via profile update');
    }
    return true;
  }),
];

export default { updateProfileValidator };
