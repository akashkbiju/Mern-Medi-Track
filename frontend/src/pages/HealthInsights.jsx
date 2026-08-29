import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus,
  LineChart,
  Info,
  HeartPulse,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import InsightCard from '../components/health/InsightCard';
import { getHealthInsights } from '../services/analyticsApi';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

const CATEGORY_FILTERS = [
  { label: 'All Insights', value: 'all' },
  { label: 'Weight', value: 'weight' },
  { label: 'Blood Pressure', value: 'blood_pressure' },
  { label: 'Blood Sugar', value: 'blood_sugar' },
  { label: 'Heart Rate', value: 'heart_rate' },
  { label: 'Temperature', value: 'temperature' },
  { label: 'Consistency', value: 'consistency' },
  { label: 'Adherence', value: 'adherence' },
];

const HealthInsights = () => {
  const [period, setPeriod] = useState('30d');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Custom date range state
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateError, setDateError] = useState('');

  // Data & loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [insightsData, setInsightsData] = useState(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = { period };

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
      const response = await getHealthInsights(params);
      if (response && response.success) {
        setInsightsData(response.data);
      } else {
        setError(response?.message || 'Failed to generate health insights');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Error connecting to health insight service'
      );
    } finally {
      setLoading(false);
    }
  }, [period, customStart, customEnd]);

  useEffect(() => {
    if (period !== 'custom') {
      fetchInsights();
    }
  }, [period, fetchInsights]);

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
    fetchInsights();
  };

  const rawInsights = insightsData?.insights || [];
  const filteredInsights =
    categoryFilter === 'all'
      ? rawInsights
      : rawInsights.filter((item) => item.category === categoryFilter);

  const hasAnyRecords =
    rawInsights.length > 0 &&
    !rawInsights.every((i) => i.type === 'missing_data' || i.id === 'consistency-no-data');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-teal-600" />
            Smart Health Insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Understand patterns and observations in the health data you've recorded.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/health-analytics">
            <Button variant="outline" size="sm" className="flex items-center gap-1.5">
              <LineChart className="h-4 w-4" />
              Health Analytics
            </Button>
          </Link>
          <Link to="/health">
            <Button variant="primary" size="sm" className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Add Health Record
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Period Selector */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Time Window
              </span>
              <div className="inline-flex rounded-lg bg-slate-100 p-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setPeriod(opt.value);
                      if (opt.value !== 'custom') setDateError('');
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

            {/* Category Filter Pills */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Filter by Category
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_FILTERS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategoryFilter(opt.value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      categoryFilter === opt.value
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

          {/* Custom Date Inputs */}
          {period === 'custom' && (
            <form
              onSubmit={handleApplyCustomDates}
              className="pt-3 border-t border-slate-100 flex flex-wrap items-end gap-3"
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
        </div>
      </Card>

      {/* Error Alert with Retry */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsights}
            className="bg-white hover:bg-red-50 border-red-200 text-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-slate-200/80 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 bg-slate-200/80 rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Loaded Content */}
      {!loading && !error && (
        <>
          {/* Overall Summary Card */}
          {insightsData?.summary && (
            <Card className="p-6 bg-gradient-to-r from-teal-900 to-primary text-white shadow-md">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white/10 text-teal-200 shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-teal-200">
                    Period Overview ({insightsData.period})
                  </h2>
                  <p className="text-sm sm:text-base font-medium text-white mt-1.5 leading-relaxed">
                    {insightsData.summary}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Empty State Banner if no records have been logged at all */}
          {!hasAnyRecords ? (
            <Card className="p-12 text-center bg-slate-50/50 border-dashed">
              <div className="mx-auto w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                <HeartPulse className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No health insights yet</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Add a few health records to start seeing personalized trends, comparisons, and
                recording consistency patterns.
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
            /* Insights Grid */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Personal Observations ({filteredInsights.length})
                </h2>
                {categoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {filteredInsights.length === 0 ? (
                <Card className="p-8 text-center text-slate-400 text-xs">
                  No insights found for category "{categoryFilter}".
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredInsights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Clinical Disclaimer Footnote */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-slate-700">Clinical Safety Note:</span> Smart
            Health Insights provides analytical summaries of your user-recorded data and is not a
            medical diagnosis or treatment system. Never change medications or treatments without
            consulting a licensed doctor.
          </p>
          <p className="text-slate-400">
            Your insights are based only on the information you have recorded in MediTrack+.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthInsights;
