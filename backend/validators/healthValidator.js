import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { isValidDateString } from '../utils/dateTime.js';

const ALLOWED_TYPES = ['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature'];

/**
 * Validate health record creation payload
 */
export const validateCreateHealthRecord = (req, res, next) => {
  const {
    recordDate,
    weight,
    bloodPressure,
    bloodSugar,
    heartRate,
    temperature,
    notes,
  } = req.body;

  // 1. Partial record verification: at least one measurement must be present
  const hasMeasurement =
    (weight !== undefined && weight !== null && weight !== '') ||
    (bloodPressure && (bloodPressure.systolic !== undefined || bloodPressure.diastolic !== undefined)) ||
    (bloodSugar !== undefined && bloodSugar !== null && bloodSugar !== '') ||
    (heartRate !== undefined && heartRate !== null && heartRate !== '') ||
    (temperature !== undefined && temperature !== null && temperature !== '');

  if (!hasMeasurement) {
    return next(
      new ApiError(
        400,
        'At least one health measurement (weight, bloodPressure, bloodSugar, heartRate, or temperature) is required'
      )
    );
  }

  // 2. Validate record date if provided
  if (recordDate !== undefined && recordDate !== null) {
    const parsed = new Date(recordDate);
    if (isNaN(parsed.getTime())) {
      return next(new ApiError(400, 'Invalid recordDate format'));
    }
    const maxFuture = Date.now() + 5 * 60 * 1000;
    if (parsed.getTime() > maxFuture) {
      return next(new ApiError(400, 'Record date cannot be in the future'));
    }
  }

  // 3. Validate weight
  if (weight !== undefined && weight !== null && weight !== '') {
    const num = Number(weight);
    if (isNaN(num) || !isFinite(num) || num < 1 || num > 500) {
      return next(new ApiError(400, 'Weight must be a valid number between 1 and 500 kg'));
    }
  }

  // 4. Validate blood pressure
  if (bloodPressure !== undefined && bloodPressure !== null) {
    if (typeof bloodPressure !== 'object' || Array.isArray(bloodPressure)) {
      return next(new ApiError(400, 'bloodPressure must be an object with systolic and diastolic numbers'));
    }
    const { systolic, diastolic } = bloodPressure;
    if (systolic === undefined || diastolic === undefined || systolic === null || diastolic === null) {
      return next(new ApiError(400, 'Both systolic and diastolic blood pressure are required when bloodPressure is provided'));
    }
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (isNaN(sys) || !isFinite(sys) || isNaN(dia) || !isFinite(dia)) {
      return next(new ApiError(400, 'Systolic and diastolic blood pressure must be valid numbers'));
    }
    if (sys < 40 || sys > 300) {
      return next(new ApiError(400, 'Systolic blood pressure must be between 40 and 300 mmHg'));
    }
    if (dia < 30 || dia > 200) {
      return next(new ApiError(400, 'Diastolic blood pressure must be between 30 and 200 mmHg'));
    }
    if (sys <= dia) {
      return next(new ApiError(400, 'Systolic blood pressure must be greater than diastolic blood pressure'));
    }
  }

  // 5. Validate blood sugar
  if (bloodSugar !== undefined && bloodSugar !== null && bloodSugar !== '') {
    const num = Number(bloodSugar);
    if (isNaN(num) || !isFinite(num) || num < 20 || num > 1000) {
      return next(new ApiError(400, 'Blood sugar must be a valid number between 20 and 1000 mg/dL'));
    }
  }

  // 6. Validate heart rate
  if (heartRate !== undefined && heartRate !== null && heartRate !== '') {
    const num = Number(heartRate);
    if (isNaN(num) || !isFinite(num) || num < 20 || num > 300) {
      return next(new ApiError(400, 'Heart rate must be a valid number between 20 and 300 BPM'));
    }
  }

  // 7. Validate temperature
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const num = Number(temperature);
    if (isNaN(num) || !isFinite(num) || num < 25 || num > 45) {
      return next(new ApiError(400, 'Temperature must be a valid number between 25 and 45 °C'));
    }
  }

  // 8. Validate notes
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return next(new ApiError(400, 'Notes must be a string'));
    }
    if (notes.length > 1000) {
      return next(new ApiError(400, 'Notes cannot exceed 1000 characters'));
    }
  }

  next();
};

/**
 * Validate health record update payload
 */
