import api from './api';

/**
 * Health Reports API Client
 * Interfaces with backend structured health report endpoints
 */

/**
 * Generate a new structured health report
 * POST /api/reports/generate
 *
 * @param {Object} data - { reportType: 'weekly' | 'monthly' | 'custom', startDate?, endDate? }
 * @returns {Promise<Object>} API response with generated HealthReport
 */
export const generateReport = async (data) => {
  const response = await api.post('/reports/generate', data);
  return response.data;
};

/**
 * Retrieve paginated reports for authenticated patient
 * GET /api/reports
 *
 * @param {Object} [params] - { page, limit, reportType }
 * @returns {Promise<Object>} API response with reports array and pagination
 */
export const getReports = async (params = {}) => {
  const response = await api.get('/reports', { params });
  return response.data;
};

/**
 * Retrieve latest generated report for authenticated patient
 * GET /api/reports/latest
 *
 * @returns {Promise<Object>} API response with latest HealthReport
 */
export const getLatestReport = async () => {
  const response = await api.get('/reports/latest');
  return response.data;
};

/**
 * Retrieve single report by ID (Patient or authorized Doctor)
 * GET /api/reports/:id
 *
 * @param {string} reportId - Report ObjectId
 * @returns {Promise<Object>} API response with HealthReport
 */
export const getReportById = async (reportId) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

export default {
  generateReport,
  getReports,
  getLatestReport,
  getReportById,
};
