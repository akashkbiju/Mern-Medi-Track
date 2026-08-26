import Medicine from '../models/Medicine.js';
import { ApiError } from '../utils/ApiError.js';
import {
  formatDate,
  isValidDateString,
  getTodayDateString,
  isDateInMedicationRange,
  combineDateAndTime,
  compareTimes,
  formatTime12h,
} from '../utils/dateTime.js';

/**
 * Checks whether a medicine document is scheduled to be taken on a specific calendar date
 * @param {Object} medicine - Medicine document
 * @param {string} dateStr - Target date in YYYY-MM-DD format
 * @returns {boolean}
 */
export const isMedicineScheduledForDate = (medicine, dateStr) => {
  if (!medicine || !medicine.isActive) {
    return false;
  }

  return isDateInMedicationRange(dateStr, medicine.startDate, medicine.endDate);
};

/**
 * Retrieves scheduled times for a medicine on a specific date
 * @param {Object} medicine - Medicine document
 * @param {string} dateStr - Target date in YYYY-MM-DD format
 * @returns {Array<string>} Array of HH:mm strings
 */
export const getScheduledTimes = (medicine, dateStr) => {
  if (!isMedicineScheduledForDate(medicine, dateStr)) {
    return [];
  }

  return Array.isArray(medicine.times) ? [...medicine.times].sort() : [];
};

/**
 * Pure generator function to build and sort daily doses from a list of medicine objects
 * @param {Array<Object>} medicines - List of medicine documents/objects
 * @param {string} dateStr - Target date in YYYY-MM-DD format
 * @returns {Array<Object>} Array of individual dose objects sorted chronologically
 */
export const generateDailyDoses = (medicines, dateStr) => {
  if (!Array.isArray(medicines)) {
    return [];
  }

  const doses = [];

  for (const med of medicines) {
    if (isMedicineScheduledForDate(med, dateStr)) {
      const times = Array.isArray(med.times) ? med.times : [];
      for (const time of times) {
        doses.push({
          medicineId: med._id ? med._id.toString() : '',
          medicineName: med.name,
          genericName: med.genericName || '',
          dosage: med.dosage,
          dosageUnit: med.dosageUnit,
          frequency: med.frequency,
          scheduledDate: dateStr,
          scheduledTime: time,
          scheduledTime12h: formatTime12h(time),
          instructions: med.instructions || '',
          status: 'Scheduled',
          isActive: med.isActive === undefined ? true : med.isActive,
        });
      }
    }
  }

  // Sort chronologically by scheduled time, with secondary sort on medicine name
  doses.sort((a, b) => {
    const timeDiff = compareTimes(a.scheduledTime, b.scheduledTime);
    if (timeDiff !== 0) return timeDiff;
    return a.medicineName.localeCompare(b.medicineName);
  });

  return doses;
};

/**
 * Retrieve the schedule for a single medicine on a specified date
 * @param {string} userId - Authenticated user ID
 * @param {string} medicineId - Target medicine ObjectId
 * @param {string} [dateStr] - YYYY-MM-DD date (defaults to today)
 */
export const getMedicineSchedule = async (userId, medicineId, dateStr) => {
  const targetDate = dateStr || getTodayDateString();

  if (!isValidDateString(targetDate)) {
    throw new ApiError(400, 'Invalid date format. Date must be YYYY-MM-DD (e.g. 2026-09-06)');
  }

  const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
  if (!medicine) {
    throw new ApiError(404, 'Medicine not found');
  }

  const scheduledTimes = getScheduledTimes(medicine, targetDate);
  const doses = scheduledTimes.map((time) => ({
    medicineId: medicine._id.toString(),
    medicineName: medicine.name,
    dosage: medicine.dosage,
    dosageUnit: medicine.dosageUnit,
    frequency: medicine.frequency,
    scheduledDate: targetDate,
    scheduledTime: time,
    scheduledTime12h: formatTime12h(time),
    instructions: medicine.instructions || '',
    status: 'Scheduled',
    isActive: medicine.isActive,
  }));

  return {
    medicine: {
      id: medicine._id.toString(),
      name: medicine.name,
      genericName: medicine.genericName || '',
      dosage: medicine.dosage,
      dosageUnit: medicine.dosageUnit,
      frequency: medicine.frequency,
      instructions: medicine.instructions || '',
      isActive: medicine.isActive,
    },
    date: targetDate,
    scheduledTimes,
    doses,
    isScheduled: scheduledTimes.length > 0,
  };
};

/**
 * Compute full daily schedule for all active medications belonging to the authenticated user
 * @param {string} userId - Authenticated user ID
 * @param {string} [dateStr] - YYYY-MM-DD date (defaults to today)
 */
export const getDailySchedule = async (userId, dateStr) => {
  const targetDate = dateStr || getTodayDateString();

  if (!isValidDateString(targetDate)) {
    throw new ApiError(400, 'Invalid date format. Date must be YYYY-MM-DD (e.g. 2026-09-06)');
  }

  // Query active medicines for the authenticated user only
  const activeMedicines = await Medicine.find({
    user: userId,
    isActive: true,
  });

  const doses = generateDailyDoses(activeMedicines, targetDate);

  return {
    date: targetDate,
    count: doses.length,
    schedule: doses,
  };
};

/**
 * Convenience helper to retrieve today's medication schedule
 * @param {string} userId - Authenticated user ID
 */
export const getTodaySchedule = async (userId) => {
  const today = getTodayDateString();
  return getDailySchedule(userId, today);
};

/**
 * Compute upcoming scheduled doses within a rolling window (default: next 24 hours)
 * @param {string} userId - Authenticated user ID
 * @param {number} [windowHours=24] - Rolling hour window
 */
export const getUpcomingSchedule = async (userId, windowHours = 24) => {
  const now = new Date();
  const todayStr = getTodayDateString();

  // Tomorrow's date string
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = formatDate(tomorrow);

  // Compute today and tomorrow's schedules
  const [todaySchedule, tomorrowSchedule] = await Promise.all([
    getDailySchedule(userId, todayStr),
    getDailySchedule(userId, tomorrowStr),
  ]);

  const allCandidateDoses = [...todaySchedule.schedule, ...tomorrowSchedule.schedule];
  const windowEndTime = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

  // Filter doses occurring strictly between now and windowEndTime
  const upcomingDoses = allCandidateDoses.filter((dose) => {
    const doseTime = combineDateAndTime(dose.scheduledDate, dose.scheduledTime);
    if (!doseTime) return false;
    return doseTime >= now && doseTime <= windowEndTime;
  });

  // Sort chronologically
  upcomingDoses.sort((a, b) => {
    const dateA = combineDateAndTime(a.scheduledDate, a.scheduledTime);
    const dateB = combineDateAndTime(b.scheduledDate, b.scheduledTime);
    return dateA.getTime() - dateB.getTime();
  });

  return {
    windowHours,
    from: now.toISOString(),
    to: windowEndTime.toISOString(),
    count: upcomingDoses.length,
    schedule: upcomingDoses,
  };
};

export const scheduleService = {
  isMedicineScheduledForDate,
  getScheduledTimes,
  generateDailyDoses,
  getMedicineSchedule,
  getDailySchedule,
  getTodaySchedule,
  getUpcomingSchedule,
};

export default scheduleService;
