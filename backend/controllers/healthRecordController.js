import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { healthService } from '../services/healthService.js';

/**
 * Controller for Health Record operations
 */

/**
 * Create a new health measurement record
 * POST /api/health-records
 */
export const createHealthRecord = asyncHandler(async (req, res) => {
  const record = await healthService.createHealthRecord(req.user.id, req.body);
  return res.status(201).json(
    new ApiResponse(true, 'Health record created successfully', { record })
  );
});

/**
 * Get paginated list of health records for authenticated user
 * GET /api/health-records
 */
export const getHealthRecords = asyncHandler(async (req, res) => {
  const result = await healthService.getHealthRecords(req.user.id, req.query);
  return res.status(200).json(
    new ApiResponse(true, 'Health records retrieved successfully', result)
  );
});

/**
 * Get single health record by ID
 * GET /api/health-records/:id
 */
export const getHealthRecordById = asyncHandler(async (req, res) => {
  const record = await healthService.getHealthRecordById(req.user.id, req.params.id);
  return res.status(200).json(
    new ApiResponse(true, 'Health record retrieved successfully', { record })
  );
});

/**
 * Update health record by ID
 * PATCH /api/health-records/:id (or PUT)
 */
export const updateHealthRecord = asyncHandler(async (req, res) => {
  const record = await healthService.updateHealthRecord(
    req.user.id,
    req.params.id,
    req.body
  );
  return res.status(200).json(
    new ApiResponse(true, 'Health record updated successfully', { record })
  );
});

/**
 * Delete health record by ID
 * DELETE /api/health-records/:id
 */
export const deleteHealthRecord = asyncHandler(async (req, res) => {
  const result = await healthService.deleteHealthRecord(req.user.id, req.params.id);
  return res.status(200).json(
    new ApiResponse(true, 'Health record deleted successfully', result)
  );
});

export default {
  createHealthRecord,
  getHealthRecords,
  getHealthRecordById,
  updateHealthRecord,
  deleteHealthRecord,
};
