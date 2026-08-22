import User from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get current authenticated user's private profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Use req.user.id established from verified JWT (prevents ID spoofing)
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  return ApiResponse.success(
    res,
    'Profile retrieved successfully',
    {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        emergencyContact: user.emergencyContact,
        createdAt: user.createdAt,
      },
    },
    200
  );
});

/**
 * Update current authenticated user's profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  // Allowed editable fields only - role and password can NEVER be updated here
  const { fullName, phone, gender, dateOfBirth, emergencyContact } = req.body;

  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName.trim();
  if (phone !== undefined) updates.phone = phone.trim();
  if (gender !== undefined) updates.gender = gender;
  if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth;
  if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact;

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    throw new ApiError(404, 'User profile not found');
  }

  return ApiResponse.success(
    res,
    'Profile updated successfully',
    {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        emergencyContact: user.emergencyContact,
        createdAt: user.createdAt,
      },
    },
    200
  );
});

/**
 * Get all users (Admin only)
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password');
  return ApiResponse.success(res, 'Users retrieved successfully', { users }, 200);
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return ApiResponse.success(res, 'User retrieved successfully', { user }, 200);
});

export default { getProfile, updateProfile, getAllUsers, getUserById };
