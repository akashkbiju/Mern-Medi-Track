import React from 'react';
import Card from '../ui/Card';
import {
  Scale,
  HeartPulse,
  Droplets,
  Activity,
  Thermometer,
  CalendarCheck,
  Pill,
  Sparkles,
  Info,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_ICONS = {
  weight: Scale,
  blood_pressure: HeartPulse,
  blood_sugar: Droplets,
  heart_rate: Activity,
  temperature: Thermometer,
  consistency: CalendarCheck,
  adherence: Pill,
  general: Sparkles,
};

const SEVERITY_STYLES = {
  info: {
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-50 text-sky-600',
    border: 'border-slate-200 hover:border-sky-300',
    dot: 'bg-sky-500',
    indicatorIcon: Info,
    label: 'Observation',
  },
  positive: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-slate-200 hover:border-emerald-300',
    dot: 'bg-emerald-500',
    indicatorIcon: CheckCircle2,
    label: 'Consistent',
  },
  attention: {
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-amber-200 hover:border-amber-300 bg-amber-50/20',
    dot: 'bg-amber-500',
    indicatorIcon: AlertCircle,
    label: 'Notable Change',
  },
};

const formatCategoryName = (category) => {
  if (!category) return 'General';
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const InsightCard = ({ insight, className = '' }) => {
  if (!insight) return null;

  const category = insight.category || 'general';
  const severity = insight.severity || 'info';
  const IconComponent = CATEGORY_ICONS[category] || Sparkles;
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.info;
  const IndicatorIcon = style.indicatorIcon;

  return (
    <Card
      className={`p-5 transition-all duration-200 hover:shadow-sm ${style.border} ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Category Icon & Content */}
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${style.iconBg}`}>
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {formatCategoryName(category)}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${style.badge}`}
              >
                <IndicatorIcon className="h-3 w-3" />
                {style.label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">{insight.title}</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{insight.message}</p>
          </div>
        </div>

        {/* Right: Optional Metric Value Pill */}
        {insight.value !== undefined && insight.value !== null && (
          <div className="shrink-0 text-right hidden sm:block">
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              {insight.value > 0 ? `+${insight.value}` : insight.value}{' '}
              {insight.unit ? ` ${insight.unit}` : ''}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InsightCard;
