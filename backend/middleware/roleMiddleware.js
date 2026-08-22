import { ApiError } from '../utils/ApiError.js';

/**
 * Reusable role-based authorization middleware
 * Checks whether the authenticated user possesses one of the allowed roles
 *
 * @param {...string} allowedRoles - List of authorized roles ('patient', 'doctor', 'admin')
 * @returns {Function} Express middleware function
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Ensure user is authenticated
    if (!req.user) {
      throw new ApiError(401, 'Authentication required before role verification.');
    }

    // 2. Verify user's role against allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        'You do not have permission to access this resource'
      );
    }

    next();
  };
};

export default authorizeRoles;
