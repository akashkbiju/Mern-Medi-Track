import mongoose from 'mongoose';
import MedicationLog from '../models/MedicationLog.js';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  formatDate,
  isValidDateString,
  getUserDateTime,
  combineDateAndTimeToUTC,
  compareTimes,
  formatTime12h,
} from '../utils/dateTime.js';
import { scheduleService } from './scheduleService.js';

/**
 * Medication Log Service
 * Manages medication dose logging, state transitions (pending, taken, missed, skipped),
 * and on-demand daily log generation based on Step 10 schedule service.
 */
export const medicationLogService = {
  /**
   * Idempotently ensure that daily MedicationLog documents exist for all active doses
   * on a given calendar date. Preserves any existing taken, missed, or skipped statuses.
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} dateStr - Target date in YYYY-MM-DD format
   * @returns {Promise<Array<Object>>} Array of populated daily MedicationLog documents
   */
  ensureDailyMedicationLogs: async (userId, dateStr) => {
    if (!isValidDateString(dateStr)) {
      throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g. 2026-09-06)');
    }

    // Standardize midnight UTC Date object for index consistency
    const scheduledDateUTC = new Date(`${dateStr}T00:00:00.000Z`);

    // 1. Retrieve active scheduled doses from Step 10 Schedule Service
    const dailySchedule = await scheduleService.getDailySchedule(userId, dateStr);
    const scheduledDoses = dailySchedule.schedule || [];

    // 2. Query existing MedicationLogs for this user on this date
    const existingLogs = await MedicationLog.find({
      user: userId,
      scheduledDate: scheduledDateUTC,
    });

    const existingLookup = new Set(
      existingLogs.map((log) => `${log.medicine.toString()}_${log.scheduledTime}`)
    );

    // 3. Identify and insert missing log records
    const logsToCreate = [];
    for (const dose of scheduledDoses) {
      const key = `${dose.medicineId}_${dose.scheduledTime}`;
      if (!existingLookup.has(key)) {
        logsToCreate.push({
          user: userId,
          medicine: dose.medicineId,
          scheduledDate: scheduledDateUTC,
          scheduledTime: dose.scheduledTime,
          status: 'pending',
          takenAt: null,
          notes: '',
        });
      }
    }

    if (logsToCreate.length > 0) {
      try {
        await MedicationLog.insertMany(logsToCreate, { ordered: false });
      } catch (err) {
        // Handle duplicate key error (code 11000) gracefully for concurrent calls
        if (err.code !== 11000 && !err.writeErrors?.every((we) => we.code === 11000)) {
          logger.error(`[MedicationLogService] Error bulk creating logs: ${err.message}`);
          throw err;
        }
      }
    }

    // 4. Return all daily logs, populated and sorted chronologically
    const allDailyLogs = await MedicationLog.find({
      user: userId,
      scheduledDate: scheduledDateUTC,
    })
      .populate('medicine', 'name genericName dosage dosageUnit instructions frequency')
      .lean();

    // Sort chronologically by scheduledTime, with secondary sort on medicine name
    allDailyLogs.sort((a, b) => {
      const timeDiff = compareTimes(a.scheduledTime, b.scheduledTime);
      if (timeDiff !== 0) return timeDiff;
      const nameA = a.medicine?.name || '';
      const nameB = b.medicine?.name || '';
      return nameA.localeCompare(nameB);
    });

    // Attach human-readable 12-hour time for frontend display
    return allDailyLogs.map((log) => ({
      ...log,
      scheduledDateFormatted: dateStr,
      scheduledTime12h: formatTime12h(log.scheduledTime),
    }));
  },

  /**
   * Retrieve today's medication logs and progress statistics for authenticated user
   * Interprets "today" in the user's configured timezone.
   *
   * @param {string} userId - Authenticated user ID
   * @returns {Promise<Object>}
   */
  getTodayMedicationLogs: async (userId) => {
    const user = await User.findById(userId).select('timezone');
    const userTimezone = user?.timezone || 'Asia/Kolkata';

    // Compute today in user's timezone
    const { dateStr: todayDateStr } = getUserDateTime(userTimezone);

    // Ensure logs exist and retrieve
    const medications = await medicationLogService.ensureDailyMedicationLogs(
      userId,
      todayDateStr
    );

    // Compute progress statistics
    const total = medications.length;
    const taken = medications.filter((m) => m.status === 'taken').length;
    const pending = medications.filter((m) => m.status === 'pending').length;
    const missed = medications.filter((m) => m.status === 'missed').length;
    const skipped = medications.filter((m) => m.status === 'skipped').length;
    const completionRate = total > 0 ? Math.round((taken / total) * 100) : 0;

    return {
      date: todayDateStr,
      timezone: userTimezone,
      stats: {
        total,
        taken,
        pending,
        missed,
        skipped,
        completionRate,
      },
      medications,
    };
  },

  /**
   * Query medication logs history with safe filtering and pagination
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} [filters={}] - { date, startDate, endDate, status, medicineId, page, limit }
   */
  getMedicationLogs: async (userId, filters = {}) => {
    const query = { user: userId };

    // Filter by specific date
    if (filters.date && isValidDateString(filters.date)) {
      query.scheduledDate = new Date(`${filters.date}T00:00:00.000Z`);
    } else if (filters.startDate || filters.endDate) {
      query.scheduledDate = {};
      if (filters.startDate && isValidDateString(filters.startDate)) {
        query.scheduledDate.$gte = new Date(`${filters.startDate}T00:00:00.000Z`);
      }
      if (filters.endDate && isValidDateString(filters.endDate)) {
        query.scheduledDate.$lte = new Date(`${filters.endDate}T00:00:00.000Z`);
      }
    }

    // Filter by status (whitelist valid statuses)
    if (filters.status && ['pending', 'taken', 'missed', 'skipped'].includes(filters.status)) {
      query.status = filters.status;
    }

    // Filter by medicine ID
    if (filters.medicineId && mongoose.Types.ObjectId.isValid(filters.medicineId)) {
      query.medicine = filters.medicineId;
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      MedicationLog.find(query)
        .sort({ scheduledDate: -1, scheduledTime: 1 })
        .skip(skip)
        .limit(limit)
        .populate('medicine', 'name genericName dosage dosageUnit instructions frequency')
        .lean(),
      MedicationLog.countDocuments(query),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      scheduledDateFormatted: formatDate(log.scheduledDate),
      scheduledTime12h: formatTime12h(log.scheduledTime),
    }));

    return {
      logs: formattedLogs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
      },
    };
  },

  /**
   * Retrieve a single medication log by ID verifying ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} logId - MedicationLog ObjectId
   */
  getMedicationLogById: async (userId, logId) => {
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      throw new ApiError(400, 'Invalid medication log ID format');
    }

    const log = await MedicationLog.findOne({ _id: logId, user: userId })
      .populate('medicine', 'name genericName dosage dosageUnit instructions frequency')
      .lean();

    if (!log) {
      throw new ApiError(404, 'Medication log not found');
    }

    return {
      ...log,
      scheduledDateFormatted: formatDate(log.scheduledDate),
      scheduledTime12h: formatTime12h(log.scheduledTime),
    };
  },

  /**
   * Mark a scheduled medication dose as taken
   * Idempotent: if already marked taken, returns existing log without modification.
   * Supports pending -> taken and missed -> taken (late taking).
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} logId - MedicationLog ObjectId
   * @param {string} [notes] - Optional patient note
   */
  markMedicationTaken: async (userId, logId, notes) => {
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      throw new ApiError(400, 'Invalid medication log ID format');
    }

    const log = await MedicationLog.findOne({ _id: logId, user: userId });
    if (!log) {
      throw new ApiError(404, 'Medication log not found or does not belong to this account');
    }

    // Idempotent: already taken
    if (log.status === 'taken') {
      const populated = await MedicationLog.findById(log._id).populate(
        'medicine',
        'name genericName dosage dosageUnit instructions frequency'
      );
      return populated;
    }

    // Disallow transition from skipped to taken
    if (log.status === 'skipped') {
      throw new ApiError(
        400,
        'Cannot mark a skipped dose as taken. Please contact your healthcare provider if dosage needs rescheduling.'
      );
    }

    // Set taken status and actual taken timestamp
    log.status = 'taken';
    log.takenAt = new Date();

    if (notes && typeof notes === 'string') {
      log.notes = notes.trim().slice(0, 500);
    }

    await log.save();

    return MedicationLog.findById(log._id).populate(
      'medicine',
      'name genericName dosage dosageUnit instructions frequency'
    );
  },

  /**
   * Mark a scheduled medication dose as skipped with an optional reason note
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} logId - MedicationLog ObjectId
   * @param {string} [notes] - Optional reason for skipping
   */
  markMedicationSkipped: async (userId, logId, notes) => {
    if (!mongoose.Types.ObjectId.isValid(logId)) {
      throw new ApiError(400, 'Invalid medication log ID format');
    }

    const log = await MedicationLog.findOne({ _id: logId, user: userId });
    if (!log) {
      throw new ApiError(404, 'Medication log not found or does not belong to this account');
    }

    // Idempotent: already skipped
    if (log.status === 'skipped') {
      const populated = await MedicationLog.findById(log._id).populate(
        'medicine',
        'name genericName dosage dosageUnit instructions frequency'
      );
      return populated;
    }

    // Disallow transition from taken to skipped
    if (log.status === 'taken') {
      throw new ApiError(400, 'Cannot skip a medication dose that has already been taken.');
    }

    // Disallow transition from missed to skipped
    if (log.status === 'missed') {
      throw new ApiError(400, 'Cannot skip a medication dose that is already marked as missed.');
    }

    log.status = 'skipped';
    if (notes && typeof notes === 'string') {
      log.notes = notes.trim().slice(0, 500);
    }

    await log.save();

    return MedicationLog.findById(log._id).populate(
      'medicine',
      'name genericName dosage dosageUnit instructions frequency'
    );
  },

  /**
   * Core background worker to automatically process pending medication logs
   * into 'missed' once the scheduled time + grace period has expired.
   * Never marks taken or skipped logs as missed.
   *
   * @param {Object} [options={}] - { graceMinutes }
   * @returns {Promise<{ processed: number, markedMissed: number }>}
   */
  processMissedMedicationLogs: async (options = {}) => {
    const graceMinutes = options.graceMinutes ?? env.REMINDER_GRACE_MINUTES ?? 60;
    const now = new Date();

    // Query pending logs
    const pendingLogs = await MedicationLog.find({ status: 'pending' }).populate(
      'user',
      'timezone isActive'
    );

    let processedCount = 0;
    let markedMissedCount = 0;

    for (const log of pendingLogs) {
      processedCount++;
      try {
        const userTimezone = log.user?.timezone || 'Asia/Kolkata';
        const dateStr = formatDate(log.scheduledDate);

        if (!dateStr || !log.scheduledTime) continue;

        // Calculate exact UTC timestamp of scheduled dose
        const scheduledUTC = combineDateAndTimeToUTC(dateStr, log.scheduledTime, userTimezone);
        if (!scheduledUTC) continue;

        // Expiration cutoff = scheduled time + grace period
        const expirationCutoff = new Date(scheduledUTC.getTime() + graceMinutes * 60 * 1000);

        if (now.getTime() > expirationCutoff.getTime()) {
          // Transition pending -> missed
          const updateResult = await MedicationLog.updateOne(
            { _id: log._id, status: 'pending' },
            { $set: { status: 'missed' } }
          );
          if (updateResult.modifiedCount > 0) {
            markedMissedCount++;
          }
        }
      } catch (logErr) {
        logger.error(
          `[MedicationLogService] Error processing missed status for log ${log._id}: ${logErr.message}`
        );
        // Continue processing remaining logs
      }
    }

    if (markedMissedCount > 0) {
      logger.info(
        `[MedicationLogService] Automated missed check completed: ${markedMissedCount} of ${processedCount} pending doses marked missed (Grace: ${graceMinutes}m)`
      );
    }

    return {
      processed: processedCount,
      markedMissed: markedMissedCount,
    };
  },
};

export default medicationLogService;
