import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Protect middleware: Verifies JWT token and attaches authenticated user to req.user
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header (Bearer token)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    // 2. Check for token in httpOnly cookie
    token = req.cookies.token;
  }

  if (!token) {
    throw new ApiError(401, 'Authentication token required. Please log in.');
  }

  try {
    // 3. Verify token
    const decoded = verifyToken(token);

    // 4. Find user by id (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new ApiError(401, 'User account associated with this token no longer exists.');
    }

    // 5. Check if user is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    // 6. Attach authenticated user to request
    req.user = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Invalid authentication token. Please log in again.');
    }
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token has expired. Please log in again.');
    }
    throw error;
  }
});

/**
 * Role-based Authorization Middleware Foundation (Activated in Step 6)
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role (${req.user?.role || 'unknown'}) is not authorized to access this resource.`
      );
    }
    next();
  };
};

export default { protect, authorizeRoles };
