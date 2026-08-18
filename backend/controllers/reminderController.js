import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Medication Reminder & Log Controller Foundation
 */
export const getReminders = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medication reminders API will be implemented in a later development step')
  );
});

export const logMedication = asyncHandler(async (req, res) => {
  return res.status(501).json(
    new ApiResponse(false, 'Medication logging API will be implemented in a later development step')
  );
});

export default { getReminders, logMedication };
