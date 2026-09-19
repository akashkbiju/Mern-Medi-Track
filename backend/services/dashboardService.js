import Medicine from '../models/Medicine.js';
import HealthRecord from '../models/HealthRecord.js';
import HealthReport from '../models/HealthReport.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorNote from '../models/DoctorNote.js';
import Notification from '../models/Notification.js';
import { adherenceService } from './adherenceService.js';
import { reminderService } from './reminderService.js';
import { medicationLogService } from './medicationLogService.js';
import { doctorNoteService } from './doctorNoteService.js';
import { logger } from '../utils/logger.js';

/**
 * Dashboard Service
 * Aggregates role-specific metrics and shortcuts for Patients and Doctors.
 */
export const dashboardService = {
  /**
   * Retrieve consolidated dashboard telemetry for an authenticated Patient.
   *
   * @param {string} userId - Patient User ID
   * @returns {Promise<Object>} Aggregated patient dashboard data
   */
  getPatientDashboardData: async (userId) => {
    const [
      activeMedicationsCount,
      todayLogsResult,
      adherenceResult,
      upcomingRemindersResult,
      latestHealthRecord,
      approvedConnections,
      pendingRequestsCount,
      recommendationsResult,
      latestReport,
      unreadNotificationCount,
    ] = await Promise.all([
      // 1. Active medication count
      Medicine.countDocuments({ user: userId, status: 'active' }).catch(() => 0),

      // 2. Today's dose tracking stats
      (userId
        ? medicationLogService.getTodayMedicationLogs(userId)
        : Promise.resolve({ stats: { total: 0, taken: 0, missed: 0, pending: 0, skipped: 0, completionRate: 0 } })
      ).catch(() => ({ stats: { total: 0, taken: 0, missed: 0, pending: 0, skipped: 0, completionRate: 0 } })),

      // 3. Weekly adherence stats
      (userId
        ? adherenceService.getAdherenceSummary(userId, { period: '7d' })
        : Promise.resolve({ hasData: false, adherenceScore: 0, category: 'No Data', taken: 0, totalEligible: 0, currentStreak: 0 })
      ).catch(() => ({ hasData: false, adherenceScore: 0, category: 'No Data', taken: 0, totalEligible: 0, currentStreak: 0 })),

      // 4. Upcoming reminders for next 24h
      (userId
        ? reminderService.generateUpcomingReminders(userId, 24)
        : Promise.resolve([])
      ).catch(() => []),

      // 5. Latest health record
      HealthRecord.findOne({ user: userId }).sort({ recordDate: -1 }).lean().catch(() => null),

      // 6. Connected doctors
      DoctorPatientConnection.find({ patient: userId, status: 'approved' })
        .populate({
          path: 'doctor',
          select: 'fullName email phone doctorProfile',
        })
        .lean()
        .catch(() => []),

      // 7. Pending connection requests count
      DoctorPatientConnection.countDocuments({ patient: userId, status: 'pending' }).catch(() => 0),

      // 8. Recent patient-visible recommendations
      doctorNoteService.getPatientRecommendations({ patientId: userId, page: 1, limit: 4 }).catch(() => ({ recommendations: [] })),

      // 9. Latest structured health report
      HealthReport.findOne({ user: userId }).sort({ createdAt: -1 }).lean().catch(() => null),

      // 10. Unread notifications count
      Notification.countDocuments({ recipient: userId, isRead: false }).catch(() => 0),
    ]);

    // Extract latest vitals cleanly
    const vitals = {
      bloodPressure: latestHealthRecord?.bloodPressure
        ? `${latestHealthRecord.bloodPressure.systolic}/${latestHealthRecord.bloodPressure.diastolic} mmHg`
        : null,
      bloodSugar: latestHealthRecord?.bloodSugar !== undefined && latestHealthRecord?.bloodSugar !== null
        ? `${latestHealthRecord.bloodSugar} ${latestHealthRecord.bloodSugarUnit || 'mg/dL'}`
        : null,
      heartRate: latestHealthRecord?.heartRate !== undefined && latestHealthRecord?.heartRate !== null
        ? `${latestHealthRecord.heartRate} BPM`
        : null,
      weight: latestHealthRecord?.weight !== undefined && latestHealthRecord?.weight !== null
        ? `${latestHealthRecord.weight} ${latestHealthRecord.weightUnit || 'kg'}`
        : null,
      temperature: latestHealthRecord?.temperature !== undefined && latestHealthRecord?.temperature !== null
        ? `${latestHealthRecord.temperature} °${latestHealthRecord.temperatureUnit || 'C'}`
        : null,
      recordedAt: latestHealthRecord?.recordDate || null,
    };

    return {
      medication: {
        activeCount: activeMedicationsCount,
        today: todayLogsResult.stats,
        adherence: adherenceResult,
        upcomingReminders: upcomingRemindersResult.slice(0, 5),
      },
      health: {
        vitals,
        hasRecords: Boolean(latestHealthRecord),
      },
      doctor: {
        connectedDoctors: approvedConnections.map((c) => ({
          connectionId: c._id,
          doctor: c.doctor,
          permissions: c.permissions,
          connectedSince: c.updatedAt,
        })),
        pendingRequestsCount,
        recentRecommendations: recommendationsResult.recommendations || [],
      },
      reports: {
        latestReport: latestReport
          ? {
              _id: latestReport._id,
              reportType: latestReport.reportType,
              startDate: latestReport.startDate,
              endDate: latestReport.endDate,
              summary: latestReport.summary,
              adherenceScore: latestReport.medicationSummary?.adherenceScore,
              createdAt: latestReport.createdAt,
            }
          : null,
      },
      notifications: {
        unreadCount: unreadNotificationCount,
      },
    };
  },

  /**
   * Retrieve consolidated dashboard metrics for an authenticated Doctor.
   *
   * @param {string} doctorId - Doctor User ID
   * @returns {Promise<Object>} Aggregated doctor dashboard data
   */
  getDoctorDashboardData: async (doctorId) => {
    const [
      doctorProfile,
      approvedConnectionsCount,
      pendingRequestsCount,
      recentApprovedConnections,
      recentPendingRequests,
      recentDoctorNotes,
      unreadNotificationCount,
    ] = await Promise.all([
      // 1. Doctor Profile
      DoctorProfile.findOne({ doctor: doctorId }).lean().catch(() => null),

      // 2. Connected patients count
      DoctorPatientConnection.countDocuments({ doctor: doctorId, status: 'approved' }).catch(() => 0),

      // 3. Pending requests count
      DoctorPatientConnection.countDocuments({ doctor: doctorId, status: 'pending' }).catch(() => 0),

      // 4. Recently connected patients
      DoctorPatientConnection.find({ doctor: doctorId, status: 'approved' })
        .sort({ updatedAt: -1 })
        .limit(6)
        .populate('patient', 'fullName email gender dateOfBirth phone')
        .lean()
        .catch(() => []),

      // 5. Recent pending connection requests
      DoctorPatientConnection.find({ doctor: doctorId, status: 'pending' })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patient', 'fullName email')
        .lean()
        .catch(() => []),

      // 6. Recent notes & recommendations by this doctor
      DoctorNote.find({ doctor: doctorId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patient', 'fullName')
        .lean()
        .catch(() => []),

      // 7. Unread notifications
      Notification.countDocuments({ recipient: doctorId, isRead: false }).catch(() => 0),
    ]);

    return {
      profile: doctorProfile,
      stats: {
        connectedPatientCount: approvedConnectionsCount,
        pendingRequestCount: pendingRequestsCount,
        notesCount: recentDoctorNotes.length,
        unreadNotifications: unreadNotificationCount,
      },
      roster: {
        connectedPatients: recentApprovedConnections.map((c) => ({
          connectionId: c._id,
          patient: c.patient,
          permissions: c.permissions,
          connectedSince: c.updatedAt,
        })),
        pendingRequests: recentPendingRequests.map((r) => ({
          connectionId: r._id,
          patient: r.patient,
          initiatedBy: r.initiatedBy,
          createdAt: r.createdAt,
        })),
      },
      recentNotes: recentDoctorNotes.map((n) => ({
        _id: n._id,
        patientName: n.patient?.fullName || 'Patient',
        patientId: n.patient?._id,
        title: n.title,
        content: n.content,
        type: n.type,
        visibility: n.visibility,
        priority: n.priority,
        createdAt: n.createdAt,
      })),
    };
  },
};

export default dashboardService;
