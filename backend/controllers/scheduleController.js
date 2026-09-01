import { scheduleService } from '../services/scheduleService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Retrieve today's medication schedule for current user
 * GET /api/medicines/schedule/today
 */
export const getTodaySchedule = asyncHandler(async (req, res) => {
  const result = await scheduleService.getTodaySchedule(req.user.id);
  return ApiResponse.success(res, "Today's medication schedule retrieved successfully", result, 200);
});

/**
 * Retrieve daily medication schedule for a specific date (defaults to today)
 * GET /api/medicines/schedule/daily?date=YYYY-MM-DD
 */
export const getDailySchedule = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await scheduleService.getDailySchedule(req.user.id, date);
  return ApiResponse.success(res, 'Daily medication schedule retrieved successfully', result, 200);
});

/**
 * Retrieve upcoming doses for next 24 hours for current user
 * GET /api/medicines/schedule/upcoming
 */
export const getUpcomingSchedule = asyncHandler(async (req, res) => {
  const result = await scheduleService.getUpcomingSchedule(req.user.id);
  return ApiResponse.success(res, 'Upcoming medication schedule retrieved successfully', result, 200);
});

/**
 * Retrieve schedule for a specific medicine on a given date (defaults to today)
 * GET /api/medicines/:id/schedule?date=YYYY-MM-DD
 */
export const getMedicineSchedule = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await scheduleService.getMedicineSchedule(req.user.id, req.params.id, date);
  return ApiResponse.success(res, 'Medicine schedule retrieved successfully', result, 200);
});

export default {
  getTodaySchedule,
  getDailySchedule,
  getUpcomingSchedule,
  getMedicineSchedule,
};
