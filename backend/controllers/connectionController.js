import { connectionService } from '../services/connectionService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Send a new connection request to a doctor
 * POST /api/connections
 */
export const sendRequest = asyncHandler(async (req, res) => {
  const result = await connectionService.sendConnectionRequest(req.user.id, req.body.doctorId);
  return ApiResponse.success(
    res,
    'Connection request sent successfully',
    result,
    201
  );
});

/**
 * Get current connection status between patient and doctor
 * GET /api/connections/status/:doctorId
 */
export const getStatus = asyncHandler(async (req, res) => {
  const result = await connectionService.getConnectionStatus(req.user.id, req.params.doctorId);
  return ApiResponse.success(
    res,
    'Connection status retrieved successfully',
    result,
    200
  );
});

/**
 * Patient views pending connection requests
 * GET /api/connections/patient/pending
 */
export const getPatientPending = asyncHandler(async (req, res) => {
  const result = await connectionService.getPatientPendingRequests(req.user.id);
  return ApiResponse.success(
    res,
    'Pending requests retrieved successfully',
    result,
    200
  );
});

/**
 * Patient views approved connected doctors
 * GET /api/connections/patient/connected
 */
export const getPatientConnected = asyncHandler(async (req, res) => {
  const result = await connectionService.getPatientConnections(req.user.id);
  return ApiResponse.success(
    res,
    'Connected doctors retrieved successfully',
    result,
    200
  );
});

/**
 * Patient cancels a pending connection request
 * PATCH /api/connections/:id/cancel
 */
export const cancelRequest = asyncHandler(async (req, res) => {
  const result = await connectionService.cancelConnectionRequest(req.user.id, req.params.id);
  return ApiResponse.success(
    res,
    'Connection request cancelled successfully',
    result,
    200
  );
});

/**
 * Doctor views incoming pending connection requests
 * GET /api/connections/doctor/requests
 */
export const getDoctorRequests = asyncHandler(async (req, res) => {
  const result = await connectionService.getDoctorRequests(req.user.id);
  return ApiResponse.success(
    res,
    'Incoming connection requests retrieved successfully',
    result,
    200
  );
});

/**
 * Doctor views approved connected patients
 * GET /api/connections/doctor/connected
 */
export const getDoctorConnected = asyncHandler(async (req, res) => {
  const result = await connectionService.getDoctorConnections(req.user.id);
  return ApiResponse.success(
    res,
    'Connected patients retrieved successfully',
    result,
    200
  );
});

/**
 * Doctor accepts a pending connection request
 * PATCH /api/connections/:id/accept
 */
export const acceptRequest = asyncHandler(async (req, res) => {
  const result = await connectionService.acceptConnectionRequest(req.user.id, req.params.id);
  return ApiResponse.success(
    res,
    'Connection request accepted successfully',
    result,
    200
  );
});

/**
 * Doctor rejects a pending connection request
 * PATCH /api/connections/:id/reject
 */
export const rejectRequest = asyncHandler(async (req, res) => {
  const result = await connectionService.rejectConnectionRequest(req.user.id, req.params.id);
  return ApiResponse.success(
    res,
    'Connection request rejected successfully',
    result,
    200
  );
});

/**
 * Either party revokes an approved connection
 * PATCH /api/connections/:id/revoke
 */
export const revoke = asyncHandler(async (req, res) => {
  const result = await connectionService.revokeConnection(req.user.id, req.params.id);
  return ApiResponse.success(
    res,
    'Connection revoked successfully',
    result,
    200
  );
});

export default {
  sendRequest,
  getStatus,
  getPatientPending,
  getPatientConnected,
  cancelRequest,
  getDoctorRequests,
  getDoctorConnected,
  acceptRequest,
  rejectRequest,
  revoke,
};
