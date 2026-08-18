import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Doctor & Connectivity Controller Foundation
 */
export const getDoctors = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Doctor directory functionality will be implemented in a later development step')
  );
});

export const connectDoctor = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Doctor connectivity will be implemented in a later development step')
  );
});

export default { getDoctors, connectDoctor };
