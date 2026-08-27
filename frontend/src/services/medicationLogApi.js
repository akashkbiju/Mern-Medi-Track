import api from './api';

/**
 * Medication Log API Client Module
 * Communicates with /api/medication-logs REST endpoints
 */

/**
 * Retrieve today's medication dose logs and progress statistics
 */
export const getTodayMedicationLogs = async () => {
  const response = await api.get('/medication-logs/today');
  return response.data;
};

/**
 * Query medication dose logs history with optional filters
 * @param {Object} [params={}] - { date, startDate, endDate, status, medicineId, page, limit }
 */
export const getMedicationLogs = async (params = {}) => {
  const response = await api.get('/medication-logs', { params });
  return response.data;
};

/**
 * Fetch a single medication log by its ID
 * @param {string} id - MedicationLog ObjectId
 */
export const getMedicationLog = async (id) => {
  const response = await api.get(`/medication-logs/${id}`);
  return response.data;
};

/**
 * Mark a scheduled medication dose as taken
 * @param {string} id - MedicationLog ObjectId
 * @param {string} [notes] - Optional patient notes
 */
export const markMedicationTaken = async (id, notes = '') => {
  const response = await api.patch(`/medication-logs/${id}/taken`, { notes });
  return response.data;
};

/**
 * Mark a scheduled medication dose as skipped
 * @param {string} id - MedicationLog ObjectId
 * @param {string} [notes] - Optional reason for skipping
 */
export const markMedicationSkipped = async (id, notes = '') => {
  const response = await api.patch(`/medication-logs/${id}/skipped`, { notes });
  return response.data;
};

export default {
  getTodayMedicationLogs,
  getMedicationLogs,
  getMedicationLog,
  markMedicationTaken,
  markMedicationSkipped,
};
