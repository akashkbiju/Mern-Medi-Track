import React from 'react';
import {
  Search,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import DoctorNoteCard from './DoctorNoteCard';
import Button from '../ui/Button';

export const DoctorNoteList = ({
  notes = [],
  pagination = { page: 1, limit: 20, total: 0, totalPages: 1 },
  loading = false,
  filters = { type: 'all', visibility: 'all', priority: 'all', search: '' },
  onFilterChange,
  onPageChange,
  onEditNote,
  onDeleteNote,
  onAddNew,
}) => {
  const { page, totalPages, total } = pagination;

  // Local text search filter
  const filteredNotes = notes.filter((note) => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      (note.title && note.title.toLowerCase().includes(q)) ||
      (note.content && note.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notes and recommendations..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type filter */}
          <select
            value={filters.type || 'all'}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="all">All Types</option>
            <option value="note">Clinical Notes</option>
            <option value="recommendation">Recommendations</option>
          </select>

          {/* Visibility filter */}
          <select
            value={filters.visibility || 'all'}
            onChange={(e) => onFilterChange({ visibility: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="all">All Visibilities</option>
            <option value="doctor_private">Doctor Only (Private)</option>
            <option value="patient_visible">Patient Visible</option>
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFilterChange({ priority: e.target.value })}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">No Clinical Records Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {filters.search || filters.type !== 'all' || filters.visibility !== 'all' || filters.priority !== 'all'
                ? 'No notes match your filter criteria. Try adjusting your search filters.'
                : 'No clinical notes or recommendations recorded for this patient yet.'}
            </p>
          </div>
          {onAddNew && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onAddNew}
                className="py-1.5 px-4 text-xs font-semibold"
              >
                Create First Entry
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Notes Cards */
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <DoctorNoteCard
              key={note._id}
              note={note}
              onEdit={onEditNote}
              onDelete={onDeleteNote}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredNotes.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{total}</span> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 py-1 font-semibold text-slate-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorNoteList;
