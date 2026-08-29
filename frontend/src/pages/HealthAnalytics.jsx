import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  RefreshCw,
  Plus,
  HeartPulse,
  Info,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import HealthMetricCard from '../components/health/HealthMetricCard';
import HealthChart from '../components/health/HealthChart';
import { getHealthAnalytics } from '../services/analyticsApi';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

const METRIC_OPTIONS = [
  { label: 'All Vitals', value: 'all' },
  { label: 'Weight', value: 'weight' },
  { label: 'Blood Pressure', value: 'bloodPressure' },
  { label: 'Blood Sugar', value: 'bloodSugar' },
  { label: 'Heart Rate', value: 'heartRate' },
  { label: 'Temperature', value: 'temperature' },
];

const HealthAnalytics = () => {
  const [period, setPeriod] = useState('30d');
  const [metric, setMetric] = useState('all');

  // Custom date range state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateError, setDateError] = useState('');

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = {
      period,
      metric,
    };

    if (period === 'custom') {
      if (!customStart || !customEnd) {
        setDateError('Both start date and end date are required');
        setLoading(false);
        return;
      }
      if (customStart > customEnd) {
        setDateError('Start date cannot be after end date');
        setLoading(false);
        return;
      }
      setDateError('');
      params.startDate = customStart;
      params.endDate = customEnd;
    }

    try {
      const response = await getHealthAnalytics(params);
      if (response && response.success) {
        setAnalyticsData(response.data);
      } else {
        setError(response?.message || 'Failed to load health analytics');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Error connecting to health analytics service'
      );
    } finally {
      setLoading(false);
    }
  }, [period, metric, customStart, customEnd]);

  useEffect(() => {
    if (period !== 'custom') {
      fetchAnalytics();
    }
  }, [period, metric, fetchAnalytics]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      setDateError('Please provide both start and end dates');
      return;
    }
    if (customStart > customEnd) {
      setDateError('Start date cannot be after end date');
      return;
    }
    setDateError('');
    fetchAnalytics();
  };

  // Determine if total records in period is 0 across all metrics
  const totalRecordCount = analyticsData?.summary
    ? Object.values(analyticsData.summary).reduce((acc, curr) => acc + (curr.recordCount || 0), 0)
    : analyticsData?.recordCount || 0;

  const isAllEmpty = !loading && !error && totalRecordCount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <HeartPulse className="h-7 w-7 text-teal-600" />
            Health Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track changes in your recorded health measurements over time.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/health-insights">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
            >
              <Sparkles className="h-4 w-4 text-teal-600" />
              View Smart Insights
            </Button>
          </Link>
          <Link to="/health">
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Health Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar: Period and Metric Selectors */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Period Selector Pills */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Time Range
            </span>
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setPeriod(opt.value);
                    if (opt.value !== 'custom') {
                      setDateError('');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    period === opt.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Selector Pills */}
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Vital Parameter
            </span>
            <div className="flex flex-wrap gap-1.5">
              {METRIC_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMetric(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    metric === opt.value
                      ? 'bg-teal-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker Input Row */}
        {period === 'custom' && (
          <form
            onSubmit={handleApplyCustomDates}
            className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-[34px]">
              Apply Range
            </Button>
            {dateError && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 self-center">
                <AlertCircle className="h-3.5 w-3.5" />
                {dateError}
              </p>
            )}
          </form>
        )}
      </Card>

      {/* Error State with Retry */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalytics}
            className="bg-white hover:bg-red-50 border-red-200 text-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-28 bg-slate-200/80 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-slate-200/80 rounded-xl" />
            <div className="h-80 bg-slate-200/80 rounded-xl" />
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {!loading && !error && (
        <>
          {/* Summary Cards Row (5 Vitals) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {['weight', 'bloodPressure', 'bloodSugar', 'heartRate', 'temperature'].map((mKey) => {
              const cardData = analyticsData?.summary
                ? analyticsData.summary[mKey]
                : metric === mKey
                ? analyticsData
                : {};

              return (
                <HealthMetricCard
                  key={mKey}
                  metricKey={mKey}
                  data={cardData || {}}
                  isSelected={metric === mKey}
                  onClick={() => setMetric(metric === mKey ? 'all' : mKey)}
                />
              );
            })}
          </div>

          {/* Empty State Banner if no records exist in period */}
          {isAllEmpty ? (
            <Card className="p-12 text-center bg-slate-50/50 border-dashed">
              <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                <HeartPulse className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No health data available for this period
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No vital signs were recorded during the selected date window ({period}). Log a measurement to view visual analytics.
              </p>
              <div className="mt-5">
                <Link to="/health">
                  <Button variant="primary" size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Health Record
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            /* Charts Section */
            <div className="space-y-6">
              {metric === 'all' ? (
                /* All Metrics 2-Column Responsive Layout */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analyticsData?.metrics && (
                    <>
                      <HealthChart
                        metricKey="weight"
                        data={analyticsData.metrics.weight?.trend || []}
                      />
                      <HealthChart
                        metricKey="bloodPressure"
                        data={analyticsData.metrics.bloodPressure?.trend || []}
                      />
                      <HealthChart
                        metricKey="bloodSugar"
                        data={analyticsData.metrics.bloodSugar?.trend || []}
                      />
                      <HealthChart
                        metricKey="heartRate"
                        data={analyticsData.metrics.heartRate?.trend || []}
                      />
                      <HealthChart
                        metricKey="temperature"
                        data={analyticsData.metrics.temperature?.trend || []}
                        className="lg:col-span-2"
                      />
                    </>
                  )}
                </div>
              ) : (
                /* Single Metric Detailed Chart */
                <div className="space-y-4">
                  <HealthChart
                    metricKey={metric}
                    data={analyticsData?.trend || []}
                    height={380}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Clinical Disclaimer Footnote */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold text-slate-700">Clinical Safety Note:</span> This
          analytics dashboard summarizes user-recorded measurements over time and does not provide
          medical diagnosis, normative classifications, or treatment advice. Consult a licensed
          healthcare professional for medical interpretation of your vital signs.
        </p>
      </div>
    </div>
  );
};

export default HealthAnalytics;
