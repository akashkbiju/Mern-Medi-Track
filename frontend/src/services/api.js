import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Health check helper to verify frontend-to-backend communication
 */
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.warn('[API Health Check] Backend health endpoint not reachable:', error.message);
    return null;
  }
};

/**
 * Register a new patient account
 * @param {Object} userData - { fullName, email, password, confirmPassword, phone }
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export default api;
