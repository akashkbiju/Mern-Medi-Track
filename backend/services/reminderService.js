import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import Medicine from '../models/Medicine.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  formatDate,
  isValidDateString,
  getTodayDateString,
  getUserDateTime,
  combineDateAndTimeToUTC,
  compareTimes,
  formatTime12h,
} from '../utils/dateTime.js';
import {
  scheduleService,
  isMedicineScheduledForDate,
} from './scheduleService.js';

/**
 * Smart Medication Reminder Engine Service
 * Generates and manages reminder events with guaranteed idempotency and timezone accuracy.
 */
export const reminderService = {
  /**
   * Generate or retrieve a medication reminder for a single scheduled dose
   * Idempotent: returns existing reminder if already generated.
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} medicineId - Medicine ObjectId
   * @param {string} dateStr - Target date in YYYY-MM-DD format
   * @param {string} scheduledTime - Time in HH:mm format
   * @returns {Promise<{ reminder: Object, created: boolean }>}
   */
  generateReminderForDose: async (userId, medicineId, dateStr, scheduledTime) => {
    if (!isValidDateString(dateStr)) {
      throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g. 2026-09-06)');
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(scheduledTime)) {
      throw new ApiError(400, 'Invalid scheduled time format. Expected HH:mm (e.g. 08:00)');
    }

    // 1. Verify user and medicine ownership
    const [user, medicine] = await Promise.all([
      User.findById(userId).select('timezone isActive fullName'),
      Medicine.findOne({ _id: medicineId, user: userId }),
    ]);

    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    if (!medicine) {
      throw new ApiError(404, 'Medicine not found or does not belong to this account');
    }

    // 2. Validate medicine active status
    if (!medicine.isActive) {
      throw new ApiError(400, 'Cannot generate reminder for an inactive medication');
    }

    // 3. Validate schedule eligibility for date
    if (!isMedicineScheduledForDate(medicine, dateStr)) {
      throw new ApiError(
        400,
        `Medication is not scheduled for date ${dateStr} based on prescription start/end dates`
      );
    }

    // 4. Validate scheduled time belongs to medicine frequency times
    if (!Array.isArray(medicine.times) || !medicine.times.includes(scheduledTime)) {
      throw new ApiError(
        400,
        `Time ${scheduledTime} is not in the scheduled times for medication '${medicine.name}'`
      );
    }

    // 5. Calculate exact UTC scheduledFor Date based on user timezone
    const userTimezone = user.timezone || 'Asia/Kolkata';
    const scheduledForUTC = combineDateAndTimeToUTC(dateStr, scheduledTime, userTimezone);

    if (!scheduledForUTC) {
      throw new ApiError(500, 'Failed to compute exact reminder schedule timestamp');
    }

    // 6. Check if reminder already exists (Idempotency check)
    const existingReminder = await Notification.findOne({
      user: userId,
      relatedMedicine: medicineId,
      type: 'medication_reminder',
      scheduledFor: scheduledForUTC,
    }).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

    if (existingReminder) {
      return { reminder: existingReminder, created: false };
    }

    // 7. Format clean, professional reminder notification
    const time12h = formatTime12h(scheduledTime);
    const title = `Medication Reminder: ${medicine.name}`;
    const instructionsText = medicine.instructions ? ` • ${medicine.instructions}` : '';
    const message = `It's time to take ${medicine.name} (${medicine.dosage} ${medicine.dosageUnit}) at ${time12h}${instructionsText}.`;

    try {
      const newReminder = await Notification.create({
        user: userId,
        type: 'medication_reminder',
        title,
        message,
        relatedMedicine: medicine._id,
        scheduledFor: scheduledForUTC,
        isRead: false,
        sentAt: null,
      });

      const populatedReminder = await Notification.findById(newReminder._id).populate(
        'relatedMedicine',
        'name genericName dosage dosageUnit instructions'
      );

      return { reminder: populatedReminder, created: true };
    } catch (err) {
      // Handle race condition or duplicate key (code 11000) gracefully
      if (err.code === 11000) {
        const raceReminder = await Notification.findOne({
          user: userId,
          relatedMedicine: medicineId,
          type: 'medication_reminder',
          scheduledFor: scheduledForUTC,
        }).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

        if (raceReminder) {
          return { reminder: raceReminder, created: false };
        }
      }
      throw err;
    }
  },

  /**
   * Generate or retrieve all scheduled medication reminders for a specific date
   * @param {string} userId - Authenticated user ID
   * @param {string} [dateStr] - YYYY-MM-DD date (defaults to today in user timezone)
   * @returns {Promise<Array<Object>>}
   */
  generateRemindersForDate: async (userId, dateStr) => {
    const user = await User.findById(userId).select('timezone');
    const userTimezone = user?.timezone || 'Asia/Kolkata';

    let targetDate = dateStr;
    if (!targetDate) {
      const userNow = getUserDateTime(userTimezone);
      targetDate = userNow.dateStr;
    }

    if (!isValidDateString(targetDate)) {
      throw new ApiError(400, 'Invalid date format. Expected YYYY-MM-DD (e.g. 2026-09-06)');
    }

    // Retrieve active daily doses from Step 10 Schedule Service
    const dailySchedule = await scheduleService.getDailySchedule(userId, targetDate);
    const doses = dailySchedule.schedule || [];

    const reminders = [];

    // Ensure reminder records exist for all doses
    for (const dose of doses) {
      const { reminder } = await reminderService.generateReminderForDose(
        userId,
        dose.medicineId,
        targetDate,
        dose.scheduledTime
      );
      if (reminder) {
        reminders.push(reminder);
      }
    }

    // Sort chronologically by scheduledFor date
    reminders.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

    return reminders;
  },

  /**
   * Generate or retrieve upcoming reminders within a lookahead window (default 24h)
   * @param {string} userId - Authenticated user ID
   * @param {number} [lookaheadHours=24] - Hours ahead to include
   * @returns {Promise<Array<Object>>}
   */
  generateUpcomingReminders: async (userId, lookaheadHours = env.REMINDER_LOOKAHEAD_HOURS) => {
    const hours = Math.max(1, Math.min(parseInt(lookaheadHours, 10) || 24, 168)); // Cap between 1h and 7d

    // Retrieve upcoming doses from Step 10 Schedule Service
    const upcomingSchedule = await scheduleService.getUpcomingSchedule(userId, hours);
    const candidateDoses = upcomingSchedule.schedule || [];

    const reminders = [];

    for (const dose of candidateDoses) {
      const { reminder } = await reminderService.generateReminderForDose(
        userId,
        dose.medicineId,
        dose.scheduledDate,
        dose.scheduledTime
      );
      if (reminder) {
        reminders.push(reminder);
      }
    }

    // Sort chronologically
    reminders.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

    return reminders;
  },

  /**
   * Query existing reminders for authenticated user with safe filtering
   * @param {string} userId - Authenticated user ID
   * @param {Object} [filters={}] - { date, isRead, medicineId, page, limit }
   */
  getUserReminders: async (userId, filters = {}) => {
    const query = {
      user: userId,
      type: 'medication_reminder',
    };

    if (filters.medicineId && mongoose.Types.ObjectId.isValid(filters.medicineId)) {
      query.relatedMedicine = filters.medicineId;
    }

    if (filters.isRead !== undefined && filters.isRead !== '') {
      query.isRead = filters.isRead === 'true' || filters.isRead === true;
    }

    if (filters.date && isValidDateString(filters.date)) {
      const user = await User.findById(userId).select('timezone');
      const tz = user?.timezone || 'Asia/Kolkata';

      // Start and end of calendar day in user timezone
      const startOfDay = combineDateAndTimeToUTC(filters.date, '00:00', tz);
      const endOfDay = combineDateAndTimeToUTC(filters.date, '23:59', tz);

      if (startOfDay && endOfDay) {
        query.scheduledFor = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 30));
    const skip = (page - 1) * limit;

    const [reminders, totalCount] = await Promise.all([
      Notification.find(query)
        .sort({ scheduledFor: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedMedicine', 'name genericName dosage dosageUnit instructions frequency'),
      Notification.countDocuments(query),
    ]);

    return {
      reminders,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
      },
    };
  },

  /**
   * Mark a reminder notification as read
   * @param {string} userId - Authenticated user ID
   * @param {string} reminderId - Notification ObjectId
   */
  markReminderAsRead: async (userId, reminderId) => {
    if (!mongoose.Types.ObjectId.isValid(reminderId)) {
      throw new ApiError(400, 'Invalid reminder ID format');
    }

    const reminder = await Notification.findOneAndUpdate(
      { _id: reminderId, user: userId, type: 'medication_reminder' },
      { isRead: true },
      { new: true }
    ).populate('relatedMedicine', 'name genericName dosage dosageUnit instructions');

    if (!reminder) {
      throw new ApiError(404, 'Reminder not found');
    }

    return reminder;
  },

  /**
   * Core background batch scheduler worker
   * Processes active users, creates due reminders within the recovery and lookahead windows,
   * catches individual errors without interrupting the job.
   *
   * @param {Object} [options={}] - { lookaheadMinutes, recoveryMinutes }
   */
  processScheduledReminders: async (options = {}) => {
    const lookaheadMinutes = options.lookaheadMinutes ?? 60;
    const recoveryMinutes = options.recoveryMinutes ?? env.REMINDER_RECOVERY_MINUTES;

    const now = new Date();
    logger.info(
      `[ReminderEngine] Processing scheduled reminders at ${now.toISOString()} (Lookahead: ${lookaheadMinutes}m, Recovery: ${recoveryMinutes}m)`
    );

    // Find all distinct users who have active medicines
    const activeMedicines = await Medicine.find({ isActive: true }).select('user');
    const userIds = [...new Set(activeMedicines.map((m) => m.user.toString()))];

    let successCount = 0;
    let failedCount = 0;
    let totalRemindersProcessed = 0;

    for (const uid of userIds) {
      try {
        const user = await User.findById(uid).select('timezone isActive');
        if (!user || !user.isActive) continue;

        const userTimezone = user.timezone || 'Asia/Kolkata';
        const { dateStr: todayDateStr } = getUserDateTime(userTimezone, now);

        // Generate reminders for today
        const reminders = await reminderService.generateRemindersForDate(uid, todayDateStr);
        totalRemindersProcessed += reminders.length;
        successCount++;
      } catch (userErr) {
        failedCount++;
        logger.error(
          `[ReminderEngine] Failed processing reminders for user ${uid}: ${userErr.message}`
        );
        // Continue operating for remaining users
      }
    }

    logger.info(
      `[ReminderEngine] Processing completed. Users processed: ${successCount}, Users failed: ${failedCount}, Total active reminders: ${totalRemindersProcessed}`
    );

    return {
      success: true,
      usersProcessed: successCount,
      usersFailed: failedCount,
      totalRemindersProcessed,
    };
  },
};

export default reminderService;
