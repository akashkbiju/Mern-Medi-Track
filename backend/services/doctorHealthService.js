import HealthRecord from '../models/HealthRecord.js';
import { healthService } from './healthService.js';
import { healthAnalyticsService } from './healthAnalyticsService.js';
import { connectionAccessService } from './connectionAccessService.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const ALLOWED_METRICS = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature'];

/**
 * Doctor Health Service
 * Provides secure, audited access to connected patient health records, summaries,
 * and analytics strictly after verifying approved connection and healthRecords permission.
 */
export const doctorHealthService = {
  /**
   * Retrieve paginated health records for a connected patient
   *
   * @param {string} doctorId - Authenticated doctor user ID
   * @param {string} patientId - Target patient user ID
   * @param {Object} query - Filtering & pagination parameters
   * @returns {Promise<Object>} Safe patient metadata, records array, and pagination info
   */
  getConnectedPatientHealthRecords: async (doctorId, patientId, query = {}) => {
    // 1. Enforce 5-layer authorization chain
    const { patient } = await connectionAccessService.verifyDoctorPatientHealthAccess(
      doctorId,
      patientId
    );

    // 2. Validate and sanitize query parameters
    const sanitizedQuery = {};
    if (query.page) sanitizedQuery.page = query.page;
    if (query.limit) sanitizedQuery.limit = query.limit;
    if (query.startDate) sanitizedQuery.startDate = query.startDate;
    if (query.endDate) sanitizedQuery.endDate = query.endDate;

    // Measurement whitelist filter
    const metricParam = query.metric || query.type;
    if (metricParam) {
      if (!ALLOWED_METRICS.includes(metricParam)) {
        throw new ApiError(
          400,
          `Invalid metric filter '${metricParam}'. Allowed values: ${ALLOWED_METRICS.join(', ')}`
        );
      }
      sanitizedQuery.type = metricParam;
    }

    // 3. Query records strictly for the target patient
    const recordsResult = await healthService.getHealthRecords(patient._id.toString(), sanitizedQuery);

    // 4. Safe projection: omit private system/user fields
    const safeRecords = recordsResult.records.map((rec) => ({
      id: rec._id.toString(),
      recordDate: rec.recordDate,
      weight: rec.weight,
      bloodPressure: rec.bloodPressure,
      bloodSugar: rec.bloodSugar,
      heartRate: rec.heartRate,
      temperature: rec.temperature,
      notes: rec.notes || '',
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    }));

    // 5. Lightweight security audit logging (Never logs sensitive health values, passwords, or tokens)
    logger.info(
      `[Audit] Doctor ${doctorId} viewed health records for patient ${patientId}`,
      {
        doctorId: doctorId.toString(),
        patientId: patientId.toString(),
        action: 'doctor_viewed_health_records',
        timestamp: new Date().toISOString(),
      }
    );

    return {
      patient: {
        id: patient._id.toString(),
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth || null,
        gender: patient.gender || null,
        emergencyContact: patient.emergencyContact || null,
      },
      records: safeRecords,
      pagination: recordsResult.pagination,
    };
  },

  /**
   * Retrieve concise health KPI summary for a connected patient
   *
   * @param {string} doctorId - Authenticated doctor user ID
   * @param {string} patientId - Target patient user ID
   * @returns {Promise<Object>} Patient info, latest measurements, and record count
   */
  getConnectedPatientHealthSummary: async (doctorId, patientId) => {
    // 1. Enforce 5-layer authorization chain
    const { patient } = await connectionAccessService.verifyDoctorPatientHealthAccess(
      doctorId,
      patientId
    );

    // 2. Fetch latest analytics summary across all metrics (defaults to 90d window)
    const analytics = await healthAnalyticsService.getHealthAnalytics(patient._id.toString(), {
      metric: 'all',
      period: '90d',
    });

    // 3. Total record count for the patient
    const recordCount = await HealthRecord.countDocuments({ user: patient._id });

    // 4. Lightweight security audit logging
    logger.info(
      `[Audit] Doctor ${doctorId} viewed health summary for patient ${patientId}`,
      {
        doctorId: doctorId.toString(),
        patientId: patientId.toString(),
        action: 'doctor_viewed_health_summary',
        timestamp: new Date().toISOString(),
      }
    );

    return {
      patient: {
        id: patient._id.toString(),
        fullName: patient.fullName,
        gender: patient.gender || null,
        dateOfBirth: patient.dateOfBirth || null,
      },
      latest: {
        weight: analytics.summary.weight,
        bloodPressure: analytics.summary.bloodPressure,
        bloodSugar: analytics.summary.bloodSugar,
        heartRate: analytics.summary.heartRate,
        temperature: analytics.summary.temperature,
      },
      recordCount,
    };
  },

  /**
   * Retrieve trend analytics for a connected patient
   *
   * @param {string} doctorId - Authenticated doctor user ID
   * @param {string} patientId - Target patient user ID
   * @param {Object} query - Analytics query options (metric, period, startDate, endDate)
   * @returns {Promise<Object>} Trend data, summary KPI, and date bounds
   */
  getConnectedPatientHealthAnalytics: async (doctorId, patientId, query = {}) => {
    // 1. Enforce 5-layer authorization chain
    const { patient } = await connectionAccessService.verifyDoctorPatientHealthAccess(
      doctorId,
      patientId
    );

    // 2. Query analytics using existing robust healthAnalyticsService
    const analyticsResult = await healthAnalyticsService.getHealthAnalytics(
      patient._id.toString(),
      query
    );

    // 3. Lightweight security audit logging
    logger.info(
      `[Audit] Doctor ${doctorId} viewed health analytics for patient ${patientId}`,
      {
        doctorId: doctorId.toString(),
        patientId: patientId.toString(),
        action: 'doctor_viewed_health_analytics',
        timestamp: new Date().toISOString(),
      }
    );

    return {
      patient: {
        id: patient._id.toString(),
        fullName: patient.fullName,
      },
      ...analyticsResult,
    };
  },

  /**
   * Retrieve connection context for the doctor and patient
   *
   * @param {string} doctorId - Authenticated doctor user ID
   * @param {string} patientId - Target patient user ID
   * @returns {Promise<Object>} Connection and patient context
   */
  getDoctorPatientContext: async (doctorId, patientId) => {
    const { connection, patient } = await connectionAccessService.verifyDoctorPatientHealthAccess(
      doctorId,
      patientId
    );

    return {
      connectionId: connection._id.toString(),
      status: connection.status,
      approvedAt: connection.approvedAt,
      permissions: connection.permissions,
      patient: {
        id: patient._id.toString(),
        fullName: patient.fullName,
        gender: patient.gender || null,
        dateOfBirth: patient.dateOfBirth || null,
      },
    };
  },
};

export default doctorHealthService;
