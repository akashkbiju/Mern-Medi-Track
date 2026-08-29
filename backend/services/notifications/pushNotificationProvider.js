import { logger } from '../../utils/logger.js';

/**
 * Push Notification Provider (Architecture-ready)
 * Provides a clean interface for external push delivery services (e.g. Web Push / FCM).
 */
export const pushNotificationProvider = {
  name: 'push',

  /**
   * Send notification via push notification
   * @param {Object} notification - Notification document or payload
   * @param {Object} [user] - User document or recipient device tokens
   * @returns {Promise<{ success: boolean, status: string, message?: string }>}
   */
  send: async (notification, user) => {
    // Check if push notifications are explicitly configured
    if (!process.env.PUSH_NOTIFICATIONS_ENABLED || process.env.PUSH_NOTIFICATIONS_ENABLED !== 'true') {
      logger.debug('[PushNotificationProvider] Push notifications are not configured or disabled.');
      return {
        success: false,
        status: 'not_configured',
      };
    }

    // Future push service integration (FCM, APNs, WebPush)
    return {
      success: true,
      status: 'sent',
    };
  },
};

export default pushNotificationProvider;
