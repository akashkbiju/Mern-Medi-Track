import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authentication Controller (Foundation for Step 4)
 */
export const register = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User registration functionality will be implemented in Step 4')
  );
});

export const login = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User login functionality will be implemented in Step 4')
  );
});

export const getMe = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User profile retrieval will be implemented in Step 4')
  );
});

export default { register, login, getMe };
