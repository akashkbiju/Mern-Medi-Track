import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { generateToken } from '../utils/jwt.js';

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

  /**
   * Authenticate a user by credentials and return a signed JWT + safe user profile
   */
  loginUser: async ({ email, password }) => {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      throw new ApiError(
        503,
        'Database connection is currently unavailable. Please verify MongoDB connectivity.'
      );
    }

    // 1. Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email, explicitly including password field (which is select: false)
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    // Generic error message to prevent account enumeration
    const genericAuthError = new ApiError(401, 'Invalid email or password');

    if (!user) {
      throw genericAuthError;
    }

    // 3. Verify account is active
    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive. Please contact support.');
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw genericAuthError;
    }

    // 5. Generate signed JWT token
    const token = generateToken(user);

    // 6. Return token and safe user profile (excluding password)
    return {
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    };
  },

  /**
   * Get user profile by ID
   */
  getMe: async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  },
};

export default authService;
