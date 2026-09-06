import api from './api';

/**
 * Dashboard API Service
 * Provides aggregated telemetry for role-specific dashboards.
 */

/**
 * Fetch patient dashboard consolidated data
 * GET /api/dashboard/patient
 *
 * @returns {Promise<Object>} API response containing medication, vitals, doctors, reports, notifications
 */
export const getPatientDashboard = async () => {
  const response = await api.get('/dashboard/patient');
  return response.data;
};

/**
 * Fetch doctor dashboard consolidated data
 * GET /api/dashboard/doctor
 *
 * @returns {Promise<Object>} API response containing profile, patient roster, notes, notifications
 */
export const getDoctorDashboard = async () => {
  const response = await api.get('/dashboard/doctor');
  return response.data;
};

export default {
  getPatientDashboard,
  getDoctorDashboard,
};
