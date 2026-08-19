import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Authentication Service
 * Encapsulates registration, credentials verification, and security rules
 */
export const authService = {
  /**
   * Register a new patient account
   * Strict security: Always enforces role='patient' for public registration
   */
  registerUser: async ({ fullName, email, password, phone }) => {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(
        503,
        'Database connection is currently unavailable. Please verify MongoDB connectivity.'
      );
    }
    // 1. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // 3. Hash password securely using bcrypt (work factor: 12)
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new user document (strictly patient role for public registration)
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone ? phone.trim() : undefined,
      role: 'patient', // Enforced on the server to prevent role injection
      isActive: true,
    });

    // 5. Return safe user object (omits password and password hash)
    return {
      id: newUser._id.toString(),
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      phone: newUser.phone,
      createdAt: newUser.createdAt,
    };
  },

  loginUser: async () => {
    throw new ApiError(501, 'Login functionality will be implemented in Step 5');
  },
};

export default authService;
