import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Helper to escape regex special characters to prevent regex injection
 */
const escapeRegex = (string = '') => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Doctor-Patient Connection Service
 * Enforces explicit connection workflows, role-based ownership, duplicate checks,
 * state machine transitions, and notification dispatch.
 */
export const connectionService = {
  /**
   * Search for doctors eligible for patient connection
   *
   * @param {Object} queryParams
   * @param {string} [queryParams.search]
   * @param {string} [queryParams.specialization]
   * @param {string} [queryParams.hospital]
   * @param {number} [queryParams.page=1]
   * @param {number} [queryParams.limit=10]
   * @returns {Promise<{ doctors: Array, pagination: Object }>}
   */
  searchDoctors: async ({ search, specialization, hospital, page = 1, limit = 10 } = {}) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // 1. Build DoctorProfile query filters
    const profileFilter = {};
    if (specialization && typeof specialization === 'string') {
      profileFilter.specialization = { $regex: new RegExp(escapeRegex(specialization.trim()), 'i') };
    }
    if (hospital && typeof hospital === 'string') {
      profileFilter.hospital = { $regex: new RegExp(escapeRegex(hospital.trim()), 'i') };
    }

    // 2. Fetch all DoctorProfiles matching profile filters
    const matchingProfiles = await DoctorProfile.find(profileFilter).lean();
    const userIds = matchingProfiles.map((p) => p.user);

    // 3. Build User query filters (role = doctor, isActive = true, userIds from matching profiles)
    const userFilter = {
      _id: { $in: userIds },
      role: 'doctor',
      isActive: true,
    };

    if (search && typeof search === 'string') {
      const sanitizedSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitizedSearch, 'i');

      // Check if search matches doctor's name or any profile's specialization/hospital
      const profilesMatchingSearch = matchingProfiles.filter(
        (p) =>
          (p.specialization && searchRegex.test(p.specialization)) ||
          (p.hospital && searchRegex.test(p.hospital))
      );
      const searchUserIds = profilesMatchingSearch.map((p) => p.user.toString());

      userFilter.$or = [
        { fullName: searchRegex },
        { _id: { $in: searchUserIds } },
      ];
    }

    const total = await User.countDocuments(userFilter);
    const doctors = await User.find(userFilter)
      .select('fullName email createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // 4. Map user records with profile information
    const profileMap = new Map(matchingProfiles.map((p) => [p.user.toString(), p]));

    const formattedDoctors = doctors.map((doc) => {
      const profile = profileMap.get(doc._id.toString()) || {};
      return {
        id: doc._id.toString(),
        fullName: doc.fullName,
        specialization: profile.specialization || '',
        hospital: profile.hospital || '',
        experience: profile.experience,
        bio: profile.bio || '',
        isVerified: Boolean(profile.isVerified),
        consultationInfo: profile.consultationInfo || '',
      };
    });

    // Sort: verified doctors first, then by experience/createdAt
    formattedDoctors.sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return (b.experience || 0) - (a.experience || 0);
    });

    return {
      doctors: formattedDoctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get safe doctor professional profile by doctor ID
   *
   * @param {string} doctorId - Target physician User ID
   * @returns {Promise<Object>} Safe doctor details
   */
  getDoctorById: async (doctorId) => {
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, 'Invalid doctor ID format');
    }

    const doctorUser = await User.findById(doctorId).select('fullName email isActive role createdAt');
    if (!doctorUser || doctorUser.role !== 'doctor' || !doctorUser.isActive) {
      throw new ApiError(404, 'Doctor not found or inactive');
    }

    const doctorProfile = await DoctorProfile.findOne({ user: doctorId }).lean();
    if (!doctorProfile) {
      throw new ApiError(404, 'Doctor profile details not found');
    }

    return {
      id: doctorUser._id.toString(),
      fullName: doctorUser.fullName,
      specialization: doctorProfile.specialization || '',
      hospital: doctorProfile.hospital || '',
      experience: doctorProfile.experience,
      bio: doctorProfile.bio || '',
      isVerified: Boolean(doctorProfile.isVerified),
      consultationInfo: doctorProfile.consultationInfo || '',
      createdAt: doctorUser.createdAt,
    };
  },

  /**
   * Send a connection request from a patient to a doctor
   *
   * @param {string} patientId - Authenticated patient ID
   * @param {string} doctorId - Target physician User ID
   * @returns {Promise<Object>} Connection document
   */
  sendConnectionRequest: async (patientId, doctorId) => {
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, 'Valid doctor ID is required');
    }

    if (patientId.toString() === doctorId.toString()) {
      throw new ApiError(400, 'You cannot connect with yourself');
    }

    // 1. Verify requester is an active patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient' || !patient.isActive) {
      throw new ApiError(403, 'Only active patients can send doctor connection requests');
    }

    // 2. Verify target is an active doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
      throw new ApiError(404, 'Target doctor does not exist or is inactive');
    }

    // 3. Check for existing connection between this patient and doctor
    let connection = await DoctorPatientConnection.findOne({
      doctor: doctorId,
      patient: patientId,
    });

    if (connection) {
      if (connection.status === 'pending') {
        throw new ApiError(409, 'A connection request is already pending with this doctor');
      }
      if (connection.status === 'approved') {
        throw new ApiError(409, 'You are already connected with this doctor');
      }

      // If rejected or revoked, re-initiate connection request
      connection.status = 'pending';
      connection.requestedBy = patientId;
      connection.requestedAt = new Date();
      connection.approvedAt = undefined;
      connection.revokedAt = undefined;
      await connection.save();
    } else {
      // Create new connection document
      connection = await DoctorPatientConnection.create({
        doctor: doctorId,
        patient: patientId,
        requestedBy: patientId,
        status: 'pending',
        permissions: {
          medications: false,
          healthRecords: false,
          reports: false,
        },
        requestedAt: new Date(),
      });
    }

    // 4. Dispatch notification to doctor via notificationService
    try {
      await notificationService.createNotification({
        user: doctorId,
        type: 'doctor_request',
        title: 'New Doctor Connection Request',
        message: `${patient.fullName} has requested to connect with you.`,
        channel: 'in_app',
        priority: 'normal',
        metadata: {
          connectionId: connection._id.toString(),
          patientId: patientId.toString(),
        },
      });
    } catch (notifErr) {
      logger.warn(`[ConnectionService] Non-critical notification failed: ${notifErr.message}`);
    }

    return connection;
  },

  /**
   * Get relationship status between authenticated patient and specific doctor
   *
   * @param {string} patientId - Authenticated patient ID
   * @param {string} doctorId - Target physician User ID
   * @returns {Promise<{ status: string, connectionId: string|null }>}
   */
  getConnectionStatus: async (patientId, doctorId) => {
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, 'Invalid doctor ID format');
    }

    const connection = await DoctorPatientConnection.findOne({
      doctor: doctorId,
      patient: patientId,
    }).lean();

    if (!connection) {
      return { status: 'none', connectionId: null };
    }

    return {
      status: connection.status,
      connectionId: connection._id.toString(),
    };
  },

  /**
   * Get patient's pending connection requests
   *
   * @param {string} patientId - Authenticated patient ID
   * @returns {Promise<Array>} List of pending requests with doctor details
   */
  getPatientPendingRequests: async (patientId) => {
    const connections = await DoctorPatientConnection.find({
      patient: patientId,
      status: 'pending',
    })
      .sort({ requestedAt: -1 })
      .populate('doctor', 'fullName email')
      .lean();

    const doctorIds = connections.map((c) => c.doctor?._id);
    const profiles = await DoctorProfile.find({ user: { $in: doctorIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    return connections.map((conn) => {
      const docProfile = profileMap.get(conn.doctor?._id?.toString()) || {};
      return {
        id: conn._id.toString(),
        status: conn.status,
        requestedAt: conn.requestedAt,
        doctor: {
          id: conn.doctor?._id?.toString(),
          fullName: conn.doctor?.fullName || 'Doctor',
          specialization: docProfile.specialization || '',
          hospital: docProfile.hospital || '',
          experience: docProfile.experience,
          isVerified: Boolean(docProfile.isVerified),
        },
      };
    });
  },

  /**
   * Get patient's approved/connected doctors
   *
   * @param {string} patientId - Authenticated patient ID
   * @returns {Promise<Array>} List of connected doctors
   */
  getPatientConnections: async (patientId) => {
    const connections = await DoctorPatientConnection.find({
      patient: patientId,
      status: 'approved',
    })
      .sort({ approvedAt: -1 })
      .populate('doctor', 'fullName email')
      .lean();

    const doctorIds = connections.map((c) => c.doctor?._id);
    const profiles = await DoctorProfile.find({ user: { $in: doctorIds } }).lean();
    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));

    return connections.map((conn) => {
      const docProfile = profileMap.get(conn.doctor?._id?.toString()) || {};
      return {
        id: conn._id.toString(),
        status: conn.status,
        requestedAt: conn.requestedAt,
        approvedAt: conn.approvedAt,
        permissions: conn.permissions,
        doctor: {
          id: conn.doctor?._id?.toString(),
          fullName: conn.doctor?.fullName || 'Doctor',
          specialization: docProfile.specialization || '',
          hospital: docProfile.hospital || '',
          experience: docProfile.experience,
          isVerified: Boolean(docProfile.isVerified),
        },
      };
    });
  },

  /**
   * Cancel pending connection request by patient
   *
   * @param {string} patientId - Authenticated patient ID
   * @param {string} connectionId - Connection document ID
   * @returns {Promise<Object>} Updated connection
   */
  cancelConnectionRequest: async (patientId, connectionId) => {
    if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
      throw new ApiError(400, 'Invalid connection ID format');
    }

    const connection = await DoctorPatientConnection.findById(connectionId);
    if (!connection) {
      throw new ApiError(404, 'Connection request not found');
    }

    if (connection.patient.toString() !== patientId.toString()) {
      throw new ApiError(403, 'You are not authorized to cancel this connection request');
    }

    if (connection.status !== 'pending') {
      throw new ApiError(400, 'Only pending connection requests can be cancelled');
    }

    connection.status = 'revoked';
    connection.revokedAt = new Date();
    await connection.save();

    return connection;
  },

  /**
   * Get incoming connection requests for authenticated doctor
   *
   * @param {string} doctorId - Authenticated doctor ID
   * @returns {Promise<Array>} List of incoming pending requests
   */
  getDoctorRequests: async (doctorId) => {
    const connections = await DoctorPatientConnection.find({
      doctor: doctorId,
      status: 'pending',
    })
      .sort({ requestedAt: -1 })
      .populate('patient', 'fullName email createdAt')
      .lean();

    return connections.map((conn) => ({
      id: conn._id.toString(),
      status: conn.status,
      requestedAt: conn.requestedAt,
      patient: {
        id: conn.patient?._id?.toString(),
        fullName: conn.patient?.fullName || 'Patient',
        email: conn.patient?.email,
        memberSince: conn.patient?.createdAt,
      },
    }));
  },

  /**
   * Get connected patients for authenticated doctor
   *
   * @param {string} doctorId - Authenticated doctor ID
   * @returns {Promise<Array>} List of connected patients
   */
  getDoctorConnections: async (doctorId) => {
    const connections = await DoctorPatientConnection.find({
      doctor: doctorId,
      status: 'approved',
    })
      .sort({ approvedAt: -1 })
      .populate('patient', 'fullName email createdAt')
      .lean();

    return connections.map((conn) => ({
      id: conn._id.toString(),
      status: conn.status,
      requestedAt: conn.requestedAt,
      approvedAt: conn.approvedAt,
      permissions: conn.permissions,
      patient: {
        id: conn.patient?._id?.toString(),
        fullName: conn.patient?.fullName || 'Patient',
        email: conn.patient?.email,
        memberSince: conn.patient?.createdAt,
      },
    }));
  },

  /**
   * Doctor accepts a pending connection request
   *
   * @param {string} doctorId - Authenticated doctor ID
   * @param {string} connectionId - Connection document ID
   * @returns {Promise<Object>} Updated connection
   */
  acceptConnectionRequest: async (doctorId, connectionId) => {
    if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
      throw new ApiError(400, 'Invalid connection ID format');
    }

    const connection = await DoctorPatientConnection.findById(connectionId);
    if (!connection) {
      throw new ApiError(404, 'Connection request not found');
    }

    if (connection.doctor.toString() !== doctorId.toString()) {
      throw new ApiError(403, 'You are not authorized to accept this connection request');
    }

    if (connection.status !== 'pending') {
      throw new ApiError(400, 'Only pending connection requests can be accepted');
    }

    connection.status = 'approved';
    connection.approvedAt = new Date();
    await connection.save();

    // Fetch doctor name for notification
    const doctorUser = await User.findById(doctorId).select('fullName');

    // Dispatch notification to patient
    try {
      await notificationService.createNotification({
        user: connection.patient,
        type: 'doctor_approved',
        title: 'Doctor Connection Approved',
        message: `Dr. ${doctorUser?.fullName || 'Your physician'} has approved your connection request.`,
        channel: 'in_app',
        priority: 'normal',
        metadata: {
          connectionId: connection._id.toString(),
          doctorId: doctorId.toString(),
        },
      });
    } catch (notifErr) {
      logger.warn(`[ConnectionService] Non-critical notification failed: ${notifErr.message}`);
    }

    return connection;
  },

  /**
   * Doctor rejects a pending connection request
   *
   * @param {string} doctorId - Authenticated doctor ID
   * @param {string} connectionId - Connection document ID
   * @returns {Promise<Object>} Updated connection
   */
  rejectConnectionRequest: async (doctorId, connectionId) => {
    if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
      throw new ApiError(400, 'Invalid connection ID format');
    }

    const connection = await DoctorPatientConnection.findById(connectionId);
    if (!connection) {
      throw new ApiError(404, 'Connection request not found');
    }

    if (connection.doctor.toString() !== doctorId.toString()) {
      throw new ApiError(403, 'You are not authorized to reject this connection request');
    }

    if (connection.status !== 'pending') {
      throw new ApiError(400, 'Only pending connection requests can be rejected');
    }

    connection.status = 'rejected';
    await connection.save();

    const doctorUser = await User.findById(doctorId).select('fullName');

    // Dispatch notification to patient
    try {
      await notificationService.createNotification({
        user: connection.patient,
        type: 'doctor_rejected',
        title: 'Doctor Connection Request Declined',
        message: `Your connection request to Dr. ${doctorUser?.fullName || 'the physician'} was declined.`,
        channel: 'in_app',
        priority: 'normal',
        metadata: {
          connectionId: connection._id.toString(),
          doctorId: doctorId.toString(),
        },
      });
    } catch (notifErr) {
      logger.warn(`[ConnectionService] Non-critical notification failed: ${notifErr.message}`);
    }

    return connection;
  },

  /**
   * Revoke an approved connection (callable by either patient or doctor)
   *
   * @param {string} userId - Authenticated user ID (doctor or patient)
   * @param {string} connectionId - Connection document ID
   * @returns {Promise<Object>} Updated connection
   */
  revokeConnection: async (userId, connectionId) => {
    if (!connectionId || !mongoose.Types.ObjectId.isValid(connectionId)) {
      throw new ApiError(400, 'Invalid connection ID format');
    }

    const connection = await DoctorPatientConnection.findById(connectionId);
    if (!connection) {
      throw new ApiError(404, 'Connection record not found');
    }

    const isPatient = connection.patient.toString() === userId.toString();
    const isDoctor = connection.doctor.toString() === userId.toString();

    if (!isPatient && !isDoctor) {
      throw new ApiError(403, 'You are not authorized to revoke this connection');
    }

    if (connection.status !== 'approved') {
      throw new ApiError(400, 'Only approved connections can be revoked');
    }

    connection.status = 'revoked';
    connection.revokedAt = new Date();
    await connection.save();

    return connection;
  },
};

export default connectionService;
