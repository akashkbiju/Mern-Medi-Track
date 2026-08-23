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
 * Sanitizes a Medicine document into a safe, consistent representation
 * @param {Object} medicine - Mongoose document or plain object
 * @returns {Object} Sanitized medicine object
 */
export const sanitizeMedicine = (medicine) => {
  if (!medicine) return null;
  const raw = typeof medicine.toObject === 'function' ? medicine.toObject() : medicine;

  return {
    id: (raw._id || raw.id).toString(),
    user: (raw.user?._id || raw.user || '').toString(),
    name: raw.name,
    genericName: raw.genericName || '',
    dosage: raw.dosage,
    dosageUnit: raw.dosageUnit,
    frequency: raw.frequency,
    times: raw.times || [],
    startDate: raw.startDate,
    endDate: raw.endDate || null,
    instructions: raw.instructions || '',
    notes: raw.notes || '',
    isActive: Boolean(raw.isActive),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
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
 * Medicine Service
 * Encapsulates CRUD and interaction logic for user medications
 */
export const medicineService = {
  validateSchedule,
  validateDateRange,
  normalizeMedicineData,
  validateMedicineData,
  sanitizeMedicine,

  /**
   * Retrieve all medicines for the authenticated user with optional status and search filtering
   * @param {string} userId - Authenticated user ID
   * @param {Object} options - { status, search, page, limit }
   */
  getMedicines: async (userId, { status = 'active', search = '', page = 1, limit = 20 } = {}) => {
    const query = { user: userId };

    // Status filter: 'active' (default), 'inactive', or 'all'
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    // 'all' allows both active and inactive

    // Search filter: case-insensitive match on name or genericName
    if (typeof search === 'string' && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { genericName: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, medicines] = await Promise.all([
      Medicine.countDocuments(query),
      Medicine.find(query)
        .sort({ isActive: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return {
      medicines: medicines.map(sanitizeMedicine),
      count: medicines.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  },

  /**
   * Get single medicine by ID with ownership verification
   * @param {string} userId - Authenticated user ID
   * @param {string} medicineId - Target medicine ObjectId
   */
  getMedicineById: async (userId, medicineId) => {
    const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
    if (!medicine) {
      throw new ApiError(404, 'Medicine not found');
    }
    return sanitizeMedicine(medicine);
  },

  /**
   * Create a new medicine under the authenticated user
   * @param {string} userId - Authenticated user ID
   * @param {Object} medicineData - Medicine payload
   */
  createMedicine: async (userId, medicineData) => {
    const normalized = normalizeMedicineData(medicineData);
    const validation = validateMedicineData(normalized);

    if (!validation.valid) {
      throw new ApiError(400, validation.errors[0] || 'Invalid medicine data', validation.errors);
    }

    // Explicit field assignment prevents mass-assignment vulnerabilities
    const newMedicine = await Medicine.create({
      user: userId,
      name: normalized.name,
      genericName: normalized.genericName || '',
      dosage: normalized.dosage,
      dosageUnit: normalized.dosageUnit,
      frequency: normalized.frequency,
      times: normalized.times,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      instructions: normalized.instructions || '',
      notes: normalized.notes || '',
      isActive: true,
    });

    return sanitizeMedicine(newMedicine);
  },

  /**
   * Update an existing medicine with ownership verification
   * @param {string} userId - Authenticated user ID
   * @param {string} medicineId - Target medicine ObjectId
   * @param {Object} updateData - Updated fields
   */
  updateMedicine: async (userId, medicineId, updateData = {}) => {
    const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
    if (!medicine) {
      throw new ApiError(404, 'Medicine not found');
    }

    const normalized = normalizeMedicineData(updateData);

    // If frequency or times are being updated, validate their mutual consistency
    const frequency = normalized.frequency || medicine.frequency;
    const times = normalized.times && normalized.times.length > 0 ? normalized.times : medicine.times;
    const scheduleCheck = validateSchedule(frequency, times);
    if (!scheduleCheck.valid) {
      throw new ApiError(400, scheduleCheck.error);
    }

    // If dates are being updated, validate date boundaries
    const startDate = normalized.startDate || medicine.startDate;
    const endDate = normalized.endDate !== undefined ? normalized.endDate : medicine.endDate;
    const dateCheck = validateDateRange(startDate, endDate);
    if (!dateCheck.valid) {
      throw new ApiError(400, dateCheck.error);
    }

    // Explicit field assignment
    if (normalized.name !== undefined) medicine.name = normalized.name;
    if (normalized.genericName !== undefined) medicine.genericName = normalized.genericName;
    if (normalized.dosage !== undefined) medicine.dosage = normalized.dosage;
    if (normalized.dosageUnit !== undefined) medicine.dosageUnit = normalized.dosageUnit;
    if (normalized.frequency !== undefined) medicine.frequency = normalized.frequency;
    if (normalized.times !== undefined) medicine.times = normalized.times;
    if (normalized.startDate !== undefined) medicine.startDate = normalized.startDate;
    if (normalized.endDate !== undefined) medicine.endDate = normalized.endDate;
    if (normalized.instructions !== undefined) medicine.instructions = normalized.instructions;
    if (normalized.notes !== undefined) medicine.notes = normalized.notes;

    await medicine.save();
    return sanitizeMedicine(medicine);
  },

  /**
   * Soft-deactivate a medicine (maintains history for future analytics and logs)
   * @param {string} userId - Authenticated user ID
   * @param {string} medicineId - Target medicine ObjectId
   */
  deactivateMedicine: async (userId, medicineId) => {
    const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
    if (!medicine) {
      throw new ApiError(404, 'Medicine not found');
    }

    medicine.isActive = false;
    await medicine.save();

    return sanitizeMedicine(medicine);
  },

  /**
   * Reactivate an inactive medicine
   * @param {string} userId - Authenticated user ID
   * @param {string} medicineId - Target medicine ObjectId
   */
  activateMedicine: async (userId, medicineId) => {
    const medicine = await Medicine.findOne({ _id: medicineId, user: userId });
    if (!medicine) {
      throw new ApiError(404, 'Medicine not found');
    }

    medicine.isActive = true;
    await medicine.save();

    return sanitizeMedicine(medicine);
  },
};

export default medicineService;
