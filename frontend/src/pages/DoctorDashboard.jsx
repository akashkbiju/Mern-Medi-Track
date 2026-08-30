import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  ShieldCheck,
  Award,
  Building,
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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getDoctorProfile } from '../services/doctorApi';
import Button from '../components/ui/Button';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocData = async () => {
      try {
        const res = await getDoctorProfile();
        setProfileData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load doctor dashboard information.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocData();
  }, []);

  const doctorProfile = profileData?.doctorProfile;
  const isVerified = Boolean(doctorProfile?.isVerified);

  // Compute profile completeness percentage
  const calculateCompleteness = () => {
    if (!profileData) return 0;
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
        <p className="text-sm font-medium text-slate-500">Loading Doctor Portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-slate-900 to-teal-950 p-6 sm:p-8 text-white shadow-md">
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
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-500/30">
                  <Clock className="h-3 w-3" />
                  Pending Verification
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {user?.fullName || 'Doctor'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Manage your clinical profile, review notifications, and prepare for patient connection requests and adherence tracking.
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

      {/* Verification Status Alert if Pending */}
      {!isVerified && (
        <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-amber-900 flex items-start gap-4 text-xs sm:text-sm leading-relaxed shadow-sm">
          <ShieldCheck className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-amber-950">Credential Verification in Progress</h4>
            <p className="text-amber-800">
              Your license number <span className="font-mono font-semibold">{doctorProfile?.licenseNumber}</span> is currently queued for clinical verification. During this stage, you can configure your practice profile, hospital affiliation, and consultation schedule. Direct patient invitations and clinical monitoring will unlock automatically once verified.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Account Status */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
            <div className={`p-2 rounded-xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">
              {isVerified ? 'Verified Physician' : 'Pending Verification'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isVerified ? 'Full clinical access enabled' : 'Administrative check ongoing'}
            </p>
          </div>
        </div>

        {/* Card 2: Specialty & Experience */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Specialty</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 truncate">
              {doctorProfile?.specialization || 'General'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {doctorProfile?.experience ? `${doctorProfile.experience} years clinical practice` : 'Experience not specified'}
            </p>
          </div>
        </div>

        {/* Card 3: License */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Medical License</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-slate-900 truncate">
              {doctorProfile?.licenseNumber || 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {doctorProfile?.hospital || 'Hospital unassigned'}
            </p>
          </div>
        </div>

        {/* Card 4: Profile Completeness */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Profile Completeness</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-slate-900">{completeness}%</span>
              <span className="text-xs text-slate-400">
                {completeness === 100 ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Clinical Details & Practice Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Physician Practice Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current profile information visible on your practitioner record.
            </p>
          </div>
          <Link
            to="/doctor/profile"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 self-start sm:self-auto"
          >
            Edit Information <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Hospital / Affiliation</span>
            <p className="text-sm font-semibold text-slate-800">
              {doctorProfile?.hospital || <span className="text-slate-400 font-normal italic">Not specified</span>}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Consultation Hours</span>
            <p className="text-sm font-semibold text-slate-800">
              {doctorProfile?.consultationInfo || <span className="text-slate-400 font-normal italic">Not specified</span>}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Primary Contact</span>
            <p className="text-sm font-semibold text-slate-800">
              {user?.phone || <span className="text-slate-400 font-normal italic">Phone not added</span>}
            </p>
          </div>

          <div className="md:col-span-3 space-y-1 pt-2 border-t border-slate-50">
            <span className="text-xs text-slate-400 font-medium">Professional Biography</span>
            <p className="text-sm text-slate-700 leading-relaxed">
              {doctorProfile?.bio || (
                <span className="text-slate-400 italic">
                  No professional bio provided yet. Click &quot;Edit Profile&quot; to describe your clinical background and special interests.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Clinical Features Preview (Step 20 & 21 Placeholders) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Upcoming Clinical Modules</h3>
          <p className="text-xs text-slate-500">
            Preview of physician capabilities rolling out in the upcoming releases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 20 Preview: Patient Connections */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Step 20 Preview
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Patient Connections</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Connect directly with your patients via invitation code or search directory once verified.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                Connecting soon in Step 20
              </span>
            </div>
          </div>

          {/* Step 21 Preview: Clinical Health Records & Adherence */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-2xs">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Step 21 Preview
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Patient Health & Adherence</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review connected patients&apos; medication adherence scores, logged doses, and biometric records.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                Unlocks in Step 21
              </span>
            </div>
          </div>

          {/* Step 22 Preview: Clinical Notes & Feedback */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-2xs">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
                Step 22 Preview
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Clinical Feedback & Notes</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Provide clinical recommendations, treatment notes, and adherence guidance directly to patients.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 cursor-not-allowed">
                Unlocks in Step 22
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
