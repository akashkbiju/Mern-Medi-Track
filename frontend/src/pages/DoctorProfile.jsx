import { useState, useEffect } from 'react';
import {
  Stethoscope,
  ShieldCheck,
  Clock,
  Building,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { getDoctorProfile } from '../services/doctorApi';
import DoctorProfileForm from '../components/doctor/DoctorProfileForm';

const DoctorProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDoctorProfile();
      setProfileData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve doctor profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdated = (updated) => {
    setProfileData((prev) => ({
      ...prev,
      user: { ...prev?.user, ...updated?.user },
      doctorProfile: { ...prev?.doctorProfile, ...updated?.doctorProfile },
    }));
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
        <p className="text-sm font-medium text-slate-500">Loading physician credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-base font-bold">Unable to Load Doctor Profile</h3>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchProfile}
            className="mt-2 text-xs font-semibold text-red-700 underline hover:text-red-800"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const { user, doctorProfile } = profileData || {};
  const isVerified = Boolean(doctorProfile?.isVerified);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Physician Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar badge */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-teal-700/10 flex-shrink-0">
            {getInitials(user?.fullName)}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {user?.fullName || 'Physician'}
              </h1>

              {/* Verification Status Pill */}
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Physician
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Pending Verification
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1 text-teal-700 font-medium">
                <Stethoscope className="h-4 w-4 text-teal-600" />
                {doctorProfile?.specialization || 'Specialist'}
              </span>

              {doctorProfile?.hospital && (
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4 text-slate-400" />
                  {doctorProfile.hospital}
                </span>
              )}

              <span className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <Award className="h-3.5 w-3.5 text-slate-500" />
                License: {doctorProfile?.licenseNumber}
              </span>

              {user?.createdAt && (
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Registered {new Date(user.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice if Pending */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-3.5 text-xs leading-relaxed">
          <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-amber-950">Credential Verification Notice:</span>{' '}
            Your medical license credentials have been received and are pending verification by the MediTrack+ clinical administrator. During this period, you may keep your practice details and consultation availability up to date. Direct patient connectivity will activate upon credential verification.
          </div>
        </div>
      )}

      {/* Profile Edit Form */}
      <div>
        <DoctorProfileForm initialData={profileData} onProfileUpdated={handleProfileUpdated} />
      </div>
    </div>
  );
};

export default DoctorProfile;
