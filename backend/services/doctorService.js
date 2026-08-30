import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';
import { logger } from '../utils/logger.js';

/**
 * Doctor Service
 * Manages doctor account registration, profile retrieval, and professional detail updates.
 */
export const doctorService = {
  /**
   * Register a new healthcare provider with doctor role and pending verification status
   *
   * @param {Object} data - Doctor registration payload
   * @returns {Promise<{ user: Object, doctorProfile: Object }>}
   */
  registerDoctor: async (data) => {
    const {
      fullName,
      email,
      password,
      specialization,
      licenseNumber,
      phone,
      hospital,
      experience,
      bio,
      consultationInfo,
    } = data;

    // 1. Check database connectivity
    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(
        503,
        'Database connection is currently unavailable. Please verify MongoDB connectivity.'
      );
    }

    // 2. Normalize and validate uniqueness of email
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // 3. Normalize and validate uniqueness of license number
    const trimmedLicense = licenseNumber.trim();
    const existingLicense = await DoctorProfile.findOne({ licenseNumber: trimmedLicense });
    if (existingLicense) {
      throw new ApiError(409, 'A doctor account with this license number already exists');
    }

    // 4. Securely hash password with bcrypt (work factor: 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create User record with enforced doctor role
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
      role: 'doctor', // Server-enforced: role injection from client is completely ignored
      isActive: true,
    });

    // 6. Create associated DoctorProfile record with safe rollback
    let newDoctorProfile = null;
    try {
      newDoctorProfile = await DoctorProfile.create({
        user: newUser._id,
        specialization: specialization.trim(),
        licenseNumber: trimmedLicense,
        hospital: hospital ? hospital.trim() : '',
        experience:
          experience !== undefined && experience !== '' ? Number(experience) : undefined,
        bio: bio ? bio.trim() : '',
        consultationInfo: consultationInfo ? consultationInfo.trim() : '',
        isVerified: false, // Server-enforced: all public registrations begin pending verification
      });
    } catch (profileErr) {
      // Roll back created User document to avoid orphan records
      logger.error(`[DoctorService] DoctorProfile creation failed. Rolling back User ${newUser._id}`);
      await User.findByIdAndDelete(newUser._id);

      if (profileErr.code === 11000) {
        throw new ApiError(409, 'A doctor account with this license number already exists');
      }
      throw profileErr;
    }

    // 7. Dispatch welcome system notification via notificationService
    try {
      await notificationService.createNotification({
        user: newUser._id,
        type: 'system',
        title: 'Doctor Account Created',
        message:
          'Your doctor account has been registered successfully. Your credentials are currently pending professional verification.',
        channel: 'in_app',
        priority: 'normal',
      });
    } catch (notifErr) {
      logger.warn(
        `[DoctorService] Non-critical notification failed on doctor register: ${notifErr.message}`
      );
    }

    return {
      user: {
        id: newUser._id.toString(),
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone || '',
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      doctorProfile: {
        specialization: newDoctorProfile.specialization,
        licenseNumber: newDoctorProfile.licenseNumber,
        hospital: newDoctorProfile.hospital || '',
        experience: newDoctorProfile.experience,
        bio: newDoctorProfile.bio || '',
        consultationInfo: newDoctorProfile.consultationInfo || '',
        isVerified: newDoctorProfile.isVerified,
      },
    };
  },

  /**
   * Retrieve doctor profile for authenticated physician
   *
   * @param {string} userId - Authenticated user ID (req.user.id)
   * @returns {Promise<{ user: Object, doctorProfile: Object }>}
   */
  getDoctorProfile: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    if (user.role !== 'doctor') {
      throw new ApiError(403, 'Access restricted to registered doctor accounts only');
    }

    const profile = await DoctorProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Doctor professional profile not found');
    }

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        createdAt: user.createdAt,
      },
      doctorProfile: {
        specialization: profile.specialization,
        licenseNumber: profile.licenseNumber,
        hospital: profile.hospital || '',
        experience: profile.experience,
        bio: profile.bio || '',
        consultationInfo: profile.consultationInfo || '',
        isVerified: profile.isVerified || false,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    };
  },

  /**
   * Update permitted professional and contact details for authenticated doctor
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} updateData - Incoming updates
   */
  updateDoctorProfile: async (userId, updateData = {}) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive');
    }

    if (user.role !== 'doctor') {
      throw new ApiError(403, 'Access restricted to registered doctor accounts only');
    }

    const profile = await DoctorProfile.findOne({ user: userId });
    if (!profile) {
      throw new ApiError(404, 'Doctor profile not found');
    }

    // 1. Update permitted User fields (strictly fullName and phone)
    if (updateData.fullName !== undefined && typeof updateData.fullName === 'string') {
      user.fullName = updateData.fullName.trim();
    }
    if (updateData.phone !== undefined && typeof updateData.phone === 'string') {
      user.phone = updateData.phone.trim();
    }
    await user.save();

    // 2. Update permitted DoctorProfile fields (explicit whitelist)
    // Disallows changing: user, licenseNumber, isVerified, _id, createdAt
    if (updateData.specialization !== undefined && typeof updateData.specialization === 'string') {
      profile.specialization = updateData.specialization.trim();
    }
    if (updateData.hospital !== undefined && typeof updateData.hospital === 'string') {
      profile.hospital = updateData.hospital.trim();
    }
    if (updateData.experience !== undefined) {
      profile.experience =
        updateData.experience !== '' && !isNaN(updateData.experience)
          ? Number(updateData.experience)
          : undefined;
    }
    if (updateData.bio !== undefined && typeof updateData.bio === 'string') {
      profile.bio = updateData.bio.trim();
    }
    if (updateData.consultationInfo !== undefined && typeof updateData.consultationInfo === 'string') {
      profile.consultationInfo = updateData.consultationInfo.trim();
    }

    await profile.save();

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
      },
      doctorProfile: {
        specialization: profile.specialization,
        licenseNumber: profile.licenseNumber,
        hospital: profile.hospital || '',
        experience: profile.experience,
        bio: profile.bio || '',
        consultationInfo: profile.consultationInfo || '',
        isVerified: profile.isVerified || false,
        updatedAt: profile.updatedAt,
      },
    };
  },

  /**
   * Placeholder foundation for future Step 20 doctor connectivity
   */
  getAvailableDoctors: async () => {
    throw new ApiError(501, 'Doctor directory will be implemented in Step 20');
  },

  requestConnection: async () => {
    throw new ApiError(501, 'Doctor-patient connectivity will be implemented in Step 20');
  },
};

export default doctorService;
