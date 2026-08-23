import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  Pill,
  Clock,
  Calendar,
  Edit2,
  Power,
  RotateCcw,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';

const FREQUENCY_LABELS = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_times_daily: '3x daily',
  four_times_daily: '4x daily',
  custom: 'Custom schedule',
};

const formatDate = (dateString) => {
  if (!dateString) return 'Ongoing';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Ongoing';
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Ongoing';
  }
};

const MedicineCard = ({
  medicine,
  onEdit,
  onDeactivate,
  onActivate,
}) => {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleDeactivate = async () => {
    setProcessing(true);
    try {
      await onDeactivate(medicine.id);
    } finally {
      setProcessing(false);
      setConfirmDeactivate(false);
    }
  };

  const handleActivate = async () => {
    setProcessing(true);
    try {
      await onActivate(medicine.id);
    } finally {
      setProcessing(false);
    }
  };

  const isActive = medicine.isActive;

  return (
    <Card
      className={`relative overflow-hidden border p-5 transition-all duration-200 hover:shadow-md ${
        isActive
          ? 'border-slate-200 bg-white'
          : 'border-slate-200/80 bg-slate-50/70 opacity-90'
      }`}
    >
      {/* Top Row: Name, Dosage, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isActive
                ? 'bg-secondary/10 text-secondary'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                {medicine.name}
              </h3>
              <Badge variant={isActive ? 'success' : 'neutral'} className="text-[10px] uppercase font-semibold">
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            {medicine.genericName && (
              <p className="text-xs text-slate-500 font-medium">
                {medicine.genericName}
              </p>
            )}
          </div>
        </div>

        {/* Dosage Tag */}
        <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
          {medicine.dosage} {medicine.dosageUnit}
        </div>
      </div>

      {/* Middle Section: Frequency & Scheduled Times */}
      <div className="mt-4 space-y-2.5 border-t border-b border-slate-100 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">
            {FREQUENCY_LABELS[medicine.frequency] || medicine.frequency}:
          </span>
          <div className="flex flex-wrap gap-1">
            {medicine.times && medicine.times.length > 0 ? (
              medicine.times.map((t, i) => (
                <span
                  key={i}
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 font-mono"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-slate-400 italic">No times set</span>
            )}
          </div>
        </div>

        {/* Date Span */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>
            {formatDate(medicine.startDate)} →{' '}
            <strong className="text-slate-700 font-semibold">
              {formatDate(medicine.endDate)}
            </strong>
          </span>
        </div>

        {/* Instructions */}
        {medicine.instructions && (
          <div className="flex items-start gap-2 text-xs text-slate-600 pt-0.5">
            <Info className="h-3.5 w-3.5 text-secondary shrink-0 mt-0.5" />
            <span className="italic">{medicine.instructions}</span>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-3.5 flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => onEdit(medicine)}
          className="text-xs py-1.5 px-3 flex items-center gap-1.5"
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>

        {isActive ? (
          <button
            type="button"
            onClick={() => setConfirmDeactivate(true)}
            className="text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors flex items-center gap-1 px-2 py-1"
          >
            <Power className="h-3.5 w-3.5" />
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            disabled={processing}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 px-2 py-1"
          >
            {processing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reactivate
          </button>
        )}
      </div>

      {/* In-Card Deactivation Confirmation Dialog */}
      {confirmDeactivate && (
        <div className="absolute inset-0 z-10 flex flex-col justify-center rounded-2xl bg-white/95 p-5 text-center backdrop-blur-sm animate-in fade-in duration-150">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Deactivate {medicine.name}?
          </h4>
          <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
            This will archive the medicine schedule. Historical logs will be preserved.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeactivate(false)}
              disabled={processing}
              className="text-xs py-1 px-3"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={processing}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                'Deactivate'
              )}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MedicineCard;
