import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Restore session from localStorage on first load ───────────────────────
  const refreshUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        return true;
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        return false;
      }
    } else {
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    refreshUserFromStorage();
    setLoading(false);
  }, []);

  // ── Login (email + password) ──────────────────────────────────────────────
  const login = async (credentials) => {
    const response = await api.auth.login(credentials.email, credentials.password);
    const { user: userData, token } = response.data;

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    window.dispatchEvent(new CustomEvent('auth-update'));

    return { user: userData, token };
  };

  // ── Signup (email + password) - FIXED ─────────────────────────────────────
  // Returns the full response data including requires_verification and user_id
  const signup = async (userData) => {
    const response = await api.auth.register(userData);
    // Return the entire response data so Register component can access
    // requires_verification, user_id, email, etc.
    return response.data;
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('bookingChatId');
    localStorage.removeItem('paymentChatId');
    setUser(null);
    window.dispatchEvent(new CustomEvent('auth-update'));
    navigate('/');
  };

  // ── Update stored user (e.g. after profile edit) ──────────────────────────
  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
    window.dispatchEvent(new CustomEvent('auth-update'));
  };

  const getToken = () => localStorage.getItem('token');
  const isAuthenticated = !!user && !!localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateUser,
      getToken,
      isAuthenticated,
      loading,
      refreshUserFromStorage,
    }}>
      {children}
    </AuthContext.Provider>
  );
};