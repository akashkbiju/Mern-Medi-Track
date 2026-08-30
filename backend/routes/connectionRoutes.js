import express from 'express';
import {
  sendRequest,
  getStatus,
  getPatientPending,
  getPatientConnected,
  cancelRequest,
  getDoctorRequests,
  getDoctorConnected,
  acceptRequest,
  rejectRequest,
  revoke,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { validate } from '../middleware/validateMiddleware.js';
import {
  sendConnectionRequestValidator,
  connectionIdParamValidator,
  doctorIdParamValidator,
} from '../validators/connectionValidator.js';

const router = express.Router();

// All connection routes require authentication
router.use(protect);

/**
 * Patient Connection Operations
 */
router.post(
  '/',
  authorizeRoles('patient'),
  validate(sendConnectionRequestValidator),
  sendRequest
);

router.get(
  '/status/:doctorId',
  authorizeRoles('patient'),
  validate(doctorIdParamValidator),
  getStatus
);

router.get('/patient/pending', authorizeRoles('patient'), getPatientPending);
router.get('/patient/connected', authorizeRoles('patient'), getPatientConnected);

router.patch(
  '/:id/cancel',
  authorizeRoles('patient'),
  validate(connectionIdParamValidator),
  cancelRequest
);

/**
 * Doctor Connection Operations
 */
router.get('/doctor/requests', authorizeRoles('doctor'), getDoctorRequests);
router.get('/doctor/connected', authorizeRoles('doctor'), getDoctorConnected);

router.patch(
  '/:id/accept',
  authorizeRoles('doctor'),
  validate(connectionIdParamValidator),
  acceptRequest
);

router.patch(
  '/:id/reject',
  authorizeRoles('doctor'),
  validate(connectionIdParamValidator),
  rejectRequest
);

/**
 * Shared Connection Operations (Callable by either connected party with ownership check)
 */
router.patch(
  '/:id/revoke',
  authorizeRoles('patient', 'doctor'),
  validate(connectionIdParamValidator),
  revoke
);

export default router;
