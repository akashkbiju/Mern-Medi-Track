import { healthAnalyticsService } from './healthAnalyticsService.js';
import { adherenceService } from './adherenceService.js';

/**
 * Health & Adherence Analytics Service
 */
export const analyticsService = {
  calculateAdherence: adherenceService.calculateAdherence,
  getAdherenceSummary: adherenceService.getAdherenceSummary,
  getHealthAnalytics: healthAnalyticsService.getHealthAnalytics,
  getHealthSummary: healthAnalyticsService.getHealthSummary,
};

export default analyticsService;
