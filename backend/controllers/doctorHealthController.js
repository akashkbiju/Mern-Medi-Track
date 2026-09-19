import { doctorHealthService } from '../services/doctorHealthService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Doctor Health Controller
 * Thin controller layer delegating to doctorHealthService.
 * Always resolves doctor ID strictly from req.user.id.
 */

/**
 * Get connected patient health records
 * GET /api/doctors/patients/:patientId/health-records
 */
export const getPatientHealthRecords = asyncHandler(async (req, res) => {
  const result = await doctorHealthService.getConnectedPatientHealthRecords(
    req.user.id,
    req.params.patientId,
    req.query
  );

  return ApiResponse.success(
    res,
    'Patient health records retrieved successfully',
    result,
    200
  );
});

/**
 * Get connected patient health KPI summary
 * GET /api/doctors/patients/:patientId/health-summary
 */
export const getPatientHealthSummary = asyncHandler(async (req, res) => {
  const result = await doctorHealthService.getConnectedPatientHealthSummary(
    req.user.id,
    req.params.patientId
  );

  return ApiResponse.success(
    res,
    'Patient health summary retrieved successfully',
    result,
    200
  );
});

/**
 * Get connected patient health analytics
 * GET /api/doctors/patients/:patientId/health-analytics
 */
export const getPatientHealthAnalytics = asyncHandler(async (req, res) => {
  const result = await doctorHealthService.getConnectedPatientHealthAnalytics(
    req.user.id,
    req.params.patientId,
    req.query
  );

  return ApiResponse.success(
    res,
    'Patient health analytics retrieved successfully',
    result,
    200
  );
});

/**
 * Get connected patient context
 * GET /api/doctors/patients/:patientId/context
 */
export const getPatientContext = asyncHandler(async (req, res) => {
  const result = await doctorHealthService.getDoctorPatientContext(
    req.user.id,
    req.params.patientId
  );

  return ApiResponse.success(
    res,
    'Doctor-patient connection context retrieved successfully',
    result,
    200
  );
});

export default {
  getPatientHealthRecords,
  getPatientHealthSummary,
  getPatientHealthAnalytics,
  getPatientContext,
};
