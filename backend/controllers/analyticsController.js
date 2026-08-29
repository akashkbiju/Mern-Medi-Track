import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { adherenceService } from '../services/adherenceService.js';
import { healthAnalyticsService } from '../services/healthAnalyticsService.js';

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
 * Get health analytics trends and statistical changes
 * GET /api/analytics/health?metric=weight|bloodPressure|bloodSugar|heartRate|temperature|all&period=7d|30d|90d|custom
 */
export const getHealthAnalytics = asyncHandler(async (req, res) => {
  const { metric, period, startDate, endDate } = req.query;

  const data = await healthAnalyticsService.getHealthAnalytics(req.user.id, {
    metric,
    period,
    startDate,
    endDate,
  });

  return res.status(200).json(
    new ApiResponse(true, 'Health analytics retrieved successfully', data)
  );
});

/**
 * Get compact health summary metrics
 * GET /api/analytics/health/summary?period=7d|30d|90d|custom
 */
export const getHealthSummary = asyncHandler(async (req, res) => {
  const { period, startDate, endDate } = req.query;

  const data = await healthAnalyticsService.getHealthSummary(req.user.id, {
    period,
    startDate,
    endDate,
  });

  return res.status(200).json(
    new ApiResponse(true, 'Health summary retrieved successfully', data)
  );
});

/**
 * Health trends alias
 */
export const getHealthTrends = getHealthAnalytics;

export default {
  getAdherenceSummary,
  getAdherenceAnalytics,
  getHealthAnalytics,
  getHealthSummary,
  getHealthTrends,
};
