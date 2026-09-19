import mongoose from 'mongoose';
import HealthRecord from '../models/HealthRecord.js';
import { ApiError } from '../utils/ApiError.js';
import { isValidDateString } from '../utils/dateTime.js';

const ALLOWED_MEASUREMENT_TYPES = [
  'weight',
  'bloodPressure',
  'bloodSugar',
  'heartRate',
  'temperature',
];

export const healthService = {
  /**
   * Create a new HealthRecord for the authenticated user
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} inputData - Health measurement payload
   * @returns {Promise<Object>} Created HealthRecord
   */
  createHealthRecord: async (userId, inputData = {}) => {
    // 1. Verify at least one measurement is present in payload
    const bp = inputData.bloodPressure;
    const hasMeasurement =
      (inputData.weight !== undefined && inputData.weight !== null && inputData.weight !== '') ||
      (bp && (bp.systolic !== undefined || bp.diastolic !== undefined)) ||
      (inputData.bloodSugar !== undefined && inputData.bloodSugar !== null && inputData.bloodSugar !== '') ||
      (inputData.heartRate !== undefined && inputData.heartRate !== null && inputData.heartRate !== '') ||
      (inputData.temperature !== undefined && inputData.temperature !== null && inputData.temperature !== '');

    if (!hasMeasurement) {
      throw new ApiError(
        400,
        'At least one health measurement (weight, bloodPressure, bloodSugar, heartRate, or temperature) is required'
      );
    }

    // 2. Validate and parse record date (defaults to now)
    let recordDate = new Date();
    if (inputData.recordDate) {
      const parsedDate = new Date(inputData.recordDate);
      if (isNaN(parsedDate.getTime())) {
        throw new ApiError(400, 'Invalid recordDate format');
      }
      const maxAllowedFuture = Date.now() + 5 * 60 * 1000;
      if (parsedDate.getTime() > maxAllowedFuture) {
        throw new ApiError(400, 'Record date cannot be in the future');
      }
      recordDate = parsedDate;
    }

    // 3. Construct sanitized data explicitly (prevent mass assignment)
    const sanitizedData = {
      user: userId,
      recordDate,
    };

    if (inputData.weight !== undefined && inputData.weight !== null && inputData.weight !== '') {
      const num = Number(inputData.weight);
      if (isNaN(num) || !isFinite(num) || num < 1 || num > 500) {
        throw new ApiError(400, 'Weight must be a valid number between 1 and 500 kg');
      }
      sanitizedData.weight = num;
    }

    if (bp) {
      if (typeof bp !== 'object' || Array.isArray(bp)) {
        throw new ApiError(400, 'bloodPressure must be an object with systolic and diastolic values');
      }
      const sys = Number(bp.systolic);
      const dia = Number(bp.diastolic);

      if (isNaN(sys) || !isFinite(sys) || isNaN(dia) || !isFinite(dia)) {
        throw new ApiError(400, 'Both systolic and diastolic blood pressure must be valid numbers');
      }
      if (sys < 40 || sys > 300) {
        throw new ApiError(400, 'Systolic blood pressure must be between 40 and 300 mmHg');
      }
      if (dia < 30 || dia > 200) {
        throw new ApiError(400, 'Diastolic blood pressure must be between 30 and 200 mmHg');
      }
      if (sys <= dia) {
        throw new ApiError(400, 'Systolic blood pressure must be greater than diastolic blood pressure');
      }

      sanitizedData.bloodPressure = { systolic: sys, diastolic: dia };
    }

    if (inputData.bloodSugar !== undefined && inputData.bloodSugar !== null && inputData.bloodSugar !== '') {
      const num = Number(inputData.bloodSugar);
      if (isNaN(num) || !isFinite(num) || num < 20 || num > 1000) {
        throw new ApiError(400, 'Blood sugar must be a valid number between 20 and 1000 mg/dL');
      }
      sanitizedData.bloodSugar = num;
    }

    if (inputData.heartRate !== undefined && inputData.heartRate !== null && inputData.heartRate !== '') {
      const num = Number(inputData.heartRate);
      if (isNaN(num) || !isFinite(num) || num < 20 || num > 300) {
        throw new ApiError(400, 'Heart rate must be a valid number between 20 and 300 BPM');
      }
      sanitizedData.heartRate = num;
    }

    if (inputData.temperature !== undefined && inputData.temperature !== null && inputData.temperature !== '') {
      const num = Number(inputData.temperature);
      if (isNaN(num) || !isFinite(num) || num < 25 || num > 45) {
        throw new ApiError(400, 'Temperature must be a valid number between 25 and 45 °C');
      }
      sanitizedData.temperature = num;
    }

    if (inputData.notes !== undefined && inputData.notes !== null) {
      if (typeof inputData.notes !== 'string') {
        throw new ApiError(400, 'Notes must be text');
      }
      if (inputData.notes.length > 1000) {
        throw new ApiError(400, 'Notes cannot exceed 1000 characters');
      }
      sanitizedData.notes = inputData.notes.trim();
    }

    const record = await HealthRecord.create(sanitizedData);
    return record;
  },

  /**
   * Retrieve paginated health records belonging strictly to the authenticated user
   *
   * @param {string} userId - Authenticated user ID
   * @param {Object} query - { page, limit, date, startDate, endDate, type }
   * @returns {Promise<Object>} { records, pagination }
   */
  getHealthRecords: async (userId, query = {}) => {
    // Prevent query injection: enforce strict user filter
    const filter = { user: userId };

    // Date filtering
    if (query.date) {
      if (!isValidDateString(query.date)) {
        throw new ApiError(400, 'Invalid date filter format. Expected YYYY-MM-DD');
      }
      filter.recordDate = {
        $gte: new Date(`${query.date}T00:00:00.000Z`),
        $lte: new Date(`${query.date}T23:59:59.999Z`),
      };
    } else if (query.startDate || query.endDate) {
      filter.recordDate = {};
      if (query.startDate) {
        if (!isValidDateString(query.startDate)) {
          throw new ApiError(400, 'Invalid startDate filter format. Expected YYYY-MM-DD');
        }
        filter.recordDate.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
      }
      if (query.endDate) {
        if (!isValidDateString(query.endDate)) {
          throw new ApiError(400, 'Invalid endDate filter format. Expected YYYY-MM-DD');
        }
        filter.recordDate.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
      }
      if (query.startDate && query.endDate && query.startDate > query.endDate) {
        throw new ApiError(400, 'startDate cannot be after endDate');
      }
    }

    // Measurement type whitelist filter
    if (query.type) {
      if (!ALLOWED_MEASUREMENT_TYPES.includes(query.type)) {
        throw new ApiError(
          400,
          `Invalid measurement type '${query.type}'. Allowed types: ${ALLOWED_MEASUREMENT_TYPES.join(', ')}`
        );
      }
      if (query.type === 'bloodPressure') {
        filter['bloodPressure.systolic'] = { $exists: true, $ne: null };
      } else {
        filter[query.type] = { $exists: true, $ne: null };
      }
    }

    // Pagination configuration
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      HealthRecord.find(filter)
        .sort({ recordDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      HealthRecord.countDocuments(filter),
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Retrieve a single HealthRecord by ID verifying user ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} recordId - HealthRecord ID
   * @returns {Promise<Object>}
   */
  getHealthRecordById: async (userId, recordId) => {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new ApiError(400, 'Invalid health record ID format');
    }

    const record = await HealthRecord.findOne({ _id: recordId, user: userId }).lean();
    if (!record) {
      throw new ApiError(404, 'Health record not found');
    }

    return record;
  },

  /**
   * Update an existing HealthRecord verifying ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} recordId - HealthRecord ID
   * @param {Object} updateData - Modified fields
   * @returns {Promise<Object>} Updated HealthRecord
   */
  updateHealthRecord: async (userId, recordId, updateData = {}) => {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new ApiError(400, 'Invalid health record ID format');
    }

    const record = await HealthRecord.findOne({ _id: recordId, user: userId });
    if (!record) {
      throw new ApiError(404, 'Health record not found');
    }

    // Prevent modification of immutable fields
    if (updateData.user || updateData.userId || updateData._id || updateData.createdAt) {
      throw new ApiError(400, 'Cannot modify immutable system fields (user, _id, createdAt)');
    }

    // Apply allowed updates
    if (updateData.recordDate !== undefined) {
      const parsedDate = new Date(updateData.recordDate);
      if (isNaN(parsedDate.getTime())) {
        throw new ApiError(400, 'Invalid recordDate format');
      }
      const maxAllowedFuture = Date.now() + 5 * 60 * 1000;
      if (parsedDate.getTime() > maxAllowedFuture) {
        throw new ApiError(400, 'Record date cannot be in the future');
      }
      record.recordDate = parsedDate;
    }

    if (updateData.weight !== undefined) {
      if (updateData.weight === null || updateData.weight === '') {
        record.weight = undefined;
      } else {
        const num = Number(updateData.weight);
        if (isNaN(num) || !isFinite(num) || num < 1 || num > 500) {
          throw new ApiError(400, 'Weight must be a valid number between 1 and 500 kg');
        }
        record.weight = num;
      }
    }

    if (updateData.bloodPressure !== undefined) {
      if (updateData.bloodPressure === null) {
        record.bloodPressure = undefined;
      } else {
        const bp = updateData.bloodPressure;
        if (typeof bp !== 'object' || Array.isArray(bp)) {
          throw new ApiError(400, 'bloodPressure must be an object with systolic and diastolic values');
        }
        const sys = Number(bp.systolic);
        const dia = Number(bp.diastolic);

        if (isNaN(sys) || !isFinite(sys) || isNaN(dia) || !isFinite(dia)) {
          throw new ApiError(400, 'Both systolic and diastolic blood pressure must be valid numbers');
        }
        if (sys < 40 || sys > 300) {
          throw new ApiError(400, 'Systolic blood pressure must be between 40 and 300 mmHg');
        }
        if (dia < 30 || dia > 200) {
          throw new ApiError(400, 'Diastolic blood pressure must be between 30 and 200 mmHg');
        }
        if (sys <= dia) {
          throw new ApiError(400, 'Systolic blood pressure must be greater than diastolic blood pressure');
        }
        record.bloodPressure = { systolic: sys, diastolic: dia };
      }
    }

    if (updateData.bloodSugar !== undefined) {
      if (updateData.bloodSugar === null || updateData.bloodSugar === '') {
        record.bloodSugar = undefined;
      } else {
        const num = Number(updateData.bloodSugar);
        if (isNaN(num) || !isFinite(num) || num < 20 || num > 1000) {
          throw new ApiError(400, 'Blood sugar must be a valid number between 20 and 1000 mg/dL');
        }
        record.bloodSugar = num;
      }
    }

    if (updateData.heartRate !== undefined) {
      if (updateData.heartRate === null || updateData.heartRate === '') {
        record.heartRate = undefined;
      } else {
        const num = Number(updateData.heartRate);
        if (isNaN(num) || !isFinite(num) || num < 20 || num > 300) {
          throw new ApiError(400, 'Heart rate must be a valid number between 20 and 300 BPM');
        }
        record.heartRate = num;
      }
    }

    if (updateData.temperature !== undefined) {
      if (updateData.temperature === null || updateData.temperature === '') {
        record.temperature = undefined;
      } else {
        const num = Number(updateData.temperature);
        if (isNaN(num) || !isFinite(num) || num < 25 || num > 45) {
          throw new ApiError(400, 'Temperature must be a valid number between 25 and 45 °C');
        }
        record.temperature = num;
      }
    }

    if (updateData.notes !== undefined) {
      if (updateData.notes === null || updateData.notes === '') {
        record.notes = '';
      } else {
        if (typeof updateData.notes !== 'string') {
          throw new ApiError(400, 'Notes must be text');
        }
        if (updateData.notes.length > 1000) {
          throw new ApiError(400, 'Notes cannot exceed 1000 characters');
        }
        record.notes = updateData.notes.trim();
      }
    }

    // Ensure resulting record has at least one valid measurement
    const bpResult = record.bloodPressure;
    const hasRemainingMeasurement =
      (record.weight !== undefined && record.weight !== null) ||
      (bpResult && bpResult.systolic !== undefined && bpResult.diastolic !== undefined) ||
      (record.bloodSugar !== undefined && record.bloodSugar !== null) ||
      (record.heartRate !== undefined && record.heartRate !== null) ||
      (record.temperature !== undefined && record.temperature !== null);

    if (!hasRemainingMeasurement) {
      throw new ApiError(
        400,
        'Cannot update record: at least one health measurement must remain'
      );
    }

    await record.save();
    return record;
  },

  /**
   * Delete a HealthRecord verifying ownership
   *
   * @param {string} userId - Authenticated user ID
   * @param {string} recordId - HealthRecord ID
   * @returns {Promise<Object>}
   */
  deleteHealthRecord: async (userId, recordId) => {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      throw new ApiError(400, 'Invalid health record ID format');
    }

    const record = await HealthRecord.findOneAndDelete({ _id: recordId, user: userId });
    if (!record) {
      throw new ApiError(404, 'Health record not found');
    }

    return { success: true, message: 'Health record deleted successfully' };
  },
};

export default healthService;
