import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DashboardLayout from './layouts/DashboardLayout'
import { checkApiHealth } from './services/api'

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
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        {/* Future routes */}
      </Route>
    </Routes>
  )
}

export default App
