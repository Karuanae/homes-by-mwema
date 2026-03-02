// App.jsx - Main application component with Properties route
import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicRoute from "./components/PublicRoute";
import Header from "./components/Navbar";
import UserLayout from "./components/UserLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import MyBookings from "./pages/MyBookings";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import Footer from "./components/Footer";
import Management from "./pages/Management";
import ListingOptimization from "./pages/ListingOptimization";
import PhotographyVideography from "./pages/PhotographyVideography";
import AdminConsultations from "./pages/AdminConsultations";
import Properties from "./pages/Properties";
import MyConsultations from "./pages/MyConsultations"; // NEW - User consultations page
import NewConsultation from "./pages/NewConsultation"; // NEW - Create consultation page

// AuthSync component to handle auth state synchronization
const AuthSync = () => {
  const { refreshUserFromStorage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for storage events (changes from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'token') {
        console.log('🔄 Storage changed, refreshing auth context');
        refreshUserFromStorage();
      }
    };

    // Listen for custom auth update events (from same tab)
    const handleAuthUpdate = () => {
      console.log('🔄 Auth update event received, refreshing auth context');
      refreshUserFromStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-update', handleAuthUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-update', handleAuthUpdate);
    };
  }, [refreshUserFromStorage, navigate]);

  return null; // This component doesn't render anything
};

// Wrapper component to use hooks that need Auth context
function AppContent() {
  return (
    <>
      <AuthSync />
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <>
              <Header />
              <Home />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Properties Route */}
        <Route path="/properties" element={
          <PublicRoute>
            <>
              <Header />
              <Properties />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Auth Routes */}
        <Route path="/login" element={
          <>
            <Header />
            <Login />
            <Footer />
          </>
        } />

        <Route path="/register" element={
          <>
            <Header />
            <Register />
            <Footer />
          </>
        } />

        {/* Booking Routes */}
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

        <Route path="/payment/success" element={
          <ProtectedRoute>
            <Header />
            <PaymentSuccess />
            <Footer />
          </ProtectedRoute>
        } />

        <Route path="/payment/cancel" element={
          <>
            <Header />
            <PaymentCancel />
            <Footer />
          </>
        } />

        {/* User Routes */}
        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <UserLayout>
              <MyBookings />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute>
            <UserLayout>
              <Chat />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <UserLayout>
              <div className="p-8">
                <h1 className="text-2xl font-serif mb-4">Profile Settings</h1>
                <p className="text-stone-500">Profile page coming soon...</p>
              </div>
            </UserLayout>
          </ProtectedRoute>
        } />

        {/* NEW Consultation Routes */}
        <Route path="/consultation/new" element={
          <ProtectedRoute>
            <UserLayout>
              <NewConsultation />
            </UserLayout>
          </ProtectedRoute>
        } />

        <Route path="/my-consultations" element={
          <ProtectedRoute>
            <UserLayout>
              <MyConsultations />
            </UserLayout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
        
        <Route path="/admin/consultations" element={
          <AdminRoute>
            <AdminConsultations />
          </AdminRoute>
        } />
        
        {/* Service Pages */}
        <Route path="/management" element={
          <PublicRoute>
            <>
              <Header />
              <Management />
              <Footer />
            </>
          </PublicRoute>
        } />
        
        <Route path="/photography-videography" element={
          <PublicRoute>
            <>
              <Header />
              <PhotographyVideography />
              <Footer />
            </>
          </PublicRoute>
        } />
        
        <Route path="/listing-optimization" element={
          <PublicRoute>
            <>
              <Header />
              <ListingOptimization />
              <Footer />
            </>
          </PublicRoute>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}