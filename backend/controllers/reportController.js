import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health Report Controller Foundation
 */
export const getReports = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health reports API will be implemented in a later development step')
  );
});

export const generateReport = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health report generation will be implemented in a later development step')
  );
});

export default { getReports, generateReport };
