import { useState, useEffect, useCallback } from 'react';
import {
  getMedicines,
  deactivateMedicine,
  activateMedicine,
} from '../services/medicineApi';
import MedicineCard from '../components/medicine/MedicineCard';
import MedicineForm from '../components/medicine/MedicineForm';
import Button from '../components/ui/Button';
import {
  Pill,
  Plus,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'inactive' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [notification, setNotification] = useState({ type: '', text: '' });

  // Fetch medicines with current filters
  const fetchMedicines = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        status: statusFilter,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const response = await getMedicines(params);
      if (response && response.data?.medicines) {
        setMedicines(response.data.medicines);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your medications. Please verify your connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    // Small debounce for search query
    const handler = setTimeout(() => {
      fetchMedicines();
    }, 250);

    return () => clearTimeout(handler);
  }, [fetchMedicines]);

  // Handle successful creation or update
  const handleFormSuccess = (savedMedicine, isEditing) => {
    if (isEditing) {
      setMedicines((prev) =>
        prev.map((med) => (med.id === savedMedicine.id ? savedMedicine : med))
      );
      showNotification('success', `Updated ${savedMedicine.name} successfully!`);
    } else {
      setMedicines((prev) => [savedMedicine, ...prev]);
      showNotification('success', `Added ${savedMedicine.name} to your schedule!`);
    }
  };

  // Handle deactivation
  const handleDeactivate = async (id) => {
    try {
      const response = await deactivateMedicine(id);
      const updated = response.data?.medicine;
      if (updated) {
        if (statusFilter === 'active') {
          setMedicines((prev) => prev.filter((m) => m.id !== id));
        } else {
          setMedicines((prev) =>
            prev.map((m) => (m.id === id ? updated : m))
          );
        }
        showNotification('success', `Medication deactivated and archived.`);
      }
    } catch (err) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to deactivate medication.'
      );
    }
  };

  // Handle reactivation
  const handleActivate = async (id) => {
    try {
      const response = await activateMedicine(id);
      const updated = response.data?.medicine;
      if (updated) {
        if (statusFilter === 'inactive') {
          setMedicines((prev) => prev.filter((m) => m.id !== id));
        } else {
          setMedicines((prev) =>
            prev.map((m) => (m.id === id ? updated : m))
          );
        }
        showNotification('success', `Medication reactivated to active schedule!`);
      }
    } catch (err) {
      showNotification(
        'error',
        err.response?.data?.message || 'Failed to reactivate medication.'
      );
    }
  };

  const openAddModal = () => {
    setSelectedMedicine(null);
    setIsFormOpen(true);
  };

  const openEditModal = (medicine) => {
    setSelectedMedicine(medicine);
    setIsFormOpen(true);
  };

  const showNotification = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification({ type: '', text: '' });
    }, 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage and organize your personal prescription schedules and dosages.
          </p>
        </div>

        <Button
          onClick={openAddModal}
          variant="secondary"
          className="flex items-center gap-2 shadow-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Add Medicine
        </Button>
      </div>

      {/* Temporary Toast Banner */}
      {notification.text && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition-all duration-200 animate-in fade-in ${
            notification.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span className="font-medium">{notification.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or generic formula..."
            className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              statusFilter === 'inactive'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inactive
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-100" />
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-base font-bold text-slate-900">{error}</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            An unexpected error occurred while communicating with the server.
          </p>
          <Button
            onClick={fetchMedicines}
            variant="outline"
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && medicines.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 text-secondary mb-4">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchQuery
              ? 'No medications match your search'
              : statusFilter === 'inactive'
              ? 'No inactive medications'
              : 'No medications added yet'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {searchQuery
              ? 'Try adjusting your search terms or view all medications.'
              : 'Add your first medication to start managing your daily reminders and dosage routines.'}
          </p>
          <div className="mt-5">
            {searchQuery ? (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="text-xs"
              >
                Clear Search
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={openAddModal}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add Medicine
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Medicines Cards Grid */}
      {!loading && !error && medicines.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {medicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={openEditModal}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      <MedicineForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={selectedMedicine}
      />
    </div>
  );
};

export default Medicines;
