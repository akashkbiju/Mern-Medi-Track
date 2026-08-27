import api from './api';

/**
 * Health Records API Service
 * Communicates with /api/health-records endpoints
 */

/**
 * Create a new health measurement record
 * @param {Object} data - { recordDate, weight, bloodPressure, bloodSugar, heartRate, temperature, notes }
 */
export const createHealthRecord = async (data) => {
  const response = await api.post('/health-records', data);
  return response.data;
};

/**
 * Retrieve paginated health records with optional filters
 * @param {Object} [params={}] - { page, limit, date, startDate, endDate, type }
 */
export const getHealthRecords = async (params = {}) => {
  const response = await api.get('/health-records', { params });
  return response.data;
};

/**
 * Retrieve a single health record by its ID
 * @param {string} id - HealthRecord ObjectId
 */
export const getHealthRecord = async (id) => {
  const response = await api.get(`/health-records/${id}`);
  return response.data;
};

/**
 * Update an existing health record
 * @param {string} id - HealthRecord ObjectId
 * @param {Object} data - Updated fields
 */
export const updateHealthRecord = async (id, data) => {
  const response = await api.patch(`/health-records/${id}`, data);
  return response.data;
};

/**
 * Delete a health record
 * @param {string} id - HealthRecord ObjectId
 */
export const deleteHealthRecord = async (id) => {
  const response = await api.delete(`/health-records/${id}`);
  return response.data;
};

export default {
  createHealthRecord,
  getHealthRecords,
  getHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
};
