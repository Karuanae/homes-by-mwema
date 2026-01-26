// Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth(); // Get logout and user from context
  const location = useLocation();
  const navigate = useNavigate(); // For redirection
  const menuRef = useRef(null);

  const [showToast, setShowToast] = useState(false);

  const isPaymentPage = location.pathname.includes('/payment');
  const isBookingPage = location.pathname.includes('/booking');

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Poll for unread host/admin replies and show toast on the right of the navbar
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await api.chats.getUnreadCount(user.id);
        const count = res.data?.unread_count ?? res.data?.count ?? res.data?.unread ?? 0;
        if (isMounted) {
          setShowToast(count > 0);
        }
      } catch (err) {
        console.error('Unread fetch error', err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Handle menu item clicks
  const handleMenuItemClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
  };

  // Handle logout
  const handleLogout = (e) => {
    e.stopPropagation();
    logout(); // Call logout from context
    setIsMenuOpen(false);
    navigate('/'); // Redirect to home page
  };

  return (
    <>
      {showToast && (
        <div className="fixed top-6 right-6 z-[60]">
          <div className="bg-white shadow-xl border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-semibold">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Host replied</p>
              <p className="text-xs text-gray-600">Open chat to view the message.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowToast(false);
                  navigate('/chat');
                }}
                className="text-teal-700 text-sm font-semibold hover:text-teal-900"
              >
                Open
              </button>
              <button
                onClick={() => setShowToast(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Dismiss chat notification"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="absolute top-0 left-0 w-full z-50 bg-transparent">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Back arrow on booking and payment pages */}
          <div className="flex items-center">
            {(isBookingPage || isPaymentPage) ? (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full transition-colors duration-200 text-black hover:text-stone-700"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            ) : (
              <span className="w-10" aria-hidden="true" />
            )}
          </div>

          {/* Menu Button */}
          <div className="flex items-center gap-4">
            
            {/* Main Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full transition-colors duration-200 text-black hover:text-stone-700"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 top-14 mt-2 w-64 rounded-xl overflow-hidden shadow-2xl animate-fadeIn border border-gray-100 z-50">
                  <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-100 transform rotate-45" />
                  
                  <div className="bg-white rounded-xl overflow-hidden">
                    {/* User Profile Section */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">
                            {isAuthenticated && user ? `Hello, ${user.name || user.email}` : 'Welcome!'}
                          </p>
                          <p className="text-gray-600 text-sm">
                            {isAuthenticated ? 'Your account' : 'Sign in to your account'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items - Conditional based on authentication */}
                    <div className="p-2">
                      {isAuthenticated ? (
                        // Show logout when authenticated
                        <>
                          <Link
                            to="/profile"
                            onClick={handleMenuItemClick}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-all duration-200 mb-1"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-100 to-teal-50 flex items-center justify-center">
                              <User size={18} className="text-teal-600" />
                            </div>
                            <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                              Profile
                            </span>
                          </Link>

                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-red-100 to-red-50 flex items-center justify-center">
                              <LogOut size={18} className="text-red-600" />
                            </div>
                            <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                              Logout
                            </span>
                          </button>
                        </>
                      ) : (
                        // Show login/signup when not authenticated
                        <>
                          <Link
                            to="/login"
                            onClick={handleMenuItemClick}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-all duration-200 mb-1"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-100 to-teal-50 flex items-center justify-center">
                              <span className="text-teal-600 text-lg">→</span>
                            </div>
                            <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Login</span>
                          </Link>

                          <Link
                            to="/register"
                            onClick={handleMenuItemClick}
                            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-all duration-200"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-100 to-teal-50 flex items-center justify-center">
                              <span className="text-teal-600 text-lg">+</span>
                            </div>
                            <span className="font-medium" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sign Up</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

                    {/* Quick Links */}
                    <div className="p-2">
                      <Link
                        to="/"
                        onClick={handleMenuItemClick}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 text-sm"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        Browse Properties
                      </Link>
                      
                      {/* Additional links for authenticated users */}
                      {isAuthenticated && (
                        <>
                          <Link
                            to="/my-bookings"
                            onClick={handleMenuItemClick}
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 text-sm"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                          >
                            My Bookings
                          </Link>
                          <Link
                            to="/chat"
                            onClick={handleMenuItemClick}
                            className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 text-sm"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}
                          >
                            Chat
                          </Link>                          
                          {user?.role === 'admin' && (
                            <Link
                              to="/admin"
                              onClick={handleMenuItemClick}
                              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 text-sm"
                              style={{ fontFamily: "'Cormorant Garamond', serif" }}
                            >
                              Admin Dashboard
                            </Link>
                          )}                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </header>
    </>
  );
};

export default Navbar;