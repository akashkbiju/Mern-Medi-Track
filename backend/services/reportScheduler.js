import cron from 'node-cron';
import User from '../models/User.js';
import { reportService } from './reportService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let cronTask = null;
let isProcessing = false;

/**
 * Process automated recurring reports for all active patients
 */
export const processAutomatedReports = async () => {
  if (isProcessing) {
    logger.warn('[ReportScheduler] Previous automated report cycle still active. Skipping.');
    return;
  }

  isProcessing = true;

  try {
    const isEnabled = process.env.REPORT_GENERATION_ENABLED !== 'false';
    if (!isEnabled) {
      logger.info('[ReportScheduler] Automated report generation is disabled via config.');
      isProcessing = false;
      return;
    }

    const activePatients = await User.find({ role: 'patient', isActive: true }).select('_id fullName').lean();
    logger.info(`[ReportScheduler] Checking automated reports for ${activePatients.length} active patients...`);

    for (const patient of activePatients) {
      try {
        // 1. Weekly automated report check
        await reportService.generateWeeklyReport(patient._id, patient._id);
        // 2. Monthly automated report check
        await reportService.generateMonthlyReport(patient._id, patient._id);
      } catch (patientErr) {
        // Duplicate report checks return gracefully, log errors only
        logger.debug(`[ReportScheduler] Report check for patient ${patient._id}: ${patientErr.message}`);
      }
    }
  } catch (error) {
    logger.error(`[ReportScheduler] Error during automated report cycle: ${error.message}`);
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the background health report scheduler
 * Default cron runs every Sunday at midnight (0 0 * * 0) or configurable
 */
export const startReportScheduler = () => {
  if (cronTask) {
    logger.warn('[ReportScheduler] Scheduler already active.');
    return;
  }

  const cronExpression = process.env.REPORT_CRON_SCHEDULE || '0 0 * * 0'; // Every Sunday at midnight
  const validExpression = cron.validate(cronExpression) ? cronExpression : '0 0 * * 0';

  logger.info(`[ReportScheduler] Initializing automated health report scheduler with cron: "${validExpression}"`);

  cronTask = cron.schedule(validExpression, async () => {
    logger.info('[ReportScheduler] Executing scheduled report generation pass...');
    await processAutomatedReports();
  });
};

export default {
  startReportScheduler,
  processAutomatedReports,
};
