import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  getDoctorNotes,
  createDoctorNote,
  updateDoctorNote,
  deleteDoctorNote,
} from '../../services/doctorNotesApi';
import DoctorNoteForm from './DoctorNoteForm';
import DoctorNoteList from './DoctorNoteList';
import Button from '../ui/Button';

export const DoctorNotes = ({ patientId, patientInfo }) => {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [filters, setFilters] = useState({
    type: 'all',
    visibility: 'all',
    priority: 'all',
    search: '',
  });

  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }

  const patientName = patientInfo?.fullName || 'Patient';

  const fetchNotes = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.visibility !== 'all') params.visibility = filters.visibility;
      if (filters.priority !== 'all') params.priority = filters.priority;

      const res = await getDoctorNotes(patientId, params);
      setNotes(res.data?.notes || []);
      setPagination(
        res.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load clinical notes.',
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, pagination.page, pagination.limit, filters.type, filters.visibility, filters.priority]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Form submit handler (Create or Update)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (editingNote) {
        await updateDoctorNote(patientId, editingNote._id, formData);
        setFeedback({
          type: 'success',
          message: 'Clinical record updated successfully.',
        });
      } else {
        await createDoctorNote(patientId, formData);
        setFeedback({
          type: 'success',
          message:
            formData.visibility === 'patient_visible' && formData.type === 'recommendation'
              ? 'Recommendation published. Notification sent to patient.'
              : 'Private clinical note saved successfully.',
        });
      }
      setShowForm(false);
      setEditingNote(null);
      fetchNotes();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save clinical entry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setShowForm(true);
    // Scroll to form smoothly
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteNote = async (noteId) => {
    setFeedback(null);
    try {
      await deleteDoctorNote(patientId, noteId);
      setFeedback({
        type: 'success',
        message: 'Clinical record deleted successfully.',
      });
      fetchNotes();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete note.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Clinical Notes & Recommendations
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              {pagination.total} {pagination.total === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain private clinical impressions and publish targeted healthcare recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotes}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>

          {!showForm && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingNote(null);
                setShowForm(true);
              }}
              className="py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Note / Guidance
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Drawer / View */}
      {showForm && (
        <DoctorNoteForm
          initialData={editingNote}
          patientName={patientName}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingNote(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Notes List */}
      <DoctorNoteList
        notes={notes}
        pagination={pagination}
        loading={loading}
        filters={filters}
        onFilterChange={(newF) => setFilters((prev) => ({ ...prev, ...newF }))}
        onPageChange={(newPage) =>
          setPagination((prev) => ({ ...prev, page: newPage }))
        }
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
        onAddNew={() => {
          setEditingNote(null);
          setShowForm(true);
        }}
      />
    </div>
  );
};

export default DoctorNotes;
