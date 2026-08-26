/**
 * Centralized Date & Time Utility
 * Ensures uniform calendar date calculation and prevents timezone shift errors across schedules
 */

/**
 * Format any Date or ISO string into a canonical YYYY-MM-DD string
 * @param {Date|string|number} date
 * @returns {string|null} YYYY-MM-DD or null
 */
export const formatDate = (date) => {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

/**
 * Validates whether a string is a strict YYYY-MM-DD calendar date
 * Rejects non-calendar days (e.g. 2026-99-99, 2026-02-31, 06-09-2026, 'hello')
 * @param {string} dateStr
 * @returns {boolean}
 */
export const isValidDateString = (dateStr) => {
  if (typeof dateStr !== 'string') return false;

  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!dateRegex.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map((num) => parseInt(num, 10));
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
};

/**
 * Get current system/application date as YYYY-MM-DD
 * @returns {string} YYYY-MM-DD
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Verifies whether a given date falls within a medication's active start and end dates
 * @param {string} targetDateStr - YYYY-MM-DD
 * @param {Date|string} startDate
 * @param {Date|string|null} endDate
 * @returns {boolean}
 */
export const isDateInMedicationRange = (targetDateStr, startDate, endDate) => {
  if (!isValidDateString(targetDateStr)) return false;
  if (!startDate) return false;

  const startDay = formatDate(startDate);
  if (!startDay) return false;

  // Target date must be on or after start date
  if (targetDateStr < startDay) {
    return false;
  }

  // If endDate is defined, target date must be on or before end date
  if (endDate !== null && endDate !== undefined && endDate !== '') {
    const endDay = formatDate(endDate);
    if (endDay && targetDateStr > endDay) {
      return false;
    }
  }

  return true;
};

/**
 * Combine YYYY-MM-DD date and HH:mm time into a Date object
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeStr - HH:mm
 * @returns {Date|null}
 */
export const combineDateAndTime = (dateStr, timeStr) => {
  if (!isValidDateString(dateStr)) return null;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeStr)) return null;

  const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
  const [hour, minute] = timeStr.split(':').map((n) => parseInt(n, 10));

  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

/**
 * Compare two 24-hour time strings (HH:mm)
 * @param {string} timeA - e.g. "08:00"
 * @param {string} timeB - e.g. "20:00"
 * @returns {number} Negative if timeA < timeB, positive if timeA > timeB, 0 if equal
 */
export const compareTimes = (timeA, timeB) => {
  return String(timeA).localeCompare(String(timeB));
};

/**
 * Convert 24-hour HH:mm to friendly 12-hour format (e.g. "08:00 AM")
 * @param {string} time24 - HH:mm
 * @returns {string}
 */
export const formatTime12h = (time24) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time24)) return time24;

  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${String(hour).padStart(2, '0')}:${minStr} ${ampm}`;
};

export default {
  formatDate,
  isValidDateString,
  getTodayDateString,
  isDateInMedicationRange,
  combineDateAndTime,
  compareTimes,
  formatTime12h,
};
