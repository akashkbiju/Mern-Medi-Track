import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

// Attach Authorization Bearer token to all outgoing requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('meditrack_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-handle 401 Unauthorized errors (token expiration / invalid credentials)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('meditrack_token');
      localStorage.removeItem('meditrack_user');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

/**
 * Authenticate user and obtain JWT token
 * @param {Object} credentials - { email, password }
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

/**
 * Logout current user session
 */
export const logoutUser = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch {
    return { success: true };
  }
};

/**
 * Retrieve authenticated user profile
 */
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export default api;
