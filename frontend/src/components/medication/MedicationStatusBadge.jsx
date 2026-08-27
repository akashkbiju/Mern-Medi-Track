import { Clock, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react';

const MedicationStatusBadge = ({ status = 'pending', className = '' }) => {
  const configs = {
    pending: {
      label: 'Pending',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
    taken: {
      label: 'Taken',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    missed: {
      label: 'Missed',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle,
    },
    skipped: {
      label: 'Skipped',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: MinusCircle,
    },
  };

  const current = configs[status] || configs.pending;
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${className}`}
    >
      <Icon size={12} className="shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};

export default MedicationStatusBadge;
