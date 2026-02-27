// App.jsx - Main application component
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
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

export default function App() {
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
        <Route path="/management" element={
          <>
            <Header />
            <Management />
            <Footer />
          </>
        } />
        <Route path="/photography-videography" element={
          <>
            <Header />
            <PhotographyVideography />
            <Footer />
          </>
        } />
        <Route path="/listing-optimization" element={
          <>
            <Header />
            <ListingOptimization />
            <Footer />
          </>
        } />
      </Routes>
    </AuthProvider>
  );
}