import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
  AlertCircle,
  Plus,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getHealthAnalytics } from '../services/analyticsApi';
import HealthMetricCard from '../components/health/HealthMetricCard';
import HealthChart from '../components/health/HealthChart';
import Button from '../components/ui/Button';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'custom', label: 'Custom' },
];

const METRIC_OPTIONS = [
  { value: 'all', label: 'All Vitals' },
  { value: 'weight', label: 'Weight' },
  { value: 'bloodPressure', label: 'Blood Pressure' },
  { value: 'bloodSugar', label: 'Blood Sugar' },
  { value: 'heartRate', label: 'Heart Rate' },
  { value: 'temperature', label: 'Temperature' },
];

const HealthAnalytics = () => {
  const [period, setPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('all');

  // Custom date range state
  const [customDates, setCustomDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [appliedCustomDates, setAppliedCustomDates] = useState({
    startDate: '',
    endDate: '',
  });
  const [dateError, setDateError] = useState('');

  // Analytics API state
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        period,
        metric: selectedMetric,
      };

      if (period === 'custom') {
        if (!appliedCustomDates.startDate || !appliedCustomDates.endDate) {
          setLoading(false);
          return;
        }
        params.startDate = appliedCustomDates.startDate;
        params.endDate = appliedCustomDates.endDate;
      }

      const res = await getHealthAnalytics(params);
      if (res?.success) {
        setAnalyticsData(res.data);
      } else {
        setAnalyticsData(res?.data || null);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to retrieve health analytics. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [period, selectedMetric, appliedCustomDates]);

  useEffect(() => {
    if (period !== 'custom') {
      fetchAnalytics();
    } else if (appliedCustomDates.startDate && appliedCustomDates.endDate) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, period, selectedMetric, appliedCustomDates]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDateError('');
    if (newPeriod === 'custom') {
      // Set defaults for custom range (last 30 days)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      const pad = (n) => String(n).padStart(2, '0');
      const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
      const endStr = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`;
      setCustomDates({ startDate: startStr, endDate: endStr });
      setAppliedCustomDates({ startDate: startStr, endDate: endStr });
    }
  };

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customDates.startDate || !customDates.endDate) {
      setDateError('Please provide both start date and end date');
      return;
    }
    if (customDates.startDate > customDates.endDate) {
      setDateError('Start date cannot be after end date');
      return;
    }
    setDateError('');
    setAppliedCustomDates({ ...customDates });
  };

  // Check if any metric has data
  const hasAnyData =
    analyticsData?.totalRecords > 0 ||
    (analyticsData?.trend && analyticsData?.trend.length > 0) ||
    Boolean(
      analyticsData?.summary &&
        Object.values(analyticsData.summary).some((s) => s?.recordCount > 0)
    );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Health Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track changes in your recorded health measurements over time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/health">
            <Button className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs">
              <Plus className="h-4 w-4" />
              <span>Record Vitals</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Period Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Period:
            </span>
            {PERIOD_OPTIONS.map((opt) => {
              const active = period === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePeriodChange(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Metric Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Metric:
            </span>
            {METRIC_OPTIONS.map((opt) => {
              const active = selectedMetric === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedMetric(opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Date Range Picker Form */}
        {period === 'custom' && (
          <form
            onSubmit={handleApplyCustomDates}
            className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs"
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-600 font-medium">From:</span>
              <input
                type="date"
                value={customDates.startDate}
                onChange={(e) =>
                  setCustomDates((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600 font-medium">To:</span>
              <input
                type="date"
                value={customDates.endDate}
                onChange={(e) =>
                  setCustomDates((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 font-medium shadow-xs"
            >
              Apply Range
            </button>
            {dateError && <span className="text-xs text-red-600 font-medium">{dateError}</span>}
          </form>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load health analytics</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          {/* Skeleton Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 bg-slate-200 rounded-xl" />
                  <div className="h-4 w-8 bg-slate-200 rounded" />
                </div>
                <div className="h-7 w-20 bg-slate-200 rounded" />
                <div className="h-3 w-28 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          {/* Skeleton Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-200 rounded" />
            </div>
            <div className="h-64 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ) : !hasAnyData ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
            <Activity className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            No health data available for this period
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            You haven't recorded any vital measurements during this timeframe. Start logging your vitals to visualize health trends over time.
          </p>
          <Link to="/health">
            <Button className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Health Record</span>
            </Button>
          </Link>
        </div>
      ) : (
        /* Analytics Content */
        <div className="space-y-6">
          {/* Summary Cards Row (5 Metrics) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature'].map(
              (metricKey) => {
                const metricSummary =
                  analyticsData?.summary?.[metricKey] ||
                  (analyticsData?.metric === metricKey ? analyticsData : null);

                return (
                  <HealthMetricCard
                    key={metricKey}
                    metricKey={metricKey}
                    data={metricSummary}
                    isActive={selectedMetric === metricKey}
                    onClick={() =>
                      setSelectedMetric(selectedMetric === metricKey ? 'all' : metricKey)
                    }
                  />
                );
              }
            )}
          </div>

          {/* Charts Section */}
          {selectedMetric === 'all' ? (
            /* All Metrics: Responsive 2-column Grid */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HealthChart
                metricKey="weight"
                data={analyticsData?.metrics?.weight}
              />
              <HealthChart
                metricKey="bloodPressure"
                data={analyticsData?.metrics?.bloodPressure}
              />
              <HealthChart
                metricKey="bloodSugar"
                data={analyticsData?.metrics?.bloodSugar}
              />
              <HealthChart
                metricKey="heartRate"
                data={analyticsData?.metrics?.heartRate}
              />
              <div className="lg:col-span-2">
                <HealthChart
                  metricKey="temperature"
                  data={analyticsData?.metrics?.temperature}
                />
              </div>
            </div>
          ) : (
            /* Single Focused Metric View */
            <div className="space-y-6">
              <HealthChart
                metricKey={selectedMetric}
                data={analyticsData?.metrics?.[selectedMetric] || analyticsData}
              />

              {/* View All Reset Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMetric('all')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                >
                  <span>View All Vital Trends</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Medical Safety Disclaimer Footnote */}
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-3.5 text-center">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Disclaimer:</span> Health analytics summarizes user-recorded measurements over time. It is not a medical diagnosis or treatment recommendation. Always consult a licensed healthcare professional for medical concerns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthAnalytics;
