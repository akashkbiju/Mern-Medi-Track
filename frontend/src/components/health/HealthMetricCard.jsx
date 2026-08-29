import React from 'react';
import Card from '../ui/Card';
import { 
  Scale, 
  Activity, 
  Droplets, 
  Heart, 
  Thermometer, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

const METRIC_CONFIGS = {
  weight: {
    title: 'Weight',
    unit: 'kg',
    icon: Scale,
    iconBg: 'bg-teal-50 text-teal-600',
  },
  bloodPressure: {
    title: 'Blood Pressure',
    unit: 'mmHg',
    icon: Activity,
    iconBg: 'bg-sky-50 text-sky-600',
  },
  bloodSugar: {
    title: 'Blood Sugar',
    unit: 'mg/dL',
    icon: Droplets,
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  heartRate: {
    title: 'Heart Rate',
    unit: 'BPM',
    icon: Heart,
    iconBg: 'bg-rose-50 text-rose-600',
  },
  temperature: {
    title: 'Temperature',
    unit: '°C',
    icon: Thermometer,
    iconBg: 'bg-amber-50 text-amber-600',
  },
};

/**
 * Reusable summary KPI card for a vital health metric
 */
const HealthMetricCard = ({
  metricKey,
  data = {},
  isSelected = false,
  onClick,
}) => {
  const config = METRIC_CONFIGS[metricKey] || {
    title: metricKey,
    unit: '',
    icon: Activity,
    iconBg: 'bg-slate-50 text-slate-600',
  };

  const IconComponent = config.icon;
  const isBP = metricKey === 'bloodPressure';

  // Format Latest Value
  let latestDisplay = '--';
  if (isBP) {
    if (data.latest?.systolic && data.latest?.diastolic) {
      latestDisplay = `${data.latest.systolic} / ${data.latest.diastolic}`;
    }
  } else if (data.latest !== null && data.latest !== undefined) {
    latestDisplay = `${data.latest}`;
  }

  // Format Previous Value
  let prevDisplay = '--';
  if (isBP) {
    if (data.previous?.systolic && data.previous?.diastolic) {
      prevDisplay = `${data.previous.systolic} / ${data.previous.diastolic}`;
    }
  } else if (data.previous !== null && data.previous !== undefined) {
    prevDisplay = `${data.previous} ${config.unit}`;
  }

  // Format Change Badge
  let changeDisplay = null;
  let changeIcon = null;

  if (isBP) {
    if (data.change?.systolic !== null && data.change?.systolic !== undefined) {
      const sysVal = data.change.systolic;
      const diaVal = data.change.diastolic;
      const sysSign = sysVal > 0 ? `+${sysVal}` : `${sysVal}`;
      const diaSign = diaVal > 0 ? `+${diaVal}` : `${diaVal}`;
      changeDisplay = `${sysSign} / ${diaSign}`;
      changeIcon = sysVal > 0 ? TrendingUp : sysVal < 0 ? TrendingDown : Minus;
    }
  } else if (data.change !== null && data.change !== undefined) {
    const sign = data.change > 0 ? `+${data.change}` : `${data.change}`;
    const pct = data.percentageChange !== null && data.percentageChange !== undefined
      ? ` (${data.percentageChange > 0 ? `+${data.percentageChange}` : data.percentageChange}%)`
      : '';
    changeDisplay = `${sign} ${config.unit}${pct}`;
    changeIcon = data.change > 0 ? TrendingUp : data.change < 0 ? TrendingDown : Minus;
  }

  const ChangeIconComponent = changeIcon || Minus;

  return (
    <Card
      onClick={onClick}
      className={`p-5 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${
        isSelected
          ? 'ring-2 ring-teal-600 shadow-md bg-teal-50/20'
          : 'hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.iconBg}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">{config.title}</h3>
            <span className="text-xs text-slate-400">
              {data.recordCount !== undefined ? `${data.recordCount} records` : 'No data'}
            </span>
          </div>
        </div>

        {changeDisplay && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <ChangeIconComponent className="h-3 w-3 text-slate-500" />
            <span>{changeDisplay}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {latestDisplay}
            </span>
            {latestDisplay !== '--' && (
              <span className="text-xs font-semibold text-slate-500">{config.unit}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Previous: <span className="font-medium text-slate-700">{prevDisplay}</span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HealthMetricCard;
