import MedicationLog from '../models/MedicationLog.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import {
  formatDate,
  isValidDateString,
  getUserDateTime,
  combineDateAndTimeToUTC,
  addDaysToDate,
  getDateRangeArray,
} from '../utils/dateTime.js';
import { medicationLogService } from './medicationLogService.js';

export const ADHERENCE_CATEGORIES = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  NEEDS_IMPROVEMENT: 'Needs Improvement',
  LOW: 'Low',
  NO_DATA: 'No Data',
};

export const ADHERENCE_DISCLAIMER =
  'Medication adherence reflects how consistently scheduled doses were recorded as taken. It is not a medical diagnosis.';

export const ADHERENCE_STREAK_THRESHOLD = 100;

/**
 * Categorizes an adherence percentage score into clinical tracking tiers
 * @param {number|null} score - Adherence percentage (0-100) or null
 * @returns {string} Category label
 */
export const getScoreCategory = (score) => {
  if (score === null || score === undefined || isNaN(score)) {
    return ADHERENCE_CATEGORIES.NO_DATA;
  }
  if (score >= 90) return ADHERENCE_CATEGORIES.EXCELLENT;
  if (score >= 75) return ADHERENCE_CATEGORIES.GOOD;
  if (score >= 50) return ADHERENCE_CATEGORIES.NEEDS_IMPROVEMENT;
  return ADHERENCE_CATEGORIES.LOW;
};

/**
 * Rounds a floating-point number to specified decimal places
 * Prevents floating point noise (e.g. 85.7142857 -> 85.71)
 * @param {number|null} num
 * @param {number} [decimals=2]
 * @returns {number|null}
 */
export const roundDecimal = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
};

/**
 * Evaluates whether an individual MedicationLog entry is eligible for adherence calculation
 * and determines its completed/non-completed contribution.
 *
 * @param {Object} log - MedicationLog plain object
 * @param {string} todayDateStr - Current local date YYYY-MM-DD
 * @param {string} timezone - User's timezone
 * @param {number} graceMinutes - Grace period before pending counts as missed
 * @param {Date} [now=new Date()]
 * @returns {{ isEligible: boolean, isTaken: boolean, isMissed: boolean, isSkipped: boolean, isPending: boolean }}
 */
export const evaluateDoseEligibility = (
  log,
  todayDateStr,
  timezone,
  graceMinutes = 60,
  now = new Date()
) => {
  const doseDateStr = formatDate(log.scheduledDate);
  const status = log.status || 'pending';

  // 1. Explicitly recorded statuses are always eligible
  if (status === 'taken') {
    return { isEligible: true, isTaken: true, isMissed: false, isSkipped: false, isPending: false };
  }
  if (status === 'missed') {
    return { isEligible: true, isTaken: false, isMissed: true, isSkipped: false, isPending: false };
  }
  if (status === 'skipped') {
    return { isEligible: true, isTaken: false, isMissed: false, isSkipped: true, isPending: false };
  }

  // 2. Pending dose evaluation:
  // If scheduled on a past calendar date (< today), evaluation window has closed
  if (doseDateStr < todayDateStr) {
    return { isEligible: true, isTaken: false, isMissed: true, isSkipped: false, isPending: false };
  }

  // If scheduled for a future calendar date (> today), excluded from eligible doses
  if (doseDateStr > todayDateStr) {
    return { isEligible: false, isTaken: false, isMissed: false, isSkipped: false, isPending: true };
  }

  // If scheduled for today, check against scheduled time + grace period
  const scheduledUTC = combineDateAndTimeToUTC(todayDateStr, log.scheduledTime, timezone);
  if (!scheduledUTC) {
    return { isEligible: false, isTaken: false, isMissed: false, isSkipped: false, isPending: true };
  }

  const expirationCutoff = new Date(scheduledUTC.getTime() + graceMinutes * 60 * 1000);

  if (now.getTime() > expirationCutoff.getTime()) {
    // Grace period expired without action -> eligible (missed)
    return { isEligible: true, isTaken: false, isMissed: true, isSkipped: false, isPending: false };
  }

  // Grace period still active or scheduled time is in future today -> NOT eligible yet
  return { isEligible: false, isTaken: false, isMissed: false, isSkipped: false, isPending: true };
};

/**
 * Calculates adherence statistics from an array of MedicationLog documents
 *
 * @param {Array<Object>} logs
 * @param {string} todayDateStr
 * @param {string} timezone
 * @param {number} graceMinutes
 * @returns {Object} { totalEligible, taken, missed, skipped, pending, adherenceScore, category, hasData }
 */
