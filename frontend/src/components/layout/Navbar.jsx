import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, User, CheckCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationCard from '../notifications/NotificationCard';

const Navbar = () => {
  const { user } = useAuth();
  const {
    unreadCount,
    recentNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    const nextState = !dropdownOpen;
    setDropdownOpen(nextState);
    if (nextState) {
      refreshNotifications();
    }
  };

  // Avatar initials helper
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Search Input */}
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </span>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 bg-slate-50"
            placeholder="Search..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Interactive Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={dropdownOpen}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in-50 duration-200">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    className="flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 transition"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                {recentNotifications.length === 0 ? (
                  <div className="py-8 text-center px-4">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                      <Sparkles size={20} />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">You're all caught up</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      No unread medication reminders or alerts.
                    </p>
                  </div>
                ) : (
                  recentNotifications.map((notif) => (
                    <NotificationCard
                      key={notif._id}
                      notification={notif}
                      onMarkRead={markAsRead}
                      compact
                    />
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="border-t border-slate-100 p-2 bg-slate-50/50 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/notifications');
                  }}
                  className="w-full py-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Link */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 border-l border-slate-200 pl-4 group hover:opacity-90 transition-opacity"
          title="View & Edit Profile"
        >
          <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-semibold text-xs group-hover:bg-teal-600 group-hover:text-white transition-colors">
            {user?.fullName ? getInitials(user.fullName) : <User size={18} />}
          </div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600 transition-colors">
            {user?.fullName || 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
