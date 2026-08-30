import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  getDoctorRequests,
  getDoctorConnections,
  acceptConnectionRequest,
  rejectConnectionRequest,
  revokeConnection,
} from '../services/connectionApi';
import ConnectionRequestCard from '../components/connection/ConnectionRequestCard';
import Button from '../components/ui/Button';

const DoctorConnections = () => {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'connected'
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [connectedPatients, setConnectedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchDoctorConnections = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [reqsRes, connsRes] = await Promise.all([
        getDoctorRequests(),
        getDoctorConnections(),
      ]);
      setIncomingRequests(reqsRes.data || []);
      setConnectedPatients(connsRes.data || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to retrieve connection requests.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorConnections();
  }, [fetchDoctorConnections]);

  const handleAccept = async (connectionId) => {
    setActionLoadingId(connectionId);
    setFeedback(null);
    try {
      await acceptConnectionRequest(connectionId);
      const acceptedReq = incomingRequests.find((r) => r.id === connectionId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== connectionId));
      if (acceptedReq) {
        setConnectedPatients((prev) => [
          { ...acceptedReq, status: 'approved', approvedAt: new Date() },
          ...prev,
        ]);
      }
      setFeedback({
        type: 'success',
        message: 'Connection request accepted successfully. Patient has been added to your care roster.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to accept connection request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (connectionId) => {
    setActionLoadingId(connectionId);
    setFeedback(null);
    try {
      await rejectConnectionRequest(connectionId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== connectionId));
      setFeedback({
        type: 'success',
        message: 'Connection request declined.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to decline connection request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (connectionId) => {
    if (!window.confirm('Are you sure you want to revoke this patient connection?')) {
      return;
    }

    setActionLoadingId(connectionId);
    setFeedback(null);
    try {
      await revokeConnection(connectionId);
      setConnectedPatients((prev) => prev.filter((c) => c.id !== connectionId));
      setFeedback({
        type: 'success',
        message: 'Patient connection revoked successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to revoke connection.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <Users className="h-3.5 w-3.5" />
              Physician Patient Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Patient Connections
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review incoming connection requests and manage your connected patient roster.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchDoctorConnections}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1.5 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Clinical Architecture Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-blue-900 text-xs flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-blue-950">Clinical Data Isolation:</span>{' '}
          Step 20 establishes explicit doctor-patient relationships. Patient health records, daily dose logs, and adherence analytics will be unlocked in Step 21 under explicit patient permission.
        </div>
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'requests'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          Incoming Requests
          {incomingRequests.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('connected')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'connected'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Connected Patients
          <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
            {connectedPatients.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium text-slate-500">Loading patient connections...</p>
        </div>
      ) : activeTab === 'requests' ? (
        incomingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
              <Clock className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Pending Requests</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You currently have no incoming connection requests awaiting approval.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {incomingRequests.map((req) => (
              <ConnectionRequestCard
                key={req.id}
                request={req}
                role="doctor"
                onAccept={handleAccept}
                onReject={handleReject}
                actionLoading={actionLoadingId === req.id}
              />
            ))}
          </div>
        )
      ) : connectedPatients.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Connected Patients Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Accepted patient connection requests will be listed here as part of your active care roster.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {connectedPatients.map((patientConn) => (
            <ConnectionRequestCard
              key={patientConn.id}
              request={patientConn}
              role="doctor"
              onRevoke={handleRevoke}
              actionLoading={actionLoadingId === patientConn.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorConnections;
