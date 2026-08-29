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
import { Scale, Activity, Droplets, Heart, Thermometer, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const METRIC_DETAILS = {
  weight: {
    title: 'Weight Trend',
    unit: 'kg',
    color: '#059669', // emerald-600
    icon: Scale,
    domainOffset: 2,
  },
  bloodPressure: {
    title: 'Blood Pressure Trend',
    unit: 'mmHg',
    colorSystolic: '#0284c7', // sky-600
    colorDiastolic: '#0d9488', // teal-600
    icon: Activity,
  },
  bloodSugar: {
    title: 'Blood Sugar Trend',
    unit: 'mg/dL',
    color: '#d97706', // amber-600
    icon: Droplets,
    domainOffset: 10,
  },
  heartRate: {
    title: 'Heart Rate (Pulse) Trend',
    unit: 'BPM',
    color: '#e11d48', // rose-600
    icon: Heart,
    domainOffset: 5,
  },
  temperature: {
    title: 'Body Temperature Trend',
    unit: '°C',
    color: '#7c3aed', // purple-600
    icon: Thermometer,
    domainOffset: 0.5,
  },
};

// Custom Tooltip for single metric
const CustomSingleTooltip = ({ active, payload, label, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1 z-50">
        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>{data.date}</span>
          <span className="text-slate-400 font-normal">{data.time}</span>
        </div>
        <div className="flex items-baseline gap-1 pt-1">
          <span className="text-slate-500 font-medium">Recorded:</span>
          <span className="font-bold text-slate-900 text-sm">{data.value}</span>
          <span className="text-slate-400">{unit}</span>
        </div>
        {data.notes && (
          <p className="text-[11px] text-slate-500 italic max-w-xs pt-1 border-t border-slate-50">
            "{data.notes}"
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Blood Pressure
const CustomBPTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1.5 z-50">
        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex items-center justify-between gap-4">
          <span>{data.date}</span>
          <span className="text-slate-400 font-normal">{data.time}</span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-sky-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              Systolic:
            </span>
            <span className="font-bold text-slate-900 font-mono">{data.systolic} mmHg</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-teal-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-teal-500" />
              Diastolic:
            </span>
            <span className="font-bold text-slate-900 font-mono">{data.diastolic} mmHg</span>
          </div>
        </div>
        {data.notes && (
          <p className="text-[11px] text-slate-500 italic max-w-xs pt-1 border-t border-slate-50">
            "{data.notes}"
          </p>
        )}
      </div>
    );
  }
  return null;
};

// Helper for formatting date strings on XAxis (e.g. "2026-09-01" -> "Sep 1")
const formatXAxisDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${monthNames[m]} ${d}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

const HealthChart = ({ metricKey, data }) => {
  const details = METRIC_DETAILS[metricKey] || {
    title: `${metricKey} Trend`,
    unit: '',
    color: '#0d9488',
    icon: Activity,
  };
  const Icon = details.icon;

  const isBP = metricKey === 'bloodPressure';
  const trend = Array.isArray(data?.trend) ? data.trend : [];
  const hasData = trend.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{details.title}</h3>
            <p className="text-xs text-slate-500">
              {trend.length} {trend.length === 1 ? 'measurement' : 'measurements'} recorded
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
          {details.unit}
        </span>
      </div>

      {/* Chart Content */}
      <div className="h-64 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            {isBP ? (
              <LineChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomBPTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                />
                <Line
                  type="monotone"
                  name="Systolic"
                  dataKey="systolic"
                  stroke={details.colorSystolic}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: details.colorSystolic }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  name="Diastolic"
                  dataKey="diastolic"
                  stroke={details.colorDiastolic}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: details.colorDiastolic }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            ) : (
              <LineChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxisDate}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomSingleTooltip unit={details.unit} />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={details.color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: details.color }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <AlertCircle className="h-7 w-7 text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">No {details.title} data</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
              No measurements recorded in this time range. Log your vitals in Health Tracking to generate visual trends.
            </p>
            <Link
              to="/health"
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-teal-600" />
              Add Measurement
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthChart;
