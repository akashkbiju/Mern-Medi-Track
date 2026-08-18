import { getDBConnectionStatus } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health check controller
 * GET /api/health
 */
export const getHealthStatus = asyncHandler(async (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: env.NODE_ENV,
    database: getDBConnectionStatus(),
  };

  return res.status(200).json(
    new ApiResponse(true, 'MediTrack+ API is running', healthData)
  );
});

/**
 * Health Record Management Foundation
 * GET /api/health-records, POST /api/health-records
 */
export const getHealthRecords = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health records API will be implemented in a later development step')
  );
});

export const createHealthRecord = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Health record creation will be implemented in a later development step')
  );
});

export default { getHealthStatus, getHealthRecords, createHealthRecord };
