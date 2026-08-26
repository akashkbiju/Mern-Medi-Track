import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Medicines from './pages/Medicines';
import Reminders from './pages/Reminders';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { checkApiHealth } from './services/api';
import { AuthProvider } from './context/AuthContext';

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
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Dashboard & App Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
        </Route>

        <Route
          path="/medicines"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Medicines />} />
        </Route>

        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Reminders />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
