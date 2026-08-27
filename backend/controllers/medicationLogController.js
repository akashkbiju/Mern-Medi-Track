import { medicationLogService } from '../services/medicationLogService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Retrieve today's medication logs and progress statistics for authenticated user
 * GET /api/medication-logs/today
 */
export const getTodayLogs = asyncHandler(async (req, res) => {
  const result = await medicationLogService.getTodayMedicationLogs(req.user.id);
  return ApiResponse.success(
    res,
    "Today's medication schedule retrieved successfully",
    result,
    200
  );
});

/**
 * Retrieve medication logs history with filters and pagination
 * GET /api/medication-logs?date=...&startDate=...&endDate=...&status=...
 */
export const getLogs = asyncHandler(async (req, res) => {
  const result = await medicationLogService.getMedicationLogs(req.user.id, req.query);
  return ApiResponse.success(res, 'Medication logs retrieved successfully', result, 200);
});

/**
 * Retrieve a single medication log by ID
 * GET /api/medication-logs/:id
 */
export const getLogById = asyncHandler(async (req, res) => {
  const log = await medicationLogService.getMedicationLogById(req.user.id, req.params.id);
  return ApiResponse.success(res, 'Medication log retrieved successfully', { log }, 200);
});

/**
 * Mark a scheduled medication dose as taken
 * PATCH /api/medication-logs/:id/taken
 */
export const markTaken = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const log = await medicationLogService.markMedicationTaken(
    req.user.id,
    req.params.id,
    notes
  );
  return ApiResponse.success(res, 'Medication dose marked as taken', { log }, 200);
});

/**
 * Mark a scheduled medication dose as skipped
 * PATCH /api/medication-logs/:id/skipped
 */
export const markSkipped = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const log = await medicationLogService.markMedicationSkipped(
    req.user.id,
    req.params.id,
    notes
  );
  return ApiResponse.success(res, 'Medication dose marked as skipped', { log }, 200);
});

/**
 * Trigger automated missed dose check
 * POST /api/medication-logs/process-missed
 */
export const processMissed = asyncHandler(async (req, res) => {
  const result = await medicationLogService.processMissedMedicationLogs(req.body);
  return ApiResponse.success(
    res,
    'Missed medication check processed successfully',
    result,
    200
  );
});

export default {
  getTodayLogs,
  getLogs,
  getLogById,
  markTaken,
  markSkipped,
  processMissed,
};
