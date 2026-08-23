import { userService } from '../services/userService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get current authenticated user's private profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Use req.user.id established from verified JWT (prevents ID spoofing)
  const user = await userService.getProfile(req.user.id);

  return ApiResponse.success(
    res,
    'Profile retrieved successfully',
    { user },
    200
  );
});

/**
 * Update current authenticated user's profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  // Ownership is strictly enforced through req.user.id
  const user = await userService.updateProfile(req.user.id, req.body);

  return ApiResponse.success(
    res,
    'Profile updated successfully',
    { user },
    200
  );
});

/**
 * Get all users (Admin only)
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  return ApiResponse.success(res, 'Users retrieved successfully', { users }, 200);
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, 'User retrieved successfully', { user }, 200);
});

export default { getProfile, updateProfile, getAllUsers, getUserById };
