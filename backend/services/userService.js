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
};

export default userService;
