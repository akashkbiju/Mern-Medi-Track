import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  Award,
  Clock,
  Bell,
  UserCheck,
  Users,
  FileText,
  TrendingUp,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Search,
  Check,
  X,
  FileCheck,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getDoctorDashboard } from '../services/dashboardApi';
import { acceptConnectionRequest, rejectConnectionRequest } from '../services/connectionApi';
import Button from '../components/ui/Button';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await getDoctorDashboard();
      setDashboardData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load doctor dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAccept = async (connectionId) => {
    setProcessingId(connectionId);
    try {
      await acceptConnectionRequest(connectionId);
      setFeedback({ type: 'success', message: 'Patient connection approved successfully.' });
      await fetchDashboard();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to accept connection.' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleReject = async (connectionId) => {
    setProcessingId(connectionId);
    try {
      await rejectConnectionRequest(connectionId);
      setFeedback({ type: 'success', message: 'Patient connection request rejected.' });
      await fetchDashboard();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to reject connection.' });
    } finally {
      setProcessingId(null);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const doctorProfile = dashboardData?.profile;
  const isVerified = Boolean(doctorProfile?.isVerified);
  const stats = dashboardData?.stats || { connectedPatientCount: 0, pendingRequestCount: 0, notesCount: 0, unreadNotifications: 0 };
  const connectedPatients = dashboardData?.roster?.connectedPatients || [];
  const pendingRequests = dashboardData?.roster?.pendingRequests || [];
  const recentNotes = dashboardData?.recentNotes || [];

  // Filter patients by search query
  const filteredPatients = connectedPatients.filter((item) => {
    const q = patientSearch.toLowerCase().trim();
    if (!q) return true;
    const name = item.patient?.fullName?.toLowerCase() || '';
    const email = item.patient?.email?.toLowerCase() || '';
    return name.includes(q) || email.includes(q);
  });

  // Calculate completeness percentage
  const calculateCompleteness = () => {
    if (!doctorProfile) return 0;
    const fields = [
      user?.fullName,
      user?.email,
      user?.phone,
      doctorProfile?.specialization,
      doctorProfile?.licenseNumber,
      doctorProfile?.hospital,
      doctorProfile?.experience,
      doctorProfile?.bio,
      doctorProfile?.consultationInfo,
    ];
    const filled = fields.filter((f) => f !== undefined && f !== null && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium text-slate-500">Loading Clinical Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary to-teal-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 ring-1 ring-inset ring-teal-500/30">
                <Stethoscope className="h-3.5 w-3.5" />
                Doctor Portal
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Physician
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30">
                  <Clock className="h-3 w-3" />
                  Pending Verification
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, Dr. {user?.fullName || 'Physician'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Longitudinal patient health telemetry, clinical notes, patient adherence oversight, and connection management.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/doctor/profile">
              <Button
                variant="secondary"
                className="py-2.5 px-4 text-xs font-semibold flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
            <Link to="/notifications">
              <Button
                variant="outline"
                className="py-2.5 px-4 text-xs font-semibold flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
              >
                <Bell className="h-4 w-4" />
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Verification Notice */}
      {!isVerified && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex items-start gap-4 text-xs sm:text-sm leading-relaxed shadow-xs">
          <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-amber-950">Credential Verification in Progress</h4>
            <p className="text-amber-800">
              License <span className="font-mono font-semibold">{doctorProfile?.licenseNumber}</span> is currently queued for clinical verification. During this stage, you can configure your specialty, hospital affiliation, and consultation schedule.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Connected Patients */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Connected Patients</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.connectedPatientCount}</div>
          <p className="text-xs text-slate-400">Authorized clinical monitoring access</p>
        </div>

        {/* Card 2: Pending Requests */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <div className={`p-2 rounded-xl ${stats.pendingRequestCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-600'}`}>
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pendingRequestCount}</div>
          <p className="text-xs text-slate-400">
            {stats.pendingRequestCount > 0 ? 'Awaiting your review below' : 'All requests up to date'}
          </p>
        </div>

        {/* Card 3: Clinical Notes Created */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Clinical Notes</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.notesCount}</div>
          <p className="text-xs text-slate-400">Private notes and recommendations</p>
        </div>

        {/* Card 4: Profile Completeness */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Profile Completeness</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{completeness}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Pending Connection Requests (Actionable) */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-bold text-slate-900">
                Pending Patient Connection Requests ({pendingRequests.length})
              </h3>
            </div>
            <Link to="/doctor/connections" className="text-xs font-semibold text-teal-600 hover:underline">
              Manage in Connections →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {pendingRequests.map((req) => (
              <div
                key={req.connectionId}
                className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">
                    {req.patient?.fullName || 'Patient'}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">{req.patient?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAccept(req.connectionId)}
                    disabled={processingId === req.connectionId}
                    className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
                    title="Accept connection"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReject(req.connectionId)}
                    disabled={processingId === req.connectionId}
                    className="p-1.5 rounded-lg bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 disabled:opacity-50"
                    title="Reject connection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Care Roster & Quick Health Shortcuts */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Active Patient Care Roster</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized patients with live clinical telemetry, medication logs, and note records
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patients..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((conn) => {
              const patient = conn.patient || {};
              const permissions = conn.permissions || {};

              return (
                <div
                  key={conn.connectionId}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                      {patient.fullName?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {patient.fullName || 'Patient'}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{patient.email}</p>
                    </div>
                  </div>

                  {/* Permissions Badges */}
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {permissions.healthRecords && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Vitals
                      </span>
                    )}
                    {permissions.medications && (
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        Meds
                      </span>
                    )}
                    {permissions.reports && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        Reports
                      </span>
                    )}
                    {permissions.notes !== false && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                        Notes
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center gap-2">
                    <Link
                      to={`/doctor/patients/${patient._id || patient.id}/health`}
                      className="flex-1"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1"
                      >
                        <TrendingUp className="h-3.5 w-3.5" />
                        Health
                      </Button>
                    </Link>
                    <Link
                      to={`/doctor/patients/${patient._id || patient.id}/notes`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full py-1.5 text-xs font-semibold text-slate-700 hover:text-teal-700 flex items-center justify-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Notes
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            {patientSearch ? 'No patients matched your search query.' : 'No active patient connections found.'}
          </div>
        )}
      </div>

      {/* Recent Notes & Practice Details Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (Span 2): Recent Clinical Notes & Recommendations */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Clinical Notes & Recommendations</h3>
            </div>
            <span className="text-xs text-slate-400">Last 5 created</span>
          </div>

          {recentNotes.length > 0 ? (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <div
                  key={note._id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{note.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase tracking-wider">
                        {note.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          note.visibility === 'patient_visible'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-300 text-slate-800'
                        }`}
                      >
                        {note.visibility === 'patient_visible' ? 'Patient Visible' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{note.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Patient: {note.patientName}</span>
                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4 text-center">
              No clinical notes recorded yet. Open a patient record to create notes or recommendations.
            </p>
          )}
        </div>

        {/* Right (Span 1): Practice Details Overview */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Practice Details</h3>
            <Link to="/doctor/profile" className="text-xs font-semibold text-teal-600 hover:underline">
              Edit →
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Specialization</span>
              <p className="font-semibold text-slate-800">{doctorProfile?.specialization || 'General'}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Medical License</span>
              <p className="font-mono font-semibold text-slate-800">{doctorProfile?.licenseNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Affiliated Hospital</span>
              <p className="font-semibold text-slate-800">{doctorProfile?.hospital || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Consultation Info</span>
              <p className="font-semibold text-slate-800">{doctorProfile?.consultationInfo || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
