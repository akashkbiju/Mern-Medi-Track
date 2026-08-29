import { useState } from 'react';
import {
  Scale,
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  FileText,
  Loader2,
} from 'lucide-react';
import Button from '../ui/Button';

const HealthRecordList = ({
  records = [],
  loading = false,
  onEdit,
  onDelete,
  deletingId = null,
}) => {
  const [recordToDelete, setRecordToDelete] = useState(null);

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const id = recordToDelete._id || recordToDelete.id;
    await onDelete(id);
    setRecordToDelete(null);
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading health records...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-4">
          <Activity className="h-7 w-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">No health records found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No records match your selected filter criteria. Try adjusting the date range, measurement filter, or record your first vitals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-3.5">Date & Time</th>
                <th scope="col" className="px-4 py-3.5">Weight</th>
                <th scope="col" className="px-4 py-3.5">Blood Pressure</th>
                <th scope="col" className="px-4 py-3.5">Blood Sugar</th>
                <th scope="col" className="px-4 py-3.5">Heart Rate</th>
                <th scope="col" className="px-4 py-3.5">Temperature</th>
                <th scope="col" className="px-4 py-3.5">Notes</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => {
                const id = rec._id || rec.id;
                const recDate = rec.recordDate || rec.createdAt;
                const isDeleting = deletingId === id;

                return (
                  <tr
                    key={id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date & Time */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(recDate)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatTime(recDate)}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rec.weight !== undefined && rec.weight !== null ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <Scale className="h-3.5 w-3.5 text-emerald-500" />
                          <span>{rec.weight} <span className="text-[10px] font-normal text-emerald-600">kg</span></span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Blood Pressure */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rec.bloodPressure?.systolic !== undefined && rec.bloodPressure?.diastolic !== undefined ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          <Activity className="h-3.5 w-3.5 text-sky-500" />
                          <span>
                            {rec.bloodPressure.systolic}/{rec.bloodPressure.diastolic}{' '}
                            <span className="text-[10px] font-normal text-sky-600">mmHg</span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Blood Sugar */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rec.bloodSugar !== undefined && rec.bloodSugar !== null ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          <Droplets className="h-3.5 w-3.5 text-amber-500" />
                          <span>{rec.bloodSugar} <span className="text-[10px] font-normal text-amber-600">mg/dL</span></span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Heart Rate */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rec.heartRate !== undefined && rec.heartRate !== null ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <Heart className="h-3.5 w-3.5 text-rose-500" />
                          <span>{rec.heartRate} <span className="text-[10px] font-normal text-rose-600">BPM</span></span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Temperature */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {rec.temperature !== undefined && rec.temperature !== null ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          <Thermometer className="h-3.5 w-3.5 text-purple-500" />
                          <span>{rec.temperature} <span className="text-[10px] font-normal text-purple-600">°C</span></span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-4 max-w-[200px]">
                      {rec.notes ? (
                        <div
                          className="truncate text-xs text-slate-600 cursor-help"
                          title={rec.notes}
                        >
                          {rec.notes}
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(rec)}
                          disabled={isDeleting}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-600 transition-colors"
                          aria-label="Edit record"
                          title="Edit record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(rec)}
                          disabled={isDeleting}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label="Delete record"
                          title="Delete record"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards (Visible on smaller screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {records.map((rec) => {
          const id = rec._id || rec.id;
          const recDate = rec.recordDate || rec.createdAt;
          const isDeleting = deletingId === id;

          return (
            <div
              key={id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(recDate)}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {formatTime(recDate)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(rec)}
                    disabled={isDeleting}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-teal-600"
                    aria-label="Edit record"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordToDelete(rec)}
                    disabled={isDeleting}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete record"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Vitals Badges Grid */}
              <div className="flex flex-wrap gap-2">
                {rec.weight !== undefined && rec.weight !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Scale className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{rec.weight} kg</span>
                  </div>
                )}
                {rec.bloodPressure?.systolic !== undefined && rec.bloodPressure?.diastolic !== undefined && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    <Activity className="h-3.5 w-3.5 text-sky-500" />
                    <span>{rec.bloodPressure.systolic}/{rec.bloodPressure.diastolic} mmHg</span>
                  </div>
                )}
                {rec.bloodSugar !== undefined && rec.bloodSugar !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    <Droplets className="h-3.5 w-3.5 text-amber-500" />
                    <span>{rec.bloodSugar} mg/dL</span>
                  </div>
                )}
                {rec.heartRate !== undefined && rec.heartRate !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <Heart className="h-3.5 w-3.5 text-rose-500" />
                    <span>{rec.heartRate} BPM</span>
                  </div>
                )}
                {rec.temperature !== undefined && rec.temperature !== null && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    <Thermometer className="h-3.5 w-3.5 text-purple-500" />
                    <span>{rec.temperature} °C</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {rec.notes && (
                <div className="flex items-start gap-1.5 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                  <p className="line-clamp-2">{rec.notes}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          aria-modal="true"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Health Record</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              Are you sure you want to delete the health record from{' '}
              <span className="font-semibold text-slate-900">
                {formatDate(recordToDelete.recordDate || recordToDelete.createdAt)} at{' '}
                {formatTime(recordToDelete.recordDate || recordToDelete.createdAt)}
              </span>
              ?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              This action cannot be undone. Any vitals recorded in this entry will be removed from your health history.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <Button
                type="button"
                variant="danger"
                onClick={confirmDelete}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthRecordList;
