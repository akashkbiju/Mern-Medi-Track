import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react';
import Button from '../ui/Button';

export const DoctorNoteForm = ({
  initialData = null,
  patientName = 'Patient',
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    type: 'note',
    title: '',
    content: '',
    visibility: 'doctor_private',
    priority: 'normal',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || 'note',
        title: initialData.title || '',
        content: initialData.content || '',
        visibility: initialData.visibility || 'doctor_private',
        priority: initialData.priority || 'normal',
      });
    }
  }, [initialData]);

  // When type is switched to recommendation, suggest setting visibility to patient_visible
  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      visibility: newType === 'recommendation' ? 'patient_visible' : prev.visibility,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.content || !formData.content.trim()) {
      setError('Note content is required.');
      return;
    }

    if (formData.title && formData.title.length > 150) {
      setError('Title cannot exceed 150 characters.');
      return;
    }

    if (formData.content.length > 5000) {
      setError('Content cannot exceed 5000 characters.');
      return;
    }

    onSubmit({
      type: formData.type,
      title: formData.title.trim(),
      content: formData.content.trim(),
      visibility: formData.visibility,
      priority: formData.priority,
    });
  };

  const isRecommendation = formData.type === 'recommendation';
  const isPatientVisible = formData.visibility === 'patient_visible';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {initialData ? 'Edit Clinical Record' : 'New Note or Recommendation'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Documenting clinical entry for {patientName}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Type & Visibility Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Entry Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Record Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('note')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                formData.type === 'note'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Clinical Note
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('recommendation')}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                formData.type === 'recommendation'
                  ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Recommendation
            </button>
          </div>
        </div>

        {/* Visibility Setting */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Patient Visibility
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, visibility: 'doctor_private' })}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                formData.visibility === 'doctor_private'
                  ? 'bg-amber-50/80 border-amber-500 text-amber-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              Doctor Only
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, visibility: 'patient_visible' })}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                formData.visibility === 'patient_visible'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-emerald-600" />
              Patient Visible
            </button>
          </div>
        </div>
      </div>

      {/* Priority Selector */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Clinical Priority
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'normal', label: 'Normal', color: 'slate' },
            { value: 'important', label: 'Important', color: 'amber' },
            { value: 'urgent', label: 'Urgent', color: 'rose' },
          ].map((pri) => (
            <button
              key={pri.value}
              type="button"
              onClick={() => setFormData({ ...formData, priority: pri.value })}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                formData.priority === pri.value
                  ? pri.value === 'urgent'
                    ? 'bg-rose-50 border-rose-400 text-rose-800'
                    : pri.value === 'important'
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-slate-100 border-slate-400 text-slate-800'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {pri.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Privacy Banner */}
      {isPatientVisible ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs flex items-start gap-2.5">
          <Eye className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Patient-Visible Publication:</span> This guidance will be displayed in {patientName}'s dashboard and recommendations list.
            {isRecommendation && ' A safe notification will be sent automatically to the patient.'}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
          <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Confidential Doctor Record:</span> This entry is private to you and will never be shared with the patient or any other healthcare provider.
          </div>
        </div>
      )}

      {/* Title Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="note-title" className="text-xs font-bold text-slate-700">
            Title / Topic <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <span className="text-[11px] text-slate-400">{formData.title.length}/150</span>
        </div>
        <input
          id="note-title"
          type="text"
          maxLength={150}
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={isRecommendation ? 'e.g., Hydration and Salt Reduction Advice' : 'e.g., Clinical Observation on Follow-up'}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
        />
      </div>

      {/* Content Field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="note-content" className="text-xs font-bold text-slate-700">
            {isRecommendation ? 'Recommendation Guidance' : 'Clinical Note'} <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">{formData.content.length}/5000</span>
        </div>
        <textarea
          id="note-content"
          rows={5}
          maxLength={5000}
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder={
            isRecommendation
              ? 'Enter patient guidance, lifestyle suggestions, or follow-up instructions here...'
              : 'Enter internal physician notes, clinical impression, or diagnostic differential...'
          }
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden leading-relaxed"
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="py-2 px-4 text-xs font-semibold"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="py-2 px-5 text-xs font-semibold flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {initialData ? 'Update Record' : isPatientVisible ? 'Publish Recommendation' : 'Save Private Note'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default DoctorNoteForm;
