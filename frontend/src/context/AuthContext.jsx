// context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to refresh user from localStorage
  const refreshUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔄 Refreshing user from storage:', {
      hasUser: !!storedUser,
      hasToken: !!token
    });
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('✅ AuthContext refreshed with user:', parsedUser.email);
        return true;
      } catch (e) {
        console.error('❌ Failed to parse stored user:', e);
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
    // Check for stored user and token on initial load
    refreshUserFromStorage();
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials.email, credentials.password);
      const { user: userData, token } = response.data;
      
      console.log('📝 Login API response:', { userData, token: token ? 'received' : 'missing' });
      
      // Store both user data and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      // Update state
      setUser(userData);
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('auth-update'));
      
      return { user: userData, token };
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.auth.register(userData);
      const { user: newUser, token } = response.data;
      
      localStorage.setItem('user', JSON.stringify(newUser));
      localStorage.setItem('token', token);
      
      setUser(newUser);
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new CustomEvent('auth-update'));
      
      return { user: newUser, token };
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Clear all auth-related data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    setUser(null);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('auth-update'));
    
    navigate('/');
  };

  const updateUser = (updatedUserData) => {
    const currentUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(currentUser));
    setUser(currentUser);
    window.dispatchEvent(new CustomEvent('auth-update'));
  };

  const getToken = () => {
    return localStorage.getItem('token');
  };

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
      refreshUserFromStorage, // Expose this method
    }}>
      {children}
    </AuthContext.Provider>
  );
};