import mongoose from 'mongoose';
import HealthReport from '../models/HealthReport.js';
import HealthRecord from '../models/HealthRecord.js';
import User from '../models/User.js';
import DoctorPatientConnection from '../models/DoctorPatientConnection.js';
import { adherenceService } from './adherenceService.js';
import { doctorNoteService } from './doctorNoteService.js';
import { notificationService } from './notificationService.js';
import { ApiError } from '../utils/ApiError.js';
import { formatDate } from '../utils/dateTime.js';
import { logger } from '../utils/logger.js';

/**
 * Health Report Generation Service
 * Synthesizes medication adherence, recorded vitals, longitudinal trends,
 * and approved doctor recommendations into structured health report documents.
 * Adheres strictly to neutral health reporting without medical diagnoses.
 */
export const reportService = {
  /**
   * Resolve date boundaries for weekly, monthly, or custom report periods
   */
  resolveReportDates: (reportType, customStart, customEnd) => {
    const now = new Date();
    let start, end;

    if (reportType === 'weekly') {
      // 7 complete days ending yesterday
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000 + 1);
    } else if (reportType === 'monthly') {
      // 30 complete days ending yesterday
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000 + 1);
    } else {
      // Custom date range
      if (!customStart || !customEnd) {
        throw new ApiError(400, 'Start date and end date are required for custom reports');
      }
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);

      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new ApiError(400, 'Invalid date format provided for report generation');
      }
      if (start.getTime() > end.getTime()) {
        throw new ApiError(400, 'Start date cannot be after end date');
      }
    }

    return { start, end };
  },

  /**
   * Build neutral descriptive summary string without medical conclusions
   */
  buildNeutralSummary: (reportType, patientName, adherenceScore, recordCount, recommendationsCount) => {
    const periodLabel = reportType === 'weekly' ? '7-day' : reportType === 'monthly' ? '30-day' : 'custom period';
    const adhText =
      adherenceScore !== null
        ? `Medication adherence was recorded at ${adherenceScore}% for scheduled doses.`
        : 'No scheduled medication doses were recorded in this tracking window.';
    const recsText =
      recommendationsCount > 0
        ? `Includes ${recommendationsCount} active care recommendation${recommendationsCount > 1 ? 's' : ''} from approved physicians.`
        : 'No active doctor recommendations were published during this period.';

    return `Comprehensive health telemetry report compiled for ${patientName || 'patient'} covering the ${periodLabel}. ${adhText} ${recordCount} vital measurement log${recordCount === 1 ? '' : 's'} recorded. ${recsText}`;
  },

  /**
   * Generate structured health report
   *
   * @param {Object} params
   * @param {string} params.userId - Target patient ID
   * @param {string} params.reportType - 'weekly' | 'monthly' | 'custom'
   * @param {string} [params.startDate]
   * @param {string} [params.endDate]
   * @param {string} [params.generatedBy] - User ID who triggered report (or patient ID)
   */
  generateReport: async ({ userId, reportType, startDate, endDate, generatedBy }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid patient ID format');
    }

    const { start, end } = reportService.resolveReportDates(reportType, startDate, endDate);
    const creatorId = generatedBy || userId;

    // 1. Check for duplicate report to ensure idempotency
    const existingReport = await HealthReport.findOne({
      user: userId,
      reportType,
      startDate: start,
      endDate: end,
    });

    if (existingReport) {
      logger.info(`Returning existing report for user ${userId} (${reportType})`);
      return existingReport;
    }

    // 2. Fetch patient profile
    const patient = await User.findById(userId).select('fullName email gender dateOfBirth isActive');
    if (!patient || !patient.isActive) {
      throw new ApiError(404, 'Patient account not found or is inactive');
    }

    // 3. Compute medication adherence summary
    const startStr = formatDate(start);
    const endStr = formatDate(end);
    let adherenceData = {
      totalScheduled: 0,
      taken: 0,
      missed: 0,
      skipped: 0,
      pending: 0,
      adherenceScore: null,
      category: 'No Data',
    };

    try {
      const adhResult = await adherenceService.calculateAdherence(userId, startStr, endStr);
      if (adhResult) {
        adherenceData = {
          totalScheduled: adhResult.totalScheduled || 0,
          taken: adhResult.taken || 0,
          missed: adhResult.missed || 0,
          skipped: adhResult.skipped || 0,
          pending: adhResult.pending || 0,
          adherenceScore: adhResult.adherenceScore !== undefined ? adhResult.adherenceScore : null,
          category: adhResult.category || 'No Data',
        };
      }
    } catch (adhErr) {
      logger.warn(`Adherence calculation fallback for report: ${adhErr.message}`);
    }

    // 4. Fetch vital health records in period
    const healthRecords = await HealthRecord.find({
      user: userId,
      recordDate: { $gte: start, $lte: end },
    })
      .sort({ recordDate: 1 })
      .lean();

    // Latest measurements
    let latestWeight = null;
    let latestBloodPressure = null;
    let latestBloodSugar = null;
    let latestHeartRate = null;
    let latestTemperature = null;

    // Longitudinal trend arrays
    const trends = {
      weight: [],
      bloodPressure: [],
      bloodSugar: [],
      heartRate: [],
      temperature: [],
    };

    for (const r of healthRecords) {
      const dateStr = formatDate(r.recordDate);

      if (r.weight !== undefined && r.weight !== null) {
        latestWeight = { value: r.weight, unit: r.weightUnit || 'kg', date: r.recordDate };
        trends.weight.push({ date: dateStr, value: r.weight, unit: r.weightUnit || 'kg' });
      }
      if (r.bloodPressure && r.bloodPressure.systolic) {
        latestBloodPressure = {
          systolic: r.bloodPressure.systolic,
          diastolic: r.bloodPressure.diastolic,
          unit: 'mmHg',
          date: r.recordDate,
        };
        trends.bloodPressure.push({
          date: dateStr,
          systolic: r.bloodPressure.systolic,
          diastolic: r.bloodPressure.diastolic,
        });
      }
      if (r.bloodSugar !== undefined && r.bloodSugar !== null) {
        latestBloodSugar = {
          value: r.bloodSugar,
          unit: r.bloodSugarUnit || 'mg/dL',
          context: r.bloodSugarContext || '',
          date: r.recordDate,
        };
        trends.bloodSugar.push({
          date: dateStr,
          value: r.bloodSugar,
          unit: r.bloodSugarUnit || 'mg/dL',
        });
      }
      if (r.heartRate !== undefined && r.heartRate !== null) {
        latestHeartRate = { value: r.heartRate, unit: 'bpm', date: r.recordDate };
        trends.heartRate.push({ date: dateStr, value: r.heartRate });
      }
      if (r.temperature !== undefined && r.temperature !== null) {
        latestTemperature = {
          value: r.temperature,
          unit: r.temperatureUnit || 'C',
          date: r.recordDate,
        };
        trends.temperature.push({ date: dateStr, value: r.temperature, unit: r.temperatureUnit || 'C' });
      }
    }

    // 5. Fetch patient-visible doctor recommendations from approved doctors
    let formattedRecommendations = [];
    try {
      const recsResult = await doctorNoteService.getPatientRecommendations({
        patientId: userId,
        page: 1,
        limit: 50,
      });

      if (recsResult && recsResult.recommendations) {
        formattedRecommendations = recsResult.recommendations.map((rec) => ({
          title: rec.title || 'Doctor Guidance',
          content: rec.content || '',
          priority: rec.priority || 'normal',
          doctorName: rec.doctor?.fullName ? `Dr. ${rec.doctor.fullName}` : 'Physician',
          specialization: rec.doctor?.specialization || 'General Practice',
          hospital: rec.doctor?.hospital || '',
          date: rec.createdAt,
        }));
      }
    } catch (recErr) {
      logger.warn(`Doctor recommendations lookup error for report: ${recErr.message}`);
    }

    // 6. Build neutral descriptive summary
    const summary = reportService.buildNeutralSummary(
      reportType,
      patient.fullName,
      adherenceData.adherenceScore,
      healthRecords.length,
      formattedRecommendations.length
    );

    // 7. Save HealthReport
    const report = await HealthReport.create({
      user: userId,
      reportType,
      startDate: start,
      endDate: end,
      status: 'ready',
      summary,
      patientInfo: {
        name: patient.fullName || '',
        email: patient.email || '',
        gender: patient.gender || '',
        dateOfBirth: patient.dateOfBirth,
      },
      medicationSummary: adherenceData,
      healthSummary: {
        latestWeight,
        latestBloodPressure,
        latestBloodSugar,
        latestHeartRate,
        latestTemperature,
        recordCount: healthRecords.length,
      },
      trends,
      recommendations: formattedRecommendations,
      generatedBy: creatorId,
    });

    // 8. Create notification for patient
    try {
      const typeLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      await notificationService.createNotification({
        user: userId,
        type: 'report_ready',
        title: 'Health report ready',
        message: `Your ${typeLabel.toLowerCase()} health report is ready to view.`,
        metadata: {
          reportId: report._id.toString(),
          reportType,
          startDate: startStr,
          endDate: endStr,
        },
      });
    } catch (notifErr) {
      logger.warn(`Failed to dispatch report notification: ${notifErr.message}`);
    }

    return report;
  },

  /**
   * Helper: Generate weekly report
   */
  generateWeeklyReport: async (userId, generatedBy) => {
    return reportService.generateReport({
      userId,
      reportType: 'weekly',
      generatedBy,
    });
  },

  /**
   * Helper: Generate monthly report
   */
  generateMonthlyReport: async (userId, generatedBy) => {
    return reportService.generateReport({
      userId,
      reportType: 'monthly',
      generatedBy,
    });
  },

  /**
   * Helper: Generate custom date range report
   */
  generateCustomReport: async (userId, { startDate, endDate }, generatedBy) => {
    return reportService.generateReport({
      userId,
      reportType: 'custom',
      startDate,
      endDate,
      generatedBy,
    });
  },

  /**
   * Retrieve paginated health reports for a user
   */
  getUserReports: async (userId, { page = 1, limit = 20, reportType }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    const query = { user: userId };
    if (reportType && reportType !== 'all') {
      query.reportType = reportType;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      HealthReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      HealthReport.countDocuments(query),
    ]);

    return {
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Retrieve report by ID with ownership or doctor access verification
   *
   * @param {string} reportId
   * @param {Object} requestingUser - { id, role }
   */
  getReportById: async (reportId, requestingUser) => {
    if (!reportId || !mongoose.Types.ObjectId.isValid(reportId)) {
      throw new ApiError(400, 'Invalid report ID format');
    }

    const report = await HealthReport.findById(reportId).lean();
    if (!report) {
      throw new ApiError(404, 'Health report not found');
    }

    // If patient, must own the report
    if (requestingUser.role === 'patient') {
      if (report.user.toString() !== requestingUser.id.toString()) {
        throw new ApiError(403, 'You do not have permission to view this report');
      }
      return report;
    }

    // If doctor, must have approved connection with reports: true
    if (requestingUser.role === 'doctor') {
      const connection = await DoctorPatientConnection.findOne({
        doctor: requestingUser.id,
        patient: report.user,
      });

      if (!connection) {
        throw new ApiError(403, "You do not have a connection with this report's patient");
      }
      if (connection.status !== 'approved') {
        throw new ApiError(403, 'Connection with this patient is not approved');
      }
      if (!connection.permissions || connection.permissions.reports !== true) {
        throw new ApiError(403, 'Report access is disabled for this connection');
      }

      return report;
    }

    throw new ApiError(403, 'Unauthorized to view this report');
  },

  /**
   * Retrieve the latest health report for a patient
   */
  getLatestReport: async (userId) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid user ID format');
    }

    const report = await HealthReport.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return report || null;
  },
};

export default reportService;
