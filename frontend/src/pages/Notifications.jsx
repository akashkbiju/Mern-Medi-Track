import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import NotificationCard from '../components/notifications/NotificationCard';
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
} from '../services/notificationApi';
import { useNotifications } from '../context/NotificationContext';

const FILTER_TABS = [
  { id: 'all', label: 'All', params: {} },
  { id: 'unread', label: 'Unread', params: { read: 'false' } },
  { id: 'medication', label: 'Medication', params: { type: 'medication_reminder' } },
  { id: 'missed', label: 'Missed', params: { type: 'missed_medication' } },
  { id: 'system', label: 'System', params: { type: 'system' } },
];

const Notifications = () => {
  const { refreshNotifications: syncGlobalNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotificationList = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);

      const tabConfig = FILTER_TABS.find((t) => t.id === activeTab) || FILTER_TABS[0];
      const queryParams = {
        page,
        limit: 15,
        ...tabConfig.params,
      };

      try {
        const res = await getNotifications(queryParams);
        if (res.success && res.data) {
          setNotifications(res.data.notifications || []);
          setPagination(
            res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 }
          );
        } else {
          setError(res.message || 'Failed to load notifications');
        }
      } catch (err) {
        setError(
          err.response?.data?.message || err.message || 'Unable to connect to notification service'
        );
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchNotificationList(1);
  }, [fetchNotificationList]);

  // Mark single as read
  const handleMarkRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await markNotificationAsRead(id);
      syncGlobalNotifications();
    } catch {
      fetchNotificationList(pagination.page);
    }
  };

  // Mark single as unread
  const handleMarkUnread = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: false } : n))
    );
    try {
      await markNotificationAsUnread(id);
      syncGlobalNotifications();
    } catch {
      fetchNotificationList(pagination.page);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsAsRead();
      syncGlobalNotifications();
      fetchNotificationList(pagination.page);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await deleteNotification(id);
      syncGlobalNotifications();
    } catch {
      fetchNotificationList(pagination.page);
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    if (!window.confirm('Are you sure you want to remove all read notifications?')) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteReadNotifications();
      syncGlobalNotifications();
      fetchNotificationList(1);
    } catch (err) {
      console.error('Failed to delete read notifications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/10">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Notifications
              </h1>
              <p className="text-xs text-slate-500">
                Stay updated with medication reminders and important account activity.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={actionLoading || loading}
              className="flex items-center gap-1.5 text-xs text-teal-700 hover:bg-teal-50"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearRead}
            disabled={actionLoading || loading}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50"
            title="Clear all read notifications"
          >
            <Trash2 className="h-4 w-4" />
            Clear read
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotificationList(pagination.page)}
            disabled={loading}
            className="p-2"
            title="Refresh list"
            aria-label="Refresh notifications list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotificationList(pagination.page)}
            className="text-xs bg-white hover:bg-red-100 border-red-300 text-red-700"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Notification Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-20 w-full animate-pulse rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded bg-slate-100" />
                  <div className="h-3 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        /* Empty State */
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-slate-300 bg-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-teal-600 mb-3">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">You're all caught up</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            {activeTab === 'unread'
              ? 'No unread notifications at this time.'
              : 'No notifications recorded in this category. As you track medications and receive reminders, alerts will appear here.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <NotificationCard
              key={item._id}
              notification={item}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
              onDelete={handleDeleteNotification}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 px-1">
          <p className="text-xs text-slate-500">
            Showing page <span className="font-semibold text-slate-700">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.totalPages}</span> ({pagination.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotificationList(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="flex items-center gap-1 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotificationList(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="flex items-center gap-1 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
