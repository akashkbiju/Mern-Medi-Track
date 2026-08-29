import { useState, useEffect } from 'react';
import { createHealthRecord, updateHealthRecord } from '../../services/healthApi';
import Button from '../ui/Button';
import {
  X,
  Activity,
  Heart,
  Scale,
  Droplets,
  Thermometer,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';

const HealthRecordForm = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const isEditing = Boolean(initialData && (initialData._id || initialData.id));

  // Format date to YYYY-MM-DDTHH:mm for datetime-local input
  const formatDateTimeLocal = (dateVal) => {
    try {
      const d = dateVal ? new Date(dateVal) : new Date();
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    recordDate: formatDateTimeLocal(new Date()),
    weight: '',
    systolic: '',
    diastolic: '',
    bloodSugar: '',
    heartRate: '',
    temperature: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Populate form when initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        recordDate: formatDateTimeLocal(initialData.recordDate || initialData.createdAt),
        weight: initialData.weight !== undefined && initialData.weight !== null ? String(initialData.weight) : '',
        systolic: initialData.bloodPressure?.systolic !== undefined && initialData.bloodPressure?.systolic !== null ? String(initialData.bloodPressure.systolic) : '',
        diastolic: initialData.bloodPressure?.diastolic !== undefined && initialData.bloodPressure?.diastolic !== null ? String(initialData.bloodPressure.diastolic) : '',
        bloodSugar: initialData.bloodSugar !== undefined && initialData.bloodSugar !== null ? String(initialData.bloodSugar) : '',
        heartRate: initialData.heartRate !== undefined && initialData.heartRate !== null ? String(initialData.heartRate) : '',
        temperature: initialData.temperature !== undefined && initialData.temperature !== null ? String(initialData.temperature) : '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        recordDate: formatDateTimeLocal(new Date()),
        weight: '',
        systolic: '',
        diastolic: '',
        bloodSugar: '',
        heartRate: '',
        temperature: '',
        notes: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        delete updated.general;
        return updated;
      });
    }
  };

  const setNow = () => {
    setFormData((prev) => ({
      ...prev,
      recordDate: formatDateTimeLocal(new Date()),
    }));
    if (errors.recordDate) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.recordDate;
        return updated;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // 1. Date validation
    if (!formData.recordDate) {
      newErrors.recordDate = 'Date and time of measurement is required';
    } else {
      const recTime = new Date(formData.recordDate).getTime();
      if (isNaN(recTime)) {
        newErrors.recordDate = 'Invalid date/time format';
      } else {
        const maxAllowed = Date.now() + 5 * 60 * 1000;
        if (recTime > maxAllowed) {
          newErrors.recordDate = 'Record date cannot be in the future';
        }
      }
    }

    // 2. Weight validation (1 - 500 kg)
    if (formData.weight !== '') {
      const w = Number(formData.weight);
      if (isNaN(w) || w < 1 || w > 500) {
        newErrors.weight = 'Weight must be between 1 and 500 kg';
      }
    }

    // 3. Blood Pressure validation
    const hasSys = formData.systolic !== '';
    const hasDia = formData.diastolic !== '';

    if (hasSys && !hasDia) {
      newErrors.diastolic = 'Diastolic is required when systolic is provided';
    } else if (!hasSys && hasDia) {
      newErrors.systolic = 'Systolic is required when diastolic is provided';
    } else if (hasSys && hasDia) {
      const s = Number(formData.systolic);
      const d = Number(formData.diastolic);
      if (isNaN(s) || s < 40 || s > 300) {
        newErrors.systolic = 'Systolic must be between 40 and 300 mmHg';
      }
      if (isNaN(d) || d < 30 || d > 200) {
        newErrors.diastolic = 'Diastolic must be between 30 and 200 mmHg';
      }
      if (!isNaN(s) && !isNaN(d) && s <= d) {
        newErrors.systolic = 'Systolic must be strictly greater than diastolic';
      }
    }

    // 4. Blood Sugar (20 - 1000 mg/dL)
    if (formData.bloodSugar !== '') {
      const bs = Number(formData.bloodSugar);
      if (isNaN(bs) || bs < 20 || bs > 1000) {
        newErrors.bloodSugar = 'Blood sugar must be between 20 and 1000 mg/dL';
      }
    }

    // 5. Heart Rate (20 - 300 BPM)
    if (formData.heartRate !== '') {
      const hr = Number(formData.heartRate);
      if (isNaN(hr) || hr < 20 || hr > 300) {
        newErrors.heartRate = 'Heart rate must be between 20 and 300 BPM';
      }
    }

    // 6. Temperature (25 - 45 °C)
    if (formData.temperature !== '') {
      const temp = Number(formData.temperature);
      if (isNaN(temp) || temp < 25 || temp > 45) {
        newErrors.temperature = 'Temperature must be between 25.0 and 45.0 °C';
      }
    }

    // 7. Notes validation
    if (formData.notes && formData.notes.length > 1000) {
      newErrors.notes = 'Notes cannot exceed 1000 characters';
    }

    // 8. At least one measurement is required
    const hasAnyMeasurement =
      formData.weight !== '' ||
      (formData.systolic !== '' && formData.diastolic !== '') ||
      formData.bloodSugar !== '' ||
      formData.heartRate !== '' ||
      formData.temperature !== '';

    if (!hasAnyMeasurement) {
      newErrors.general = 'Please provide at least one vital health measurement (Weight, Blood Pressure, Blood Sugar, Heart Rate, or Temperature).';
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
        recordDate: new Date(formData.recordDate).toISOString(),
        notes: formData.notes.trim(),
      };

      if (formData.weight !== '') payload.weight = Number(formData.weight);
      if (formData.systolic !== '' && formData.diastolic !== '') {
        payload.bloodPressure = {
          systolic: Number(formData.systolic),
          diastolic: Number(formData.diastolic),
        };
      }
      if (formData.bloodSugar !== '') payload.bloodSugar = Number(formData.bloodSugar);
      if (formData.heartRate !== '') payload.heartRate = Number(formData.heartRate);
      if (formData.temperature !== '') payload.temperature = Number(formData.temperature);

      let result;
      const recordId = initialData?._id || initialData?.id;
      if (isEditing && recordId) {
        result = await updateHealthRecord(recordId, payload);
      } else {
        result = await createHealthRecord(payload);
      }

      if (onSuccess) {
        onSuccess(result?.data || result);
      }
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save health record. Please check your inputs.';
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
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? 'Edit Health Record' : 'Record Health Measurements'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update your recorded vitals and notes'
                  : 'Log your daily vital signs to track health trends'}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {serverError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="font-medium">{serverError}</p>
            </div>
          )}

          {errors.general && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p className="font-medium">{errors.general}</p>
            </div>
          )}

          {/* Record Date & Time */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="recordDate" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-500" />
                Measurement Date & Time <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={setNow}
                className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
              >
                <Clock className="h-3.5 w-3.5" />
                Set to Now
              </button>
            </div>
            <input
              type="datetime-local"
              id="recordDate"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleChange}
              className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 bg-white transition-colors focus:outline-none focus:ring-2 ${
                errors.recordDate
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
              }`}
            />
            {errors.recordDate && <p className="mt-1 text-xs text-red-600">{errors.recordDate}</p>}
          </div>

          {/* Vital Signs Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vital Measurements
              </span>
              <span className="text-xs text-slate-400 italic">Enter all or any applicable vitals</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Weight */}
              <div className="rounded-xl border border-slate-200/80 p-3.5 hover:border-emerald-300 transition-colors bg-white">
                <label htmlFor="weight" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Scale className="h-4 w-4 text-emerald-500" />
                    Weight
                  </span>
                  <span className="text-xs text-slate-400 font-normal">kg</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="500"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 70.5"
                    className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.weight
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
                    }`}
                  />
                </div>
                {errors.weight && <p className="mt-1 text-xs text-red-600">{errors.weight}</p>}
                <p className="mt-1 text-[11px] text-slate-400">Range: 1 – 500 kg</p>
              </div>

              {/* Heart Rate */}
              <div className="rounded-xl border border-slate-200/80 p-3.5 hover:border-rose-300 transition-colors bg-white">
                <label htmlFor="heartRate" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-rose-500" />
                    Heart Rate (Pulse)
                  </span>
                  <span className="text-xs text-slate-400 font-normal">BPM</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="1"
                    min="20"
                    max="300"
                    id="heartRate"
                    name="heartRate"
                    value={formData.heartRate}
                    onChange={handleChange}
                    placeholder="e.g. 72"
                    className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.heartRate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'
                    }`}
                  />
                </div>
                {errors.heartRate && <p className="mt-1 text-xs text-red-600">{errors.heartRate}</p>}
                <p className="mt-1 text-[11px] text-slate-400">Range: 20 – 300 BPM</p>
              </div>

              {/* Blood Pressure (Systolic / Diastolic) */}
              <div className="sm:col-span-2 rounded-xl border border-slate-200/80 p-3.5 hover:border-sky-300 transition-colors bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-sky-500" />
                    Blood Pressure
                  </span>
                  <span className="text-xs text-slate-400 font-normal">mmHg (Systolic / Diastolic)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="systolic" className="block text-[11px] font-medium text-slate-500 mb-1">
                      Systolic (Upper)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="40"
                      max="300"
                      id="systolic"
                      name="systolic"
                      value={formData.systolic}
                      onChange={handleChange}
                      placeholder="e.g. 120"
                      className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                        errors.systolic
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-sky-500 focus:ring-sky-200'
                      }`}
                    />
                    {errors.systolic && <p className="mt-1 text-xs text-red-600">{errors.systolic}</p>}
                    <p className="mt-1 text-[11px] text-slate-400">40 – 300 mmHg</p>
                  </div>
                  <div>
                    <label htmlFor="diastolic" className="block text-[11px] font-medium text-slate-500 mb-1">
                      Diastolic (Lower)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="30"
                      max="200"
                      id="diastolic"
                      name="diastolic"
                      value={formData.diastolic}
                      onChange={handleChange}
                      placeholder="e.g. 80"
                      className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                        errors.diastolic
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-300 focus:border-sky-500 focus:ring-sky-200'
                      }`}
                    />
                    {errors.diastolic && <p className="mt-1 text-xs text-red-600">{errors.diastolic}</p>}
                    <p className="mt-1 text-[11px] text-slate-400">30 – 200 mmHg</p>
                  </div>
                </div>
              </div>

              {/* Blood Sugar */}
              <div className="rounded-xl border border-slate-200/80 p-3.5 hover:border-amber-300 transition-colors bg-white">
                <label htmlFor="bloodSugar" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="h-4 w-4 text-amber-500" />
                    Blood Sugar / Glucose
                  </span>
                  <span className="text-xs text-slate-400 font-normal">mg/dL</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="1"
                    min="20"
                    max="1000"
                    id="bloodSugar"
                    name="bloodSugar"
                    value={formData.bloodSugar}
                    onChange={handleChange}
                    placeholder="e.g. 95"
                    className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.bloodSugar
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
                    }`}
                  />
                </div>
                {errors.bloodSugar && <p className="mt-1 text-xs text-red-600">{errors.bloodSugar}</p>}
                <p className="mt-1 text-[11px] text-slate-400">Range: 20 – 1000 mg/dL</p>
              </div>

              {/* Temperature */}
              <div className="rounded-xl border border-slate-200/80 p-3.5 hover:border-purple-300 transition-colors bg-white">
                <label htmlFor="temperature" className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="h-4 w-4 text-purple-500" />
                    Body Temperature
                  </span>
                  <span className="text-xs text-slate-400 font-normal">°C</span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    step="0.1"
                    min="25"
                    max="45"
                    id="temperature"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    placeholder="e.g. 36.8"
                    className={`w-full rounded-lg border py-2 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                      errors.temperature
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-300 focus:border-purple-500 focus:ring-purple-200'
                    }`}
                  />
                </div>
                {errors.temperature && <p className="mt-1 text-xs text-red-600">{errors.temperature}</p>}
                <p className="mt-1 text-[11px] text-slate-400">Range: 25.0 – 45.0 °C</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-slate-500" />
                Notes & Symptoms (Optional)
              </label>
              <span className="text-xs text-slate-400">
                {formData.notes.length}/1000
              </span>
            </div>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={1000}
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Checked after 20-minute morning walk; feeling energetic. Fasting state."
              className={`w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
                errors.notes
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-slate-300 focus:border-teal-500 focus:ring-teal-200'
              }`}
            />
            {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes}</p>}
          </div>

          {/* Medical Disclaimer Note */}
          <p className="text-[11px] text-slate-400 italic">
            Note: MediTrack+ records vital signs for personal tracking and informational purposes. Consult your licensed healthcare provider for medical evaluations.
          </p>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting
                ? 'Saving...'
                : isEditing
                ? 'Update Record'
                : 'Save Measurements'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HealthRecordForm;
