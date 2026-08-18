import { body, param } from 'express-validator';

/**
 * Validation schema rules for Doctor connectivity endpoints
 */
export const updateDoctorProfileValidator = [
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
];

export const doctorConnectionValidator = [
  body('doctorId').isMongoId().withMessage('Invalid doctor ID format'),
];

export default { updateDoctorProfileValidator, doctorConnectionValidator };
