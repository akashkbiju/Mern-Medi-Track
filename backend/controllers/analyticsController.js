import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adherenceService } from '../services/adherenceService.js';

/**
 * Health & Adherence Analytics Controller
 */

/**
 * Get medication adherence score, statistics, and daily trend breakdown
 * GET /api/analytics/adherence?period=7d|30d|today|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const getAdherenceSummary = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;

  const data = await adherenceService.getAdherenceSummary(req.user.id, {
    period,
    startDate,
    endDate,
  });

  return res.status(200).json(
    new ApiResponse(true, 'Medication adherence calculated successfully', data)
  );
});

/**
 * Backward compatibility alias
 */
export const getAdherenceAnalytics = getAdherenceSummary;

/**
 * Health trends placeholder for future step
 */
export const getHealthTrends = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health trends analytics will be implemented in a later development step')
  );
});

export default {
  getAdherenceSummary,
  getAdherenceAnalytics,
  getHealthTrends,
};
