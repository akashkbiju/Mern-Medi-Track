import cron from 'node-cron';
import { reminderService } from './reminderService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let cronTask = null;
let isProcessing = false;

/**
 * Start the background medication reminder scheduler
 * Automatically performs an immediate recovery pass for missed reminders upon startup,
 * then registers the recurring cron job according to REMINDER_CRON_SCHEDULE.
 */
export const startReminderScheduler = async () => {
  if (cronTask) {
    logger.warn('[ReminderScheduler] Scheduler already active. Skipping duplicate initialization.');
    return;
  }

  const scheduleExpression = env.REMINDER_CRON_SCHEDULE || '* * * * *';

  if (!cron.validate(scheduleExpression)) {
    logger.error(
      `[ReminderScheduler] Invalid cron expression '${scheduleExpression}'. Falling back to '* * * * *'.`
    );
  }

  const validExpression = cron.validate(scheduleExpression) ? scheduleExpression : '* * * * *';

  logger.info(
    `[ReminderScheduler] Initializing medication reminder scheduler with cron: "${validExpression}"`
  );

  // 1. Immediate server restart recovery run
  try {
    logger.info(
      `[ReminderScheduler] Executing startup recovery check (Recovery window: ${env.REMINDER_RECOVERY_MINUTES} minutes)...`
    );
    await reminderService.processScheduledReminders({
      recoveryMinutes: env.REMINDER_RECOVERY_MINUTES,
      lookaheadMinutes: 60,
    });
  } catch (startupErr) {
    logger.error(
      `[ReminderScheduler] Error during initial recovery pass: ${startupErr.message}`
    );
  }

  // 2. Schedule recurring job
  cronTask = cron.schedule(validExpression, async () => {
    if (isProcessing) {
      logger.warn('[ReminderScheduler] Previous reminder processing cycle still active. Skipping.');
      return;
    }

    isProcessing = true;
    try {
      await reminderService.processScheduledReminders({
        lookaheadMinutes: 60,
        recoveryMinutes: env.REMINDER_RECOVERY_MINUTES,
      });
    } catch (cycleErr) {
      logger.error(`[ReminderScheduler] Error in reminder cycle: ${cycleErr.message}`);
    } finally {
      isProcessing = false;
    }
  });

  logger.info('[ReminderScheduler] Background medication reminder scheduler running.');
};

/**
 * Gracefully stop the reminder scheduler
 */
export const stopReminderScheduler = () => {
  if (cronTask) {
    logger.info('[ReminderScheduler] Stopping background reminder scheduler...');
    cronTask.stop();
    cronTask = null;
    isProcessing = false;
    logger.info('[ReminderScheduler] Scheduler stopped successfully.');
  }
};

export default {
  startReminderScheduler,
  stopReminderScheduler,
};
