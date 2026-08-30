import api from './api';

/**
 * Doctor-Patient Connection API Service
 */

/**
 * Search and list doctors
 * GET /api/doctors
 */
export const searchDoctors = async (params = {}) => {
  const response = await api.get('/doctors', { params });
  return response.data;
};

/**
 * Get public doctor profile details
 * GET /api/doctors/:doctorId
 */
export const getDoctor = async (doctorId) => {
  const response = await api.get(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Send a connection request to a doctor
 * POST /api/connections
 */
export const sendConnectionRequest = async (doctorId) => {
  const response = await api.post('/connections', { doctorId });
  return response.data;
};

/**
 * Check connection status with a specific doctor
 * GET /api/connections/status/:doctorId
 */
export const getConnectionStatus = async (doctorId) => {
  const response = await api.get(`/connections/status/${doctorId}`);
  return response.data;
};

/**
 * Get patient's pending connection requests
 * GET /api/connections/patient/pending
 */
export const getPatientPendingRequests = async () => {
  const response = await api.get('/connections/patient/pending');
  return response.data;
};

/**
 * Get patient's approved/connected doctors
 * GET /api/connections/patient/connected
 */
export const getPatientConnections = async () => {
  const response = await api.get('/connections/patient/connected');
  return response.data;
};

/**
 * Cancel a pending connection request
 * PATCH /api/connections/:id/cancel
 */
export const cancelConnectionRequest = async (connectionId) => {
  const response = await api.patch(`/connections/${connectionId}/cancel`);
  return response.data;
};

/**
 * Doctor views incoming connection requests
 * GET /api/connections/doctor/requests
 */
export const getDoctorRequests = async () => {
  const response = await api.get('/connections/doctor/requests');
  return response.data;
};

/**
 * Doctor views connected patients
 * GET /api/connections/doctor/connected
 */
export const getDoctorConnections = async () => {
  const response = await api.get('/connections/doctor/connected');
  return response.data;
};

/**
 * Doctor accepts a connection request
 * PATCH /api/connections/:id/accept
 */
export const acceptConnectionRequest = async (connectionId) => {
  const response = await api.patch(`/connections/${connectionId}/accept`);
  return response.data;
};

/**
 * Doctor rejects a connection request
 * PATCH /api/connections/:id/reject
 */
export const rejectConnectionRequest = async (connectionId) => {
  const response = await api.patch(`/connections/${connectionId}/reject`);
  return response.data;
};

/**
 * Either party revokes an approved connection
 * PATCH /api/connections/:id/revoke
 */
export const revokeConnection = async (connectionId) => {
  const response = await api.patch(`/connections/${connectionId}/revoke`);
  return response.data;
};

export default {
  searchDoctors,
  getDoctor,
  sendConnectionRequest,
  getConnectionStatus,
  getPatientPendingRequests,
  getPatientConnections,
  cancelConnectionRequest,
  getDoctorRequests,
  getDoctorConnections,
  acceptConnectionRequest,
  rejectConnectionRequest,
  revokeConnection,
};
