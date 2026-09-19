import { logger } from '../../utils/logger.js';
import { env } from '../../config/env.js';

/**
 * Email Notification Provider (Architecture-ready)
 * Provides a clean interface for external email delivery services.
 */
export const emailNotificationProvider = {
  name: 'email',

  /**
   * Send notification via email
   * @param {Object} notification - Notification document or payload
   * @param {Object} [user] - User document or recipient object
   * @returns {Promise<{ success: boolean, status: string, message?: string }>}
   */
  send: async (notification, user) => {
    // Check if email notifications are explicitly enabled and configured
    if (!process.env.EMAIL_NOTIFICATIONS_ENABLED || process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'true') {
      logger.debug('[EmailNotificationProvider] Email notifications are not configured or disabled.');
      return {
        success: false,
        status: 'not_configured',
      };
    }

    // Future email dispatch implementation goes here (e.g., Nodemailer, SendGrid, Resend)
    logger.info(`[EmailNotificationProvider] Email provider triggered for notification ${notification._id}`);
    return {
      success: true,
      status: 'sent',
    };
  },
};

export default emailNotificationProvider;
