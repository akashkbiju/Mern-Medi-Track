import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Filter,
  Calendar,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { getHealthRecords, deleteHealthRecord } from '../services/healthApi';
import HealthSummary from '../components/health/HealthSummary';
import HealthRecordForm from '../components/health/HealthRecordForm';
import HealthRecordList from '../components/health/HealthRecordList';
import Button from '../components/ui/Button';

const TYPE_OPTIONS = [
  { value: '', label: 'All Vitals' },
  { value: 'weight', label: 'Weight' },
  { value: 'bloodPressure', label: 'Blood Pressure' },
  { value: 'bloodSugar', label: 'Blood Sugar' },
  { value: 'heartRate', label: 'Heart Rate' },
  { value: 'temperature', label: 'Temperature' },
];

const HealthTracking = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
  });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // User notification feedback toast
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const fetchRecords = useCallback(
    async (page = pagination.page) => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: 10,
        };
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (filters.type) params.type = filters.type;

        const res = await getHealthRecords(params);
        if (res?.success) {
          setRecords(res.data || []);
          if (res.pagination) {
            setPagination(res.pagination);
          }
        } else {
          setRecords(res?.data || []);
        }
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load health records.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page]
  );

  useEffect(() => {
    fetchRecords(1);
  }, [filters.startDate, filters.endDate, filters.type]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      type: '',
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchRecords(newPage);
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (rec) => {
    setEditingRecord(rec);
    setIsFormOpen(true);
  };

  const handleFormSuccess = (savedRecord) => {
    showFeedback(
      'success',
      editingRecord
        ? 'Health record updated successfully!'
        : 'New health record saved successfully!'
    );
    fetchRecords(1);
  };

  const handleDeleteRecord = async (id) => {
    setDeletingId(id);
    try {
      await deleteHealthRecord(id);
      showFeedback('success', 'Health record deleted successfully.');
      fetchRecords(pagination.page);
    } catch (err) {
      showFeedback(
        'error',
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete health record.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters = Boolean(
    filters.startDate || filters.endDate || filters.type
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl p-4 shadow-lg border animate-in slide-in-from-top-4 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <Activity className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Health Tracking</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Log and monitor your vital signs over time to stay informed about your health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchRecords(pagination.page)}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Record Vitals</span>
          </Button>
        </div>
      </div>

      {/* Latest Vitals Summary Cards */}
      <HealthSummary records={records} />

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Measurement Type Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
              Filter:
            </span>
            {TYPE_OPTIONS.map((opt) => {
              const active = filters.type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleFilterChange('type', opt.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Date Range Inputs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>From:</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>To:</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="rounded-lg border border-slate-300 py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 font-medium ml-1"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load health records</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecords(pagination.page)}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Records List / Table */}
      <HealthRecordList
        records={records}
        loading={loading}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteRecord}
        deletingId={deletingId}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-700">{pagination.page}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.totalPages}</span> ({pagination.total} total records)
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <span className="text-xs font-semibold px-2 py-1 text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Health Record Form Modal (Create / Edit) */}
      <HealthRecordForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingRecord}
      />
    </div>
  );
};

export default HealthTracking;
