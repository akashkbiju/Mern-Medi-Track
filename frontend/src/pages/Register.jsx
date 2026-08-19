import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { registerUser } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live password requirements evaluation
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password;
    return {
      hasMinLength: pwd.length >= 8,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&#^~_\-]/.test(pwd),
    };
  }, [formData.password]);

  // Calculate password strength score (0 to 4)
  const passwordStrength = useMemo(() => {
    const { hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar } = passwordCriteria;
    if (!formData.password) return { score: 0, label: '', color: 'bg-slate-200' };

    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUpperCase && hasLowerCase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecialChar) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
      case 2:
        return { score: 2, label: 'Fair', color: 'bg-amber-500', width: 'w-2/4' };
      case 3:
        return { score: 3, label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
      case 4:
        return { score: 4, label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
      default:
        return { score: 0, label: 'Weak', color: 'bg-red-500', width: 'w-1/12' };
    }
  }, [passwordCriteria, formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear inline error when typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Please enter your full name.';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (formData.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.';
    }

    if (!formData.password) {
      errors.password = 'Please enter a password.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    } else if (
      !passwordCriteria.hasUpperCase ||
      !passwordCriteria.hasLowerCase ||
      !passwordCriteria.hasNumber ||
      !passwordCriteria.hasSpecialChar
    ) {
      errors.password = 'Password does not meet the complexity requirements.';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      setIsSuccess(true);
    } catch (err) {
      const responseData = err.response?.data;
      if (err.response?.status === 409) {
        setServerError('An account with this email already exists.');
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Validation errors returned from express-validator
        const serverFieldErrors = {};
        responseData.errors.forEach((e) => {
          if (e.field) serverFieldErrors[e.field] = e.message;
        });
        setFieldErrors(serverFieldErrors);
        setServerError(responseData.message || 'Please check the information you entered.');
      } else if (responseData?.message) {
        setServerError(responseData.message);
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Unable to connect to the server. Please check your internet or try again.');
      } else {
        setServerError('Something went wrong during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center text-3xl font-bold text-primary items-center gap-2">
          <Activity className="text-secondary h-8 w-8" />
          MediTrack<span className="text-secondary">+</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
          Create your MediTrack+ account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Start managing your medicines and health information in one secure place.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[500px]">
        <div className="bg-white px-6 py-10 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-10">
          {/* Success State Screen */}
          {isSuccess ? (
            <div className="text-center py-4 space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Account Created Successfully!</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Welcome to MediTrack+. Your patient account has been created. You can now proceed to log in to access your dashboard.
                </p>
              </div>

              <div className="pt-2">
                <Button to="/login" variant="primary" className="w-full py-3 flex items-center justify-center gap-2">
                  Continue to Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              {/* Server Error Alert */}
              {serverError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{serverError}</p>
                  </div>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      fieldErrors.fullName
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                    placeholder="e.g. John Doe"
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      fieldErrors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                    Phone Number
                  </label>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      fieldErrors.phone
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                    placeholder="+91 98765 43210"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      fieldErrors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2.5 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Password strength:</span>
                      <span className="font-medium text-slate-700">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color} ${passwordStrength.width}`}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements Checklist */}
                <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-700 mb-1">Password requirements:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {passwordCriteria.hasMinLength ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                      At least 8 characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {passwordCriteria.hasUpperCase ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                      Uppercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {passwordCriteria.hasLowerCase ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                      Lowercase letter
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {passwordCriteria.hasNumber ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                      One number
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-400'} sm:col-span-2`}>
                      {passwordCriteria.hasSpecialChar ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5" />}
                      Special character (@$!%*?&#^~_-)
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-slate-200 focus:border-primary focus:ring-primary/20'
                    }`}
                    placeholder="Repeat your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 flex items-center justify-center gap-2 font-semibold shadow-sm"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Bottom link to Login */}
          {!isSuccess && (
            <p className="mt-8 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-secondary hover:text-secondary-light">
                Sign in instead
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
