import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health & Adherence Analytics Controller Foundation
 */
export const getAdherenceAnalytics = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Adherence analytics API will be implemented in a later development step')
  );
});

export const getHealthTrends = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health trends analytics will be implemented in a later development step')
  );
});

export default { getAdherenceAnalytics, getHealthTrends };
