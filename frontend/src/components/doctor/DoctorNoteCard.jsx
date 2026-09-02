import React, { useState } from 'react';
import {
  Lock,
  Eye,
  FileText,
  Sparkles,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const PRIORITY_STYLES = {
  normal: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: 'Normal',
  },
  important: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    label: 'Important',
  },
  urgent: {
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    dot: 'bg-rose-500',
    label: 'Urgent',
  },
};

export const DoctorNoteCard = ({ note, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    _id,
    type = 'note',
    title,
    content,
    visibility = 'doctor_private',
    priority = 'normal',
    createdAt,
    updatedAt,
  } = note;

  const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.normal;
  const isPrivate = visibility === 'doctor_private';
  const isRecommendation = type === 'recommendation';
  const isLongContent = content && content.length > 280;

  const formattedDate = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isUpdated = updatedAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 10000;

  const handleDeleteClick = () => {
    if (window.confirm('Are you sure you want to delete this clinical note? This action cannot be undone.')) {
      setIsDeleting(true);
      onDelete(_id);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
      {/* Top Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isRecommendation
                ? 'bg-teal-50 text-teal-800 border border-teal-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {isRecommendation ? (
              <Sparkles className="h-3 w-3 text-teal-600" />
            ) : (
              <FileText className="h-3 w-3 text-slate-500" />
            )}
            {isRecommendation ? 'Recommendation' : 'Clinical Note'}
          </span>

          {/* Visibility Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPrivate
                ? 'bg-amber-50/80 text-amber-800 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {isPrivate ? (
              <Lock className="h-3 w-3 text-amber-600" />
            ) : (
              <Eye className="h-3 w-3 text-emerald-600" />
            )}
            {isPrivate ? 'Doctor Only (Private)' : 'Patient Visible'}
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityStyle.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${priorityStyle.dot}`} />
            {priorityStyle.label} Priority
          </span>
        </div>

        {/* Date & Actions */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formattedDate}
            {isUpdated && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
          </span>

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => onEdit(note)}
              className="p-1 rounded-md text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
              title="Edit Note"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
              title="Delete Note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-3">
        {title && (
          <h4 className="text-sm font-bold text-slate-900 mb-1.5 tracking-tight">
            {title}
          </h4>
        )}
        <div
          className={`text-xs text-slate-700 leading-relaxed whitespace-pre-wrap ${
            !expanded && isLongContent ? 'line-clamp-3' : ''
          }`}
        >
          {content}
        </div>

        {isLongContent && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            {expanded ? (
              <>
                Show Less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Read Full Entry <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default DoctorNoteCard;
