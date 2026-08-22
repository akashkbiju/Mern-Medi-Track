import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard for authenticated endpoints
 * Redirects unauthenticated visitors to /login preserving intended destination
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show a professional healthcare loading screen while session is being verified
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-8 w-8 text-secondary animate-pulse" />
          <span className="text-2xl font-bold text-primary">
            MediTrack<span className="text-secondary">+</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-secondary" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
