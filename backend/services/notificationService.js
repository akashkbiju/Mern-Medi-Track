import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { inAppNotificationProvider } from './notifications/inAppNotificationProvider.js';
import { emailNotificationProvider } from './notifications/emailNotificationProvider.js';
import { pushNotificationProvider } from './notifications/pushNotificationProvider.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Core Notification Service
 * Manages notification storage, multi-channel dispatch, preference filtering,
 * read state updates, and idempotency guarantees.
 */
export const notificationService = {
  /**
   * Create and dispatch a server-controlled notification
   *
   * @param {Object} data - Notification creation payload
   * @param {string|mongoose.Types.ObjectId} data.user - Recipient User ID
   * @param {string} data.type - Controlled type enum
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification body text
   * @param {string|mongoose.Types.ObjectId} [data.relatedMedicine] - Optional Medicine ID
   * @param {Date} [data.scheduledFor] - Scheduled dose timestamp
   * @param {string} [data.channel='in_app'] - Primary channel
   * @param {string} [data.priority='normal'] - Priority (low, normal, high)
   * @param {Object} [data.metadata={}] - Flexible context metadata
   * @param {Date} [data.expiresAt] - Optional expiration date
   * @returns {Promise<{ notification: Object, created: boolean, reason?: string }>}
   */
  createNotification: async (data) => {
    const {
      user: userId,
      type,
      title,
      message,
      relatedMedicine,
      scheduledFor,
      channel = 'in_app',
      priority = 'normal',
      metadata = {},
      expiresAt,
    } = data;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Valid user ID is required to create a notification');
    }

    if (!title || typeof title !== 'string') {
      throw new ApiError(400, 'Notification title is required');
    }

    if (!message || typeof message !== 'string') {
      throw new ApiError(400, 'Notification message is required');
    }

    // 1. Check user preferences to determine if notification type should be generated
    const user = await User.findById(userId).select('notificationPreferences email fullName');
    if (!user) {
      throw new ApiError(404, 'Notification recipient user not found');
    }

    const prefs = user.notificationPreferences || {};

    if (type === 'medication_reminder' && prefs.medicationReminders === false) {
      logger.debug(`[NotificationService] Suppressed reminder for user ${userId} per preferences.`);
      return { notification: null, created: false, reason: 'preference_disabled' };
    }

    if (type === 'missed_medication' && prefs.missedMedication === false) {
      logger.debug(`[NotificationService] Suppressed missed notification for user ${userId} per preferences.`);
      return { notification: null, created: false, reason: 'preference_disabled' };
    }

    if (type === 'health_alert' && prefs.healthAlerts === false) {
      return { notification: null, created: false, reason: 'preference_disabled' };
    }

    if (
      ['doctor_request', 'doctor_approved', 'doctor_rejected'].includes(type) &&
      prefs.doctorUpdates === false
    ) {
      return { notification: null, created: false, reason: 'preference_disabled' };
    }

    if (type === 'report_ready' && prefs.reportReady === false) {
      return { notification: null, created: false, reason: 'preference_disabled' };
    }

    // 2. Deduplication check (Idempotency)
    if (type === 'medication_reminder' && relatedMedicine && scheduledFor) {
      const existing = await Notification.findOne({
        user: userId,
        type: 'medication_reminder',
        relatedMedicine,
        scheduledFor,
        channel,
      }).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

      if (existing) {
        return { notification: existing, created: false, reason: 'already_exists' };
      }
    }

    if (type === 'missed_medication' && metadata?.logId) {
      const existingMissed = await Notification.findOne({
        user: userId,
        type: 'missed_medication',
        'metadata.logId': metadata.logId.toString(),
      });

      if (existingMissed) {
        return { notification: existingMissed, created: false, reason: 'already_exists' };
      }
    }

    // 3. Create document in database
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title: title.trim(),
        message: message.trim(),
        relatedMedicine: relatedMedicine || null,
        scheduledFor: scheduledFor || null,
        channel,
        priority,
        metadata,
        expiresAt: expiresAt || null,
        isRead: false,
        sentAt: new Date(),
      });

      // 4. Multi-channel dispatch through provider abstraction
      await notificationService.sendNotification(notification, user);

      const populated = await Notification.findById(notification._id).populate(
        'relatedMedicine',
        'name genericName dosage dosageUnit instructions'
      );

      return { notification: populated, created: true };
    } catch (err) {
      // Handle race condition or duplicate key error gracefully
      if (err.code === 11000) {
        const raceExisting = await Notification.findOne({
          user: userId,
          type,
          relatedMedicine,
          scheduledFor,
          channel,
        }).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

        if (raceExisting) {
          return { notification: raceExisting, created: false, reason: 'duplicate_key_handled' };
        }
      }
      throw err;
    }
  },

  /**
   * Dispatch notification to configured providers
   *
   * @param {Object} notification - Notification document
   * @param {Object} [user] - Recipient user document
   */
  sendNotification: async (notification, user) => {
    // 1. In-App Provider (always runs for in_app notifications)
    if (!notification.channel || notification.channel === 'in_app') {
      await inAppNotificationProvider.send(notification);
    }

    // 2. Email Provider (if user has enabled email preferences)
    if (user?.notificationPreferences?.email) {
      await emailNotificationProvider.send(notification, user);
    }

    // 3. Push Provider (if user has enabled push preferences)
    if (user?.notificationPreferences?.push) {
      await pushNotificationProvider.send(notification, user);
    }
  },

  /**
   * Retrieve paginated notifications for the authenticated user
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} [options={}] - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Records per page (max 50)
   * @param {string|boolean} [options.read] - Filter by read status
   * @param {string} [options.type] - Filter by notification type
   */
  getUserNotifications: async (userId, options = {}) => {
    const page = Math.max(1, parseInt(options.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {
      user: userId,
      // Filter out expired notifications
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    };

    if (options.read !== undefined && options.read !== '') {
      query.isRead = options.read === true || options.read === 'true';
    }

    if (options.type && typeof options.type === 'string' && options.type.trim()) {
      const allowedTypes = [
        'medication_reminder',
        'missed_medication',
        'health_alert',
        'doctor_request',
        'doctor_approved',
        'doctor_rejected',
        'report_ready',
        'system',
      ];
      if (allowedTypes.includes(options.type.trim())) {
        query.type = options.type.trim();
      }
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedMedicine', 'name genericName dosage dosageUnit instructions frequency')
        .lean(),
      Notification.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Retrieve recent unread notifications for notification bell dropdown
   *
   * @param {string} userId - Authenticated user ID
   * @param {number} [limit=10] - Maximum items to retrieve
   */
  getUnreadNotifications: async (userId, limit = 10) => {
    const safeLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));

    const notifications = await Notification.find({
      user: userId,
      isRead: false,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .populate('relatedMedicine', 'name genericName dosage dosageUnit instructions')
      .lean();

    return notifications;
  },

  /**
   * Count active unread notifications for badge display
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<number>}
   */
  countUnreadNotifications: async (userId) => {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });

    return count;
  },

  /**
   * Retrieve single notification by ID ensuring user ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} notificationId - Notification ObjectId
   */
  getNotificationById: async (userId, notificationId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, 'Invalid notification ID format');
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    }).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

    if (!notification) {
      throw new ApiError(404, 'Notification not found or access denied');
    }

    return notification;
  },

  /**
   * Mark a single notification as read
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} notificationId - Notification ObjectId
   */
  markAsRead: async (userId, notificationId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, 'Invalid notification ID format');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } },
      { new: true }
    ).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

    if (!notification) {
      throw new ApiError(404, 'Notification not found or access denied');
    }

    return notification;
  },

  /**
   * Mark a single notification as unread
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} notificationId - Notification ObjectId
   */
  markAsUnread: async (userId, notificationId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, 'Invalid notification ID format');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: false } },
      { new: true }
    ).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

    if (!notification) {
      throw new ApiError(404, 'Notification not found or access denied');
    }

    return notification;
  },

  /**
   * Mark all unread notifications as read for authenticated user
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<{ modifiedCount: number }>}
   */
  markAllAsRead: async (userId) => {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return {
      modifiedCount: result.modifiedCount || 0,
    };
  },

  /**
   * Delete a single notification ensuring ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} notificationId - Notification ObjectId
   */
  deleteNotification: async (userId, notificationId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new ApiError(400, 'Invalid notification ID format');
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new ApiError(404, 'Notification not found or access denied');
    }

    return notification;
  },

  /**
   * Bulk delete read notifications for authenticated user
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<{ deletedCount: number }>}
   */
  deleteReadNotifications: async (userId) => {
    const result = await Notification.deleteMany({
      user: userId,
      isRead: true,
    });

    return {
      deletedCount: result.deletedCount || 0,
    };
  },
};

export default notificationService;
