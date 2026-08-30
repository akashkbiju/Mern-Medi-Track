import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Award,
  Building,
  Briefcase,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import Button from '../ui/Button';
import { updateDoctorProfile } from '../../services/doctorApi';
import { useAuth } from '../../context/AuthContext';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Endocrinology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Psychiatry',
  'Gastroenterology',
  'Pulmonology',
  'Oncology',
  'Other Specialization',
];

const DoctorProfileForm = ({ initialData, onProfileUpdated }) => {
  const { updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    hospital: '',
    experience: '',
    bio: '',
    consultationInfo: '',
    isVerified: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.user?.fullName || '',
        email: initialData.user?.email || '',
        phone: initialData.user?.phone || '',
        specialization: initialData.doctorProfile?.specialization || '',
        licenseNumber: initialData.doctorProfile?.licenseNumber || '',
        hospital: initialData.doctorProfile?.hospital || '',
        experience:
          initialData.doctorProfile?.experience !== undefined &&
          initialData.doctorProfile?.experience !== null
            ? initialData.doctorProfile.experience
            : '',
        bio: initialData.doctorProfile?.bio || '',
        consultationInfo: initialData.doctorProfile?.consultationInfo || '',
        isVerified: initialData.doctorProfile?.isVerified || false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    }

    if (!formData.specialization.trim()) {
      errors.specialization = 'Specialization is required.';
    }

    if (formData.experience !== '') {
      const expNum = Number(formData.experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 70) {
        errors.experience = 'Years of experience must be a valid number between 0 and 70.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setServerError('');
    setSuccessMessage('');

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
        specialization: formData.specialization.trim(),
        hospital: formData.hospital.trim() || undefined,
        experience: formData.experience !== '' ? Number(formData.experience) : undefined,
        bio: formData.bio.trim() || undefined,
        consultationInfo: formData.consultationInfo.trim() || undefined,
      };

      const result = await updateDoctorProfile(payload);

      // Sync local auth context with updated name & phone
      updateUser({
        fullName: payload.fullName,
        phone: payload.phone,
      });

      setSuccessMessage('Doctor profile updated successfully.');
      if (onProfileUpdated) {
        onProfileUpdated(result.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update doctor profile.';
      setServerError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-3 text-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-teal-600 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="font-medium">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Section 1: Immutable Identification & Credentials */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Verified Credentials (Locked)
            </h3>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Immutable for security & clinical verification
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address (Immutable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Primary Account Email
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="block w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* License Number (Immutable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600">
                Medical License Number
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Award className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={formData.licenseNumber}
                  className="block w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 font-mono text-slate-500 cursor-not-allowed"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Identity Details */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4">
            Physician Identity & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700">
                Full Name & Title <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.fullName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-700">
                Contact Phone
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Professional Practice Details */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2 mb-4">
            Practice & Specialization
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specialization */}
            <div>
              <label htmlFor="specialization" className="block text-xs font-semibold text-slate-700">
                Specialization <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <input
                  list="profileSpecList"
                  id="specialization"
                  name="specialization"
                  required
                  value={formData.specialization}
                  onChange={handleChange}
                  className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.specialization
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                />
                <datalist id="profileSpecList">
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec} />
                  ))}
                </datalist>
              </div>
              {fieldErrors.specialization && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
              )}
            </div>

            {/* Hospital / Clinic Affiliation */}
            <div>
              <label htmlFor="hospital" className="block text-xs font-semibold text-slate-700">
                Hospital / Clinic Affiliation
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  value={formData.hospital}
                  onChange={handleChange}
                  placeholder="e.g. City General Hospital"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all"
                />
              </div>
            </div>

            {/* Years of Experience */}
            <div className="sm:col-span-2">
              <label htmlFor="experience" className="block text-xs font-semibold text-slate-700">
                Years of Clinical Experience
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  max="70"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 12"
                  className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.experience
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-200 focus:border-teal-500 focus:ring-teal-100'
                  }`}
                />
              </div>
              {fieldErrors.experience && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.experience}</p>
              )}
            </div>

            {/* Professional Bio */}
            <div className="sm:col-span-2">
              <label htmlFor="bio" className="block text-xs font-semibold text-slate-700">
                Professional Bio & Clinical Philosophy
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <textarea
                  id="bio"
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Summarize your clinical focus, certifications, or patient care philosophy..."
                  className="block w-full p-3 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all resize-y"
                />
              </div>
            </div>

            {/* Consultation Hours */}
            <div className="sm:col-span-2">
              <label htmlFor="consultationInfo" className="block text-xs font-semibold text-slate-700">
                Consultation Hours & Availability Details
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 pt-2.5 pointer-events-none text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <input
                  id="consultationInfo"
                  name="consultationInfo"
                  type="text"
                  value={formData.consultationInfo}
                  onChange={handleChange}
                  placeholder="e.g. Mon-Fri 09:00 AM - 03:00 PM (OPD / Virtual)"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-teal-500 focus:ring-teal-100 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="py-2.5 px-6 flex items-center justify-center gap-2 font-semibold text-sm shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DoctorProfileForm;
