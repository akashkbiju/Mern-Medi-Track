import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Activity } from 'lucide-react';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary">
          <Activity className="h-7 w-7 text-secondary" />
          MediTrack<span className="text-secondary">+</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-6 shadow-sm border border-slate-100 sm:rounded-2xl sm:px-10 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-100">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Denied</h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              You don&apos;t have permission to access this page. This area is restricted to specific role privileges.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              to="/dashboard"
              variant="primary"
              className="py-2.5 px-6 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              Return to Dashboard
            </Button>
            <Button
              to="/"
              variant="outline"
              className="py-2.5 px-6 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
