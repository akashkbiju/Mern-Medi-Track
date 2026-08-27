import api from './api';

/**
 * Health Analytics & Medication Adherence API Service
 * Communicates with /api/analytics endpoints
 */

/**
 * Fetch medication adherence score, counts, streak, and daily trend
 * @param {Object} [params={}] - { period: 'today'|'7d'|'30d'|'custom', startDate, endDate }
 */
export const getAdherenceSummary = async (params = {}) => {
  const response = await api.get('/analytics/adherence', { params });
  return response.data;
};

/**
 * Convenience helper for today's adherence
 */
export const getTodayAdherence = async () => {
  return getAdherenceSummary({ period: 'today' });
};

/**
 * Convenience helper for 7-day adherence
 */
export const getWeeklyAdherence = async () => {
  return getAdherenceSummary({ period: '7d' });
};

/**
 * Convenience helper for 30-day adherence
 */
export const getMonthlyAdherence = async () => {
  return getAdherenceSummary({ period: '30d' });
};

/**
 * Convenience helper for custom date range adherence
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export const getCustomAdherence = async (startDate, endDate) => {
  return getAdherenceSummary({ period: 'custom', startDate, endDate });
};

export default {
  getAdherenceSummary,
  getTodayAdherence,
  getWeeklyAdherence,
  getMonthlyAdherence,
  getCustomAdherence,
};
