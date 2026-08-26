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

/**
 * Validate IANA timezone identifier
 * @param {string} tz - e.g. "Asia/Kolkata", "America/New_York"
 * @returns {boolean}
 */
export const isValidTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/**
 * Compute the current date and time formatted in a user's configured timezone
 * @param {string} [timezone='Asia/Kolkata'] - IANA timezone
 * @param {Date} [baseDate=new Date()]
 * @returns {{ dateStr: string, timeStr: string, timezone: string }}
 */
export const getUserDateTime = (timezone = 'Asia/Kolkata', baseDate = new Date()) => {
  const tz = isValidTimezone(timezone) ? timezone : 'Asia/Kolkata';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(baseDate);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const hour = map.hour === '24' ? '00' : map.hour;
  const timeStr = `${hour}:${map.minute}`;

  return { dateStr, timeStr, timezone: tz };
};

/**
 * Combine YYYY-MM-DD date and HH:mm time in a specific timezone into an exact UTC Date object
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeStr - HH:mm
 * @param {string} [timezone='Asia/Kolkata'] - User's IANA timezone
 * @returns {Date|null}
 */
export const combineDateAndTimeToUTC = (dateStr, timeStr, timezone = 'Asia/Kolkata') => {
  if (!isValidDateString(dateStr)) return null;
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(timeStr)) return null;

  const tz = isValidTimezone(timezone) ? timezone : 'Asia/Kolkata';

  // Construct initial UTC reference guess
  const [year, month, day] = dateStr.split('-').map((n) => parseInt(n, 10));
  const [hour, minute] = timeStr.split(':').map((n) => parseInt(n, 10));
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Determine the timezone shift at this date/time using Intl
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(utcGuess);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const tzYear = parseInt(map.year, 10);
  const tzMonth = parseInt(map.month, 10);
  const tzDay = parseInt(map.day, 10);
  const tzHour = map.hour === '24' ? 0 : parseInt(map.hour, 10);
  const tzMinute = parseInt(map.minute, 10);

  const tzDateInUtc = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0, 0));
  const offsetMs = tzDateInUtc.getTime() - utcGuess.getTime();

  return new Date(utcGuess.getTime() - offsetMs);
};

export default {
  formatDate,
  isValidDateString,
  getTodayDateString,
  isDateInMedicationRange,
  combineDateAndTime,
  compareTimes,
  formatTime12h,
  isValidTimezone,
  getUserDateTime,
  combineDateAndTimeToUTC,
};

