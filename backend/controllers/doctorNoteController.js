import { doctorNoteService } from '../services/doctorNoteService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Controller for Doctor Notes & Patient Recommendations
 */

/**
 * @desc    Create a doctor note or recommendation for a patient
 * @route   POST /api/doctors/patients/:patientId/notes
 * @access  Private (Doctor only)
 */
export const createDoctorNote = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { patientId } = req.params;
  const { type, title, content, visibility, priority } = req.body;

  const note = await doctorNoteService.createDoctorNote({
    doctorId,
    patientId,
    type,
    title,
    content,
    visibility,
    priority,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, note, 'Note created successfully'));
});

/**
 * @desc    Get notes and recommendations created by doctor for a patient
 * @route   GET /api/doctors/patients/:patientId/notes
 * @access  Private (Doctor only)
 */
export const getDoctorNotes = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { patientId } = req.params;
  const { type, visibility, priority, page, limit } = req.query;

  const result = await doctorNoteService.getDoctorNotes({
    doctorId,
    patientId,
    type,
    visibility,
    priority,
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Notes retrieved successfully'));
});

/**
 * @desc    Get a single doctor note by ID
 * @route   GET /api/doctors/patients/:patientId/notes/:noteId
 * @access  Private (Doctor only)
 */
export const getDoctorNoteById = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { patientId, noteId } = req.params;

  const note = await doctorNoteService.getDoctorNoteById({
    doctorId,
    patientId,
    noteId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, note, 'Note retrieved successfully'));
});

/**
 * @desc    Update an existing doctor note or recommendation
 * @route   PATCH /api/doctors/patients/:patientId/notes/:noteId
 * @access  Private (Doctor only)
 */
export const updateDoctorNote = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { patientId, noteId } = req.params;
  const updateData = req.body;

  const updatedNote = await doctorNoteService.updateDoctorNote({
    doctorId,
    patientId,
    noteId,
    updateData,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedNote, 'Note updated successfully'));
});

/**
 * @desc    Delete a doctor note
 * @route   DELETE /api/doctors/patients/:patientId/notes/:noteId
 * @access  Private (Doctor only)
 */
export const deleteDoctorNote = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { patientId, noteId } = req.params;

  const result = await doctorNoteService.deleteDoctorNote({
    doctorId,
    patientId,
    noteId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Note deleted successfully'));
});

/**
 * @desc    Get recommendations visible to the authenticated patient
 * @route   GET /api/patients/me/doctor-recommendations
 * @access  Private (Patient only)
 */
export const getPatientRecommendations = asyncHandler(async (req, res) => {
  const patientId = req.user.id;
  const { page, limit, priority } = req.query;

  const result = await doctorNoteService.getPatientRecommendations({
    patientId,
    page,
    limit,
    priority,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Recommendations retrieved successfully'));
});

export default {
  createDoctorNote,
  getDoctorNotes,
  getDoctorNoteById,
  updateDoctorNote,
  deleteDoctorNote,
  getPatientRecommendations,
};
