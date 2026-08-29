import { notificationService } from '../services/notificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get paginated list of notifications for authenticated user
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);

  return ApiResponse.success(
    res,
    'Notifications retrieved successfully',
    result,
    200
  );
});

/**
 * Get recent unread notifications for authenticated user
 * GET /api/notifications/unread
 */
export const getUnreadNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getUnreadNotifications(
    req.user.id,
    req.query.limit
  );

  return ApiResponse.success(
    res,
    'Unread notifications retrieved successfully',
    { notifications },
    200
  );
});

/**
 * Get count of unread notifications for authenticated user
 * GET /api/notifications/count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.countUnreadNotifications(req.user.id);

  return ApiResponse.success(
    res,
    'Unread count retrieved successfully',
    { unreadCount },
    200
  );
});

/**
 * Get single notification by ID
 * GET /api/notifications/:id
 */
export const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(
    req.user.id,
    req.params.id
  );

  return ApiResponse.success(
    res,
    'Notification retrieved successfully',
    { notification },
    200
  );
});

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user.id, req.params.id);

  return ApiResponse.success(
    res,
    'Notification marked as read',
    { notification },
    200
  );
});

/**
 * Mark a single notification as unread
 * PATCH /api/notifications/:id/unread
 */
export const markAsUnread = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsUnread(req.user.id, req.params.id);

  return ApiResponse.success(
    res,
    'Notification marked as unread',
    { notification },
    200
  );
});

/**
 * Mark all unread notifications as read for authenticated user
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);

  return ApiResponse.success(
    res,
    'All notifications marked as read',
    result,
    200
  );
});

/**
 * Delete a single notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.deleteNotification(
    req.user.id,
    req.params.id
  );

  return ApiResponse.success(
    res,
    'Notification deleted successfully',
    { notification },
    200
  );
});

/**
 * Delete all read notifications for authenticated user
 * DELETE /api/notifications/read
 */
export const deleteReadNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.deleteReadNotifications(req.user.id);

  return ApiResponse.success(
    res,
    'Read notifications deleted successfully',
    result,
    200
  );
});

export default {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
};
