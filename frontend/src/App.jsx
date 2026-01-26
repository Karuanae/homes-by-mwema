// App.jsx - Main application component
import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Header from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import MyBookings from "./pages/MyBookings";
import Chat from "./pages/Chat";
import AdminDashboard from "./pages/AdminDashboard";
import Footer from "./components/Footer";

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

        <Route path="/my-bookings" element={
          <ProtectedRoute>
            <Header />
            <MyBookings />
            <Footer />
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute>
            <Header />
            <Chat />
            <Footer />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}