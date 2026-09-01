import { reminderService } from '../services/reminderService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Retrieve today's medication reminders for authenticated user
 * GET /api/reminders/today
 */
export const getTodayReminders = asyncHandler(async (req, res) => {
  const reminders = await reminderService.generateRemindersForDate(req.user.id);
  return ApiResponse.success(
    res,
    "Today's medication reminders retrieved successfully",
    { reminders, count: reminders.length },
    200
  );
});

/**
 * Retrieve upcoming medication reminders for authenticated user within lookahead window
 * GET /api/reminders/upcoming?hours=24
 */
export const getUpcomingReminders = asyncHandler(async (req, res) => {
  const hours = req.query.hours ? parseInt(req.query.hours, 10) : undefined;
  const reminders = await reminderService.generateUpcomingReminders(req.user.id, hours);
  return ApiResponse.success(
    res,
    'Upcoming medication reminders retrieved successfully',
    { reminders, count: reminders.length },
    200
  );
});

/**
 * Retrieve reminders history with safe filtering & pagination
 * GET /api/reminders?date=YYYY-MM-DD&isRead=false&medicineId=...
 */
export const getReminders = asyncHandler(async (req, res) => {
  const result = await reminderService.getUserReminders(req.user.id, req.query);
  return ApiResponse.success(res, 'Reminders retrieved successfully', result, 200);
});

/**
 * Mark a specific reminder notification as read
 * PATCH /api/reminders/:id/read
 */
export const markReminderAsRead = asyncHandler(async (req, res) => {
  const reminder = await reminderService.markReminderAsRead(req.user.id, req.params.id);
  return ApiResponse.success(res, 'Reminder marked as read', { reminder }, 200);
});

/**
 * Authenticated processing trigger
 * POST /api/reminders/process
 */
export const processReminders = asyncHandler(async (req, res) => {
  // If admin, can execute full system batch run
  if (req.user.role === 'admin') {
    const summary = await reminderService.processScheduledReminders(req.body);
    return ApiResponse.success(res, 'System reminder cycle processed successfully', summary, 200);
  }

  // Normal patient: synchronize current user's today and upcoming reminders
  const [todayReminders, upcomingReminders] = await Promise.all([
    reminderService.generateRemindersForDate(req.user.id),
    reminderService.generateUpcomingReminders(req.user.id),
  ]);

  return ApiResponse.success(
    res,
    'User reminders synchronized successfully',
    {
      todayCount: todayReminders.length,
      upcomingCount: upcomingReminders.length,
    },
    200
  );
});

export default {
  getTodayReminders,
  getUpcomingReminders,
  getReminders,
  markReminderAsRead,
  processReminders,
};
