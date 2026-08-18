import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimitMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';

const router = express.Router();

/**
 * Authentication routes foundation (Step 4 preview)
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 */
router.post('/register', authLimiter, validate(registerValidator), register);
router.post('/login', authLimiter, validate(loginValidator), login);
router.get('/me', getMe);

export default router;
