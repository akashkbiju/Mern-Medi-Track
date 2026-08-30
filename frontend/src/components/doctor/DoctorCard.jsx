import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Building,
  Briefcase,
  CheckCircle2,
  Clock,
  UserPlus,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Button from '../ui/Button';
import ConnectionStatusBadge from '../connection/ConnectionStatusBadge';

export const DoctorCard = ({
  doctor,
  status = 'none',
  onConnect,
  isConnecting = false,
}) => {
  const isVerified = Boolean(doctor.isVerified);

  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-200 transition-all p-5 flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header: Avatar, Name, Verification, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-base font-bold shadow-xs flex-shrink-0">
              {getInitials(doctor.fullName)}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  {doctor.fullName}
                </h3>
                {isVerified && (
                  <span title="Verified Healthcare Provider">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 flex-shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-teal-700 mt-0.5 flex items-center gap-1">
                <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                {doctor.specialization || 'Medical Specialist'}
              </p>
            </div>
          </div>

          <ConnectionStatusBadge status={status} />
        </div>

        {/* Practice Details */}
        <div className="space-y-1 text-xs text-slate-600">
          {doctor.hospital && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Building className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{doctor.hospital}</span>
            </div>
          )}
          {doctor.experience !== undefined && doctor.experience !== null && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Briefcase className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{doctor.experience} years clinical practice</span>
            </div>
          )}
        </div>

        {/* Bio snippet */}
        {doctor.bio && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">
            {doctor.bio}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={`/doctors/${doctor.id}`}
          className="text-xs font-semibold text-slate-600 hover:text-teal-700 transition flex items-center gap-1"
        >
          View Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <div>
          {status === 'pending' ? (
            <Button
              variant="outline"
              disabled
              className="py-1.5 px-3 text-xs font-semibold bg-amber-50/60 text-amber-800 border-amber-200 cursor-not-allowed flex items-center gap-1.5"
            >
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Pending
            </Button>
          ) : status === 'approved' || status === 'connected' ? (
            <Button
              variant="outline"
              disabled
              className="py-1.5 px-3 text-xs font-semibold bg-emerald-50/60 text-emerald-800 border-emerald-200 cursor-default flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Connected
            </Button>
          ) : status === 'rejected' || status === 'revoked' ? (
            <Button
              variant="outline"
              onClick={() => onConnect && onConnect(doctor.id)}
              disabled={isConnecting}
              className="py-1.5 px-3 text-xs font-semibold text-teal-700 border-teal-300 hover:bg-teal-50 flex items-center gap-1.5 shadow-2xs"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect Again
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => onConnect && onConnect(doctor.id)}
              disabled={isConnecting}
              className="py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  Connecting...
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5" />
                  Connect
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
