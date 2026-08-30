import React from 'react';
import {
  X,
  Calendar,
  Scale,
  Activity,
  Droplets,
  Heart,
  Thermometer,
  FileText,
  Clock,
} from 'lucide-react';
import Button from '../ui/Button';

export const PatientHealthRecordDetails = ({ record, isOpen, onClose }) => {
  if (!isOpen || !record) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Health Record Details</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                {formatDate(record.recordDate)}
                {formatTime(record.recordDate) && ` at ${formatTime(record.recordDate)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Measurement Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Weight */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Scale className="h-3.5 w-3.5 text-teal-600" />
                Weight
              </div>
              <div className="text-lg font-bold text-slate-900">
                {record.weight !== null && record.weight !== undefined ? (
                  <>
                    {record.weight} <span className="text-xs font-normal text-slate-500">kg</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Not recorded</span>
                )}
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Activity className="h-3.5 w-3.5 text-sky-600" />
                Blood Pressure
              </div>
              <div className="text-lg font-bold text-slate-900">
                {record.bloodPressure?.systolic && record.bloodPressure?.diastolic ? (
                  <>
                    {record.bloodPressure.systolic} / {record.bloodPressure.diastolic}{' '}
                    <span className="text-xs font-normal text-slate-500">mmHg</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Not recorded</span>
                )}
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Droplets className="h-3.5 w-3.5 text-indigo-600" />
                Blood Sugar
              </div>
              <div className="text-lg font-bold text-slate-900">
                {record.bloodSugar !== null && record.bloodSugar !== undefined ? (
                  <>
                    {record.bloodSugar} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Not recorded</span>
                )}
              </div>
            </div>

            {/* Heart Rate */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Heart className="h-3.5 w-3.5 text-rose-600" />
                Heart Rate
              </div>
              <div className="text-lg font-bold text-slate-900">
                {record.heartRate !== null && record.heartRate !== undefined ? (
                  <>
                    {record.heartRate} <span className="text-xs font-normal text-slate-500">BPM</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Not recorded</span>
                )}
              </div>
            </div>

            {/* Temperature */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Thermometer className="h-3.5 w-3.5 text-amber-600" />
                Temperature
              </div>
              <div className="text-lg font-bold text-slate-900">
                {record.temperature !== null && record.temperature !== undefined ? (
                  <>
                    {record.temperature} <span className="text-xs font-normal text-slate-500">°C</span>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm font-normal">Not recorded</span>
                )}
              </div>
            </div>
          </div>

          {/* Patient Notes */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Patient Recorded Notes
            </label>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 min-h-[70px]">
              {record.notes ? record.notes : <span className="text-slate-400 italic">No notes provided for this record.</span>}
            </div>
          </div>

          {/* Metadata Timestamps */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Logged: {new Date(record.createdAt || record.recordDate).toLocaleString()}
            </span>
            {record.updatedAt && record.updatedAt !== record.createdAt && (
              <span>Updated: {new Date(record.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="px-4 text-xs font-semibold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PatientHealthRecordDetails;
