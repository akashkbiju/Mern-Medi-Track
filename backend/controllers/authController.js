import { authService } from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);

  return ApiResponse.success(res, 'Account created successfully', { user }, 201);
});

/**
 * Login user and issue JWT
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.loginUser(req.body);

  // Set secure httpOnly cookie (optional layer alongside bearer token)
  const cookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };

  res.cookie('token', token, cookieOptions);

  return ApiResponse.success(res, 'Login successful', { token, user }, 200);
});

/**
 * Logout user and clear session/cookie
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  return ApiResponse.success(res, 'Logged out successfully', null, 200);
});

/**
 * Get current authenticated user profile
 * GET /api/auth/me (Protected)
 */
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    'User profile retrieved successfully',
    { user: req.user },
    200
  );
});

/**
 * Verification Endpoint: Protected Route Test (Any authenticated role)
 * GET /api/auth/protected-test
 */
export const protectedTest = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    'Authenticated access successful',
    {
      userId: req.user.id,
      role: req.user.role,
    },
    200
  );
});

/**
 * Verification Endpoint: Patient Role Test
 * GET /api/auth/patient-test
 */
export const patientTest = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    'Patient access verified successfully',
    {
      userId: req.user.id,
      role: req.user.role,
    },
    200
  );
});

/**
 * Verification Endpoint: Doctor Role Test
 * GET /api/auth/doctor-test
 */
export const doctorTest = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    'Doctor access verified successfully',
    {
      userId: req.user.id,
      role: req.user.role,
    },
    200
  );
});

/**
 * Verification Endpoint: Admin Role Test
 * GET /api/auth/admin-test
 */
export const adminTest = asyncHandler(async (req, res) => {
  return ApiResponse.success(
    res,
    'Admin access verified successfully',
    {
      userId: req.user.id,
      role: req.user.role,
    },
    200
  );
});

export default {
  register,
  login,
  logout,
  getMe,
  protectedTest,
  patientTest,
  doctorTest,
  adminTest,
};
