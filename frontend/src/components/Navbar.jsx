// Navbar.jsx - Updated with Reserve a Unit linking to Properties page
import React, { useState, useEffect, useRef } from 'react';
import { useNavbarState } from '../hooks/useNavbarState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Bell, ChevronRight, Calendar, ChevronDown, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import ConsultationModal from './ConsultationModal';
import MenuLink from './MenuLink';

// --- STYLING CONSTANTS ---
const COLORS = {
  cream: '#F5F2EE',
  creamDark: '#EBE5DE',
  charcoal: '#1C1917',
  gold: '#ED9B40',
  white: '#FFFFFF',
};

// Pages where the navbar shows ONLY the logo + back button (minimal mode)
const MINIMAL_NAVBAR_ROUTES = [
  '/login',
  '/register',
  '/booking',
  '/payment',
  '/checkout',
];

// "Other Services" submenu items
const OTHER_SERVICES = [
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
  const [otherServicesOpen, setOtherServicesOpen] = useState(false);
  const [mobileOtherServicesOpen, setMobileOtherServicesOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const otherServicesRef = useRef(null);
  const notifRef = useRef(null);

  // Determine if we're on a page that should show minimal navbar
  const isMinimalRoute = MINIMAL_NAVBAR_ROUTES.some(route =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    setIsMenuOpen(false);
    setOtherServicesOpen(false);
    setNotifPanelOpen(false);

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

  // Close menu/panels on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (otherServicesOpen && otherServicesRef.current && !otherServicesRef.current.contains(event.target)) {
        setOtherServicesOpen(false);
      }
      if (notifPanelOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, menuRef, setIsMenuOpen, otherServicesOpen, notifPanelOpen]);

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
      navigate('/consultation/new');
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
      case 'message': return 'text-[#ED9B40]';
      case 'booking': return 'text-blue-400';
      default: return 'text-[#ED9B40]';
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ─── MINIMAL NAVBAR (login, register, booking, payment) ───────────────────
  if (isMinimalRoute) {
    return (
      <>
        <ConsultationModal isOpen={showConsultModal} onClose={() => setShowConsultModal(false)} />
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-0 left-0 w-full z-[100] bg-transparent py-3"
        >
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between">
              {/* Logo → home */}
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" aria-label="Go to homepage">
                  <img
                    src="/Logo2.png"
                    alt="Homes by Mwema"
                    className="w-36 h-20 object-contain drop-shadow-2xl cursor-pointer"
                  />
                </Link>
              </div>

              {/* Back button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#ED9B40] hover:text-white transition-colors duration-300 group"
              >
                <ArrowLeft
                  size={16}
                  strokeWidth={1.5}
                  className="group-hover:-translate-x-1 transition-transform duration-300"
                />
                <span className="font-sans text-[10px] uppercase tracking-[0.18em] font-medium">
                  Back
                </span>
              </button>
            </div>
          </div>
        </motion.header>
      </>
    );
  }

  // ─── FULL NAVBAR ──────────────────────────────────────────────────────────
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
                <div className="bg-[#1C1917] text-[#F5F2EE] p-5 shadow-2xl flex items-start gap-4 max-w-sm border-l-2 border-[#ED9B40]">
                  <div className={`mt-1 ${getTitleColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] uppercase tracking-[0.18em] ${getTitleColor(notification.type)} mb-1`}>
                      {notification.title}
                    </p>
                    <p className="font-serif italic text-sm text-stone-300">"{notification.message}"</p>
                    <div className="flex gap-4 mt-3">
                      <button
                        onClick={() => { setShowToast(false); navigate(notification.route); }}
                        className="text-[10px] uppercase tracking-widest border-b border-[#F5F2EE] pb-0.5 hover:text-[#ED9B40] hover:border-[#ED9B40] transition-colors"
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
      <motion.header className="absolute top-0 left-0 w-full z-[100] bg-transparent py-3 border-b border-transparent">
        <div className="max-w-[1600px] mx-auto pl-0 pr-6 lg:pl-0 lg:pr-12">
          <div className="flex items-center justify-between">

            {/* Left: Logo */}
            <div className="flex-shrink-0 flex items-center m-0 p-0">
              <Link to="/" aria-label="Go to homepage">
                <img
                  src="/Logo3.png"
                  alt="Homes by Mwema"
                  className="w-40 h-24 object-contain drop-shadow-2xl cursor-pointer"
                />
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-8">

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-8 mr-2">

                {/* 1. Reserve a Unit */}
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center bg-[#ED9B40] hover:bg-[#d48a36] transition-all duration-300 px-6 py-2"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-semibold text-[#1C1917] whitespace-nowrap">
                    Reserve a Unit
                  </span>
                </Link>

                {/* 2. Management Services */}
                <Link
                  to="/management"
                  className="inline-flex items-center justify-center relative group px-2 py-2"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 text-[#ED9B40] whitespace-nowrap">
                    Management Services
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#ED9B40] transition-all duration-500 group-hover:w-full" />
                </Link>

                {/* 3. Other Services dropdown */}
                <div className="relative" ref={otherServicesRef}>
                  <button
                    onClick={() => setOtherServicesOpen(prev => !prev)}
                    className="inline-flex items-center justify-center relative group px-2 py-2 gap-1.5"
                  >
                    <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 text-[#ED9B40] whitespace-nowrap">
                      Other Services
                    </span>
                    <ChevronDown
                      size={12}
                      strokeWidth={2}
                      className={`text-[#ED9B40] transition-transform duration-300 ${otherServicesOpen ? 'rotate-180' : ''}`}
                    />
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#ED9B40] transition-all duration-500 group-hover:w-full" />
                  </button>

                  <AnimatePresence>
                    {otherServicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="absolute left-0 top-full mt-2 w-64 bg-[#F5F2EE] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[#EBE5DE] z-50"
                      >
                        {OTHER_SERVICES.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setOtherServicesOpen(false)}
                            className="flex items-center justify-between px-6 py-4 text-[10px] uppercase tracking-[0.18em] font-medium text-[#1C1917] hover:bg-white hover:text-[#ED9B40] transition-colors duration-200 group border-b border-[#EBE5DE] last:border-0"
                          >
                            {item.label}
                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-[#ED9B40] transition-opacity" />
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Consultation */}
                <button
                  onClick={handleConsultClick}
                  className="inline-flex items-center justify-center relative group"
                >
                  <span className="font-sans text-[11px] uppercase tracking-[0.18em] font-medium text-[#ED9B40] whitespace-nowrap">
                    Consultation
                  </span>
                  <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-[#ED9B40] transition-all duration-500 group-hover:w-full" />
                </button>
              </nav>

              {/* Notification Bell with popup panel */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifPanelOpen(prev => !prev)}
                    className="relative p-2 transition-opacity hover:opacity-60 text-[#ED9B40]"
                    title={notifications.length > 0 ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}` : 'No new notifications'}
                  >
                    <Bell size={18} strokeWidth={1.5} />
                    {notifications.length > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-[#D4AF37] text-[#1C1917] text-xs font-bold rounded-full flex items-center justify-center">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    )}
                  </button>

                  {/* Notification Popup Panel */}
                  <AnimatePresence>
                    {notifPanelOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-3 w-80 bg-[#F5F2EE] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#EBE5DE] z-50 flex flex-col"
                        style={{ maxHeight: '420px' }}
                      >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE5DE] bg-white flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Bell size={13} className="text-[#ED9B40]" strokeWidth={1.5} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1C1917]">
                              Notifications
                            </span>
                          </div>
                          {notifications.length > 0 && (
                            <button
                              onClick={() => setNotifications([])}
                              className="text-[9px] uppercase tracking-widest text-stone-400 hover:text-[#ED9B40] transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                        </div>

                        {/* Scrollable Notification List */}
                        <div className="overflow-y-auto flex-1" style={{ maxHeight: '340px' }}>
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                              <Bell size={28} className="text-stone-300 mb-3" strokeWidth={1} />
                              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">
                                No new notifications
                              </p>
                            </div>
                          ) : (
                            notifications.map((notification, index) => (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 8 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 px-5 py-4 border-b border-[#EBE5DE] last:border-0 hover:bg-white transition-colors group"
                              >
                                <div className={`mt-0.5 flex-shrink-0 ${getTitleColor(notification.type)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[9px] uppercase tracking-[0.18em] font-semibold mb-1 ${getTitleColor(notification.type)}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <button
                                    onClick={() => {
                                      setNotifPanelOpen(false);
                                      navigate(notification.route);
                                    }}
                                    className="mt-2 text-[9px] uppercase tracking-widest text-[#ED9B40] border-b border-[#ED9B40]/40 pb-0.5 hover:border-[#ED9B40] transition-colors"
                                  >
                                    {notification.action}
                                  </button>
                                </div>
                                <button
                                  onClick={() => dismissNotification(notification.id)}
                                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-stone-500 mt-0.5"
                                >
                                  <X size={12} />
                                </button>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Hamburger Menu Toggle */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center transition-colors duration-300 text-[#ED9B40]"
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
                          <div className="w-10 h-10 rounded-full bg-[#1C1917] flex items-center justify-center text-[#ED9B40]">
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

                        {/* Mobile: reorganized service links */}
                        <div className="px-4 md:hidden">
                          <p className="text-[9px] uppercase tracking-widest text-stone-400 px-8 pt-2 pb-1">Navigation</p>

                          {/* Reserve a Unit */}
                          <Link
                            to="/properties"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center justify-between px-8 py-3 mb-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#1C1917] bg-[#ED9B40] hover:bg-[#d48a36] transition-colors"
                          >
                            Reserve a Unit
                            <ChevronRight size={12} />
                          </Link>

                          {/* Management Services */}
                          <Link
                            to="/management"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full text-left px-8 py-2.5 mb-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#ED9B40] hover:bg-white transition-colors block"
                          >
                            Management Services
                          </Link>

                          {/* Other Services accordion */}
                          <div>
                            <button
                              onClick={() => setMobileOtherServicesOpen(prev => !prev)}
                              className="w-full flex items-center justify-between px-8 py-2.5 mb-1 text-[10px] uppercase tracking-[0.18em] font-bold text-[#ED9B40] hover:bg-white transition-colors"
                            >
                              Other Services
                              <ChevronDown
                                size={12}
                                className={`transition-transform duration-300 ${mobileOtherServicesOpen ? 'rotate-180' : ''}`}
                              />
                            </button>
                            <AnimatePresence>
                              {mobileOtherServicesOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                  className="overflow-hidden bg-white/60"
                                >
                                  {OTHER_SERVICES.map(item => (
                                    <Link
                                      key={item.to}
                                      to={item.to}
                                      onClick={() => { setIsMenuOpen(false); setMobileOtherServicesOpen(false); }}
                                      className="block px-12 py-2.5 text-[10px] uppercase tracking-[0.18em] text-[#ED9B40]/80 hover:text-[#ED9B40] hover:bg-white transition-colors"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Consultation - Mobile */}
                          <button
                            onClick={() => { handleConsultClick(); setIsMenuOpen(false); }}
                            className="w-full text-left px-8 py-3 mb-1 uppercase text-[10px] tracking-[0.2em] font-bold text-[#ED9B40] bg-transparent hover:bg-white transition-colors"
                          >
                            Consultation
                          </button>

                          <div className="h-px bg-[#EBE5DE] mx-4 my-2" />
                        </div>

                        {/* Auth-based links */}
                        {!isAuthenticated ? (
                          <>
                            <MenuLink to="/login" label="Login" onClick={() => setIsMenuOpen(false)} />
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
                            {/* My Dashboard - replaces individual account links */}
                            <Link
                              to="/my-bookings"
                              onClick={() => setIsMenuOpen(false)}
                              className="w-full flex items-center justify-between px-8 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#1C1917] bg-[#ED9B40] hover:bg-[#d48a36] transition-colors mx-0 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <LayoutDashboard size={13} strokeWidth={2} />
                                My Dashboard
                              </div>
                              <ChevronRight size={12} />
                            </Link>

                            <div className="h-px bg-[#EBE5DE] mx-6 my-2" />

                            {/* Sign Out */}
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
                          className="text-[#ED9B40] text-[9px] uppercase tracking-[0.3em] hover:text-white transition-colors"
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

export default Navbar;