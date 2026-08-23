import express from 'express';
import {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { updateProfileValidator } from '../validators/userValidator.js';

const router = express.Router();

/**
 * User profile routes (Protected)
 * GET /api/users/profile - Access own profile via req.user.id
 * PUT /api/users/profile - Update own profile with strict field validation
 */
router.get('/profile', protect, getProfile);
router.put('/profile', protect, validate(updateProfileValidator), updateProfile);

/**
 * Administrative & User Directory routes
 * GET /api/users     - Admin only
 * GET /api/users/:id - Protected user lookup
 */
router.get('/', protect, authorizeRoles('admin'), getAllUsers);
router.get('/:id', protect, getUserById);

export default router;
