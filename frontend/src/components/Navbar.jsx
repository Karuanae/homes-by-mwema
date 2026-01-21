// Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const menuRef = useRef(null);

  const isPaymentPage = location.pathname.includes('/payment');

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

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

  return (
    <header className="absolute top-0 left-0 w-full z-50 bg-transparent">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          
          {/* Logo on Left */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/Logo.jpeg"
                alt="Homes by Mwema logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Right Side - Three Line Menu Button */}
          <div className="flex items-center gap-4">
            
            {/* Main Menu Button */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 rounded-full transition-all duration-300 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10"
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
                          <p className="text-gray-900 font-medium">Welcome!</p>
                          <p className="text-gray-600 text-sm">Sign in to your account</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
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
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-4" />

                    {/* Quick Links */}
                    <div className="p-2">
                      <Link
                        to="/properties"
                        onClick={handleMenuItemClick}
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all duration-200 text-sm"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        Browse Properties
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;