import { useState } from 'react';
import {
  Calendar,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Scale,
  Activity,
  Droplets,
  Heart,
  Thermometer,
  FileText,
  Clock,
  Inbox,
} from 'lucide-react';
import Button from '../ui/Button';
import PatientHealthRecordDetails from './PatientHealthRecordDetails';

const METRIC_OPTIONS = [
  { value: '', label: 'All Measurements' },
  { value: 'weight', label: 'Weight' },
  { value: 'bloodPressure', label: 'Blood Pressure' },
  { value: 'bloodSugar', label: 'Blood Sugar' },
  { value: 'heartRate', label: 'Heart Rate' },
  { value: 'temperature', label: 'Temperature' },
];

export const PatientHealthRecords = ({
  records = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  loading = false,
  onPageChange,
  filters = { startDate: '', endDate: '', metric: '' },
  onFilterChange,
  onResetFilters,
}) => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleOpenDetails = (rec) => {
    setSelectedRecord(rec);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recorded Health Logs</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical measurements recorded by the patient in chronological order
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Whitelist Filter */}
          <div className="relative">
            <select
              value={filters.metric || ''}
              onChange={(e) => onFilterChange({ metric: e.target.value })}
              className="py-1.5 px-3 pr-8 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-hidden appearance-none"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="h-3 w-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs">
            <input
              type="date"
              aria-label="Start Date Filter"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="bg-transparent border-0 py-0.5 px-2 text-xs text-slate-700 focus:ring-0 focus:outline-hidden"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              aria-label="End Date Filter"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="bg-transparent border-0 py-0.5 px-2 text-xs text-slate-700 focus:ring-0 focus:outline-hidden"
            />
          </div>

          {(filters.startDate || filters.endDate || filters.metric) && (
            <button
              onClick={onResetFilters}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <p className="text-xs text-slate-500 font-medium">Retrieving health records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">No health records available</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              This patient has not recorded any health measurements for the selected period.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-4">Weight</th>
                  <th className="py-3.5 px-4">Blood Pressure</th>
                  <th className="py-3.5 px-4">Blood Sugar</th>
                  <th className="py-3.5 px-4">Heart Rate</th>
                  <th className="py-3.5 px-4">Temperature</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDetails(rec)}
                  >
                    {/* Date */}
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{formatDate(rec.recordDate)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal pl-5">
                        {formatTime(rec.recordDate)}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-3.5 px-4 font-medium">
                      {rec.weight !== null && rec.weight !== undefined ? (
                        <span className="text-slate-900">
                          {rec.weight}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">kg</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>

                    {/* Blood Pressure */}
                    <td className="py-3.5 px-4 font-medium">
                      {rec.bloodPressure?.systolic && rec.bloodPressure?.diastolic ? (
                        <span className="text-slate-900">
                          {rec.bloodPressure.systolic} / {rec.bloodPressure.diastolic}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">mmHg</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>

                    {/* Blood Sugar */}
                    <td className="py-3.5 px-4 font-medium">
                      {rec.bloodSugar !== null && rec.bloodSugar !== undefined ? (
                        <span className="text-slate-900">
                          {rec.bloodSugar}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">mg/dL</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>

                    {/* Heart Rate */}
                    <td className="py-3.5 px-4 font-medium">
                      {rec.heartRate !== null && rec.heartRate !== undefined ? (
                        <span className="text-slate-900">
                          {rec.heartRate}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">BPM</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>

                    {/* Temperature */}
                    <td className="py-3.5 px-4 font-medium">
                      {rec.temperature !== null && rec.temperature !== undefined ? (
                        <span className="text-slate-900">
                          {rec.temperature}{' '}
                          <span className="text-[11px] text-slate-400 font-normal">°C</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">--</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3.5 px-4 max-w-[180px] truncate text-slate-500">
                      {rec.notes ? rec.notes : <span className="text-slate-300">None</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(rec);
                        }}
                        className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Prevents horizontal overflow) */}
          <div className="md:hidden divide-y divide-slate-100 p-4 space-y-3">
            {records.map((rec) => (
              <div
                key={rec.id}
                onClick={() => handleOpenDetails(rec)}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(rec.recordDate)}
                    <span className="text-[11px] font-normal text-slate-400">
                      {formatTime(rec.recordDate)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-teal-700 hover:bg-teal-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {rec.weight !== null && rec.weight !== undefined && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <Scale className="h-3 w-3 text-teal-600" />
                      <span className="font-semibold">{rec.weight}</span> kg
                    </div>
                  )}
                  {rec.bloodPressure?.systolic && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <Activity className="h-3 w-3 text-sky-600" />
                      <span className="font-semibold">
                        {rec.bloodPressure.systolic}/{rec.bloodPressure.diastolic}
                      </span>{' '}
                      mmHg
                    </div>
                  )}
                  {rec.bloodSugar !== null && rec.bloodSugar !== undefined && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <Droplets className="h-3 w-3 text-indigo-600" />
                      <span className="font-semibold">{rec.bloodSugar}</span> mg/dL
                    </div>
                  )}
                  {rec.heartRate !== null && rec.heartRate !== undefined && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <Heart className="h-3 w-3 text-rose-600" />
                      <span className="font-semibold">{rec.heartRate}</span> BPM
                    </div>
                  )}
                  {rec.temperature !== null && rec.temperature !== undefined && (
                    <div className="flex items-center gap-1 text-slate-700">
                      <Thermometer className="h-3 w-3 text-amber-600" />
                      <span className="font-semibold">{rec.temperature}</span> °C
                    </div>
                  )}
                </div>

                {rec.notes && (
                  <p className="text-[11px] text-slate-500 italic truncate flex items-center gap-1">
                    <FileText className="h-3 w-3 text-slate-400 flex-shrink-0" />
                    {rec.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{records.length}</span> of{' '}
              <span className="font-bold text-slate-800">{pagination.total}</span> records
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="font-medium text-slate-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Record Details Modal */}
      <PatientHealthRecordDetails
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
};

export default PatientHealthRecords;
