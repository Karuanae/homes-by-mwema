// App.jsx - with React.lazy() code splitting for faster initial bundle load
import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, useNavigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ── Always-eager imports (tiny, needed on every page) ──────────────────────
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicRoute from "./components/PublicRoute";
import Header from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// ── Lazy-loaded pages (each becomes its own JS chunk) ──────────────────────
// Core
const Home                    = lazy(() => import("./pages/Home"));
const Properties              = lazy(() => import("./pages/Properties"));
const Login                   = lazy(() => import("./pages/Login"));
const Register                = lazy(() => import("./pages/Register"));
const ForgotPassword          = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword           = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail             = lazy(() => import("./pages/VerifyEmail"));

// Booking & payment
const BookingPage             = lazy(() => import("./pages/BookingPage"));
const PaymentPage             = lazy(() => import("./pages/PaymentPage"));
const PaymentSuccess          = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel           = lazy(() => import("./pages/PaymentCancel"));

// User dashboard
const UserDashboard           = lazy(() => import("./pages/UserDashboard"));

// Admin
const AdminDashboard          = lazy(() => import("./pages/AdminDashboard"));
const AdminConsultations      = lazy(() => import("./pages/AdminConsultations"));

// Service pages
const Management              = lazy(() => import("./pages/Management"));
const ListingOptimization     = lazy(() => import("./pages/ListingOptimization"));
const PhotographyVideography  = lazy(() => import("./pages/PhotographyVideography"));
const SocialMediaMarketing    = lazy(() => import("./pages/SocialMediaMarketing"));
const CarHireServices         = lazy(() => import("./pages/CarHireServices"));
const FullyFurnishedUnitsOnSale = lazy(() => import("./pages/FullyFurnishedUnitsOnSale"));
const SafariTours             = lazy(() => import("./pages/SafariTours"));
const AirportSGRTransfers     = lazy(() => import("./pages/AirportSGRTransfers"));
const ChefServices            = lazy(() => import("./pages/ChefServices"));
const HostComingSoon          = lazy(() => import("./pages/HostComingSoon"));

// Legal
const TermsAndPolicy          = lazy(() => import("./pages/TermsAndPolicy"));

// ── Page-level loading fallback ────────────────────────────────────────────
// Minimal — just keeps the header visible so the nav doesn't flash away
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f2ee]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-[#093A3E] border-t-transparent animate-spin" />
      <p className="text-xs uppercase tracking-widest text-stone-400">Loading</p>
    </div>
  </div>
);

// ── Auth sync (listens for storage events across tabs) ────────────────────
const AuthSync = () => {
  const { refreshUserFromStorage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "token") {
        refreshUserFromStorage();
      }
    };
    const handleAuthUpdate = () => refreshUserFromStorage();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-update", handleAuthUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-update", handleAuthUpdate);
    };
  }, [refreshUserFromStorage, navigate]);

  return null;
};

// ── Thin wrapper: Suspense around every lazy page ─────────────────────────
const Page = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

// ── Route definitions ──────────────────────────────────────────────────────
function AppContent() {
  return (
    <>
      <ScrollToTop />
      <AuthSync />
      <Routes>

        {/* ── Public pages ── */}
        <Route path="/" element={
          <PublicRoute>
            <Header />
            <Page><Home /></Page>
            <Footer />
          </PublicRoute>
        } />

        <Route path="/properties" element={
          <PublicRoute>
            <Header />
            <Page><Properties /></Page>
            <Footer />
          </PublicRoute>
        } />

        <Route path="/host" element={
          <PublicRoute>
            <Header />
            <Page><HostComingSoon /></Page>
            <Footer />
          </PublicRoute>
        } />

        {/* ── Auth pages ── */}
        <Route path="/login" element={
          <>
            <Header />
            <Page><Login /></Page>
            <Footer />
          </>
        } />

        <Route path="/register" element={
          <>
            <Header />
            <Page><Register /></Page>
            <Footer />
          </>
        } />

        <Route path="/verify-email" element={
          <VerifyEmail />
        } />

        <Route path="/forgot-password" element={
          <>
            <Header />
            <Page><ForgotPassword /></Page>
            <Footer />
          </>
        } />

        <Route path="/reset-password" element={
          <>
            <Header />
            <Page><ResetPassword /></Page>
            <Footer />
          </>
        } />

        {/* ── Booking — NO auth gate on view; auth enforced inside on "Book Now" ── */}
        <Route path="/booking/:id" element={
          <>
            <Page><BookingPage /></Page>
            <Footer />
          </>
        } />

        {/* ── Payment — auth required ── */}
        <Route path="/payment/:id" element={
          <ProtectedRoute>
            <Header />
            <Page><PaymentPage /></Page>
            <Footer />
          </ProtectedRoute>
        } />

        <Route path="/payment/success" element={
          <ProtectedRoute>
            <Header />
            <Page><PaymentSuccess /></Page>
            <Footer />
          </ProtectedRoute>
        } />

        <Route path="/payment/cancel" element={
          <>
            <Header />
            <Page><PaymentCancel /></Page>
            <Footer />
          </>
        } />

        {/* ── User dashboard ── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Page><UserDashboard /></Page>
          </ProtectedRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/admin" element={
          <AdminRoute>
            <Page><AdminDashboard /></Page>
          </AdminRoute>
        } />

        <Route path="/admin/consultations" element={
          <AdminRoute>
            <Page><AdminConsultations /></Page>
          </AdminRoute>
        } />

        {/* ── Service pages ── */}
        {[
          ["/management",            <Management />],
          ["/photography-videography", <PhotographyVideography />],
          ["/listing-optimization",  <ListingOptimization />],
          ["/social-media-marketing",<SocialMediaMarketing />],
          ["/car-hire",              <CarHireServices />],
          ["/fully-furnished-units", <FullyFurnishedUnitsOnSale />],
          ["/safari-tours",          <SafariTours />],
          ["/airport-transfers",     <AirportSGRTransfers />],
          ["/chef-services",         <ChefServices />],
          ["/terms",                 <TermsAndPolicy />],
          ["/privacy",               <TermsAndPolicy />],
          ["/cookie-policy",         <TermsAndPolicy />],
        ].map(([path, element]) => (
          <Route key={path} path={path} element={
            <PublicRoute>
              <Header />
              <Page>{element}</Page>
              <Footer />
            </PublicRoute>
          } />
        ))}

        {/* ── 404 ── */}
        <Route path="*" element={
          <PublicRoute>
            <Header />
            <div className="min-h-screen flex items-center justify-center bg-[#f5f2ee] px-6">
              <div className="text-center">
                <h1 className="text-6xl font-serif text-[#093A3E] mb-4">404</h1>
                <p className="text-stone-600 mb-8">Page not found</p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
                >
                  Return Home
                </Link>
              </div>
            </div>
            <Footer />
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