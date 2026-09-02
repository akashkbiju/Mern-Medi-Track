import mongoose from 'mongoose';
import DoctorNote from '../models/DoctorNote.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { canDoctorAccessPatientNotes } from './connectionAccessService.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/**
 * Doctor Notes & Patient Recommendations Service
 * Handles CRUD operations, 5-layer authorization, patient visibility isolation,
 * and automated patient notifications.
 */
export const doctorNoteService = {
  /**
   * Create a clinical note or patient-visible recommendation
   *
   * @param {Object} params
   * @param {string} params.doctorId - Authenticated doctor ID
   * @param {string} params.patientId - Target patient ID
   * @param {string} [params.type='note'] - 'note' or 'recommendation'
   * @param {string} [params.title=''] - Summary title (<= 150 chars)
   * @param {string} params.content - Clinical note or advice (<= 5000 chars)
   * @param {string} [params.visibility='doctor_private'] - 'doctor_private' or 'patient_visible'
   * @param {string} [params.priority='normal'] - 'normal', 'important', or 'urgent'
   * @returns {Promise<Object>} Created note document
   */
  createDoctorNote: async ({
    doctorId,
    patientId,
    type = 'note',
    title = '',
    content,
    visibility = 'doctor_private',
    priority = 'normal',
  }) => {
    // 1. Authorize doctor access to patient notes
    const { connection, patient, doctor } = await canDoctorAccessPatientNotes(
      doctorId,
      patientId
    );

    if (!content || !content.trim()) {
      throw new ApiError(400, 'Note content cannot be empty');
    }

    // 2. Persist DoctorNote
    const newNote = await DoctorNote.create({
      doctor: doctor._id,
      patient: patient._id,
      connection: connection._id,
      type,
      title: title ? title.trim() : '',
      content: content.trim(),
      visibility,
      priority,
    });

    // 3. If patient-visible recommendation, generate notification
    if (visibility === 'patient_visible' && type === 'recommendation') {
      try {
        const doctorName = doctor.fullName || 'Your physician';
        const displayTitle = title ? title.trim() : 'Health Guidance';
        await notificationService.createNotification({
          user: patient._id,
          type: 'doctor_recommendation',
          title: 'New doctor recommendation',
          message: `Dr. ${doctorName} added a new recommendation: "${displayTitle}".`,
          priority: priority === 'urgent' ? 'high' : 'normal',
          metadata: {
            noteId: newNote._id.toString(),
            doctorId: doctor._id.toString(),
            doctorName,
            priority,
          },
        });
      } catch (notifError) {
        logger.warn(`Failed to dispatch notification for note ${newNote._id}: ${notifError.message}`);
      }
    }

    return newNote;
  },

  /**
   * Retrieve paginated notes created by this doctor for a connected patient
   *
   * @param {Object} params
   * @param {string} params.doctorId
   * @param {string} params.patientId
   * @param {string} [params.type]
   * @param {string} [params.visibility]
   * @param {string} [params.priority]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   */
  getDoctorNotes: async ({
    doctorId,
    patientId,
    type,
    visibility,
    priority,
    page = 1,
    limit = 20,
  }) => {
    await canDoctorAccessPatientNotes(doctorId, patientId);

    const query = {
      doctor: doctorId,
      patient: patientId,
    };

    if (type && type !== 'all') query.type = type;
    if (visibility && visibility !== 'all') query.visibility = visibility;
    if (priority && priority !== 'all') query.priority = priority;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [notes, total] = await Promise.all([
      DoctorNote.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      DoctorNote.countDocuments(query),
    ]);

    return {
      notes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Retrieve a single note by ID for a patient
   */
  getDoctorNoteById: async ({ doctorId, patientId, noteId }) => {
    await canDoctorAccessPatientNotes(doctorId, patientId);

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      throw new ApiError(400, 'Invalid note ID format');
    }

    const note = await DoctorNote.findOne({
      _id: noteId,
      patient: patientId,
    }).lean();

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    if (note.doctor.toString() !== doctorId.toString()) {
      throw new ApiError(403, 'You do not have permission to view this note.');
    }

    return note;
  },

  /**
   * Update an existing clinical note or recommendation
   */
  updateDoctorNote: async ({ doctorId, patientId, noteId, updateData }) => {
    const { doctor } = await canDoctorAccessPatientNotes(doctorId, patientId);

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      throw new ApiError(400, 'Invalid note ID format');
    }

    const note = await DoctorNote.findOne({
      _id: noteId,
      patient: patientId,
    });

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    if (note.doctor.toString() !== doctorId.toString()) {
      throw new ApiError(403, 'You can only edit notes you created.');
    }

    const previousVisibility = note.visibility;
    const previousType = note.type;

    if (updateData.title !== undefined) note.title = updateData.title ? updateData.title.trim() : '';
    if (updateData.content !== undefined) {
      if (!updateData.content || !updateData.content.trim()) {
        throw new ApiError(400, 'Note content cannot be empty');
      }
      note.content = updateData.content.trim();
    }
    if (updateData.type !== undefined) note.type = updateData.type;
    if (updateData.visibility !== undefined) note.visibility = updateData.visibility;
    if (updateData.priority !== undefined) note.priority = updateData.priority;

    await note.save();

    // Notify if transitioned into a patient-visible recommendation
    const isNowPublished =
      note.visibility === 'patient_visible' && note.type === 'recommendation';
    const wasNotPublished =
      previousVisibility !== 'patient_visible' || previousType !== 'recommendation';

    if (isNowPublished && wasNotPublished) {
      try {
        const doctorName = doctor.fullName || 'Your physician';
        const displayTitle = note.title || 'Health Guidance';
        await notificationService.createNotification({
          user: patientId,
          type: 'doctor_recommendation',
          title: 'New doctor recommendation',
          message: `Dr. ${doctorName} updated a recommendation: "${displayTitle}".`,
          priority: note.priority === 'urgent' ? 'high' : 'normal',
          metadata: {
            noteId: note._id.toString(),
            doctorId: doctorId.toString(),
            doctorName,
            priority: note.priority,
          },
        });
      } catch (notifErr) {
        logger.warn(`Failed to dispatch update notification: ${notifErr.message}`);
      }
    }

    return note;
  },

  /**
   * Delete a clinical note
   */
  deleteDoctorNote: async ({ doctorId, patientId, noteId }) => {
    await canDoctorAccessPatientNotes(doctorId, patientId);

    if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
      throw new ApiError(400, 'Invalid note ID format');
    }

    const note = await DoctorNote.findOne({
      _id: noteId,
      patient: patientId,
    });

    if (!note) {
      throw new ApiError(404, 'Note not found');
    }

    if (note.doctor.toString() !== doctorId.toString()) {
      throw new ApiError(403, 'You can only delete notes you created.');
    }

    await note.deleteOne();

    return { success: true, message: 'Note deleted successfully' };
  },

  /**
   * Retrieve patient-visible recommendations for the authenticated patient
   * Enforces:
   * - type = 'recommendation'
   * - visibility = 'patient_visible'
   * - patient = authenticated patient ID
   * - connection = active and approved
   */
  getPatientRecommendations: async ({ patientId, page = 1, limit = 20, priority }) => {
    if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
      throw new ApiError(400, 'Invalid patient ID format');
    }

    // Find all currently approved connections for this patient
    const approvedConnections = await DoctorPatientConnection.find({
      patient: patientId,
      status: 'approved',
    }).select('doctor _id');

    if (!approvedConnections.length) {
      return {
        recommendations: [],
        pagination: { page: 1, limit: parseInt(limit, 10) || 20, total: 0, totalPages: 1 },
      };
    }

    const approvedDoctorIds = approvedConnections.map((c) => c.doctor);

    const query = {
      patient: patientId,
      doctor: { $in: approvedDoctorIds },
      type: 'recommendation',
      visibility: 'patient_visible',
    };

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [recommendations, total] = await Promise.all([
      DoctorNote.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'doctor',
          select: 'fullName email profileImage',
        })
        .lean(),
      DoctorNote.countDocuments(query),
    ]);

    // Attach doctor professional profile details (specialization, hospital)
    const doctorProfiles = await DoctorProfile.find({
      user: { $in: approvedDoctorIds },
    })
      .select('user specialization hospital')
      .lean();

    const profileMap = new Map();
    for (const dp of doctorProfiles) {
      profileMap.set(dp.user.toString(), dp);
    }

    const enrichedRecommendations = recommendations.map((rec) => {
      const docId = rec.doctor?._id?.toString();
      const profile = docId ? profileMap.get(docId) : null;
      return {
        ...rec,
        doctor: {
          ...rec.doctor,
          specialization: profile?.specialization || 'Healthcare Provider',
          hospital: profile?.hospital || '',
        },
      };
    });

    return {
      recommendations: enrichedRecommendations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },
};

export default doctorNoteService;
