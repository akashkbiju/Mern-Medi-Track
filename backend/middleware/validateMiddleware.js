import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware to evaluate express-validator rules and abort with 400 if validation fails
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validation rules
    if (Array.isArray(validations)) {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (result.errors.length) break;
      }
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return next(new ApiError(400, 'Validation failed for request parameters', extractedErrors));
  };
};

export default validate;