export const calculateAdherenceStats = (
  logs,
  todayDateStr,
  timezone,
  graceMinutes = 60
) => {
  let totalEligible = 0;
  let taken = 0;
  let missed = 0;
  let skipped = 0;
  let pending = 0;

  const now = new Date();

  for (const log of logs) {
    const evaluation = evaluateDoseEligibility(log, todayDateStr, timezone, graceMinutes, now);

    if (evaluation.isEligible) {
      totalEligible++;
      if (evaluation.isTaken) taken++;
      else if (evaluation.isMissed) missed++;
      else if (evaluation.isSkipped) skipped++;
    } else if (evaluation.isPending) {
      pending++;
    }
  }

  const hasData = totalEligible > 0;
  const adherenceScore = hasData ? roundDecimal((taken / totalEligible) * 100, 2) : null;
  const category = getScoreCategory(adherenceScore);

  return {
    totalEligible,
    taken,
    missed,
    skipped,
    pending,
    adherenceScore,
    category,
    hasData,
  };
};

/**
 * Calculate user's consecutive day adherence streak up to today.
 * A day with 100% adherence increments streak.
 * A day with 0 eligible doses does not break the streak.
 * A day with <100% adherence breaks the streak.
 * Today is included if completed with 100%, or bypassed if still in progress without missed doses.
 *
 * @param {string} userId
 * @param {string} todayDateStr
 * @param {string} timezone
 * @param {number} graceMinutes
 * @returns {Promise<number>} Current streak in days
 */
export const calculateAdherenceStreak = async (
  userId,
  todayDateStr,
  timezone,
  graceMinutes = 60
) => {
  // Query up to 90 days of history for streak calculation
  const lookbackStartStr = addDaysToDate(todayDateStr, -90);
  const startUTC = new Date(`${lookbackStartStr}T00:00:00.000Z`);
  const endUTC = new Date(`${todayDateStr}T23:59:59.999Z`);

  const logs = await MedicationLog.find({
    user: userId,
    scheduledDate: { $gte: startUTC, $lte: endUTC },
  })
    .select('scheduledDate scheduledTime status')
    .lean();

  // Group logs by date
  const logsByDate = new Map();
  for (const log of logs) {
    const dStr = formatDate(log.scheduledDate);
    if (!logsByDate.has(dStr)) {
      logsByDate.set(dStr, []);
    }
    logsByDate.get(dStr).push(log);
  }

  let streak = 0;
  const now = new Date();

  // Generate day list in reverse order from today back to lookbackStartStr
  let checkDateStr = todayDateStr;

  // 1. Evaluate today first
  const todayLogs = logsByDate.get(todayDateStr) || [];
  let todayHasDoses = todayLogs.length > 0;
  let todayPendingCount = 0;
  let todayEligible = 0;
  let todayTaken = 0;
  let todayMissed = 0;
  let todaySkipped = 0;

  for (const log of todayLogs) {
    const evalResult = evaluateDoseEligibility(log, todayDateStr, timezone, graceMinutes, now);
    if (evalResult.isEligible) {
      todayEligible++;
      if (evalResult.isTaken) todayTaken++;
      else if (evalResult.isMissed) todayMissed++;
      else if (evalResult.isSkipped) todaySkipped++;
    } else {
      todayPendingCount++;
    }
  }

  if (todayEligible > 0) {
    const todayScore = (todayTaken / todayEligible) * 100;
    if (todayScore < ADHERENCE_STREAK_THRESHOLD) {
      // Dose was missed/skipped today -> streak is broken
      return 0;
    } else if (todayPendingCount === 0) {
      // All doses today completed with 100% adherence
      streak++;
    }
    // If todayPendingCount > 0 and todayScore >= 100, today is still in progress;
    // do not increment yet, but do not break streak. Continue evaluating yesterday.
  }

  // 2. Iterate backwards from yesterday
  checkDateStr = addDaysToDate(todayDateStr, -1);

  while (checkDateStr >= lookbackStartStr) {
    const dayLogs = logsByDate.get(checkDateStr) || [];

    if (dayLogs.length === 0) {
      // No doses scheduled for this day -> does not break streak
      checkDateStr = addDaysToDate(checkDateStr, -1);
      continue;
    }

    let dayEligible = 0;
    let dayTaken = 0;

    for (const log of dayLogs) {
      const evalResult = evaluateDoseEligibility(log, todayDateStr, timezone, graceMinutes, now);
      if (evalResult.isEligible) {
        dayEligible++;
        if (evalResult.isTaken) dayTaken++;
      }
    }

    if (dayEligible === 0) {
      // No eligible doses evaluated
      checkDateStr = addDaysToDate(checkDateStr, -1);
      continue;
    }

    const dayScore = (dayTaken / dayEligible) * 100;
    if (dayScore >= ADHERENCE_STREAK_THRESHOLD) {
      streak++;
      checkDateStr = addDaysToDate(checkDateStr, -1);
    } else {
      // Missed a dose on this day -> streak ends
      break;
    }
  }

  return streak;
};

