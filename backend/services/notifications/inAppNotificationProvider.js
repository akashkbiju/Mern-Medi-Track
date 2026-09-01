import { logger } from '../../utils/logger.js';

/**
 * In-App Notification Provider
 * Manages in-application notification delivery.
 */
export const inAppNotificationProvider = {
  name: 'in_app',

  /**
   * Deliver an in-app notification
   * @param {Object} notification - Mongoose Notification document or data object
   * @returns {Promise<{ success: boolean, channel: string }>}
   */
  send: async (notification) => {
    logger.debug(`[InAppNotificationProvider] Delivered in-app notification ${notification._id || notification.id}`);
    return {
      success: true,
      channel: 'in_app',
    };
  },
};

export default inAppNotificationProvider;
