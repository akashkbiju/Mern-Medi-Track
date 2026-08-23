import { useState, useEffect } from 'react';
import { createMedicine, updateMedicine } from '../../services/medicineApi';
import Button from '../ui/Button';
import {
  X,
  Pill,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const DOSAGE_UNITS = [
  { value: 'mg', label: 'mg (Milligrams)' },
  { value: 'g', label: 'g (Grams)' },
  { value: 'mcg', label: 'mcg (Micrograms)' },
  { value: 'ml', label: 'ml (Milliliters)' },
  { value: 'tablet', label: 'Tablet(s)' },
  { value: 'capsule', label: 'Capsule(s)' },
  { value: 'drop', label: 'Drop(s)' },
  { value: 'puff', label: 'Puff(s)' },
  { value: 'unit', label: 'Unit(s)' },
];

const FREQUENCY_OPTIONS = [
  { value: 'once_daily', label: 'Once daily' },
  { value: 'twice_daily', label: 'Twice daily' },
  { value: 'three_times_daily', label: 'Three times daily' },
  { value: 'four_times_daily', label: 'Four times daily' },
  { value: 'custom', label: 'Custom schedule' },
];

const DEFAULT_TIMES_MAP = {
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  three_times_daily: ['08:00', '14:00', '20:00'],
  four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
  custom: ['08:00'],
};

const INSTRUCTION_PRESETS = [
  'Take after food',
  'Take before food',
  'Take with a full glass of water',
  'Take at bedtime',
  'Do not crush or chew',
  'Take on an empty stomach',
];

const MedicineForm = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dosage: '',
    dosageUnit: 'mg',
    frequency: 'once_daily',
    times: ['08:00'],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isOngoing: true,
    instructions: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Format date to YYYY-MM-DD for input[type="date"]
  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Populate form when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        genericName: initialData.genericName || '',
        dosage: initialData.dosage !== undefined ? String(initialData.dosage) : '',
        dosageUnit: initialData.dosageUnit || 'mg',
        frequency: initialData.frequency || 'once_daily',
        times: Array.isArray(initialData.times) && initialData.times.length > 0
          ? initialData.times
          : ['08:00'],
        startDate: formatDateForInput(initialData.startDate) || new Date().toISOString().split('T')[0],
        endDate: formatDateForInput(initialData.endDate),
        isOngoing: !initialData.endDate,
        instructions: initialData.instructions || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        name: '',
        genericName: '',
        dosage: '',
        dosageUnit: 'mg',
        frequency: 'once_daily',
        times: ['08:00'],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isOngoing: true,
        instructions: '',
        notes: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFrequencyChange = (e) => {
    const newFrequency = e.target.value;
    const defaultTimes = DEFAULT_TIMES_MAP[newFrequency] || ['08:00'];
    setFormData((prev) => ({
      ...prev,
      frequency: newFrequency,
      times: defaultTimes,
    }));
    if (errors.times) {
      setErrors((prev) => ({ ...prev, times: '' }));
    }
  };

  const handleTimeChange = (index, value) => {
    setFormData((prev) => {
      const updatedTimes = [...prev.times];
      updatedTimes[index] = value;
      return { ...prev, times: updatedTimes };
    });
    if (errors.times) {
      setErrors((prev) => ({ ...prev, times: '' }));
    }
  };

  const handleAddTime = () => {
    if (formData.times.length >= 12) return;
    setFormData((prev) => ({
      ...prev,
      times: [...prev.times, '12:00'],
    }));
  };

  const handleRemoveTime = (index) => {
    if (formData.times.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const handleOngoingToggle = (e) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      isOngoing: checked,
      endDate: checked ? '' : prev.endDate,
    }));
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Medicine name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }

    if (!formData.dosage || isNaN(Number(formData.dosage)) || Number(formData.dosage) <= 0) {
      newErrors.dosage = 'Please enter a valid positive dosage number';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.isOngoing && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        newErrors.endDate = 'End date cannot be earlier than start date';
      }
    }

    // Validate times
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const invalidTime = formData.times.some((t) => !timeRegex.test(t));
    if (invalidTime) {
      newErrors.times = 'All times must be in valid 24-hour format (HH:mm)';
    } else {
      const uniqueTimes = new Set(formData.times);
      if (uniqueTimes.size !== formData.times.length) {
        newErrors.times = 'Medication times cannot contain duplicate hours';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      const payload = {
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        dosage: Number(formData.dosage),
        dosageUnit: formData.dosageUnit,
        frequency: formData.frequency,
        times: formData.times,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.isOngoing || !formData.endDate
          ? null
          : new Date(formData.endDate).toISOString(),
        instructions: formData.instructions.trim(),
        notes: formData.notes.trim(),
      };

      let response;
      if (isEditing) {
        response = await updateMedicine(initialData.id, payload);
      } else {
        response = await createMedicine(payload);
      }

      if (response && response.data?.medicine) {
        onSuccess(response.data.medicine, isEditing);
        onClose();
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors[0]?.message) ||
        'Failed to save medication. Please check your inputs.';
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Medication' : 'Add New Medication'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update your dosage schedule and instructions'
                  : 'Add a medicine schedule to track your routine'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="font-medium">{serverError}</p>
            </div>
          )}

          {/* Section 1: Basic Medicine Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Medicine Name */}
              <div>
                <label htmlFor="med-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Medicine Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="med-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Paracetamol"
                  className={`mt-1.5 block w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              {/* Generic Name */}
              <div>
                <label htmlFor="med-generic" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Generic Name / Formula
                </label>
                <input
                  type="text"
                  id="med-generic"
                  name="genericName"
                  value={formData.genericName}
                  onChange={handleChange}
                  placeholder="e.g. Acetaminophen"
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Dosage and Unit */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="med-dosage" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Dosage Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  id="med-dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  className={`mt-1.5 block w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                    errors.dosage
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
                {errors.dosage && <p className="mt-1 text-xs text-red-600">{errors.dosage}</p>}
              </div>

              <div>
                <label htmlFor="med-unit" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Dosage Unit <span className="text-red-500">*</span>
                </label>
                <select
                  id="med-unit"
                  name="dosageUnit"
                  value={formData.dosageUnit}
                  onChange={handleChange}
                  className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {DOSAGE_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Frequency & Schedule Times */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <div>
              <label htmlFor="med-frequency" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Frequency Schedule <span className="text-red-500">*</span>
              </label>
              <select
                id="med-frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleFrequencyChange}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {FREQUENCY_OPTIONS.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Medication Times */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Medication Times (24-Hour) <span className="text-red-500">*</span>
                </label>
                {formData.frequency === 'custom' && formData.times.length < 12 && (
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary-light"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Dose Time
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {formData.times.map((time, index) => (
                  <div key={index} className="relative flex items-center">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm font-medium text-slate-800 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {formData.frequency === 'custom' && formData.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(index)}
                        className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove time"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.times && <p className="mt-1.5 text-xs text-red-600">{errors.times}</p>}
            </div>
          </div>

          {/* Section 3: Date Boundaries */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="med-start" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  id="med-start"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.startDate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="med-end" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  End Date
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isOngoing}
                    onChange={handleOngoingToggle}
                    className="rounded border-slate-300 text-secondary focus:ring-secondary"
                  />
                  Ongoing (no end date)
                </label>
              </div>
              <div className="relative mt-1.5">
                <input
                  type="date"
                  id="med-end"
                  name="endDate"
                  disabled={formData.isOngoing}
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    formData.isOngoing
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : errors.endDate
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
            </div>
          </div>

          {/* Section 4: Instructions & Notes */}
          <div className="space-y-4">
            <div>
              <label htmlFor="med-instructions" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Instructions
              </label>
              <input
                type="text"
                id="med-instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="e.g. Take with food or water"
                className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {/* Presets chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {INSTRUCTION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, instructions: preset }))}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="med-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Personal Notes (Optional)
              </label>
              <textarea
                id="med-notes"
                name="notes"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any personal doctor recommendations or warnings..."
                className="mt-1.5 block w-full rounded-lg border border-slate-300 py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={submitting}
              className="min-w-[140px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Medication'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicineForm;
