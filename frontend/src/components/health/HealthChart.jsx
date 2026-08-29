import React from 'react';
import Card from '../ui/Card';
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

const METRIC_CHART_CONFIG = {
  weight: {
    title: 'Weight Trend',
    unit: 'kg',
    color: '#0d9488', // Teal
    dataKey: 'value',
    name: 'Weight',
  },
  bloodPressure: {
    title: 'Blood Pressure Trend',
    unit: 'mmHg',
    systolicColor: '#0284c7', // Sky blue
    diastolicColor: '#0d9488', // Teal
  },
  bloodSugar: {
    title: 'Blood Sugar Trend',
    unit: 'mg/dL',
    color: '#6366f1', // Indigo
    dataKey: 'value',
    name: 'Blood Sugar',
  },
  heartRate: {
    title: 'Heart Rate Trend',
    unit: 'BPM',
    color: '#e11d48', // Rose
    dataKey: 'value',
    name: 'Heart Rate',
  },
  temperature: {
    title: 'Temperature Trend',
    unit: '°C',
    color: '#f59e0b', // Amber
    dataKey: 'value',
    name: 'Temperature',
  },
};

/**
 * Format date string (YYYY-MM-DD) into concise label for X-axis
 */
const formatXAxisDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

/**
 * Custom tooltip component rendering formatted timestamp, values, and units
 */
const CustomTooltip = ({ active, payload, label, unit, isBP }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;
  const dateFormatted = formatXAxisDate(item.date);
  const timeFormatted = item.time ? ` at ${item.time}` : '';

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm text-xs space-y-1">
      <p className="font-semibold text-slate-800">
        {dateFormatted}
        <span className="text-slate-500 font-normal">{timeFormatted}</span>
      </p>
      {isBP ? (
        <div className="space-y-0.5 pt-1">
          <p className="text-sky-700 font-medium">
            Systolic: <span className="font-bold">{item.systolic}</span> {unit}
          </p>
          <p className="text-teal-700 font-medium">
            Diastolic: <span className="font-bold">{item.diastolic}</span> {unit}
          </p>
        </div>
      ) : (
        <p className="font-bold text-slate-900 pt-0.5">
          {payload[0].value} <span className="font-normal text-slate-500">{unit}</span>
        </p>
      )}
    </div>
  );
};

const HealthChart = ({ metricKey, data = [], height = 300, className = '' }) => {
  const config = METRIC_CHART_CONFIG[metricKey] || {
    title: `${metricKey} Trend`,
    unit: '',
    color: '#0d9488',
    dataKey: 'value',
    name: metricKey,
  };

  const isBP = metricKey === 'bloodPressure';
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">{config.title}</h3>
          <p className="text-xs text-slate-500">Unit of measurement: {config.unit}</p>
        </div>
        {hasData && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {data.length} {data.length === 1 ? 'reading' : 'readings'}
          </span>
        )}
      </div>

      {!hasData ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl bg-slate-50/60 border border-dashed border-slate-200 text-slate-400 text-xs"
          style={{ height: `${height}px` }}
        >
          <p className="font-medium text-slate-600">No {config.title.toLowerCase()} recorded</p>
          <p className="text-slate-400 mt-1">Measurements logged in this period will graph here.</p>
        </div>
      ) : (
        <div style={{ height: `${height}px` }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
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
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={<CustomTooltip unit={config.unit} isBP={isBP} />}
              />
              {isBP && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
              )}

              {isBP ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="systolic"
                    name="Systolic"
                    stroke={config.systolicColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: config.systolicColor, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="diastolic"
                    name="Diastolic"
                    stroke={config.diastolicColor}
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: config.diastolicColor, strokeWidth: 1 }}
                    activeDot={{ r: 5 }}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey={config.dataKey}
                  name={config.name}
                  stroke={config.color}
                  strokeWidth={2.5}
                  dot={{ r: 3.5, fill: config.color, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default HealthChart;
