import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * User Management Controller Foundation
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User management functionality will be implemented in a later development step')
  );
});

export const getUserById = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'User retrieval by ID will be implemented in a later development step')
  );
});

export default { getAllUsers, getUserById };
