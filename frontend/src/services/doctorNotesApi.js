import api from './api';

/**
 * Doctor Notes & Patient Recommendations API Client
 * Interacts with backend clinical note endpoints for doctors and patients.
 */

/**
 * Create a new clinical note or patient-visible recommendation
 * POST /api/doctors/patients/:patientId/notes
 *
 * @param {string} patientId - Target patient ObjectId
 * @param {Object} noteData - { type, title, content, visibility, priority }
 * @returns {Promise<Object>} Created note payload
 */
export const createDoctorNote = async (patientId, noteData) => {
  const response = await api.post(`/doctors/patients/${patientId}/notes`, noteData);
  return response.data;
};

/**
 * Retrieve notes created by authenticated doctor for a specific patient
 * GET /api/doctors/patients/:patientId/notes
 *
 * @param {string} patientId - Target patient ObjectId
 * @param {Object} [params] - { type, visibility, priority, page, limit }
 * @returns {Promise<Object>} Paginated notes list
 */
export const getDoctorNotes = async (patientId, params = {}) => {
  const response = await api.get(`/doctors/patients/${patientId}/notes`, {
    params,
  });
  return response.data;
};

/**
 * Retrieve a specific note by ID
 * GET /api/doctors/patients/:patientId/notes/:noteId
 *
 * @param {string} patientId - Target patient ObjectId
 * @param {string} noteId - Note ObjectId
 * @returns {Promise<Object>} Note document
 */
export const getDoctorNote = async (patientId, noteId) => {
  const response = await api.get(`/doctors/patients/${patientId}/notes/${noteId}`);
  return response.data;
};

/**
 * Update an existing clinical note or recommendation
 * PATCH /api/doctors/patients/:patientId/notes/:noteId
 *
 * @param {string} patientId - Target patient ObjectId
 * @param {string} noteId - Note ObjectId
 * @param {Object} noteData - Updated note fields
 * @returns {Promise<Object>} Updated note document
 */
export const updateDoctorNote = async (patientId, noteId, noteData) => {
  const response = await api.patch(
    `/doctors/patients/${patientId}/notes/${noteId}`,
    noteData
  );
  return response.data;
};

/**
 * Delete a clinical note
 * DELETE /api/doctors/patients/:patientId/notes/:noteId
 *
 * @param {string} patientId - Target patient ObjectId
 * @param {string} noteId - Note ObjectId
 * @returns {Promise<Object>} Confirmation response
 */
export const deleteDoctorNote = async (patientId, noteId) => {
  const response = await api.delete(`/doctors/patients/${patientId}/notes/${noteId}`);
  return response.data;
};

/**
 * Retrieve patient-visible recommendations for the authenticated patient
 * GET /api/patients/me/doctor-recommendations
 *
 * @param {Object} [params] - { priority, page, limit }
 * @returns {Promise<Object>} Paginated recommendations list with doctor profile metadata
 */
export const getDoctorRecommendations = async (params = {}) => {
  const response = await api.get('/patients/me/doctor-recommendations', {
    params,
  });
  return response.data;
};

export default {
  createDoctorNote,
  getDoctorNotes,
  getDoctorNote,
  updateDoctorNote,
  deleteDoctorNote,
  getDoctorRecommendations,
};
