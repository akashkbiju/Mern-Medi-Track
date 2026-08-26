import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Pill,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getDailySchedule } from '../../services/medicineApi';

/**
 * Format Date object into YYYY-MM-DD local string
 */
const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format Date into user-friendly display string
 * e.g., "Today - Sunday, Sep 6, 2026"
 */
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  const today = new Date();
  const todayStr = formatDateLocal(today);

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatDateLocal(tomorrow);

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDateLocal(yesterday);

  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  const formatted = targetDate.toLocaleDateString(undefined, options);

  if (dateStr === todayStr) {
    return `Today • ${formatted}`;
  } else if (dateStr === tomorrowStr) {
    return `Tomorrow • ${formatted}`;
  } else if (dateStr === yesterdayStr) {
    return `Yesterday • ${formatted}`;
  }
  return formatted;
};

const DailyMedicationSchedule = ({ className = '', onScheduleLoaded }) => {
  const [currentDateStr, setCurrentDateStr] = useState(() => formatDateLocal(new Date()));
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const todayStr = formatDateLocal(new Date());
  const isToday = currentDateStr === todayStr;

  const fetchSchedule = useCallback(async (dateToFetch) => {
    setLoading(true);
    setError('');
    try {
      const response = await getDailySchedule(dateToFetch);
      const doses = response?.data?.schedule || [];
      setScheduleData(doses);
      if (onScheduleLoaded) {
        onScheduleLoaded(doses, dateToFetch);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to retrieve medication schedule for this date.'
      );
    } finally {
      setLoading(false);
    }
  }, [onScheduleLoaded]);

  useEffect(() => {
    fetchSchedule(currentDateStr);
  }, [currentDateStr, fetchSchedule]);

  const handlePrevDay = () => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setCurrentDateStr(formatDateLocal(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setCurrentDateStr(formatDateLocal(date));
  };

  const handleToday = () => {
    setCurrentDateStr(todayStr);
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      setCurrentDateStr(e.target.value);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      {/* Schedule Header & Day Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Medication Schedule</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
              {scheduleData.length} {scheduleData.length === 1 ? 'dose' : 'doses'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-600 mt-0.5">
            {formatDisplayDate(currentDateStr)}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
              title="Previous Day"
              aria-label="Previous Day"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                isToday
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white transition"
              title="Next Day"
              aria-label="Next Day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="relative">
            <input
              type="date"
              value={currentDateStr}
              onChange={handleDateChange}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 shadow-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              aria-label="Select Date"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchSchedule(currentDateStr)}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            title="Refresh Schedule"
            aria-label="Refresh Schedule"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Schedule Content */}
      <div className="mt-5">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-slate-200 rounded" />
                    <div className="w-20 h-3 bg-slate-200 rounded" />
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
              <p className="font-semibold">Failed to load schedule</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
              <button
                type="button"
                onClick={() => fetchSchedule(currentDateStr)}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : scheduleData.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
            <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
              <CalendarIcon size={24} />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No medications scheduled for this date
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {isToday
                ? "You have no active medications prescribed for today."
                : `No active prescriptions are scheduled for ${formatDisplayDate(currentDateStr)}.`}
            </p>
            <div className="mt-4">
              <Link to="/medicines">
                <Button size="sm" variant="outline">
                  Manage Medications
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduleData.map((dose, idx) => (
              <div
                key={`${dose.medicineId}-${dose.scheduledTime}-${idx}`}
                className="flex items-center justify-between p-3.5 sm:p-4 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-100 hover:border-slate-200 shadow-xs transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100/70">
                    <Pill size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                        {dose.medicineName}
                      </h3>
                      {dose.genericName && (
                        <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                          ({dose.genericName})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">
                        {dose.dosage} {dose.dosageUnit}
                      </span>
                      {dose.instructions && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            {dose.instructions}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Time Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs">
                    <Clock size={12} className="text-slate-400" />
                    <span>{dose.scheduledTime12h || dose.scheduledTime}</span>
                  </div>

                  {/* Scheduled Status */}
                  <Badge variant="primary" className="text-xs">
                    Scheduled
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default DailyMedicationSchedule;
