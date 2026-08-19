import { authService } from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  return ApiResponse.success(res, 'Account created successfully', { user }, 201);
});

/**
 * Login placeholder (To be implemented in Step 5)
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User login functionality will be implemented in Step 5')
  );
});

/**
 * Get current user profile placeholder (To be implemented in Step 5)
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User profile retrieval will be implemented in Step 5')
  );
});

export default { register, login, getMe };
