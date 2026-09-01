import HealthReport from '../models/HealthReport.js';

/**
 * Health Report Service Foundation
 */
export const reportService = {
  generateReport: async (userId, reportConfig) => {
    throw new Error('generateReport will be implemented in a future step');
  },

  getUserReports: async (userId) => {
    throw new Error('getUserReports will be implemented in a future step');
  },
};

export default reportService;
