import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Search,
  RefreshCw,
} from 'lucide-react';
import {
  getPatientConnections,
  getPatientPendingRequests,
  cancelConnectionRequest,
  revokeConnection,
} from '../services/connectionApi';
import ConnectionRequestCard from '../components/connection/ConnectionRequestCard';
import Button from '../components/ui/Button';

const MyDoctors = () => {
  const [activeTab, setActiveTab] = useState('connected'); // 'connected' | 'pending'
  const [connectedDoctors, setConnectedDoctors] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [connectedRes, pendingRes] = await Promise.all([
        getPatientConnections(),
        getPatientPendingRequests(),
      ]);
      setConnectedDoctors(connectedRes.data || []);
      setPendingRequests(pendingRes.data || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load your doctor connections.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleCancel = async (connectionId) => {
    setActionLoadingId(connectionId);
    setFeedback(null);
    try {
      await cancelConnectionRequest(connectionId);
      setPendingRequests((prev) => prev.filter((r) => r.id !== connectionId));
      setFeedback({
        type: 'success',
        message: 'Connection request cancelled successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to cancel connection request.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevoke = async (connectionId) => {
    if (!window.confirm('Are you sure you want to disconnect from this doctor?')) {
      return;
    }

    setActionLoadingId(connectionId);
    setFeedback(null);
    try {
      await revokeConnection(connectionId);
      setConnectedDoctors((prev) => prev.filter((c) => c.id !== connectionId));
      setFeedback({
        type: 'success',
        message: 'Disconnected from doctor successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to disconnect from doctor.',
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
              <Stethoscope className="h-3.5 w-3.5" />
              Patient Care Team
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            My Doctors
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage your connected healthcare providers and view active connection requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/doctors">
            <Button variant="primary" className="py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Search className="h-3.5 w-3.5" />
              Find a Doctor
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={fetchConnections}
            className="py-2 px-3 text-xs font-semibold flex items-center gap-1 text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
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
          onClick={() => setActiveTab('connected')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'connected'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Connected Doctors
          <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
            {connectedDoctors.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium text-slate-500">Loading your connections...</p>
        </div>
      ) : activeTab === 'connected' ? (
        connectedDoctors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
              <Users className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Connected Doctors Yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                You haven&apos;t connected with any healthcare providers yet. Browse our verified physician network to send your first connection request.
              </p>
            </div>
            <Link to="/doctors">
              <Button variant="primary" className="py-2.5 px-4 text-xs font-semibold shadow-2xs mt-2">
                Browse Doctor Directory
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedDoctors.map((conn) => (
              <ConnectionRequestCard
                key={conn.id}
                request={conn}
                role="patient"
                onRevoke={handleRevoke}
                actionLoading={actionLoadingId === conn.id}
              />
            ))}
          </div>
        )
      ) : pendingRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 border border-slate-100">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Pending Requests</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any pending connection requests awaiting physician review.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => (
            <ConnectionRequestCard
              key={req.id}
              request={req}
              role="patient"
              onCancel={handleCancel}
              actionLoading={actionLoadingId === req.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDoctors;
