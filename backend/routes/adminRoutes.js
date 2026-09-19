import express from 'express';
import { verifyDoctor } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes in this file require authentication and 'admin' role
router.use(protect);
router.use(authorizeRoles('admin'));

/**
 * @route   PUT /api/admin/doctors/:id/verify
 * @desc    Verify a doctor's profile
 * @access  Private/Admin
 */
router.put('/doctors/:id/verify', verifyDoctor);

export default router;
