import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Stethoscope,
  Building,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';
import { getDoctor, getConnectionStatus, sendConnectionRequest } from '../services/connectionApi';
import ConnectionStatusBadge from '../components/connection/ConnectionStatusBadge';
import Button from '../components/ui/Button';

const DoctorDetails = () => {
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [docRes, statusRes] = await Promise.all([
          getDoctor(doctorId),
          getConnectionStatus(doctorId).catch(() => ({ data: { status: 'none' } })),
        ]);
        setDoctor(docRes.data);
        setConnectionStatus(statusRes.data?.status || 'none');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to retrieve physician details.');
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDetails();
    }
  }, [doctorId]);

  const handleConnect = async () => {
    setConnecting(true);
    setFeedback(null);
    try {
      await sendConnectionRequest(doctorId);
      setConnectionStatus('pending');
      setFeedback({
        type: 'success',
        message: 'Connection request sent successfully. The physician will review your request.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to send connection request.',
      });
    } finally {
      setConnecting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'DR';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-slate-500">Loading physician profile...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Physician Not Found</h3>
        <p className="text-xs text-slate-500">{error || 'This doctor record could not be located.'}</p>
        <Link to="/doctors">
          <Button variant="outline" className="py-2 px-4 text-xs font-semibold mt-2">
            Back to Doctor Directory
          </Button>
        </Link>
      </div>
    );
  }

  const isVerified = Boolean(doctor.isVerified);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Link */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctor Directory
        </Link>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-teal-50 border-teal-200 text-teal-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Doctor Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-teal-700/10 flex-shrink-0">
              {getInitials(doctor.fullName)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {doctor.fullName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                    Verified Provider
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-teal-700 flex items-center gap-1.5">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                {doctor.specialization || 'Medical Specialist'}
              </p>

              {doctor.hospital && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  {doctor.hospital}
                </p>
              )}
            </div>
          </div>

          {/* Connection Action CTA */}
          <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
            <ConnectionStatusBadge status={connectionStatus} />

            {connectionStatus === 'pending' ? (
              <Button
                variant="outline"
                disabled
                className="py-2.5 px-4 text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200 cursor-not-allowed"
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                Request Pending
              </Button>
            ) : connectionStatus === 'approved' ? (
              <Button
                variant="outline"
                disabled
                className="py-2.5 px-4 text-xs font-semibold bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Connected Physician
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleConnect}
                disabled={connecting}
                className="py-2.5 px-5 text-xs font-semibold flex items-center gap-2 shadow-2xs"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {connectionStatus === 'rejected' || connectionStatus === 'revoked'
                      ? 'Connect Again'
                      : 'Send Connection Request'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Practice Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Clinical Experience
            </span>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-slate-500" />
              {doctor.experience ? `${doctor.experience} Years` : 'Not specified'}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-1 sm:col-span-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Consultation Hours & Availability
            </span>
            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-500" />
              {doctor.consultationInfo || 'By appointment only'}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        {doctor.bio && (
          <div className="space-y-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Professional Biography</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.bio}
            </p>
          </div>
        )}

        {/* Clinical Disclaimer */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-blue-900 text-xs flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Connecting with a doctor allows coordinated healthcare tracking within MediTrack+. Medical records are protected and only shared with explicitly approved healthcare providers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetails;
