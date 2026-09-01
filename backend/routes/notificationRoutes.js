import express from 'express';
import {
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  getNotificationsValidator,
  notificationIdValidator,
} from '../validators/notificationValidator.js';

const router = express.Router();

/**
 * All notification endpoints require authenticated user session
 */
router.use(protect);

// 1. Static subpaths first to prevent conflict with :id param
// GET /api/notifications/count - Unread badge count
router.get('/count', getUnreadCount);

// GET /api/notifications/unread - Recent unread list
router.get('/unread', getUnreadNotifications);

// PATCH /api/notifications/read-all - Mark all unread as read
router.patch('/read-all', markAllAsRead);

// DELETE /api/notifications/read - Delete all read notifications
router.delete('/read', deleteReadNotifications);

// 2. Collection root route
// GET /api/notifications - Paginated notification history with filtering
router.get('/', validate(getNotificationsValidator), getNotifications);

// 3. Resource ID routes (:id)
// GET /api/notifications/:id - Single notification details
router.get('/:id', validate(notificationIdValidator), getNotificationById);

// PATCH /api/notifications/:id/read - Mark single as read
router.patch('/:id/read', validate(notificationIdValidator), markAsRead);

// PATCH /api/notifications/:id/unread - Mark single as unread
router.patch('/:id/unread', validate(notificationIdValidator), markAsUnread);

// DELETE /api/notifications/:id - Delete single notification
router.delete('/:id', validate(notificationIdValidator), deleteNotification);

export default router;
