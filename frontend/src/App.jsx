// App.jsx - Main application component
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import MyBookings from "./pages/MyBookings";
import Footer from "./components/Footer";

// Auth Context
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => React.useContext(AuthContext);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the location they tried to visit
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Route Component (redirects authenticated users away)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
      </div>
    );
  }

  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/my-bookings" replace />;
  }

  return children;
};

// Updated Header component
const UpdatedHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="absolute top-0 left-0 w-full z-50 bg-transparent">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-3">
              <img
                src="/Logo.jpeg"
                alt="Homes by Mwema logo"
                className="h-10 w-auto object-contain"
              />
            </a>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Existing menu button... */}
            {/* ... rest of your header code ... */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default function App() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Routes>
          <Route path="/" element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          } />
          
          <Route path="/login" element={
            <PublicRoute>
              <Header />
              <Login />
              <Footer />
            </PublicRoute>
          } />
          
          <Route path="/register" element={
            <PublicRoute>
              <Header />
              <Register />
              <Footer />
            </PublicRoute>
          } />
          
          <Route path="/booking/:id" element={
            <>
              <Header />
              <BookingPage />
              <Footer />
            </>
          } />
          
          <Route path="/payment/:id" element={
            <ProtectedRoute>
              <Header />
              <PaymentPage />
              <Footer />
            </ProtectedRoute>
          } />
          
          <Route path="/my-bookings" element={
            <ProtectedRoute>
              <Header />
              <MyBookings />
              <Footer />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
  );
}