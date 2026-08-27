import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  SkipForward,
  Calendar,
  AlertCircle,
  RefreshCw,
  Info,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { getAdherenceSummary } from '../services/analyticsApi';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
];

const getCategoryBadgeVariant = (category) => {
  switch (category) {
    case 'Excellent':
      return 'success';
    case 'Good':
      return 'primary';
    case 'Needs Improvement':
      return 'warning';
    case 'Low':
      return 'danger';
    default:
      return 'default';
  }
};

const getCategoryColorHex = (category) => {
  switch (category) {
    case 'Excellent':
      return '#10b981'; // emerald-500
    case 'Good':
      return '#0284c7'; // sky-600
    case 'Needs Improvement':
      return '#f59e0b'; // amber-500
    case 'Low':
      return '#ef4444'; // rose-500
    default:
      return '#94a3b8'; // slate-400
  }
};

const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1.5 min-w-[170px]">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
          <span>{label}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
            style={{
              backgroundColor: `${getCategoryColorHex(data.category)}15`,
              color: getCategoryColorHex(data.category),
            }}
          >
            {data.category}
          </span>
        </div>
        {data.hasData ? (
          <>
            <div className="flex justify-between text-slate-600 pt-1">
              <span>Adherence Score:</span>
              <span className="font-bold text-slate-900">{data.score}%</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Taken:</span>
              <span className="font-semibold">{data.taken}</span>
            </div>
            <div className="flex justify-between text-rose-600">
              <span>Missed:</span>
              <span className="font-semibold">{data.missed}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Skipped:</span>
              <span className="font-semibold">{data.skipped}</span>
            </div>
            <div className="flex justify-between text-slate-500 border-t border-slate-100 pt-1">
              <span>Total Eligible:</span>
              <span className="font-medium">{data.eligible}</span>
            </div>
          </>
        ) : (
          <p className="text-slate-400 italic pt-1">No eligible doses on this date</p>
        )}
      </div>
    );
  }
  return null;
};

