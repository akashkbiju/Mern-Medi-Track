import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  protectedTest,
  patientTest,
  doctorTest,
  adminTest,
} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import {
  registerValidator,
  loginValidator,
} from '../validators/authValidator.js';

const router = express.Router();

/**
 * Authentication routes
 * POST /api/auth/register - Register new patient account
 * POST /api/auth/login    - Authenticate user & issue JWT
 * POST /api/auth/logout   - Logout & clear auth cookies
 * GET  /api/auth/me       - Retrieve authenticated user profile (Protected)
 */
router.post('/register', authLimiter, validate(registerValidator), register);
router.post('/login', authLimiter, validate(loginValidator), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);

/**
 * RBAC Verification Test Routes
 */
router.get('/protected-test', protect, protectedTest);
router.get('/patient-test', protect, authorizeRoles('patient'), patientTest);
router.get('/doctor-test', protect, authorizeRoles('doctor'), doctorTest);
router.get('/admin-test', protect, authorizeRoles('admin'), adminTest);

export default router;
