import { ApiError } from '../utils/ApiError.js';
import { isValidDateString, getDateRangeArray } from '../utils/dateTime.js';

/**
 * Validate query parameters for GET /api/analytics/adherence
 */
export const validateAdherenceQuery = (req, res, next) => {
  const { period, startDate, endDate } = req.query;

  const validPeriods = ['today', '7d', '30d', 'custom'];

  if (period !== undefined) {
    if (typeof period !== 'string' || !validPeriods.includes(period.toLowerCase())) {
      return next(
        new ApiError(
          400,
          `Invalid period '${period}'. Allowed values: ${validPeriods.join(', ')}`
        )
      );
    }
  }

  const resolvedPeriod = (period || '7d').toLowerCase();

  if (resolvedPeriod === 'custom') {
    if (!startDate || !endDate) {
      return next(
        new ApiError(
          400,
          "Both 'startDate' and 'endDate' are required when period is 'custom'"
        )
      );
    }

    if (!isValidDateString(startDate)) {
      return next(
        new ApiError(
          400,
          `Invalid startDate '${startDate}'. Must be in YYYY-MM-DD format (e.g. 2026-09-01)`
        )
      );
    }

    if (!isValidDateString(endDate)) {
      return next(
        new ApiError(
          400,
          `Invalid endDate '${endDate}'. Must be in YYYY-MM-DD format (e.g. 2026-09-30)`
        )
      );
    }

    if (startDate > endDate) {
      return next(
        new ApiError(400, `startDate (${startDate}) cannot be after endDate (${endDate})`)
      );
    }

    const rangeDays = getDateRangeArray(startDate, endDate);
    if (rangeDays.length > 366) {
      return next(
        new ApiError(
          400,
          `Date range (${rangeDays.length} days) exceeds maximum allowed limit of 366 days (1 year)`
        )
      );
    }
  }

  next();
};

export default {
  validateAdherenceQuery,
};
