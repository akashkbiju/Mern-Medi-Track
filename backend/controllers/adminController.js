import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

/**
 * Verify a doctor's credentials
 * PUT /api/admin/doctors/:id/verify
 * Restricted to 'admin' role
 */
export const verifyDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params; // This is the User ID of the doctor

  // 1. Find the user and ensure they are a doctor
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.role !== 'doctor') {
    throw new ApiError(400, 'User is not a doctor');
  }

  // 2. Find their doctor profile
  const doctorProfile = await DoctorProfile.findOne({ user: id });
  if (!doctorProfile) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  // 3. Update verification status
  if (doctorProfile.isVerified) {
    throw new ApiError(400, 'Doctor is already verified');
  }

  doctorProfile.isVerified = true;
  await doctorProfile.save();

  return ApiResponse.success(
    res,
    'Doctor verified successfully',
    { user: sanitizeUser(user), doctorProfile },
    200
  );
});

export default {
  verifyDoctor,
};
