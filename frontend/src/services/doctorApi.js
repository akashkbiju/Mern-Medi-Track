import api from './api';

/**
 * Doctor API Service
 * Handles doctor account registration, profile retrieval, and updates
 */

/**
 * Register a new physician account
 * POST /api/auth/doctor/register
 * 
 * @param {Object} doctorData - Doctor registration payload
 * @returns {Promise<Object>} API response data
 */
export const registerDoctor = async (doctorData) => {
  const response = await api.post('/auth/doctor/register', doctorData);
  return response.data;
};

/**
 * Retrieve authenticated doctor's professional profile
 * GET /api/doctors/profile
 * 
 * @returns {Promise<Object>} API response data with user and doctorProfile
 */
export const getDoctorProfile = async () => {
  const response = await api.get('/doctors/profile');
  return response.data;
};

/**
 * Update authenticated doctor's permitted profile fields
 * PATCH /api/doctors/profile
 * 
 * @param {Object} updateData - Permitted update fields (fullName, phone, specialization, hospital, experience, bio, consultationInfo)
 * @returns {Promise<Object>} API response data
 */
export const updateDoctorProfile = async (updateData) => {
  const response = await api.patch('/doctors/profile', updateData);
  return response.data;
};

export default {
  registerDoctor,
  getDoctorProfile,
  updateDoctorProfile,
};
