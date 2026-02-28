import React, { useState, useEffect } from 'react';
import { useNavbarState } from '../hooks/useNavbarState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Bell, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import ConsultationModal from './ConsultationModal';

// --- STYLING CONSTANTS ---
const COLORS = {
  cream: '#F5F2EE',
  creamDark: '#EBE5DE',
  charcoal: '#1C1917',
  gold: '#C1A173',
  white: '#FFFFFF',
};

// Flat nav links — replaces Services dropdown
const NAV_LINKS = [
  { label: 'Management Services', to: '/management' },
  { label: 'Photography & Videography', to: '/photography-videography' },
  { label: 'Listing Optimization', to: '/listing-optimization' },
];

const Navbar = () => {
  const { isMenuOpen, setIsMenuOpen, showConsultModal, setShowConsultModal, menuRef } = useNavbarState();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    setIsMenuOpen(false);

    const params = new URLSearchParams(location.search);
    if (params.get('consult') === '1' && isAuthenticated) {
      setShowConsultModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, isAuthenticated, navigate, setIsMenuOpen, setShowConsultModal]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const notificationsList = [];

        if (user.role === 'admin') {
          try {
            const chatRes = await api.chats.getUnreadCount();
            const unreadCount = chatRes.data?.unread_count ?? chatRes.data?.count ?? chatRes.data?.unread ?? 0;
            if (unreadCount > 0) {
              notificationsList.push({
                id: 'chat-' + Date.now(),
                type: 'message',
                title: 'New Guest Messages',
                message: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''} from guests.`,
                icon: 'message',
                action: 'View Messages',
                route: '/admin/messages',
                timestamp: new Date(),
              });
            }
          } catch (err) {
            console.error('Chat fetch error', err);
          }
        }

        if (user.role !== 'admin') {
          try {
            const bookingsRes = await api.bookings.getUserBookings();
            const upcomingBookings = bookingsRes.data?.filter(b => b.status === 'upcoming').slice(0, 1);
            if (upcomingBookings && upcomingBookings.length > 0) {
              const booking = upcomingBookings[0];
              notificationsList.push({
                id: 'booking-' + booking.id,
                type: 'booking',
                title: 'Upcoming Booking',
                message: `Your booking at ${booking.propertyName} is coming up on ${new Date(booking.checkIn).toLocaleDateString()}.`,
                icon: 'calendar',
                action: 'View Booking',
                route: '/my-bookings',
                timestamp: new Date(),
              });
            }
          } catch (err) {
            console.error('Booking fetch error', err);
          }
        }

        if (isMounted) {
          setNotifications(notificationsList);
          setShowToast(notificationsList.length > 0);
        }
      } catch (err) {
        console.error('Notification fetch error', err);
      }
    };
    fetchNotifications();
    return () => { isMounted = false; };
  }, [isAuthenticated, user, location]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, menuRef, setIsMenuOpen]);

  const handleLogout = (e) => {
    e.stopPropagation();
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleConsultClick = () => {
    if (!isAuthenticated) {
      const dest = `${location.pathname}${location.search ? location.search + '&' : '?'}consult=1`;
      navigate(`/login?redirect=${encodeURIComponent(dest)}`);
    } else {
      setShowConsultModal(true);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} />;
      case 'booking': return <Calendar size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const getTitleColor = (type) => {
    switch (type) {
      case 'message': return 'text-[#C1A173]';
      case 'booking': return 'text-blue-400';
      default: return 'text-[#C1A173]';
    }
  };

  return (
    <>
      <ConsultationModal isOpen={showConsultModal} onClose={() => setShowConsultModal(false)} />

      {/* --- TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
        {showToast && isAuthenticated && user && user.role !== 'admin' && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-28 right-8 z-[70]"
          >
            {notifications.map((notification, index) => (
              <div key={notification.id} className={index === 0 ? 'block' : 'hidden'}>
                <div className="bg-[#1C1917] text-[#F5F2EE] p-5 shadow-2xl flex items-start gap-4 max-w-sm border-l-2 border-[#C1A173]">
                  <div className={`mt-1 ${getTitleColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] uppercase tracking-[0.15em] ${getTitleColor(notification.type)} mb-1`}>
                      {notification.title}
                    </p>
                    <p className="font-serif italic text-sm text-stone-300">"{notification.message}"</p>
                    <div className="flex gap-4 mt-3">
                      <button
                        onClick={() => { setShowToast(false); navigate(notification.route); }}
                        className="text-[10px] uppercase tracking-widest border-b border-[#F5F2EE] pb-0.5 hover:text-[#C1A173] hover:border-[#C1A173] transition-colors"
                      >
                        {notification.action}
                      </button>
                      <button
                        onClick={() => setShowToast(false)}
                        className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN NAVBAR --- */}
      <motion.header className="absolute top-0 left-0 w-full z-[100] bg-transparent py-2 border-b border-transparent">
        <div className="max-w-[1600px] mx-auto pl-0 pr-6 lg:pl-0 lg:pr-12">
          <div className="flex items-center justify-between">

            {/* Left: Logo — using Logo.jpeg, increased size */}
            <div className="flex-shrink-0 flex items-center m-0 p-0">
              <Link to="/" aria-label="Go to homepage">
                <img
                  src="/Logo2.png"
                  alt="Homes by Mwema"
                  className="w-40 h-24 object-contain drop-shadow-2xl cursor-pointer"
                />
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">

              {/* Desktop Nav Links — flat, no dropdown */}
              <nav className="hidden md:flex items-center gap-6 mr-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="relative group py-2"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 text-[#C1A173] whitespace-nowrap">
                      {link.label}
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C1A173] transition-all duration-500 group-hover:w-full" />
                  </Link>
                ))}

                {/* Consultation — separate CTA style */}
                <button
                  onClick={handleConsultClick}
                  className="relative group py-2 px-4 border border-[#C1A173]/40 hover:border-[#C1A173] transition-all duration-300"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-medium text-[#C1A173]">
                    Consultation
                  </span>
                </button>
              </nav>

              {/* Notification Bell */}
              {isAuthenticated && (
                <button
                  onClick={() => navigate('/chat')}
                  className="relative p-2 transition-opacity hover:opacity-60 text-[#C1A173]"
                  title={notifications.length > 0 ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}` : 'No new notifications'}
                >
                  <Bell size={18} strokeWidth={1.5} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-[#D4AF37] text-[#1C1917] text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
              )}

              {/* Hamburger Menu Toggle */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center transition-colors duration-300 text-[#C1A173]"
                >
                  <div className={`p-2 border rounded-full transition-all duration-300 ${isMenuOpen ? 'border-[#1C1917] rotate-90' : 'border-transparent hover:border-[#1C1917]/20'}`}>
                    {isMenuOpen ? <X size={18} strokeWidth={1} /> : <Menu size={18} strokeWidth={1} />}
                  </div>
                </button>

                {/* --- DROPDOWN MENU --- */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
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
                        {/* Mobile: flat service links */}
                        <div className="px-4 md:hidden">
                          <p className="text-[9px] uppercase tracking-widest text-stone-400 px-8 pt-2 pb-1">Services</p>
                          {NAV_LINKS.map((link) => (
                            <Link
                              key={link.to}
                              to={link.to}
                              onClick={() => setIsMenuOpen(false)}
                              className="w-full text-left px-8 py-2.5 mb-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#C1A173] hover:bg-white transition-colors block"
                            >
                              {link.label}
                            </Link>
                          ))}
                          <button
                            onClick={() => { handleConsultClick(); setIsMenuOpen(false); }}
                            className="w-full text-left px-8 py-3 mb-1 uppercase text-[10px] tracking-[0.2em] font-bold text-[#C1A173] bg-transparent hover:bg-white transition-colors"
                          >
                            Consultation
                          </button>
                          <div className="h-px bg-[#EBE5DE] mx-4 my-2" />
                        </div>

                        {/* Auth-based links */}
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

import MenuLink from './MenuLink';

export default Navbar;