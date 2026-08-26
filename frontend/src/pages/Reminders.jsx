import { useState, useEffect } from 'react';
import { Bell, BellRing, CheckCircle2, Clock, Pill, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import ReminderList from '../components/reminders/ReminderList';
import { getTodayReminders, getUpcomingReminders, getReminders } from '../services/reminderApi';

const Reminders = () => {
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchOverviewStats = async () => {
    try {
      const [todayRes, upcomingRes, unreadRes] = await Promise.all([
        getTodayReminders(),
        getUpcomingReminders(24),
        getReminders({ isRead: false }),
      ]);
      setTodayCount(todayRes?.data?.count || todayRes?.data?.reminders?.length || 0);
      setUpcomingCount(upcomingRes?.data?.count || upcomingRes?.data?.reminders?.length || 0);
      setUnreadCount(unreadRes?.data?.pagination?.total || unreadRes?.data?.reminders?.length || 0);
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Medication Reminders</h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Smart Engine
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Automated dose schedule notifications and daily reminders based on your active prescriptions.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Today's Reminders</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{todayCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Upcoming (Next 24h)</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{upcomingCount}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <BellRing size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Unread Reminders</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{unreadCount}</p>
          </div>
        </Card>
      </div>

      {/* Main Reminder Management Card */}
      <Card className="p-6">
        <ReminderList onStatsUpdate={fetchOverviewStats} />
      </Card>
    </div>
  );
};

export default Reminders;
