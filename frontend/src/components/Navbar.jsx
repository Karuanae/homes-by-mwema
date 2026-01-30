import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ArrowLeft, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [showToast, setShowToast] = useState(false);

  const isPaymentPage = location.pathname.includes('/payment');
  const isBookingPage = location.pathname.includes('/booking');
  // Check if we are on the home page to handle transparent vs solid backgrounds
  const isHome = location.pathname === '/';

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await api.chats.getUnreadCount(user.id);
        const count = res.data?.unread_count ?? res.data?.count ?? res.data?.unread ?? 0;
        if (isMounted) setShowToast(count > 0);
      } catch (err) {
        console.error('Unread fetch error', err);
      }
    };

    fetchUnread();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      {/* --- REFINED TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 right-6 z-[70]"
          >
            <div className="bg-stone-900 text-[#f5f2ee] shadow-2xl border border-stone-800 rounded-sm px-5 py-4 flex items-center gap-4 max-w-sm backdrop-blur-md bg-opacity-95">
              <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
                <MessageSquare size={18} className="text-amber-200" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest font-bold text-amber-200 mb-0.5">Notification</p>
                <p className="text-sm font-serif italic">The host has sent a reply</p>
              </div>
              <div className="flex flex-col gap-2 border-l border-stone-700 pl-4">
                <button
                  onClick={() => { setShowToast(false); navigate('/chat'); }}
                  className="text-[10px] uppercase tracking-widest font-bold hover:text-white transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-[10px] uppercase tracking-widest font-bold text-stone-500 hover:text-stone-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN NAVBAR --- */}
      <header className="fixed top-0 left-0 w-full z-[60] transition-all duration-500 bg-transparent">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            
            {/* Left: Navigation/Back */}
            <div className="flex items-center gap-4">
              {(isBookingPage || isPaymentPage) ? (
                <button
                  onClick={() => navigate(-1)}
                  className="group flex items-center gap-2 text-stone-900 transition-transform active:scale-95"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Back</span>
                </button>
              ) : (
                <Link to="/" className="text-xl font-serif tracking-tighter text-stone-900">
                  MWEMA<span className="italic font-light text-stone-400">.</span>
                </Link>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              {/* Notification Dot for Auth Users */}
              {isAuthenticated && (
                <button onClick={() => navigate('/chat')} className="relative p-2 text-stone-900 hover:opacity-60 transition-opacity">
                  <Bell size={20} strokeWidth={1.5} />
                  {showToast && <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-[#f5f2ee]" />}
                </button>
              )}

              {/* Menu Toggle */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 pl-4 pr-2 py-2 rounded-full border border-stone-300 bg-white/50 backdrop-blur-sm hover:border-stone-900 transition-all duration-300 group"
                >
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-600 group-hover:text-stone-900 hidden sm:block">
                    {isMenuOpen ? 'Close' : 'Menu'}
                  </span>
                  <div className="p-1">
                    {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
                  </div>
                </button>

                {/* --- LUXURY DROPDOWN MENU --- */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="absolute right-0 top-14 mt-4 w-72 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.15)] rounded-sm border border-stone-100 overflow-hidden z-50"
                    >
                      {/* Header Section */}
                      <div className="p-8 bg-stone-50 border-b border-stone-100">
                        <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center mb-4">
                          <User size={20} className="text-amber-100" strokeWidth={1.5} />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Account</p>
                        <h4 className="font-serif text-xl text-stone-900 truncate">
                          {isAuthenticated && user ? user.name || user.email.split('@')[0] : 'Guest'}
                        </h4>
                      </div>

                      {/* Menu Links */}
                      <div className="p-4 space-y-1">
                        {!isAuthenticated ? (
                          <>
                            <MenuLink to="/login" label="Login" icon="→" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/register" label="Register" icon="+" onClick={() => setIsMenuOpen(false)} />
                          </>
                        ) : user?.role === 'admin' ? (
                          /* Admin Menu - Only show Administrator option */
                          <>
                            <MenuLink to="/admin" label="Administrator" highlight onClick={() => setIsMenuOpen(false)} />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-between px-4 py-3 text-red-800 hover:bg-red-50 transition-colors rounded-sm"
                            >
                              <span className="text-[11px] uppercase tracking-widest font-bold">Sign Out</span>
                              <LogOut size={14} />
                            </button>
                          </>
                        ) : (
                          /* Regular User Menu */
                          <>
                            <MenuLink to="/profile" label="Profile Settings" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/my-bookings" label="My Bookings" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/chat" label="Concierge Chat" onClick={() => setIsMenuOpen(false)} />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center justify-between px-4 py-3 text-red-800 hover:bg-red-50 transition-colors rounded-sm"
                            >
                              <span className="text-[11px] uppercase tracking-widest font-bold">Sign Out</span>
                              <LogOut size={14} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Footer Link */}
                      <div className="p-4 bg-stone-900">
                        <Link 
                          to="/" 
                          onClick={() => setIsMenuOpen(false)}
                          className="block text-center text-[#f5f2ee] text-[10px] uppercase tracking-[0.3em] font-bold py-2 hover:text-amber-200 transition-colors"
                        >
                          Explore Collection
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

// Helper component for menu links to keep code clean
const MenuLink = ({ to, label, icon, highlight, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-between px-4 py-3 rounded-sm transition-all duration-300 group ${highlight ? 'bg-amber-50' : 'hover:bg-stone-50'}`}
  >
    <span className={`text-[11px] uppercase tracking-widest font-bold ${highlight ? 'text-amber-900' : 'text-stone-600 group-hover:text-stone-900'}`}>
      {label}
    </span>
    {icon ? <span className="text-stone-400 font-light">{icon}</span> : <div className="w-1 h-1 bg-stone-300 rounded-full group-hover:bg-stone-900 transition-colors" />}
  </Link>
);

export default Navbar;