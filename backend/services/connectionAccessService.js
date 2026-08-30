import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Reusable authorization helper for doctor-patient connection data access.
 * Enforces the 5-layer authorization chain:
 * 1. Valid doctor and patient ObjectIds (prevents operator injection)
 * 2. Active doctor account with role 'doctor'
 * 3. Active patient account with role 'patient'
 * 4. Approved connection between the specific doctor and patient
 * 5. Explicit permission enabled (e.g. permissions.healthRecords === true)
 */
export const connectionAccessService = {
  /**
   * Verifies an authenticated doctor can access a target patient's health records.
   *
   * @param {string} doctorId - Authenticated doctor ID (strictly from req.user.id)
   * @param {string} patientId - Target patient ID (from validated route params)
   * @returns {Promise<{ connection: Object, patient: Object, doctor: Object }>}
   * @throws {ApiError} 400 for invalid IDs, 403 for unauthorized/unapproved/missing permission, 404 if patient inactive/not found
   */
  verifyDoctorPatientHealthAccess: async (doctorId, patientId) => {
    // 1. Strict ObjectId validation (prevents arbitrary Mongo operators like $ne, $in, $where)
    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, 'Invalid doctor ID format');
    }
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      throw new ApiError(400, 'Invalid patient ID format');
    }

    const doctorIdStr = doctorId.toString();
    const patientIdStr = patientId.toString();

    // Prevent self-connection lookup
    if (doctorIdStr === patientIdStr) {
      throw new ApiError(403, 'A doctor cannot access records through self-connection');
    }

    // 2. Verify doctor account is active with role 'doctor'
    const doctor = await User.findById(doctorIdStr).select('fullName email role isActive');
    if (!doctor || doctor.role !== 'doctor' || !doctor.isActive) {
      throw new ApiError(403, 'Doctor account is not active or authorized');
    }

    // 3. Verify patient account exists and is active
    const patient = await User.findById(patientIdStr).select(
      'fullName email role isActive dateOfBirth gender emergencyContact'
    );
    if (!patient || patient.role !== 'patient' || !patient.isActive) {
      throw new ApiError(404, 'Patient not found or account is inactive');
    }

    // 4. Find connection record between this doctor and patient
    const connection = await DoctorPatientConnection.findOne({
      doctor: doctorIdStr,
      patient: patientIdStr,
    });

    if (!connection) {
      throw new ApiError(403, "You do not have permission to view this patient's health records.");
    }

    // 5. Verify connection status is strictly 'approved'
    if (connection.status !== 'approved') {
      if (connection.status === 'revoked') {
        throw new ApiError(403, 'Connection with this patient has been revoked.');
      }
      if (connection.status === 'rejected') {
        throw new ApiError(403, 'Connection request with this patient was rejected.');
      }
      throw new ApiError(403, "You do not have permission to view this patient's health records.");
    }

    // 6. Verify healthRecords permission is explicitly true
    if (!connection.permissions || connection.permissions.healthRecords !== true) {
      throw new ApiError(403, 'Health record access is disabled for this connection.');
    }

    return {
      connection,
      patient,
      doctor,
    };
  },
};

export default connectionAccessService;
