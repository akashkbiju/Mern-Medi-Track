import { useState, useEffect, useCallback } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  MinusCircle,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import MedicationDoseCard from '../components/medication/MedicationDoseCard';
import {
  getTodayMedicationLogs,
  markMedicationTaken,
  markMedicationSkipped,
} from '../services/medicationLogApi';
import { getTodayAdherence } from '../services/analyticsApi';

const MedicationTracker = () => {
  const [trackerData, setTrackerData] = useState(null);
  const [todayAdherence, setTodayAdherence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'taken' | 'missed' | 'skipped'
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchTodayLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const [logsRes, adherenceRes] = await Promise.allSettled([
        getTodayMedicationLogs(),
        getTodayAdherence(),
      ]);

      if (logsRes.status === 'fulfilled' && logsRes.value?.data) {
        setTrackerData(logsRes.value.data);
      }
      if (adherenceRes.status === 'fulfilled' && adherenceRes.value?.data) {
        setTodayAdherence(adherenceRes.value.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to load today’s medication doses. Please try again.'
      );
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayLogs();
  }, [fetchTodayLogs]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 4000);
  };

  const handleTake = async (id, notes) => {
    try {
      const response = await markMedicationTaken(id, notes);
      if (response?.data?.log) {
        const updated = response.data.log;
        setTrackerData((prev) => {
          if (!prev) return prev;
          const updatedMeds = prev.medications.map((m) =>
            m._id === id ? { ...m, status: 'taken', takenAt: updated.takenAt, notes: updated.notes } : m
          );
          const total = updatedMeds.length;
          const taken = updatedMeds.filter((m) => m.status === 'taken').length;
          const pending = updatedMeds.filter((m) => m.status === 'pending').length;
          const missed = updatedMeds.filter((m) => m.status === 'missed').length;
          const skipped = updatedMeds.filter((m) => m.status === 'skipped').length;
          const completionRate = total > 0 ? Math.round((taken / total) * 100) : 0;

          return {
            ...prev,
            stats: { total, taken, pending, missed, skipped, completionRate },
            medications: updatedMeds,
          };
        });
        showFeedback('success', 'Dose marked as taken successfully!');
        getTodayAdherence().then((res) => { if (res?.data) setTodayAdherence(res.data); }).catch(() => {});
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to mark dose as taken');
    }
  };

  const handleSkip = async (id, notes) => {
    try {
      const response = await markMedicationSkipped(id, notes);
      if (response?.data?.log) {
        const updated = response.data.log;
        setTrackerData((prev) => {
          if (!prev) return prev;
          const updatedMeds = prev.medications.map((m) =>
            m._id === id ? { ...m, status: 'skipped', notes: updated.notes } : m
          );
          const total = updatedMeds.length;
          const taken = updatedMeds.filter((m) => m.status === 'taken').length;
          const pending = updatedMeds.filter((m) => m.status === 'pending').length;
          const missed = updatedMeds.filter((m) => m.status === 'missed').length;
          const skipped = updatedMeds.filter((m) => m.status === 'skipped').length;
          const completionRate = total > 0 ? Math.round((taken / total) * 100) : 0;

          return {
            ...prev,
            stats: { total, taken, pending, missed, skipped, completionRate },
            medications: updatedMeds,
          };
        });
        showFeedback('success', 'Dose marked as skipped.');
        getTodayAdherence().then((res) => { if (res?.data) setTodayAdherence(res.data); }).catch(() => {});
      }
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to skip dose');
    }
  };

  const stats = trackerData?.stats || {
    total: 0,
    taken: 0,
    pending: 0,
    missed: 0,
    skipped: 0,
    completionRate: 0,
  };

  const medications = trackerData?.medications || [];

  const filteredMeds = medications.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.status === activeFilter;
  });

  const filterTabs = [
    { id: 'all', label: 'All Doses', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending },
    { id: 'taken', label: 'Taken', count: stats.taken },
    { id: 'missed', label: 'Missed', count: stats.missed },
    { id: 'skipped', label: 'Skipped', count: stats.skipped },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Today's Medication Tracker</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Live Tracker
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Check off your scheduled doses and record your daily medication intake.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRefreshing(true);
            fetchTodayLogs(true);
          }}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Checklist</span>
        </Button>
      </div>

      {/* Feedback Alert */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Adherence Progress Bar & KPI Cards */}
      <Card className="p-6 bg-gradient-to-r from-teal-900 via-primary to-primary-light text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-teal-200">
                Today's Adherence
              </span>
              {todayAdherence?.category && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                  {todayAdherence.category}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {todayAdherence?.hasData
                ? `${todayAdherence.taken} / ${todayAdherence.totalEligible} completed`
                : `${stats.taken} of ${stats.total} completed`}
            </h2>
            <p className="text-xs text-teal-100/90">
              {stats.completionRate === 100
                ? 'Great job! You have taken all your scheduled medications for today.'
                : stats.pending > 0
                ? `You have ${stats.pending} dose${stats.pending === 1 ? '' : 's'} remaining today.`
                : 'Stay consistent with your prescription schedule for optimal health outcomes.'}
            </p>
          </div>

          <div className="flex items-center gap-6">
            {/* Adherence Metric */}
            <div className="text-right">
              <span className="text-4xl font-extrabold tracking-tight">
                {todayAdherence?.hasData ? `${todayAdherence.adherenceScore}%` : `${stats.completionRate}%`}
              </span>
              <p className="text-xs text-teal-200 mt-0.5">Adherence Score</p>
            </div>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-white/20 h-2.5 rounded-full mt-5 overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${todayAdherence?.hasData ? todayAdherence.adherenceScore : stats.completionRate}%`,
            }}
          />
        </div>
      </Card>

      {/* Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
            <Pill size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Scheduled</p>
            <p className="text-lg font-bold text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Taken</p>
            <p className="text-lg font-bold text-emerald-600">{stats.taken}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending</p>
            <p className="text-lg font-bold text-amber-600">{stats.pending}</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
            <AlertCircle size={16} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Missed / Skipped</p>
            <p className="text-lg font-bold text-slate-900">
              {stats.missed + stats.skipped}
            </p>
          </div>
        </div>
      </div>

      {/* Doses Checklist Section */}
      <Card className="p-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-slate-100 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeFilter === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="mt-5">
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
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Unable to fetch today's medication logs</p>
                <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchTodayLogs()}
                  className="mt-2 text-xs font-semibold underline hover:no-underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredMeds.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="inline-flex p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
                <CalendarIcon size={24} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                No doses found in this category
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {activeFilter === 'all'
                  ? 'You have no active medications scheduled for today.'
                  : `There are no doses currently marked as ${activeFilter}.`}
              </p>
              {activeFilter === 'all' && (
                <div className="mt-4">
                  <Link to="/medicines">
                    <Button size="sm" variant="outline">
                      Manage Prescriptions
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeds.map((log) => (
                <MedicationDoseCard
                  key={log._id}
                  log={log}
                  onTake={handleTake}
                  onSkip={handleSkip}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MedicationTracker;
