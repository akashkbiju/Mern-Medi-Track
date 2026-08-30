import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Stethoscope,
  Award,
  Building,
  Briefcase,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { registerDoctor } from '../services/doctorApi';

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

const DoctorRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    hospital: '',
    experience: '',
    bio: '',
    consultationInfo: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{};:'",.<>/\\|`~]).{8,}$/;
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!passwordRegex.test(formData.password)) {
      errors.password =
        'Password must contain an uppercase letter, lowercase letter, number, and special character.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!formData.specialization.trim()) {
      errors.specialization = 'Medical specialization is required.';
    }

    if (!formData.licenseNumber.trim()) {
      errors.licenseNumber = 'Medical license number is required.';
    } else if (formData.licenseNumber.trim().length < 2) {
      errors.licenseNumber = 'License number must be at least 2 characters.';
    }

    if (formData.experience !== '') {
      const expNum = Number(formData.experience);
      if (isNaN(expNum) || expNum < 0 || expNum > 70) {
        errors.experience = 'Years of experience must be between 0 and 70.';
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

    setLoading(true);
    setServerError('');

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim() || undefined,
        specialization: formData.specialization.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        hospital: formData.hospital.trim() || undefined,
        experience: formData.experience !== '' ? Number(formData.experience) : undefined,
        bio: formData.bio.trim() || undefined,
        consultationInfo: formData.consultationInfo.trim() || undefined,
      };

      await registerDoctor(payload);
      setRegisteredSuccess(true);
    } catch (err) {
      const responseData = err.response?.data;
      if (err.response?.status === 409) {
        if (responseData?.message?.toLowerCase().includes('license')) {
          setServerError('A doctor account with this license number already exists.');
        } else {
          setServerError('An account with this email address already exists. Please log in.');
        }
      } else if (responseData?.message) {
        setServerError(responseData.message);
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Unable to reach the server. Please check your connectivity.');
      } else {
        setServerError('Registration failed. Please review your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <div className="flex min-h-screen bg-slate-50 flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white p-8 sm:p-10 shadow-sm border border-slate-100 sm:rounded-2xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Doctor Account Created!
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Welcome, <span className="font-semibold text-slate-800">{formData.fullName}</span>. Your physician profile has been registered successfully.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-950">
                <ShieldCheck className="h-4 w-4 text-amber-700" />
                Status: Pending Verification
              </div>
              <p className="text-amber-800 leading-relaxed">
                Your medical license (<span className="font-mono font-medium">{formData.licenseNumber}</span>) is queued for administrative credential verification. You can sign in immediately to configure your practice details and consultation information.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
                className="w-full py-3 flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                Proceed to Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center">
        <Link to="/" className="inline-flex justify-center text-3xl font-bold text-primary items-center gap-2">
          <Activity className="text-secondary h-8 w-8" />
          MediTrack<span className="text-secondary">+</span>
        </Link>
        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
          <Stethoscope className="h-3.5 w-3.5" />
          Healthcare Provider Portal
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Physician Registration
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Create your verified doctor account to manage clinical consultations and monitor connected patient adherence.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white px-6 py-8 sm:px-10 sm:py-10 shadow-sm border border-slate-100 sm:rounded-2xl">
          {/* Verification Notice Banner */}
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs leading-relaxed">
            <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Professional Verification Required:</span>{' '}
              All physician registrations begin in <span className="font-medium text-blue-950">&quot;Pending Verification&quot;</span> status. Verified credentials ensure clinical accountability and patient safety across the MediTrack+ platform.
            </div>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{serverError}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* Section 1: Account & Contact */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
                1. Account & Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700">
                    Full Legal Name & Title <span className="text-red-500">*</span>
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
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.fullName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="physician@hospital.org"
                      className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
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
                      className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters"
                      className={`block w-full pl-9 pr-9 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      className={`block w-full pl-9 pr-9 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Credentials */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
                2. Professional Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Specialization */}
                <div>
                  <label htmlFor="specialization" className="block text-xs font-semibold text-slate-700">
                    Primary Specialization <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <input
                      list="specializationList"
                      id="specialization"
                      name="specialization"
                      required
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Cardiology"
                      className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.specialization
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                    <datalist id="specializationList">
                      {SPECIALIZATIONS.map((spec) => (
                        <option key={spec} value={spec} />
                      ))}
                    </datalist>
                  </div>
                  {fieldErrors.specialization && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.specialization}</p>
                  )}
                </div>

                {/* Medical License Number */}
                <div>
                  <label htmlFor="licenseNumber" className="block text-xs font-semibold text-slate-700">
                    Medical License Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Award className="h-4 w-4" />
                    </div>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="e.g. MD-987654"
                      className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.licenseNumber
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.licenseNumber && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.licenseNumber}</p>
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
                      className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                {/* Years of Experience */}
                <div>
                  <label htmlFor="experience" className="block text-xs font-semibold text-slate-700">
                    Years of Clinical Experience
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
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
                      placeholder="e.g. 10"
                      className={`block w-full pl-9 pr-3 py-2 text-sm rounded-lg border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.experience
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.experience && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.experience}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Practice Information */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 border-b border-slate-100 pb-1">
                3. Practice & Bio Information
              </h3>
              <div className="space-y-4">
                {/* Professional Bio */}
                <div>
                  <label htmlFor="bio" className="block text-xs font-semibold text-slate-700">
                    Professional Biography
                  </label>
                  <div className="mt-1 relative rounded-lg shadow-sm">
                    <textarea
                      id="bio"
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Brief background on medical education, areas of interest, or clinical specialties..."
                      className="block w-full p-3 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all resize-y"
                    />
                  </div>
                </div>

                {/* Consultation Info */}
                <div>
                  <label htmlFor="consultationInfo" className="block text-xs font-semibold text-slate-700">
                    Consultation Hours & Availability
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
                      placeholder="e.g. Mon-Thu 09:00 AM - 04:00 PM (By appointment)"
                      className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 flex items-center justify-center gap-2 font-semibold shadow-sm text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Registering Doctor Account...
                  </>
                ) : (
                  'Complete Doctor Registration'
                )}
              </Button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 space-y-2">
            <p>
              Already registered as a physician?{' '}
              <Link to="/login" className="font-semibold text-secondary hover:text-secondary-light">
                Sign in to Doctor Portal
              </Link>
            </p>
            <p>
              Registering as a patient instead?{' '}
              <Link to="/register" className="font-medium text-slate-600 hover:text-primary underline">
                Create Patient Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRegister;
