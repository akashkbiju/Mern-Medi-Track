import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, logoutUser, getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('meditrack_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = Boolean(user && token);

  // Initialize and restore authentication session on app mount / refresh
  const initializeAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('meditrack_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await getMe();
      if (response && response.data?.user) {
        setUser(response.data.user);
        setToken(storedToken);
      } else {
        throw new Error('Invalid user payload');
      }
    } catch {
      // If token expired or invalid, clear stored state
      localStorage.removeItem('meditrack_token');
      localStorage.removeItem('meditrack_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Log in user, store token in localStorage, and update state
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const { token: receivedToken, user: receivedUser } = response.data;

    // Securely persist token and user info
    localStorage.setItem('meditrack_token', receivedToken);
    localStorage.setItem('meditrack_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  /**
   * Log out user, notify backend, clear storage, and reset state
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Continue cleanup regardless of network status
    } finally {
      localStorage.removeItem('meditrack_token');
      localStorage.removeItem('meditrack_user');
      setUser(null);
      setToken(null);
    }
  };

  /**
   * Update authenticated user in memory and localStorage
   * @param {Object} updatedUser - Updated user payload
   */
  const updateUser = (updatedUser) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem('meditrack_user', JSON.stringify(merged));
      return merged;
    });
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
