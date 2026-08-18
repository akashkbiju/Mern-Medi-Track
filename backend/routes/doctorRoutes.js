import express from 'express';
import { getDoctors, connectDoctor } from '../controllers/doctorController.js';
import { validate } from '../middleware/validateMiddleware.js';
import { doctorConnectionValidator } from '../validators/doctorValidator.js';

const router = express.Router();

/**
 * Doctor Connectivity RESTful endpoints foundation
 * GET  /api/doctors
 * POST /api/doctors/connect
 */
router.get('/', getDoctors);
router.post('/connect', validate(doctorConnectionValidator), connectDoctor);

export default router;
