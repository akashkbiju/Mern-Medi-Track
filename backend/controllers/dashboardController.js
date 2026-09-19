import { dashboardService } from '../services/dashboardService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Dashboard Controller
 * Serves role-specific aggregated telemetry and status payloads.
 */

/**
 * @desc    Get aggregated telemetry for authenticated patient dashboard
 * @route   GET /api/dashboard/patient
 * @access  Private (Patient only)
 */
export const getPatientDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getPatientDashboardData(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, 'Patient dashboard data retrieved successfully'));
});

/**
 * @desc    Get aggregated telemetry for authenticated doctor dashboard
 * @route   GET /api/dashboard/doctor
 * @access  Private (Doctor only)
 */
export const getDoctorDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDoctorDashboardData(req.user.id);
  return res
    .status(200)
    .json(new ApiResponse(200, data, 'Doctor dashboard data retrieved successfully'));
});

export default {
  getPatientDashboard,
  getDoctorDashboard,
};
