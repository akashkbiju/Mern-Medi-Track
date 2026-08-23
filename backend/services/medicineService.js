import Medicine from '../models/Medicine.js';
import { ApiError } from '../utils/ApiError.js';

export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const ALLOWED_DOSAGE_UNITS = [
  'mg',
  'g',
  'mcg',
  'ml',
  'tablet',
  'capsule',
  'drop',
  'puff',
  'unit',
];

export const FREQUENCY_TIMES_MAP = {
  once_daily: 1,
  twice_daily: 2,
  three_times_daily: 3,
  four_times_daily: 4,
};

/**
 * Validates frequency and medication times compatibility
 * @param {string} frequency - e.g. 'once_daily', 'twice_daily', 'custom'
 * @param {Array<string>} times - Array of HH:mm strings
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateSchedule = (frequency, times) => {
  if (!Array.isArray(times) || times.length === 0) {
    return { valid: false, error: 'Medication times must be a non-empty array' };
  }

  // Verify time format (24-hour HH:mm)
  for (const time of times) {
    if (typeof time !== 'string' || !TIME_REGEX.test(time)) {
      return {
        valid: false,
        error: `Invalid medication time "${time}". Times must follow 24-hour HH:mm format (e.g., 08:00, 20:00)`,
      };
    }
  }

  // Check for duplicate times
  const uniqueTimes = new Set(times);
  if (uniqueTimes.size !== times.length) {
    return { valid: false, error: 'Medication times array cannot contain duplicate times' };
  }

  // Enforce frequency-to-times matching
  if (FREQUENCY_TIMES_MAP[frequency]) {
    const expectedCount = FREQUENCY_TIMES_MAP[frequency];
    if (times.length !== expectedCount) {
      return {
        valid: false,
        error: `Frequency "${frequency}" requires exactly ${expectedCount} medication time(s), but received ${times.length}`,
      };
    }
  } else if (frequency === 'custom') {
    if (times.length < 1 || times.length > 12) {
      return {
        valid: false,
        error: 'Custom frequency must have between 1 and 12 medication times per day',
      };
    }
  } else {
    return { valid: false, error: `Unsupported medication frequency: "${frequency}"` };
  }

  return { valid: true };
};

/**
 * Validates start and end date boundaries
 * @param {Date|string} startDate
 * @param {Date|string|null} endDate
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate) {
    return { valid: false, error: 'Start date is required' };
  }

  const start = new Date(startDate);
  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Start date must be a valid date' };
  }

  if (endDate !== undefined && endDate !== null && endDate !== '') {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return { valid: false, error: 'End date must be a valid date' };
    }
    if (end.getTime() < start.getTime()) {
      return { valid: false, error: 'End date cannot be earlier than start date' };
    }
  }

  return { valid: true };
};

/**
 * Normalizes medicine input data to standard formats
 * @param {Object} data
 * @returns {Object} Normalized medicine payload
 */
export const normalizeMedicineData = (data = {}) => {
  const normalized = { ...data };

  if (typeof normalized.name === 'string') {
    normalized.name = normalized.name.trim();
  }

  if (typeof normalized.genericName === 'string') {
    normalized.genericName = normalized.genericName.trim();
  }

  if (normalized.dosage !== undefined && normalized.dosage !== null) {
    normalized.dosage = Number(normalized.dosage);
  }

  if (typeof normalized.dosageUnit === 'string') {
    normalized.dosageUnit = normalized.dosageUnit.trim().toLowerCase();
  }

  if (Array.isArray(normalized.times)) {
    // Sort times chronologically and remove duplicate entries
    normalized.times = Array.from(new Set(normalized.times.map((t) => (typeof t === 'string' ? t.trim() : t))))
      .filter((t) => TIME_REGEX.test(t))
      .sort();
  }

  if (typeof normalized.instructions === 'string') {
    normalized.instructions = normalized.instructions.trim();
  }

  if (typeof normalized.notes === 'string') {
    normalized.notes = normalized.notes.trim();
  }

  if (normalized.startDate) {
    normalized.startDate = new Date(normalized.startDate);
  }

  if (normalized.endDate) {
    normalized.endDate = new Date(normalized.endDate);
  } else if (normalized.endDate === '' || normalized.endDate === undefined) {
    normalized.endDate = null;
  }

  return normalized;
};

/**
 * Validates complete medicine data object
 * @param {Object} data
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export const validateMedicineData = (data = {}) => {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('Medicine name is required');
  }

  if (data.dosage === undefined || data.dosage === null || isNaN(Number(data.dosage)) || Number(data.dosage) <= 0) {
    errors.push('Dosage must be a positive number');
  }

  if (!data.dosageUnit || !ALLOWED_DOSAGE_UNITS.includes(String(data.dosageUnit).trim().toLowerCase())) {
    errors.push(`Dosage unit must be one of: ${ALLOWED_DOSAGE_UNITS.join(', ')}`);
  }

  const scheduleCheck = validateSchedule(data.frequency, data.times);
  if (!scheduleCheck.valid) {
    errors.push(scheduleCheck.error);
  }

  const dateCheck = validateDateRange(data.startDate, data.endDate);
  if (!dateCheck.valid) {
    errors.push(dateCheck.error);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Medicine Service Foundation
 * Encapsulates CRUD and interaction logic for user medications
 */
export const medicineService = {
  validateSchedule,
  validateDateRange,
  normalizeMedicineData,
  validateMedicineData,

  getAllMedicines: async (userId) => {
    throw new ApiError(501, 'Medicine list retrieval will be implemented in Step 9');
  },

  getMedicineById: async (userId, medicineId) => {
    throw new ApiError(501, 'Medicine retrieval by ID will be implemented in Step 9');
  },

  createMedicine: async (userId, medicineData) => {
    throw new ApiError(501, 'Medicine creation will be implemented in Step 9');
  },

  updateMedicine: async (userId, medicineId, updateData) => {
    throw new ApiError(501, 'Medicine update will be implemented in Step 9');
  },

  deleteMedicine: async (userId, medicineId) => {
    throw new ApiError(501, 'Medicine deletion will be implemented in Step 9');
  },
};

export default medicineService;
