import express from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateProfileValidator } from '../validators/userValidator.js';
import { updatePreferencesValidator } from '../validators/notificationValidator.js';

const router = express.Router();

/**
 * User profile routes (Protected)
 * GET /api/users/profile - Access own profile via req.user.id
 * PUT /api/users/profile - Update own profile with strict field validation
 */
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileValidator), updateProfile);

/**
 * User Notification Preferences (Protected)
 * GET /api/users/notification-preferences
 * PATCH /api/users/notification-preferences
 */
router.get('/notification-preferences', protect, getNotificationPreferences);
router.patch(
  '/notification-preferences',
  protect,
  validate(updatePreferencesValidator),
  updateNotificationPreferences
);

/**
 * Administrative & User Directory routes
 * GET /api/users     - Admin only
 * GET /api/users/:id - Protected user lookup
 */
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.get('/:id', protect, getUserById);

export default router;
