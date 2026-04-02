// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  // ── Restore session from localStorage on first load ───────────────────────
  const refreshUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    const token      = localStorage.getItem('token');

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

    localStorage.setItem('user',  JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    window.dispatchEvent(new CustomEvent('auth-update'));

    return { user: userData, token };
  };

  // ── Signup (email + password) ─────────────────────────────────────────────
  // The backend NEVER returns a token for a new registration because the
  // account starts unverified.  We deliberately do NOT set user/token here —
  // the user must click the verification link first, then log in normally.
  const signup = async (userData) => {
    const response = await api.auth.register(userData);
    const { user: newUser } = response.data;

    // Safety check: if somehow the backend returns a verified user + token
    // (e.g. an admin account being created programmatically), handle it.
    if (newUser?.email_verified && response.data.token) {
      localStorage.setItem('user',  JSON.stringify(newUser));
      localStorage.setItem('token', response.data.token);
      setUser(newUser);
      window.dispatchEvent(new CustomEvent('auth-update'));
    }
    // In the normal case (email_verified: false) we do nothing with state —
    // Register.jsx will show the "check your inbox" panel instead.

    return { user: newUser };
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

  const getToken       = () => localStorage.getItem('token');
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