export const validateUpdateHealthRecord = (req, res, next) => {
  const {
    user,
    userId,
    _id,
    createdAt,
    recordDate,
    weight,
    bloodPressure,
    bloodSugar,
    heartRate,
    temperature,
    notes,
  } = req.body;

  // 1. Prevent modification of immutable fields
  if (user || userId || _id || createdAt) {
    return next(new ApiError(400, 'Cannot modify immutable system fields (user, _id, createdAt)'));
  }

  // 2. Validate record date if provided
  if (recordDate !== undefined && recordDate !== null) {
    const parsed = new Date(recordDate);
    if (isNaN(parsed.getTime())) {
      return next(new ApiError(400, 'Invalid recordDate format'));
    }
    const maxFuture = Date.now() + 5 * 60 * 1000;
    if (parsed.getTime() > maxFuture) {
      return next(new ApiError(400, 'Record date cannot be in the future'));
    }
  }

  // 3. Validate weight if provided
  if (weight !== undefined && weight !== null && weight !== '') {
    const num = Number(weight);
    if (isNaN(num) || !isFinite(num) || num < 1 || num > 500) {
      return next(new ApiError(400, 'Weight must be a valid number between 1 and 500 kg'));
    }
  }

  // 4. Validate blood pressure if provided
  if (bloodPressure !== undefined && bloodPressure !== null) {
    if (typeof bloodPressure !== 'object' || Array.isArray(bloodPressure)) {
      return next(new ApiError(400, 'bloodPressure must be an object with systolic and diastolic numbers'));
    }
    const { systolic, diastolic } = bloodPressure;
    if (systolic === undefined || diastolic === undefined || systolic === null || diastolic === null) {
      return next(new ApiError(400, 'Both systolic and diastolic blood pressure are required when bloodPressure is provided'));
    }
    const sys = Number(systolic);
    const dia = Number(diastolic);
    if (isNaN(sys) || !isFinite(sys) || isNaN(dia) || !isFinite(dia)) {
      return next(new ApiError(400, 'Systolic and diastolic blood pressure must be valid numbers'));
    }
    if (sys < 40 || sys > 300) {
      return next(new ApiError(400, 'Systolic blood pressure must be between 40 and 300 mmHg'));
    }
    if (dia < 30 || dia > 200) {
      return next(new ApiError(400, 'Diastolic blood pressure must be between 30 and 200 mmHg'));
    }
    if (sys <= dia) {
      return next(new ApiError(400, 'Systolic blood pressure must be greater than diastolic blood pressure'));
    }
  }

  // 5. Validate blood sugar
  if (bloodSugar !== undefined && bloodSugar !== null && bloodSugar !== '') {
    const num = Number(bloodSugar);
    if (isNaN(num) || !isFinite(num) || num < 20 || num > 1000) {
      return next(new ApiError(400, 'Blood sugar must be a valid number between 20 and 1000 mg/dL'));
    }
  }

  // 6. Validate heart rate
  if (heartRate !== undefined && heartRate !== null && heartRate !== '') {
    const num = Number(heartRate);
    if (isNaN(num) || !isFinite(num) || num < 20 || num > 300) {
      return next(new ApiError(400, 'Heart rate must be a valid number between 20 and 300 BPM'));
    }
  }

  // 7. Validate temperature
  if (temperature !== undefined && temperature !== null && temperature !== '') {
    const num = Number(temperature);
    if (isNaN(num) || !isFinite(num) || num < 25 || num > 45) {
      return next(new ApiError(400, 'Temperature must be a valid number between 25 and 45 °C'));
    }
  }

  // 8. Validate notes
  if (notes !== undefined && notes !== null && notes !== '') {
    if (typeof notes !== 'string') {
      return next(new ApiError(400, 'Notes must be a string'));
    }
    if (notes.length > 1000) {
      return next(new ApiError(400, 'Notes cannot exceed 1000 characters'));
    }
  }

  next();
};

/**
 * Validate query parameters for GET /api/health-records
 */
export const validateHealthRecordQuery = (req, res, next) => {
  const { page, limit, date, startDate, endDate, type } = req.query;

  if (page !== undefined) {
    const p = Number(page);
    if (isNaN(p) || !Number.isInteger(p) || p < 1) {
      return next(new ApiError(400, 'Page parameter must be a positive integer'));
    }
  }

  if (limit !== undefined) {
    const l = Number(limit);
    if (isNaN(l) || !Number.isInteger(l) || l < 1) {
      return next(new ApiError(400, 'Limit parameter must be a positive integer'));
    }
    if (l > 50) {
      return next(new ApiError(400, 'Limit cannot exceed maximum of 50 records per page'));
    }
  }

  if (date !== undefined) {
    if (!isValidDateString(date)) {
      return next(new ApiError(400, 'Invalid date filter format. Expected YYYY-MM-DD'));
    }
  }

  if (startDate !== undefined) {
    if (!isValidDateString(startDate)) {
      return next(new ApiError(400, 'Invalid startDate filter format. Expected YYYY-MM-DD'));
    }
  }

  if (endDate !== undefined) {
    if (!isValidDateString(endDate)) {
      return next(new ApiError(400, 'Invalid endDate filter format. Expected YYYY-MM-DD'));
    }
  }

  if (startDate && endDate && startDate > endDate) {
    return next(new ApiError(400, 'startDate cannot be after endDate'));
  }

  if (type !== undefined) {
    if (!ALLOWED_TYPES.includes(type)) {
      return next(
        new ApiError(
          400,
          `Invalid measurement type filter '${type}'. Allowed types: ${ALLOWED_TYPES.join(', ')}`
        )
      );
    }
  }

  next();
};

/**
 * Validate MongoDB ObjectId in req.params.id
 */
export const validateRecordId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return next(new ApiError(400, 'Invalid health record ID format'));
  }
  next();
};

export default {
  validateCreateHealthRecord,
  validateUpdateHealthRecord,
  validateHealthRecordQuery,
  validateRecordId,
};
