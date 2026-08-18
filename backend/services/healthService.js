import HealthRecord from '../models/HealthRecord.js';

/**
 * Health Record Service Foundation
 */
export const healthService = {
  getHealthRecords: async (userId, filters) => {
    throw new Error('getHealthRecords will be implemented in a future step');
  },

  createHealthRecord: async (userId, recordData) => {
    throw new Error('createHealthRecord will be implemented in a future step');
  },
};

export default healthService;
