import {
  User,
  Stethoscope,
  Calendar,
  Building,
  Check,
  X,
  UserX,
  Loader2,
  Clock,
} from 'lucide-react';
import Button from '../ui/Button';
import ConnectionStatusBadge from './ConnectionStatusBadge';

export const ConnectionRequestCard = ({
  request,
  role = 'doctor', // 'doctor' | 'patient'
  onAccept,
  onReject,
  onCancel,
  onRevoke,
  actionLoading = false,
}) => {
  const isDoctorRole = role === 'doctor';
  const item = isDoctorRole ? request.patient : request.doctor;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formattedDate = request.approvedAt
    ? `Connected on ${new Date(request.approvedAt).toLocaleDateString()}`
    : request.requestedAt
    ? `Requested on ${new Date(request.requestedAt).toLocaleDateString()}`
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Entity Info */}
      <div className="flex items-center gap-4">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-base shadow-xs flex-shrink-0 ${
            isDoctorRole
              ? 'bg-slate-100 text-slate-700'
              : 'bg-gradient-to-br from-teal-500 to-teal-700 text-white'
          }`}
        >
          {item?.fullName ? getInitials(item.fullName) : <User className="h-5 w-5" />}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {item?.fullName || (isDoctorRole ? 'Patient' : 'Doctor')}
            </h4>
            <ConnectionStatusBadge status={request.status} />
          </div>

          {!isDoctorRole && item?.specialization && (
            <p className="text-xs font-medium text-teal-700 flex items-center gap-1">
              <Stethoscope className="h-3 w-3 text-teal-600" />
              {item.specialization}
              {item.hospital && ` • ${item.hospital}`}
            </p>
          )}

          {isDoctorRole && item?.memberSince && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Member since {new Date(item.memberSince).toLocaleDateString()}
            </p>
          )}

          {formattedDate && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        {/* Doctor Actions */}
        {isDoctorRole && request.status === 'pending' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject && onReject(request.id)}
              disabled={actionLoading}
              className="py-1.5 px-3 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5 text-rose-500" />
              Decline
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAccept && onAccept(request.id)}
              disabled={actionLoading}
              className="py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1 shadow-2xs"
            >
              {actionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <Check className="h-3.5 w-3.5 text-white" />
              )}
              Accept
            </Button>
          </>
        )}

        {isDoctorRole && request.status === 'approved' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevoke && onRevoke(request.id)}
            disabled={actionLoading}
            className="py-1.5 px-3 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <UserX className="h-3.5 w-3.5" />
            Revoke
          </Button>
        )}

        {/* Patient Actions */}
        {!isDoctorRole && request.status === 'pending' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel && onCancel(request.id)}
            disabled={actionLoading}
            className="py-1.5 px-3 text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 flex items-center gap-1.5"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5 text-rose-500" />
            )}
            Cancel Request
          </Button>
        )}

        {!isDoctorRole && request.status === 'approved' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRevoke && onRevoke(request.id)}
            disabled={actionLoading}
            className="py-1.5 px-3 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <UserX className="h-3.5 w-3.5" />
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
};

export default ConnectionRequestCard;
