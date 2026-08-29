import {
  Pill,
  CircleAlert,
  HeartPulse,
  UserRound,
  FileText,
  Info,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Format timestamp into human-readable relative time
 * @param {string|Date} dateVal
 */
export const formatRelativeTime = (dateVal) => {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Configuration for notification types
 */
const TYPE_CONFIG = {
  medication_reminder: {
    icon: Pill,
    colorClass: 'text-teal-600 bg-teal-50 border-teal-200',
    dotClass: 'bg-teal-500',
    targetRoute: '/tracker',
  },
  missed_medication: {
    icon: CircleAlert,
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-500',
    targetRoute: '/tracker',
  },
  health_alert: {
    icon: HeartPulse,
    colorClass: 'text-rose-600 bg-rose-50 border-rose-200',
    dotClass: 'bg-rose-500',
    targetRoute: '/health-insights',
  },
  doctor_request: {
    icon: UserRound,
    colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    dotClass: 'bg-indigo-500',
    targetRoute: '/dashboard',
  },
  doctor_approved: {
    icon: UserRound,
    colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-500',
    targetRoute: '/dashboard',
  },
  doctor_rejected: {
    icon: UserRound,
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
    dotClass: 'bg-slate-400',
    targetRoute: '/dashboard',
  },
  report_ready: {
    icon: FileText,
    colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    dotClass: 'bg-cyan-500',
    targetRoute: '/health-analytics',
  },
  system: {
    icon: Info,
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
    dotClass: 'bg-blue-500',
    targetRoute: null,
  },
};

const NotificationCard = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
  compact = false,
}) => {
  const navigate = useNavigate();
  const {
    _id,
    type = 'system',
    title,
    message,
    isRead,
    createdAt,
  } = notification;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.system;
  const IconComponent = config.icon;
  const timeStr = formatRelativeTime(createdAt);

  const handleCardClick = () => {
    if (!isRead && onMarkRead) {
      onMarkRead(_id);
    }
    if (config.targetRoute) {
      navigate(config.targetRoute);
    }
  };

  const handleToggleRead = (e) => {
    e.stopPropagation();
    if (isRead) {
      if (onMarkUnread) onMarkUnread(_id);
    } else {
      if (onMarkRead) onMarkRead(_id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(_id);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex items-start gap-3 rounded-xl border p-4 transition-all cursor-pointer ${
        isRead
          ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
          : 'bg-teal-50/30 border-teal-200/80 hover:bg-teal-50/50 shadow-xs'
      } ${compact ? 'p-3 text-xs' : 'text-sm'}`}
      role="article"
      aria-label={`${isRead ? 'Read' : 'Unread'} notification: ${title}`}
    >
      {/* Type Icon */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border ${config.colorClass} ${
          compact ? 'h-8 w-8' : 'h-10 w-10'
        }`}
      >
        <IconComponent className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {!isRead && (
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${config.dotClass}`}
                title="Unread notification"
              />
            )}
            <h4
              className={`truncate font-semibold ${
                isRead ? 'text-slate-800' : 'text-slate-900 font-bold'
              }`}
            >
              {title}
            </h4>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {timeStr}
          </span>
        </div>

        <p
          className={`text-slate-600 leading-snug break-words ${
            compact ? 'text-xs line-clamp-2' : 'text-sm mt-1'
          }`}
        >
          {message}
        </p>
      </div>

      {/* Action Buttons (Desktop hover / accessible focus) */}
      <div
        className={`flex items-center gap-1 shrink-0 ${
          compact
            ? 'opacity-0 group-hover:opacity-100 transition-opacity'
            : 'opacity-80 group-hover:opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={handleToggleRead}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          title={isRead ? 'Mark as unread' : 'Mark as read'}
          aria-label={isRead ? 'Mark as unread' : 'Mark as read'}
        >
          {isRead ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5 text-teal-600" />
          )}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
            title="Delete notification"
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
