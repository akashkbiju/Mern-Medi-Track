import { Scale, Activity, Droplets, Heart, Thermometer, Minus, TrendingUp, TrendingDown } from 'lucide-react';

const METRIC_CONFIG = {
  weight: {
    label: 'Weight',
    unit: 'kg',
    icon: Scale,
    color: 'emerald',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'hover:border-emerald-300',
  },
  bloodPressure: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: Activity,
    color: 'sky',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    borderColor: 'hover:border-sky-300',
  },
  bloodSugar: {
    label: 'Blood Sugar',
    unit: 'mg/dL',
    icon: Droplets,
    color: 'amber',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'hover:border-amber-300',
  },
  heartRate: {
    label: 'Heart Rate',
    unit: 'BPM',
    icon: Heart,
    color: 'rose',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    borderColor: 'hover:border-rose-300',
  },
  temperature: {
    label: 'Body Temperature',
    unit: '°C',
    icon: Thermometer,
    color: 'purple',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    borderColor: 'hover:border-purple-300',
  },
};

const HealthMetricCard = ({
  metricKey,
  data,
  isActive = false,
  onClick,
}) => {
  const config = METRIC_CONFIG[metricKey] || {
    label: metricKey,
    unit: '',
    icon: Activity,
    iconBg: 'bg-slate-50',
    iconColor: 'text-slate-600',
    borderColor: 'hover:border-slate-300',
  };
  const Icon = config.icon;

  const isBP = metricKey === 'bloodPressure';
  const hasData = isBP
    ? Boolean(data?.latest?.systolic !== undefined && data?.latest?.systolic !== null)
    : Boolean(data?.latest !== undefined && data?.latest !== null);

  const recordCount = data?.recordCount || 0;

  // Format change string
  const formatChange = () => {
    if (!hasData || !data?.previous) return null;

    if (isBP) {
      const sysChg = data?.change?.systolic;
      const diaChg = data?.change?.diastolic;
      if (sysChg === null || sysChg === undefined) return null;
      const sysSign = sysChg > 0 ? `+${sysChg}` : `${sysChg}`;
      const diaSign = diaChg > 0 ? `+${diaChg}` : `${diaChg}`;
      return `${sysSign} / ${diaSign} mmHg`;
    }

    const chg = data?.change;
    if (chg === null || chg === undefined) return null;
    const sign = chg > 0 ? `+${chg}` : `${chg}`;
    const pct = data?.percentageChange !== null && data?.percentageChange !== undefined
      ? ` (${data.percentageChange > 0 ? `+${data.percentageChange}` : data.percentageChange}%)`
      : '';
    return `${sign} ${config.unit}${pct}`;
  };

  const changeText = formatChange();

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 shadow-xs transition-all cursor-pointer ${
        isActive
          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-sm'
          : `border-slate-200/80 ${config.borderColor}`
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{config.label}</h3>
            <p className="text-xs text-slate-500">
              {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </p>
          </div>
        </div>

        {hasData && (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
            {config.unit}
          </span>
        )}
      </div>

      <div className="mt-4">
        {hasData ? (
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {isBP ? `${data.latest.systolic}/${data.latest.diastolic}` : data.latest}
              </span>
              <span className="text-xs font-medium text-slate-500">{config.unit}</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs">
              {changeText ? (
                <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium">
                  <span className="text-[11px] text-slate-500 font-normal">Change:</span>
                  <span>{changeText}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">Initial baseline reading</span>
              )}

              {data?.previous && (
                <span className="text-[11px] text-slate-400">
                  Prev: {isBP ? `${data.previous.systolic}/${data.previous.diastolic}` : data.previous}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <span className="text-sm font-medium text-slate-400">No records</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Not recorded in this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthMetricCard;
