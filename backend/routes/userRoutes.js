import express from 'express';
import { getAllUsers, getUserById } from '../controllers/userController.js';

const router = express.Router();

/**
 * User management routes foundation
 * GET /api/users
 * GET /api/users/:id
 */
router.get('/', getAllUsers);
router.get('/:id', getUserById);

export default router;
