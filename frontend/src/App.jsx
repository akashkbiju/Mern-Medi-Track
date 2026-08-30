import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import DoctorRegister from './pages/DoctorRegister';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Medicines from './pages/Medicines';
import Reminders from './pages/Reminders';
import MedicationTracker from './pages/MedicationTracker';
import Adherence from './pages/Adherence';
import HealthTracking from './pages/HealthTracking';
import HealthAnalytics from './pages/HealthAnalytics';
import HealthInsights from './pages/HealthInsights';
import Notifications from './pages/Notifications';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { checkApiHealth } from './services/api';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  useEffect(() => {
    // Development connectivity verification
    if (import.meta.env.DEV) {
      checkApiHealth().then((health) => {
        if (health && health.success) {
          console.info('[MediTrack+] API is online and responding:', health);
        }
      });
    }
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/doctor/register" element={<DoctorRegister />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Doctor Protected Routes */}
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorDashboard />} />
          </Route>

          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DoctorProfile />} />
          </Route>

          {/* Patient Protected Dashboard & App Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
          </Route>

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
          </Route>

          <Route
            path="/medicines"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Medicines />} />
          </Route>

          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Reminders />} />
          </Route>

          <Route
            path="/tracker"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MedicationTracker />} />
          </Route>

          <Route
            path="/adherence"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Adherence />} />
          </Route>

          <Route
            path="/health"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HealthTracking />} />
          </Route>

          <Route
            path="/health-records"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HealthTracking />} />
          </Route>

          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Adherence />} />
          </Route>

          <Route
            path="/health-analytics"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HealthAnalytics />} />
          </Route>

          <Route
            path="/health-insights"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HealthInsights />} />
          </Route>

          {/* Shared Protected Notification Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Notifications />} />
          </Route>
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
