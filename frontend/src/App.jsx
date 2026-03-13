// App.jsx - Main application component with Properties route
import React, { useEffect } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicRoute from "./components/PublicRoute";
import Header from "./components/Navbar";
import UserLayout from "./components/UserLayout";
import ScrollToTop from "./components/ScrollToTop";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
import MyConsultations from "./pages/MyConsultations";
import NewConsultation from "./pages/NewConsultation";
import ProfileSettings from "./pages/ProfileSettings";

// NEW SERVICE PAGE IMPORTS
import TermsAndPolicy from "./pages/TermsAndPolicy";
import SocialMediaMarketing from "./pages/SocialMediaMarketing";
import CarHireServices from "./pages/CarHireServices";
import FullyFurnishedUnitsOnSale from "./pages/FullyFurnishedUnitsOnSale";
import SafariTours from "./pages/SafariTours";
import AirportSGRTransfers from "./pages/AirportSGRTransfers";
import ChefServices from "./pages/ChefServices";

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

  return null;
};

// Wrapper component to use hooks that need Auth context
function AppContent() {
  return (
    <>
      <ScrollToTop />
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

        {/* Forgot Password Routes */}
        <Route path="/forgot-password" element={
          <>
            <Header />
            <ForgotPassword />
            <Footer />
          </>
        } />

        <Route path="/reset-password" element={
          <>
            <Header />
            <ResetPassword />
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

        {/* Consultation Routes */}
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

        {/* Profile Settings Route - UPDATED */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserLayout>
              <ProfileSettings />
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

        {/* Social Media Marketing */}
        <Route path="/social-media-marketing" element={
          <PublicRoute>
            <>
              <Header />
              <SocialMediaMarketing />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Car Hire Services */}
        <Route path="/car-hire" element={
          <PublicRoute>
            <>
              <Header />
              <CarHireServices />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Fully Furnished Units On Sale */}
        <Route path="/fully-furnished-units" element={
          <PublicRoute>
            <>
              <Header />
              <FullyFurnishedUnitsOnSale />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Safari Tours */}
        <Route path="/safari-tours" element={
          <PublicRoute>
            <>
              <Header />
              <SafariTours />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Airport & SGR Transfers */}
        <Route path="/airport-transfers" element={
          <PublicRoute>
            <>
              <Header />
              <AirportSGRTransfers />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Chef Services */}
        <Route path="/chef-services" element={
          <PublicRoute>
            <>
              <Header />
              <ChefServices />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Legal Pages */}
        <Route path="/terms" element={
          <PublicRoute>
            <>
              <Header />
              <TermsAndPolicy />
              <Footer />
            </>
          </PublicRoute>
        } />

        <Route path="/privacy" element={
          <PublicRoute>
            <>
              <Header />
              <TermsAndPolicy />
              <Footer />
            </>
          </PublicRoute>
        } />

        <Route path="/cookie-policy" element={
          <PublicRoute>
            <>
              <Header />
              <TermsAndPolicy />
              <Footer />
            </>
          </PublicRoute>
        } />

        {/* Catch-all for 404 */}
        <Route path="*" element={
          <PublicRoute>
            <>
              <Header />
              <div className="min-h-screen flex items-center justify-center bg-[#f5f2ee] px-6">
                <div className="text-center">
                  <h1 className="text-6xl font-serif text-[#093A3E] mb-4">404</h1>
                  <p className="text-stone-600 mb-8">Page not found</p>
                  <Link to="/" className="inline-block px-6 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors">
                    Return Home
                  </Link>
                </div>
              </div>
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