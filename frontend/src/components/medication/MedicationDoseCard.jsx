import { useState } from 'react';
import { Pill, Clock, Check, X, MessageSquare, AlertCircle } from 'lucide-react';
import MedicationStatusBadge from './MedicationStatusBadge';
import Button from '../ui/Button';

/**
 * Format ISO string into readable 12-hour time
 */
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MedicationDoseCard = ({ log, onTake, onSkip }) => {
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [actionType, setActionType] = useState(null); // 'take' | 'skip'
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  const medicine = log.medicine || {};
  const isPending = log.status === 'pending';
  const isMissed = log.status === 'missed';
  const isTaken = log.status === 'taken';
  const isSkipped = log.status === 'skipped';

  const handleOpenAction = (type) => {
    setActionType(type);
    setNoteText(log.notes || '');
    setIsNoteOpen(true);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (actionType === 'take' && onTake) {
        await onTake(log._id, noteText);
      } else if (actionType === 'skip' && onSkip) {
        await onSkip(log._id, noteText);
      }
      setIsNoteOpen(false);
    } catch (err) {
      console.error('Error recording medication action:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isTaken
          ? 'bg-emerald-50/30 border-emerald-200/80 shadow-xs'
          : isMissed
          ? 'bg-rose-50/30 border-rose-200/80 shadow-xs'
          : isSkipped
          ? 'bg-slate-50/70 border-slate-200 opacity-75'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Dose Details */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isTaken
                ? 'bg-emerald-100 text-emerald-700'
                : isMissed
                ? 'bg-rose-100 text-rose-700'
                : isSkipped
                ? 'bg-slate-200 text-slate-600'
                : 'bg-teal-50 text-teal-700 border border-teal-100'
            }`}
          >
            <Pill size={20} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                {medicine.name || 'Medication'}
              </h3>
              {medicine.dosage && medicine.dosageUnit && (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {medicine.dosage} {medicine.dosageUnit}
                </span>
              )}
              {medicine.genericName && (
                <span className="text-xs text-slate-400 font-normal hidden md:inline">
                  ({medicine.genericName})
                </span>
              )}
            </div>

            {medicine.instructions && (
              <p className="text-xs text-slate-600 mt-0.5">
                {medicine.instructions}
              </p>
            )}

            {/* Timing & Notes Meta */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Clock size={12} className="text-slate-400" />
                Scheduled: {log.scheduledTime12h || log.scheduledTime}
              </span>

              {isTaken && log.takenAt && (
                <span className="text-emerald-700 font-medium">
                  • Taken at {formatTime(log.takenAt)}
                </span>
              )}

              {log.notes && (
                <span className="italic text-slate-500">
                  • "{log.notes}"
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <MedicationStatusBadge status={log.status} />

          {/* Action Buttons */}
          {isPending && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenAction('take')}
                className="flex items-center gap-1 text-xs"
              >
                <Check size={13} />
                <span>Take</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenAction('skip')}
                className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800"
              >
                <X size={13} />
                <span>Skip</span>
              </Button>
            </div>
          )}

          {isMissed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenAction('take')}
              className="flex items-center gap-1 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              <Check size={13} />
              <span>Take Late</span>
            </Button>
          )}
        </div>
      </div>

      {/* Note & Action Confirmation Modal */}
      {isNoteOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200/80">
          <form onSubmit={handleConfirmAction} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1">
                <MessageSquare size={12} />
                {actionType === 'take'
                  ? 'Add optional note for taken dose:'
                  : 'Reason for skipping this dose (optional):'}
              </label>
              <button
                type="button"
                onClick={() => setIsNoteOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                Cancel
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  actionType === 'take'
                    ? 'e.g. Taken after lunch with water'
                    : 'e.g. Fasting or advised by doctor'
                }
                maxLength={500}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-hidden"
              />
              <Button
                type="submit"
                size="sm"
                variant={actionType === 'take' ? 'primary' : 'outline'}
                disabled={loading}
                className="text-xs shrink-0"
              >
                {loading
                  ? 'Saving...'
                  : actionType === 'take'
                  ? 'Confirm Taken'
                  : 'Confirm Skip'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MedicationDoseCard;