const Adherence = () => {
  const [period, setPeriod] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const fetchAdherence = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');

    try {
      const params = { period };
      if (period === 'custom') {
        if (!appliedCustomDates.start || !appliedCustomDates.end) {
          if (!isSilent) setLoading(false);
          return;
        }
        params.startDate = appliedCustomDates.start;
        params.endDate = appliedCustomDates.end;
      }

      const res = await getAdherenceSummary(params);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to calculate medication adherence. Please try again.'
      );
    } finally {
      if (!isSilent) setLoading(false);
      setRefreshing(false);
    }
  }, [period, appliedCustomDates]);

  useEffect(() => {
    if (period !== 'custom') {
      fetchAdherence();
    } else if (appliedCustomDates.start && appliedCustomDates.end) {
      fetchAdherence();
    }
  }, [fetchAdherence, period, appliedCustomDates]);

  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Please select both a start date and an end date.');
      return;
    }
    if (startDate > endDate) {
      setError('Start date cannot be after end date.');
      return;
    }
    setError('');
    setAppliedCustomDates({ start: startDate, end: endDate });
  };

  // Format chart data
  const chartData = (data?.daily || []).map((item) => {
    // Format YYYY-MM-DD into short MMM DD
    const [, month, day] = item.date.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const shortLabel = `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;

    return {
      ...item,
      shortLabel,
      scoreValue: item.score !== null ? item.score : null,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Medication Adherence</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              Clinical Analytics
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track how consistently you take your prescribed medications over time.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setRefreshing(true);
            fetchAdherence(true);
          }}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          <span>Refresh Analytics</span>
        </Button>
      </div>

      {/* Period Filter Selector */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === opt.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <form onSubmit={handleApplyCustomDates} className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button type="submit" size="sm" className="text-xs px-3 py-1.5">
                Apply Range
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          <div className="md:col-span-2 h-44 bg-slate-200 rounded-2xl" />
          <div className="h-44 bg-slate-200 rounded-2xl" />
          <div className="h-44 bg-slate-200 rounded-2xl" />
        </div>
      ) : data ? (
        <>
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Primary Adherence Score Card */}
            <Card className="sm:col-span-2 p-6 bg-gradient-to-br from-teal-900 via-primary to-primary-light text-white shadow-md flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wider uppercase text-teal-200">
                    Overall Adherence Score
                  </span>
                  <Badge
                    variant={getCategoryBadgeVariant(data.category)}
                    className="bg-white/20 text-white border-white/30 backdrop-blur-xs font-bold"
                  >
                    {data.category}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                    {data.hasData ? `${data.adherenceScore}%` : 'No Data'}
                  </span>
                  {data.hasData && (
                    <span className="text-xs text-teal-100/90 font-medium">
                      ({data.taken} of {data.totalEligible} eligible doses taken)
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-100/80 pt-1">
                  {data.hasData
                    ? `Calculated across ${data.daily?.length || 0} days based on scheduled dose records.`
                    : 'No completed or evaluated medication doses recorded in this timeframe.'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="relative z-10 w-full bg-white/20 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${data.hasData ? data.adherenceScore : 0}%`,
                    backgroundColor: getCategoryColorHex(data.category),
                  }}
                />
              </div>
            </Card>

            {/* Streak Counter Card */}
            <Card className="p-5 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Adherence Streak
                </span>
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <Flame size={18} />
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {data.currentStreak}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {data.currentStreak === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Consecutive days with 100% adherence on scheduled doses.
                </p>
              </div>
              <div className="text-[10px] text-amber-700 bg-amber-50/70 px-2 py-1 rounded-md font-medium">
                Target: 100% daily compliance
              </div>
            </Card>

            {/* Dose Breakdown Card */}
            <Card className="p-5 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Dose Tallies
                </span>
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <Award size={18} />
                </div>
              </div>
              <div className="space-y-1.5 my-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Taken:
                  </span>
                  <span className="font-bold text-slate-900">{data.taken}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-rose-700 font-medium flex items-center gap-1.5">
                    <XCircle size={13} /> Missed:
                  </span>
                  <span className="font-bold text-slate-900">{data.missed}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-700 font-medium flex items-center gap-1.5">
                    <SkipForward size={13} /> Skipped:
                  </span>
                  <span className="font-bold text-slate-900">{data.skipped}</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 flex justify-between">
                <span>Total Eligible Doses:</span>
                <span className="font-semibold text-slate-800">{data.totalEligible}</span>
              </div>
            </Card>
          </div>

          {/* Daily Trend Chart Section */}
          <Card className="p-6 bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  <span>Daily Adherence Trend</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual breakdown of percentage adherence across each day in this period.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-slate-600 font-medium">Adherence %</span>
                </div>
              </div>
            </div>

            {data.hasData && chartData.length > 0 ? (
              <div className="w-full h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="scoreValue"
                      name="Adherence"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#0f766e', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Calendar size={32} className="text-slate-300" />
                <p className="font-semibold text-slate-600">No completed medication history is available for this period.</p>
                <p className="max-w-xs text-slate-400">
                  Doses scheduled in the future or not yet evaluated do not count against adherence.
                </p>
              </div>
            )}
          </Card>

          {/* Daily Table Breakdown */}
          {data.daily && data.daily.length > 0 && (
            <Card className="p-6 bg-white border border-slate-200 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4">Daily Performance Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Date</th>
                      <th className="py-2.5 px-4 font-semibold">Eligible Doses</th>
                      <th className="py-2.5 px-4 font-semibold">Taken</th>
                      <th className="py-2.5 px-4 font-semibold">Missed</th>
                      <th className="py-2.5 px-4 font-semibold">Skipped</th>
                      <th className="py-2.5 px-4 font-semibold">Adherence Score</th>
                      <th className="py-2.5 px-4 font-semibold">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.daily.map((day) => (
                      <tr key={day.date} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-800">{day.date}</td>
                        <td className="py-2.5 px-4 text-slate-600">{day.eligible}</td>
                        <td className="py-2.5 px-4 text-emerald-600 font-semibold">{day.taken}</td>
                        <td className="py-2.5 px-4 text-rose-600 font-semibold">{day.missed}</td>
                        <td className="py-2.5 px-4 text-amber-600 font-semibold">{day.skipped}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {day.hasData ? `${day.score}%` : '—'}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge variant={getCategoryBadgeVariant(day.category)}>
                            {day.category}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Medical Safety Disclaimer Alert */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-teal-900 text-xs flex items-start gap-3 shadow-xs">
            <Info size={18} className="text-teal-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-teal-950">Clinical & Safety Disclaimer</p>
              <p className="text-teal-800/90 leading-relaxed">
                {data.disclaimer ||
                  'Medication adherence reflects how consistently scheduled doses were recorded as taken. It is not a medical diagnosis.'}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Adherence;
