import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

/**
 * User Service
 * Encapsulates profile retrieval, updates, and user management logic
 */
export const userService = {
  /**
   * Retrieve current authenticated user's private profile
   * @param {string} userId - Authenticated user ID (from req.user.id)
   * @returns {Promise<Object>} Sanitized user profile
   */
  getProfile: async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    return sanitizeUser(user);
  },

  /**
   * Update current authenticated user's profile with allowed fields
   * @param {string} userId - Authenticated user ID (from req.user.id)
   * @param {Object} profileData - Incoming profile payload
   * @returns {Promise<Object>} Sanitized updated user profile
   */
  updateProfile: async (userId, profileData = {}) => {
    // 1. Find the authenticated user
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User profile not found');
    }

    // 2. Confirm account is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    // 3. Explicitly extract and sanitize ONLY permitted fields (blocks operator injection)
    const { fullName, phone, dateOfBirth, gender, emergencyContact, profileImage } = profileData;

    if (fullName !== undefined) {
      user.fullName = fullName.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (dateOfBirth !== undefined) {
      user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (gender !== undefined) {
      user.gender = gender;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    // Explicitly update structured emergency contact fields
    if (emergencyContact !== undefined) {
      if (typeof emergencyContact === 'object' && emergencyContact !== null) {
        user.emergencyContact = {
          name: emergencyContact.name ? emergencyContact.name.trim() : '',
          relationship: emergencyContact.relationship ? emergencyContact.relationship.trim() : '',
          phone: emergencyContact.phone ? emergencyContact.phone.trim() : '',
        };
      } else if (typeof emergencyContact === 'string') {
        user.emergencyContact = {
          name: '',
          relationship: '',
          phone: emergencyContact.trim(),
        };
      }
    }

    // 4. Save the user document
    await user.save();

    // 5. Return sanitized user profile
    return sanitizeUser(user);
  },

  /**
   * Get all users (Admin directory lookup)
   * @returns {Promise<Array>} Array of sanitized user profiles
   */
  getAllUsers: async () => {
    const users = await User.find();
    return users.map(sanitizeUser);
  },

  /**
   * Lookup single user by ID
   * @param {string} userId
   * @returns {Promise<Object>} Sanitized user profile
   */
  getUserById: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return sanitizeUser(user);
  },

  /**
   * Retrieve notification preferences for authenticated user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  getNotificationPreferences: async (userId) => {
    const user = await User.findById(userId).select('notificationPreferences isActive');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive');
    }

    return (
      user.notificationPreferences || {
        medicationReminders: true,
        missedMedication: true,
        healthAlerts: true,
        doctorUpdates: true,
        reportReady: true,
        email: false,
        push: false,
      }
    );
  },

  /**
   * Update notification preferences for authenticated user
   * Strict validation ensuring only allowed boolean preferences can be modified
   * @param {string} userId
   * @param {Object} preferences
   * @returns {Promise<Object>}
   */
  updateNotificationPreferences: async (userId, preferences = {}) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive');
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        medicationReminders: true,
        missedMedication: true,
        healthAlerts: true,
        doctorUpdates: true,
        reportReady: true,
        email: false,
        push: false,
      };
    }

    const allowedKeys = [
      'medicationReminders',
      'missedMedication',
      'healthAlerts',
      'doctorUpdates',
      'reportReady',
      'email',
      'push',
    ];

    for (const key of Object.keys(preferences)) {
      if (allowedKeys.includes(key)) {
        if (typeof preferences[key] !== 'boolean') {
          throw new ApiError(400, `Preference '${key}' must be a boolean value`);
        }
        user.notificationPreferences[key] = preferences[key];
      }
    }

    await user.save();
    return user.notificationPreferences;
  },
};

export default userService;
