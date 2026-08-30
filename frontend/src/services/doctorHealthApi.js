import api from './api';

/**
 * Doctor Health Records API Service
 * Handles doctor access to connected patient health data.
 * All doctor identification is resolved strictly on the backend via JWT token.
 */

/**
 * Retrieve paginated health records for a connected patient
 *
 * @param {string} patientId - Target patient MongoDB ObjectId
 * @param {Object} [params] - Query parameters (page, limit, startDate, endDate, metric)
 * @returns {Promise<Object>} API response with patient info, records array, and pagination
 */
export const getPatientHealthRecords = async (patientId, params = {}) => {
  const response = await api.get(`/doctors/patients/${patientId}/health-records`, {
    params,
  });
  return response.data;
};

/**
 * Retrieve concise health summary for a connected patient
 *
 * @param {string} patientId - Target patient MongoDB ObjectId
 * @returns {Promise<Object>} API response with latest metric values and record count
 */
export const getPatientHealthSummary = async (patientId) => {
  const response = await api.get(`/doctors/patients/${patientId}/health-summary`);
  return response.data;
};

/**
 * Retrieve trend analytics for a connected patient
 *
 * @param {string} patientId - Target patient MongoDB ObjectId
 * @param {Object} [params] - Query parameters (metric, period, startDate, endDate)
 * @returns {Promise<Object>} API response with trend time series and statistical summary
 */
export const getPatientHealthAnalytics = async (patientId, params = {}) => {
  const response = await api.get(`/doctors/patients/${patientId}/health-analytics`, {
    params,
  });
  return response.data;
};

/**
 * Retrieve connection metadata and authorization context for doctor-patient pair
 *
 * @param {string} patientId - Target patient MongoDB ObjectId
 * @returns {Promise<Object>} API response with connection status and permissions
 */
export const getPatientContext = async (patientId) => {
  const response = await api.get(`/doctors/patients/${patientId}/context`);
  return response.data;
};

export default {
  getPatientHealthRecords,
  getPatientHealthSummary,
  getPatientHealthAnalytics,
  getPatientContext,
};
