import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  BellRing,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ReminderCard from './ReminderCard';
import Button from '../ui/Button';
import {
  getTodayReminders,
  getUpcomingReminders,
  getReminders,
  markReminderAsRead,
  processReminders,
} from '../../services/reminderApi';

const ReminderList = ({ onStatsUpdate }) => {
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'upcoming' | 'unread' | 'all'
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const fetchReminders = useCallback(async (tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      let data = [];
      if (tab === 'today') {
        const res = await getTodayReminders();
        data = res?.data?.reminders || [];
      } else if (tab === 'upcoming') {
        const res = await getUpcomingReminders(24);
        data = res?.data?.reminders || [];
      } else if (tab === 'unread') {
        const res = await getReminders({ isRead: false, limit: 50 });
        data = res?.data?.reminders || [];
      } else {
        const res = await getReminders({ limit: 50 });
        data = res?.data?.reminders || [];
      }
      setReminders(data);

      if (onStatsUpdate) {
        onStatsUpdate({
          totalCount: data.length,
          unreadCount: data.filter((r) => !r.isRead).length,
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load medication reminders. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, onStatsUpdate]);

  useEffect(() => {
    fetchReminders(activeTab);
  }, [activeTab, fetchReminders]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await markReminderAsRead(id);
      const updated = res?.data?.reminder;
      if (updated) {
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isRead: true } : r))
        );
      }
    } catch (err) {
      console.error('Failed to mark reminder as read:', err);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processReminders();
      await fetchReminders(activeTab);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const tabs = [
    { id: 'today', label: "Today's Reminders" },
    { id: 'upcoming', label: 'Upcoming (24h)' },
    { id: 'unread', label: 'Unread Only' },
    { id: 'all', label: 'All History' },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs & Sync Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync Reminders'}</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                <div className="space-y-2">
                  <div className="w-40 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-3 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-24 h-6 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Unable to fetch reminders</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button
              type="button"
              onClick={() => fetchReminders(activeTab)}
              className="mt-2 text-xs font-semibold underline hover:no-underline"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
          <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
            <BellRing size={24} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            No medication reminders scheduled
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === 'today'
              ? "You don't have any medication reminders scheduled for today."
              : activeTab === 'upcoming'
              ? 'No medication reminders due in the next 24 hours.'
              : activeTab === 'unread'
              ? 'You have caught up on all reminders!'
              : 'No reminder history available for your account.'}
          </p>
          <div className="mt-4">
            <Link to="/medicines">
              <Button size="sm" variant="outline">
                View Active Prescriptions
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReminderList;
