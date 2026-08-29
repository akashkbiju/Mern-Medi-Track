import { Activity, Heart, Droplets, Thermometer, Scale, Info } from 'lucide-react';
import Card from '../ui/Card';

/**
 * Format a Date into a friendly short string (e.g. "Sep 6, 08:30 AM" or "Today, 08:30 AM")
 */
const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const timeFormatted = d.toLocaleTimeString([], timeOptions);

    if (isToday) {
      return `Today, ${timeFormatted}`;
    }

    const dateOptions = { month: 'short', day: 'numeric' };
    return `${d.toLocaleDateString([], dateOptions)}, ${timeFormatted}`;
  } catch {
    return '';
  }
};

/**
 * HealthSummary Component
 * Displays compact summary cards for the latest recorded values of each vital health parameter.
 */
const HealthSummary = ({ records = [], loading = false }) => {
  // Determine latest non-null value for each measurement from sorted records (newest first)
  const latest = {
    weight: null,
    weightDate: null,
    bloodPressure: null,
    bpDate: null,
    bloodSugar: null,
    sugarDate: null,
    heartRate: null,
    hrDate: null,
    temperature: null,
    tempDate: null,
  };

  for (const r of records) {
    if (latest.weight === null && r.weight !== undefined && r.weight !== null) {
      latest.weight = r.weight;
      latest.weightDate = r.recordDate;
    }
    if (
      latest.bloodPressure === null &&
      r.bloodPressure &&
      r.bloodPressure.systolic !== undefined &&
      r.bloodPressure.diastolic !== undefined
    ) {
      latest.bloodPressure = r.bloodPressure;
      latest.bpDate = r.recordDate;
    }
    if (latest.bloodSugar === null && r.bloodSugar !== undefined && r.bloodSugar !== null) {
      latest.bloodSugar = r.bloodSugar;
      latest.sugarDate = r.recordDate;
    }
    if (latest.heartRate === null && r.heartRate !== undefined && r.heartRate !== null) {
      latest.heartRate = r.heartRate;
      latest.hrDate = r.recordDate;
    }
    if (latest.temperature === null && r.temperature !== undefined && r.temperature !== null) {
      latest.temperature = r.temperature;
      latest.tempDate = r.recordDate;
    }
  }

  const cards = [
    {
      id: 'weight',
      title: 'Latest Weight',
      value: latest.weight !== null ? `${latest.weight} kg` : 'Not recorded',
      recorded: latest.weightDate ? `Recorded ${formatFriendlyDate(latest.weightDate)}` : 'No data',
      icon: Scale,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      hasData: latest.weight !== null,
    },
    {
      id: 'bloodPressure',
      title: 'Blood Pressure',
      value:
        latest.bloodPressure !== null
          ? `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic} mmHg`
          : 'Not recorded',
      recorded: latest.bpDate ? `Recorded ${formatFriendlyDate(latest.bpDate)}` : 'No data',
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      hasData: latest.bloodPressure !== null,
    },
    {
      id: 'bloodSugar',
      title: 'Blood Sugar',
      value: latest.bloodSugar !== null ? `${latest.bloodSugar} mg/dL` : 'Not recorded',
      recorded: latest.sugarDate ? `Recorded ${formatFriendlyDate(latest.sugarDate)}` : 'No data',
      icon: Droplets,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      hasData: latest.bloodSugar !== null,
    },
    {
      id: 'heartRate',
      title: 'Heart Rate',
      value: latest.heartRate !== null ? `${latest.heartRate} BPM` : 'Not recorded',
      recorded: latest.hrDate ? `Recorded ${formatFriendlyDate(latest.hrDate)}` : 'No data',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      hasData: latest.heartRate !== null,
    },
    {
      id: 'temperature',
      title: 'Temperature',
      value: latest.temperature !== null ? `${latest.temperature} °C` : 'Not recorded',
      recorded: latest.tempDate ? `Recorded ${formatFriendlyDate(latest.tempDate)}` : 'No data',
      icon: Thermometer,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      hasData: latest.temperature !== null,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 animate-pulse">
        {cards.map((c) => (
          <div key={c.id} className="h-28 bg-slate-100 rounded-xl border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {cards.map((c) => (
          <Card
            key={c.id}
            className="p-4 bg-white border border-slate-200 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.bg} ${c.color}`}>
                <c.icon size={16} />
              </div>
            </div>

            <div className="mt-3">
              <p
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  c.hasData ? 'text-slate-900' : 'text-slate-400 text-sm italic'
                }`}
              >
                {c.value}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{c.recorded}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 pt-1">
        <Info size={12} className="shrink-0 text-slate-400" />
        <span>Tracking metrics are recorded history values and are not medical diagnoses.</span>
      </div>
    </div>
  );
};

export default HealthSummary;
