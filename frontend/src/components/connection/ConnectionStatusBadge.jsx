import { Clock, CheckCircle2, XCircle, UserX } from 'lucide-react';

/**
 * Reusable Connection Status Badge component
 *
 * @param {Object} props
 * @param {string} props.status - 'pending' | 'approved' | 'connected' | 'rejected' | 'revoked' | 'none'
 * @param {string} [props.className]
 */
export const ConnectionStatusBadge = ({ status = 'none', className = '' }) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
          Request Pending
        </span>
      );

    case 'approved':
    case 'connected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
          Connected
        </span>
      );

    case 'rejected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600 flex-shrink-0" />
          Declined
        </span>
      );

    case 'revoked':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <UserX className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
          Disconnected
        </span>
      );

    default:
      return null;
  }
};

export default ConnectionStatusBadge;
