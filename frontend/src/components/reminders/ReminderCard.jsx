import { useState } from 'react';
import { Pill, Clock, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import Badge from '../ui/Badge';

/**
 * Format ISO date string into readable 12-hour time (e.g., "08:00 AM")
 */
const formatTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format ISO date string into friendly date (e.g., "Today", "Tomorrow", "Sep 6, 2026")
 */
const formatDateFriendly = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();

  if (isTomorrow) return 'Tomorrow';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

const ReminderCard = ({ reminder, onMarkAsRead }) => {
  const [marking, setMarking] = useState(false);

  const isPastDue = new Date(reminder.scheduledFor).getTime() <= Date.now();
  const medicine = reminder.relatedMedicine || {};

  const handleRead = async () => {
    if (marking || reminder.isRead) return;
    setMarking(true);
    try {
      if (onMarkAsRead) {
        await onMarkAsRead(reminder._id);
      }
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
        reminder.isRead
          ? 'bg-slate-50/60 border-slate-200/80 opacity-75'
          : isPastDue
          ? 'bg-amber-50/40 border-amber-200/80 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-start sm:items-center gap-3.5 mb-3 sm:mb-0">
        {/* Medicine / Alert Icon */}
        <div
          className={`p-2.5 rounded-xl shrink-0 ${
            reminder.isRead
              ? 'bg-slate-100 text-slate-500'
              : isPastDue
              ? 'bg-amber-100 text-amber-700'
              : 'bg-teal-50 text-teal-700 border border-teal-100'
          }`}
        >
          {isPastDue && !reminder.isRead ? <AlertCircle size={20} /> : <Pill size={20} />}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              {medicine.name || reminder.title || 'Medication'}
            </h3>
            {medicine.dosage && medicine.dosageUnit && (
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {medicine.dosage} {medicine.dosageUnit}
              </span>
            )}
            {medicine.genericName && (
              <span className="text-xs text-slate-400 font-normal hidden md:inline">
                ({medicine.genericName})
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {reminder.message}
          </p>

          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1 font-medium text-slate-700">
              <Clock size={12} className="text-slate-400" />
              {formatTime(reminder.scheduledFor)}
            </span>
            <span>•</span>
            <span>{formatDateFriendly(reminder.scheduledFor)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
        {/* Status Badge */}
        {reminder.isRead ? (
          <Badge variant="default" className="text-xs">
            Read
          </Badge>
        ) : isPastDue ? (
          <Badge variant="warning" className="text-xs flex items-center gap-1">
            <Clock size={11} /> Due
          </Badge>
        ) : (
          <Badge variant="primary" className="text-xs flex items-center gap-1">
            <Bell size={11} /> Upcoming
          </Badge>
        )}

        {/* Mark as Read Action */}
        {!reminder.isRead && (
          <button
            type="button"
            onClick={handleRead}
            disabled={marking}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-xs transition disabled:opacity-50"
            title="Mark as Read"
          >
            <CheckCircle2 size={13} className={marking ? 'animate-spin' : 'text-slate-400'} />
            <span>Mark Read</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReminderCard;