/**
 * Adherence Service Core Interface
 */
export const adherenceService = {
  /**
   * Calculate adherence summary and daily trend breakdown for a requested period
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} query - { period, startDate, endDate }
   * @returns {Promise<Object>}
   */
  getAdherenceSummary: async (userId, query = {}) => {
    // 1. Resolve user timezone
    const user = await User.findById(userId).select('timezone');
    const timezone = user?.timezone || 'Asia/Kolkata';
    const graceMinutes = env.REMINDER_GRACE_MINUTES || 60;

    const { dateStr: todayDateStr } = getUserDateTime(timezone);

    // 2. Determine date range based on period
    const rawPeriod = (query.period || '7d').toLowerCase();
    let startDateStr;
    let endDateStr;
    let periodKey = rawPeriod;

    if (rawPeriod === 'today') {
      startDateStr = todayDateStr;
      endDateStr = todayDateStr;
    } else if (rawPeriod === '7d') {
      startDateStr = addDaysToDate(todayDateStr, -6);
      endDateStr = todayDateStr;
    } else if (rawPeriod === '30d') {
      startDateStr = addDaysToDate(todayDateStr, -29);
      endDateStr = todayDateStr;
    } else if (rawPeriod === 'custom') {
      startDateStr = query.startDate;
      endDateStr = query.endDate;

      if (!isValidDateString(startDateStr) || !isValidDateString(endDateStr)) {
        throw new ApiError(400, 'Custom period requires valid startDate and endDate in YYYY-MM-DD format');
      }
      if (startDateStr > endDateStr) {
        throw new ApiError(400, 'startDate cannot be after endDate');
      }

      // Enforce max 366 days
      const daysArray = getDateRangeArray(startDateStr, endDateStr);
      if (daysArray.length > 366) {
        throw new ApiError(400, 'Date range cannot exceed 366 days (1 year)');
      }
    } else {
      throw new ApiError(400, "Invalid period. Allowed values: 'today', '7d', '30d', 'custom'");
    }

    // 3. Ensure today's logs exist if today falls within the evaluation window
    if (todayDateStr >= startDateStr && todayDateStr <= endDateStr) {
      try {
        await medicationLogService.ensureDailyMedicationLogs(userId, todayDateStr);
      } catch (err) {
        logger.warn(`[AdherenceService] Warning while generating today's logs: ${err.message}`);
      }
    }

    // 4. Single optimized MongoDB query across the requested range
    const startUTC = new Date(`${startDateStr}T00:00:00.000Z`);
    const endUTC = new Date(`${endDateStr}T23:59:59.999Z`);

    const logs = await MedicationLog.find({
      user: userId,
      scheduledDate: { $gte: startUTC, $lte: endUTC },
    })
      .select('scheduledDate scheduledTime status takenAt notes medicine')
      .lean();

    // 5. Group logs by date string
    const logsByDate = new Map();
    for (const log of logs) {
      const dStr = formatDate(log.scheduledDate);
      if (!logsByDate.has(dStr)) {
        logsByDate.set(dStr, []);
      }
      logsByDate.get(dStr).push(log);
    }

    // 6. Compute overall period statistics
    const overallStats = calculateAdherenceStats(logs, todayDateStr, timezone, graceMinutes);

    // 7. Compute daily trend breakdown for each calendar day in the range
    const allDays = getDateRangeArray(startDateStr, endDateStr);
    const daily = allDays.map((dateStr) => {
      const dayLogs = logsByDate.get(dateStr) || [];
      const dayStats = calculateAdherenceStats(dayLogs, todayDateStr, timezone, graceMinutes);

      return {
        date: dateStr,
        eligible: dayStats.totalEligible,
        taken: dayStats.taken,
        missed: dayStats.missed,
        skipped: dayStats.skipped,
        pending: dayStats.pending,
        score: dayStats.adherenceScore,
        category: dayStats.category,
        hasData: dayStats.hasData,
      };
    });

    // 8. Calculate current consecutive adherence streak
    const currentStreak = await calculateAdherenceStreak(
      userId,
      todayDateStr,
      timezone,
      graceMinutes
    );

    return {
      period: periodKey,
      startDate: startDateStr,
      endDate: endDateStr,
      timezone,
      totalEligible: overallStats.totalEligible,
      taken: overallStats.taken,
      missed: overallStats.missed,
      skipped: overallStats.skipped,
      pending: overallStats.pending,
      adherenceScore: overallStats.adherenceScore,
      category: overallStats.category,
      hasData: overallStats.hasData,
      currentStreak,
      daily,
      disclaimer: ADHERENCE_DISCLAIMER,
    };
  },
};

export default adherenceService;
