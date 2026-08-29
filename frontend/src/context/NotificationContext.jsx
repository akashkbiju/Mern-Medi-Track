import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getUnreadNotificationCount,
  getUnreadNotifications,
  markNotificationAsRead as apiMarkAsRead,
  markAllNotificationsAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from '../services/notificationApi';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollTimerRef = useRef(null);

  /**
   * Fetch current unread count and recent unread notifications
   */
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      return;
    }

    try {
      const [countRes, recentRes] = await Promise.all([
        getUnreadNotificationCount().catch(() => null),
        getUnreadNotifications(6).catch(() => null),
      ]);

      if (countRes && countRes.data) {
        setUnreadCount(countRes.data.unreadCount ?? 0);
      }

      if (recentRes && recentRes.data?.notifications) {
        setRecentNotifications(recentRes.data.notifications);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to refresh notifications:', err.message);
    }
  }, [isAuthenticated]);

  // Initial load and periodic polling setup
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      setRecentNotifications([]);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    // Immediate fetch on login / mount
    refreshNotifications();

    // Default polling interval: 60 seconds
    const intervalMs = 60000;
    pollTimerRef.current = setInterval(() => {
      refreshNotifications();
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isAuthenticated, refreshNotifications]);

  /**
   * Mark a single notification as read with optimistic UI update
   * @param {string} id - Notification ObjectId
   */
  const markAsRead = async (id) => {
    // Optimistically update local state
    setRecentNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await apiMarkAsRead(id);
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
      // Rollback on failure
      refreshNotifications();
    }
  };

  /**
   * Mark all unread notifications as read with optimistic UI update
   */
  const markAllAsRead = async () => {
    setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await apiMarkAllAsRead();
    } catch (err) {
      console.error('[NotificationContext] Error marking all as read:', err);
      refreshNotifications();
    }
  };

  /**
   * Delete a notification with optimistic UI update
   * @param {string} id - Notification ObjectId
   */
  const deleteNotification = async (id) => {
    const target = recentNotifications.find((n) => n._id === id);
    setRecentNotifications((prev) => prev.filter((n) => n._id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await apiDeleteNotification(id);
    } catch (err) {
      console.error('[NotificationContext] Error deleting notification:', err);
      refreshNotifications();
    }
  };

  const value = {
    unreadCount,
    recentNotifications,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
