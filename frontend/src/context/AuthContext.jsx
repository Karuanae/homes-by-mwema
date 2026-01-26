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

  useEffect(() => {
    // Check for stored user and token on initial load
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      // Token will be automatically added to requests via axios interceptor
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials.email, credentials.password);
      const { user: userData, token } = response.data;
      
      // Store both user data and token
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', token);
      
      // Token will be automatically added to requests via axios interceptor
      setUser(userData);
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
      
      // Token will be automatically added to requests via axios interceptor
      setUser(newUser);
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
    navigate('/');
  };

  const updateUser = (updatedUserData) => {
    const currentUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(currentUser));
    setUser(currentUser);
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
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};