import { doctorService } from '../services/doctorService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Register a new doctor account
 * POST /api/auth/doctor/register
 */
export const registerDoctor = asyncHandler(async (req, res) => {
  const result = await doctorService.registerDoctor(req.body);

  return ApiResponse.success(
    res,
    'Doctor account created successfully. Your account is pending verification.',
    result,
    201
  );
});

/**
 * Retrieve professional profile for authenticated doctor
 * GET /api/doctors/profile
 */
export const getDoctorProfile = asyncHandler(async (req, res) => {
  const result = await doctorService.getDoctorProfile(req.user.id);

  return ApiResponse.success(
    res,
    'Doctor profile retrieved successfully',
    result,
    200
  );
});

/**
 * Update professional profile for authenticated doctor
 * PATCH /api/doctors/profile
 */
export const updateDoctorProfile = asyncHandler(async (req, res) => {
  const result = await doctorService.updateDoctorProfile(req.user.id, req.body);

  return ApiResponse.success(
    res,
    'Doctor profile updated successfully',
    result,
    200
  );
});

import { connectionService } from '../services/connectionService.js';

/**
 * Search and discover doctors
 * GET /api/doctors
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const result = await connectionService.searchDoctors(req.query);

  return ApiResponse.success(
    res,
    'Doctors retrieved successfully',
    result,
    200
  );
});

/**
 * Get public doctor profile details
 * GET /api/doctors/:doctorId
 */
export const getDoctorById = asyncHandler(async (req, res) => {
  const result = await connectionService.getDoctorById(req.params.doctorId);

  return ApiResponse.success(
    res,
    'Doctor profile retrieved successfully',
    result,
    200
  );
});

export default {
  registerDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctors,
  getDoctorById,
};
