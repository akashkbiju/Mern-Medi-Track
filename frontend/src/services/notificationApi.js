import api from './api';

/**
 * Notification API Service Module
 * Connects with /api/notifications and /api/users/notification-preferences endpoints
 */

/**
 * Retrieve paginated notifications with optional filters
 * @param {Object} [params={}] - { page, limit, read, type }
 */
export const getNotifications = async (params = {}) => {
  const response = await api.get('/notifications', { params });
  return response.data;
};

/**
 * Retrieve recent unread notifications for bell dropdown
 * @param {number} [limit=10]
 */
export const getUnreadNotifications = async (limit = 10) => {
  const response = await api.get('/notifications/unread', { params: { limit } });
  return response.data;
};

/**
 * Retrieve active unread notification count
 */
export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/count');
  return response.data;
};

/**
 * Retrieve single notification details
 * @param {string} id - Notification ObjectId
 */
export const getNotification = async (id) => {
  const response = await api.get(`/notifications/${id}`);
  return response.data;
};

/**
 * Mark a single notification as read
 * @param {string} id - Notification ObjectId
 */
export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

/**
 * Mark a single notification as unread
 * @param {string} id - Notification ObjectId
 */
export const markNotificationAsUnread = async (id) => {
  const response = await api.patch(`/notifications/${id}/unread`);
  return response.data;
};

/**
 * Mark all unread notifications as read for current user
 */
export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

/**
 * Delete a single notification
 * @param {string} id - Notification ObjectId
 */
export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

/**
 * Delete all read notifications
 */
export const deleteReadNotifications = async () => {
  const response = await api.delete('/notifications/read');
  return response.data;
};

/**
 * Retrieve user's notification preferences
 */
export const getNotificationPreferences = async () => {
  const response = await api.get('/users/notification-preferences');
  return response.data;
};

/**
 * Update user's notification preferences
 * @param {Object} preferences - { medicationReminders, missedMedication, healthAlerts, doctorUpdates, reportReady, email, push }
 */
export const updateNotificationPreferences = async (preferences) => {
  const response = await api.patch('/users/notification-preferences', preferences);
  return response.data;
};

export default {
  getNotifications,
  getUnreadNotifications,
  getUnreadNotificationCount,
  getNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
};
