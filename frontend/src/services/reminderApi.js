import api from './api';

/**
 * Reminder API Client Module
 * Communicates with /api/reminders REST endpoints
 */

/**
 * Retrieve today's medication reminders for the current user
 */
export const getTodayReminders = async () => {
  const response = await api.get('/reminders/today');
  return response.data;
};

/**
 * Retrieve upcoming medication reminders within a lookahead window
 * @param {number} [hours=24] - Lookahead window in hours
 */
export const getUpcomingReminders = async (hours = 24) => {
  const response = await api.get('/reminders/upcoming', { params: { hours } });
  return response.data;
};

/**
 * Query user's reminder history with optional filtering
 * @param {Object} [params={}] - { date: 'YYYY-MM-DD', isRead: boolean, medicineId: string, page: number, limit: number }
 */
export const getReminders = async (params = {}) => {
  const response = await api.get('/reminders', { params });
  return response.data;
};

/**
 * Mark a reminder as read
 * @param {string} id - Reminder ObjectId
 */
export const markReminderAsRead = async (id) => {
  const response = await api.patch(`/reminders/${id}/read`);
  return response.data;
};

/**
 * Trigger reminder synchronization / generation cycle
 * @param {Object} [data={}] - { lookaheadMinutes, recoveryMinutes }
 */
export const processReminders = async (data = {}) => {
  const response = await api.post('/reminders/process', data);
  return response.data;
};

export default {
  getTodayReminders,
  getUpcomingReminders,
  getReminders,
  markReminderAsRead,
  processReminders,
};
