import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Shield,
  Lock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';

const GENDER_OPTIONS = [
  { value: '', label: 'Select Gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Select Relationship' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Child', label: 'Child' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Other', label: 'Other' },
];

const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    emergencyName: '',
    emergencyRelationship: '',
    emergencyPhone: '',
  });

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Format date to YYYY-MM-DD for standard HTML5 date input
  const formatDateForInput = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Populate form with user profile
  const populateFormData = (profile) => {
    if (!profile) return;
    const formatted = {
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      dateOfBirth: formatDateForInput(profile.dateOfBirth),
      gender: profile.gender || '',
      emergencyName: profile.emergencyContact?.name || '',
      emergencyRelationship: profile.emergencyContact?.relationship || '',
      emergencyPhone: profile.emergencyContact?.phone || '',
    };
    setFormData(formatted);
    setInitialData(formatted);
  };

  // Fetch latest profile on mount
  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await getUserProfile();
        if (isMounted && response?.data?.user) {
          populateFormData(response.data.user);
          // Sync with AuthContext in case of recent updates
          updateUser(response.data.user);
        }
      } catch (err) {
        if (isMounted) {
          // Fallback to AuthContext user if API call fails
          if (authUser) {
            populateFormData(authUser);
          }
          setStatusMessage({
            type: 'error',
            text: err.response?.data?.message || 'Failed to load profile details.',
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error upon editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (statusMessage.text) {
      setStatusMessage({ type: '', text: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters';
    }

    // Phone validation
    if (formData.phone && !PHONE_REGEX.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number (e.g., +1234567890 or 10 digits)';
    }

    // Date of Birth validation
    if (formData.dateOfBirth) {
      const selectedDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (isNaN(selectedDate.getTime())) {
        newErrors.dateOfBirth = 'Please select a valid date';
      } else if (selectedDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    // Emergency Contact Phone validation
    if (formData.emergencyPhone && !PHONE_REGEX.test(formData.emergencyPhone.trim())) {
      newErrors.emergencyPhone = 'Please enter a valid emergency contact phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      setStatusMessage({
        type: 'error',
        text: 'Please correct the highlighted errors before saving.',
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        gender: formData.gender,
        emergencyContact: {
          name: formData.emergencyName.trim(),
          relationship: formData.emergencyRelationship.trim(),
          phone: formData.emergencyPhone.trim(),
        },
      };

      const response = await updateUserProfile(payload);

      if (response?.data?.user) {
        const updatedUser = response.data.user;
        updateUser(updatedUser);
        populateFormData(updatedUser);
        setStatusMessage({
          type: 'success',
          text: 'Profile updated successfully!',
        });
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors[0]?.message) ||
        'Failed to update profile. Please try again.';

      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setErrors({});
      setStatusMessage({ type: '', text: '' });
    }
  };

  // Helper for avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
          <p className="text-sm font-medium text-slate-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information, contact credentials, and emergency details.
        </p>
      </div>

      {/* Status Notifications */}
      {statusMessage.text && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 text-sm transition-all duration-200 ${
            statusMessage.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div className="flex-1 font-medium">{statusMessage.text}</div>
        </div>
      )}

      {/* Profile Overview Card */}
      <Card className="overflow-hidden border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light text-2xl font-bold text-white shadow-md">
              {getInitials(formData.fullName || authUser?.fullName)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {formData.fullName || authUser?.fullName || 'User Profile'}
                </h2>
                <Badge variant="success" className="capitalize">
                  {authUser?.role || 'Patient'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{formData.email || authUser?.email}</p>
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <Shield className="h-3.5 w-3.5 text-secondary" />
                <span>Verified Patient Account</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-md bg-slate-100 px-3 py-1.5 font-medium">
              Role: <strong className="capitalize text-slate-800">{authUser?.role || 'patient'}</strong>
            </span>
            <span className="rounded-md bg-slate-100 px-3 py-1.5 font-medium">
              Status: <strong className="text-emerald-700">Active</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Personal Information */}
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500">Your core identity details on MediTrack+</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={`block w-full rounded-lg border py-2.5 px-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address (Read-only) */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Lock className="h-3 w-3" /> Read-only
                </span>
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-500 cursor-not-allowed select-none"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Email is tied to your login identity and cannot be changed here.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`block w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.phone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700">
                Date of Birth
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  max={todayStr}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.dateOfBirth
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-xs text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div className="sm:col-span-2">
              <label htmlFor="gender" className="block text-sm font-medium text-slate-700">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1.5 block w-full sm:w-1/2 rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Emergency Contact */}
        <Card className="border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Emergency Contact</h3>
              <p className="text-xs text-slate-500">
                Designated contact in the event of health or medication emergencies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Contact Name */}
            <div>
              <label htmlFor="emergencyName" className="block text-sm font-medium text-slate-700">
                Contact Name
              </label>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  id="emergencyName"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Doe"
                  className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-slate-700">
                Relationship
              </label>
              <div className="relative mt-1.5">
                <select
                  id="emergencyRelationship"
                  name="emergencyRelationship"
                  value={formData.emergencyRelationship}
                  onChange={handleChange}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Emergency Phone */}
            <div>
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-slate-700">
                Emergency Phone
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="tel"
                  id="emergencyPhone"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`block w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                    errors.emergencyPhone
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-slate-300 focus:border-primary focus:ring-primary/20'
                  }`}
                />
              </div>
              {errors.emergencyPhone && (
                <p className="mt-1 text-xs text-red-600">{errors.emergencyPhone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={submitting}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Discard Changes
          </Button>

          <Button
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex items-center gap-2 min-w-[140px] justify-center"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
