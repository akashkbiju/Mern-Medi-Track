import MedicationLog from '../models/MedicationLog.js';

/**
 * Reminder & Adherence Service Foundation
 */
export const reminderService = {
  getUserReminders: async (userId) => {
    throw new Error('getUserReminders will be implemented in a future step');
  },

  logMedicationStatus: async (logData) => {
    throw new Error('logMedicationStatus will be implemented in a future step');
  },
};

export default reminderService;
