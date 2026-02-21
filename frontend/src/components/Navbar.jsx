import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Bell, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// --- STYLING CONSTANTS ---
// You can adjust these hex codes to match your specific brand
const COLORS = {
  cream: '#F5F2EE',      // Background
  creamDark: '#EBE5DE',  // Borders/Hover
  charcoal: '#1C1917',   // Text Main
  gold: '#C1A173',       // Accents (Muted Gold)
  white: '#FFFFFF',
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [showToast, setShowToast] = useState(false);
  
  // Consultation modal state
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultDate, setConsultDate] = useState(null);
  
  // Calendar logic
  const today = new Date();
  const [consultMonth, setConsultMonth] = useState(today.getMonth());
  const [consultYear, setConsultYear] = useState(today.getFullYear());
  const consultMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m, y) => new Date(y, m, 1).getDay();



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
    return () => { isMounted = false; };
  }, [isAuthenticated, user, location]);

  // Close menu on outside click
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
      {/* --- CONSULTATION MODAL (Bespoke Paper Look) --- */}
      <AnimatePresence>
        {showConsultModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Elegant easing
              className="bg-[#F5F2EE] border border-[#EBE5DE] shadow-2xl p-8 w-full max-w-md relative"
            >
              <button
                onClick={() => setShowConsultModal(false)}
                className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <X size={20} strokeWidth={1} />
              </button>

              <div className="text-center mb-8">
                <h3 className="font-serif text-2xl text-stone-900 mb-2 italic">Private Consultation</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium">Select a Date</p>
              </div>

              {/* Calendar UI */}
              <div className="border border-stone-200 p-6 bg-white mb-6">
                <div className="flex justify-between items-center mb-6">
                  <button onClick={() => setConsultMonth(m => m === 0 ? 11 : m - 1)} className="text-stone-400 hover:text-stone-900 transition-colors">
                    <span className="font-serif text-lg">←</span>
                  </button>
                  <span className="font-serif text-lg text-stone-800 tracking-wide">
                    {consultMonths[consultMonth]} <span className="text-stone-400">{consultYear}</span>
                  </span>
                  <button onClick={() => setConsultMonth(m => m === 11 ? 0 : m + 1)} className="text-stone-400 hover:text-stone-900 transition-colors">
                    <span className="font-serif text-lg">→</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[9px] uppercase tracking-widest text-stone-400 mb-3">
                  {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: getStartDay(consultMonth, consultYear) }, (_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: getDaysInMonth(consultMonth, consultYear) }, (_, i) => {
                    const d = i + 1;
                    const dateObj = new Date(consultYear, consultMonth, d);
                    const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isSel = consultDate && dateObj.toDateString() === new Date(consultDate).toDateString();
                    
                    return (
                      <button
                        key={d}
                        disabled={isPast}
                        onClick={() => setConsultDate(dateObj)}
                        className={`
                          h-9 w-9 text-xs flex items-center justify-center transition-all duration-300 font-serif
                          ${isSel 
                            ? 'bg-[#1C1917] text-[#F5F2EE]' 
                            : 'hover:bg-[#F5F2EE] text-stone-600'
                          } 
                          ${isPast ? 'opacity-20 cursor-not-allowed' : ''}
                        `}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                className={`
                  w-full py-4 uppercase text-[11px] tracking-[0.25em] font-bold border border-[#1C1917] transition-all duration-500
                  ${!consultDate 
                    ? 'opacity-50 cursor-not-allowed text-stone-400 border-stone-200' 
                    : 'bg-[#1C1917] text-[#F5F2EE] hover:bg-transparent hover:text-[#1C1917]'
                  }
                `}
                disabled={!consultDate}
                onClick={() => {
                  setShowConsultModal(false);
                  setConsultDate(null);
                  alert('Consultation request received.');
                }}
              >
                Confirm Appointment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOAST NOTIFICATION --- */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-28 right-8 z-[70]"
          >
            <div className="bg-[#1C1917] text-[#F5F2EE] p-5 shadow-2xl flex items-start gap-4 max-w-sm border-l-2 border-[#C1A173]">
              <div className="mt-1 text-[#C1A173]">
                <MessageSquare size={16} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.15em] text-[#C1A173] mb-1">Concierge</p>
                <p className="font-serif italic text-sm text-stone-300">"You have a new message waiting."</p>
                <div className="flex gap-4 mt-3">
                  <button onClick={() => { setShowToast(false); navigate('/chat'); }} className="text-[10px] uppercase tracking-widest border-b border-[#F5F2EE] pb-0.5 hover:text-[#C1A173] hover:border-[#C1A173] transition-colors">Read</button>
                  <button onClick={() => setShowToast(false)} className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


  {/* --- MAIN NAVBAR --- */}
      <motion.header 
        className="absolute top-0 left-0 w-full z-[100] bg-transparent py-2 border-b border-transparent"
      >
        <div className="max-w-[1600px] mx-auto pl-0 pr-6 lg:pl-0 lg:pr-12">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-center m-0 p-0">
              <Link to="/" aria-label="Go to homepage">
                <img src="/Finalogo.png" alt="Logo" className="w-32 h-20 object-contain drop-shadow-2xl cursor-pointer" />
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-8">
              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-8 mr-4">
                <button
                  onClick={() => setShowConsultModal(true)}
                  className="relative group py-2"
                >
                  <span className="font-sans text-[12px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 text-[#C1A173]">
                    Consultation
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C1A173] transition-all duration-500 group-hover:w-full"></span>
                </button>

                {/* Services Dropdown */}
                <div className="relative group">
                  <button
                    className="relative group py-2"
                  >
                    <span className="font-sans text-[12px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 text-[#C1A173]">
                      Services
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C1A173] transition-all duration-500 group-hover:w-full"></span>
                  </button>
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-[#EBE5DE] shadow-xl opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none transition-opacity duration-300 z-50">
                    <div className="py-2 px-4 text-left">
                      <Link
                        to="/photography-videography"
                        className="block text-[11px] font-serif text-[#1C1917] py-2 border-b border-[#EBE5DE] hover:bg-[#F5F2EE] transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Photography & videography
                      </Link>
                      <Link
                        to="/listing-optimization"
                        className="block text-[11px] font-serif text-[#1C1917] py-2 border-b border-[#EBE5DE] hover:bg-[#F5F2EE] transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Listing optimization
                      </Link>
                      <button
                        onClick={() => { setIsMenuOpen(false); navigate('/management'); }}
                        className="w-full text-left text-[11px] font-serif text-[#1C1917] py-2 hover:bg-[#F5F2EE] transition-colors"
                      >
                        Management
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Bell */}
              {isAuthenticated && (
                <button 
                  onClick={() => navigate('/chat')} 
                  className="relative p-2 transition-opacity hover:opacity-60 text-[#C1A173]"
                >
                  <Bell size={18} strokeWidth={1.5} />
                  {showToast && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#C1A173] rounded-full" />}
                </button>
              )}

              {/* Menu Toggle */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center transition-colors duration-300 text-[#C1A173]"
                >
                  <div className={`p-2 border rounded-full transition-all duration-300 ${isMenuOpen ? 'border-[#1C1917] rotate-90' : 'border-transparent hover:border-[#1C1917]/20'}`}>
                    {isMenuOpen ? <X size={18} strokeWidth={1} /> : <Menu size={18} strokeWidth={1} />}
                  </div>
                </button>

                {/* --- LUXURY DROPDOWN MENU --- */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute right-0 top-16 mt-2 w-80 bg-[#F5F2EE] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#EBE5DE] z-50 flex flex-col"
                    >
                      {/* User Header */}
                      <div className="p-8 border-b border-[#EBE5DE] bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1C1917] flex items-center justify-center text-[#C1A173]">
                                <User size={16} strokeWidth={1.5} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] uppercase tracking-widest text-stone-400 mb-0.5">Signed in as</p>
                                <h4 className="font-serif text-lg text-[#1C1917] truncate leading-none">
                                {isAuthenticated && user ? user.name || user.email.split('@')[0] : 'Guest'}
                                </h4>
                            </div>
                        </div>
                      </div>

                      {/* Navigation Links */}
                      <div className="py-4">
                        {!isAuthenticated ? (
                          <>
                            <MenuLink to="/login" label="Client Login" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/register" label="Register" onClick={() => setIsMenuOpen(false)} />
                          </>
                        ) : user?.role === 'admin' ? (
                          <>
                            <MenuLink to="/admin" label="Administration" highlight onClick={() => setIsMenuOpen(false)} />
                            <div className="h-px bg-[#EBE5DE] mx-6 my-2" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-red-900/60 hover:text-red-900 hover:bg-red-50/50 transition-colors flex items-center justify-between group"
                            >
                              Sign Out
                              <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </>
                        ) : (
                          <>
                            <MenuLink to="/profile" label="Profile & Settings" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/my-bookings" label="My Reservations" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/chat" label="Concierge Service" onClick={() => setIsMenuOpen(false)} />
                            <div className="h-px bg-[#EBE5DE] mx-6 my-2" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-red-900/60 hover:text-red-900 hover:bg-red-50/50 transition-colors flex items-center justify-between group"
                            >
                              Sign Out
                              <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Footer Link */}
                      <div className="bg-[#1C1917] p-4 text-center">
                        <Link 
                          to="/" 
                          onClick={() => setIsMenuOpen(false)}
                          className="text-[#C1A173] text-[9px] uppercase tracking-[0.3em] hover:text-white transition-colors"
                        >
                          Discover The Collection
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
};

// Helper component for styled links
const MenuLink = ({ to, label, highlight, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`
      flex items-center justify-between px-8 py-3 group transition-all duration-300
      ${highlight ? 'bg-[#C1A173]/10' : 'hover:bg-white'}
    `}
  >
    <span className={`
      text-[10px] uppercase tracking-[0.2em] font-bold transition-colors
      text-[#C1A173]
    `}>
      {label}
    </span>
    <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#C1A173]">
        <ChevronRight size={14} strokeWidth={1} />
    </span>
  </Link>
);

export default Navbar;