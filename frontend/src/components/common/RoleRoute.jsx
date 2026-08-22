import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Route guard requiring specific role membership
 * Redirects unauthenticated users to /login and unauthorized roles to /unauthorized
 */
const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

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
          <span>Verifying role permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user role is not within the authorized roles array
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
