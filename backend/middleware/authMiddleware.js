import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication Middleware Foundation (To be fully implemented in Step 4)
 * Protects routes requiring valid JSON Web Tokens
 */
export const protect = (req, res, next) => {
  // Placeholder foundation for JWT authentication in upcoming Step 4
  // When Step 4 is implemented: extract Bearer token, verify via jwt.verify, and attach req.user
  return next(
    new ApiError(
      501,
      'Authentication protection middleware will be activated in Step 4'
    )
  );
};

/**
 * Role-based Authorization Middleware Foundation
 * Restricts access to specified roles (e.g. 'patient', 'doctor', 'admin')
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Placeholder foundation for RBAC
    return next(
      new ApiError(
        501,
        `Role authorization (${roles.join(', ')}) will be activated in upcoming development steps`
      )
    );
  };
};

export default { protect, authorizeRoles };
