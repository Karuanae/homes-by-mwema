import React, { useState, useEffect } from 'react';
import { useNavbarState } from '../hooks/useNavbarState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Bell, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import ConsultationModal from './ConsultationModal';
import ServicesDropdown from './ServicesDropdown';
import MobileServices from './MobileServices';

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
  const { isMenuOpen, setIsMenuOpen, showServices, setShowServices, showConsultModal, setShowConsultModal, menuRef } = useNavbarState();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showToast, setShowToast] = useState(false);
  const [notifications, setNotifications] = useState([]);



  useEffect(() => {
    // synchronise with location changes (close menus)
    setIsMenuOpen(false);
    setShowServices(false);

    // consult query handling
    const params = new URLSearchParams(location.search);
    if (params.get('consult') === '1' && isAuthenticated) {
      setShowConsultModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, isAuthenticated, navigate, setIsMenuOpen, setShowServices, setShowConsultModal]);

  useEffect(() => {
    // Only fetch notifications for authenticated users who are not admins
    if (!isAuthenticated || !user) return;
    
    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const notificationsList = [];
        
        // Only admins see unread message notifications
        if (user.role === 'admin') {
          // Fetch unread messages FROM GUESTS
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
                timestamp: new Date()
              });
            }
          } catch (err) {
            console.error('Chat fetch error', err);
          }
        }
        
        // Guests see upcoming bookings
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
                timestamp: new Date()
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

  // Auto-dismiss toast notification after 5 seconds
  useEffect(() => {
    if (!showToast) return;
    
    const timer = setTimeout(() => {
      setShowToast(false);
    }, 5000); // 5 seconds
    
    return () => clearTimeout(timer);
  }, [showToast]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
      // close services dropdown if clicking outside
      if (showServices && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowServices(false);
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

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'message': return <MessageSquare size={16} />;
      case 'booking': return <Calendar size={16} />;
      case 'payment': return <Bell size={16} />;
      case 'consultation': return <Bell size={16} />;
      default: return <Bell size={16} />;
    }
  };

  // Get title color based on notification type
  const getTitleColor = (type) => {
    switch(type) {
      case 'message': return 'text-[#C1A173]';
      case 'booking': return 'text-blue-400';
      case 'payment': return 'text-green-400';
      case 'consultation': return 'text-amber-400';
      default: return 'text-[#C1A173]';
    }
  };

  return (
    <>
      <ConsultationModal isOpen={showConsultModal} onClose={() => setShowConsultModal(false)} />

      {/* --- TOAST NOTIFICATIONS (Only for authenticated regular users, not admins or guests) --- */}
      <AnimatePresence>
        {showToast && isAuthenticated && user && user.role !== 'admin' && notifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-28 right-8 z-[70]"
          >
            {notifications.map((notification, index) => (
              <div key={notification.id} className={`${index === 0 ? 'block' : 'hidden'}`}>
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
                        onClick={() => { 
                          setShowToast(false); 
                          navigate(notification.route); 
                        }} 
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
                  onClick={() => {
                    if (!isAuthenticated) {
                      const dest = `${location.pathname}${location.search ? location.search + '&' : '?'}consult=1`;
                      navigate(`/login?redirect=${encodeURIComponent(dest)}`);
                    } else {
                      setShowConsultModal(true);
                    }
                  }}
                  className="relative group py-2"
                >
                  <span className="font-sans text-[12px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 text-[#C1A173]">
                    Consultation
                  </span>
                  <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C1A173] transition-all duration-500 group-hover:w-full"></span>
                </button>

                {/* Services Dropdown */}
                <div className="relative">
                  <button
                    className="relative group py-2"
                    aria-expanded={showServices}
                    onClick={() => setShowServices(s => !s)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setShowServices(false); }}
                  >
                    <span className="font-sans text-[12px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 text-[#C1A173]">
                      Services
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#C1A173] transition-all duration-500 group-hover:w-full"></span>
                  </button>
                  <div className={`absolute left-0 mt-2 w-56 bg-white border border-[#EBE5DE] shadow-xl transition-opacity duration-300 z-50 ${showServices ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none'}`}>
                    <ServicesDropdown onClose={() => { setIsMenuOpen(false); setShowServices(false); }} />
                  </div>
                </div>
              </div>

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
                        {/* Mobile: Consultation + Services collapsible */}
                        <div className="px-4">
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                const dest = `${location.pathname}${location.search ? location.search + '&' : '?'}consult=1`;
                                navigate(`/login?redirect=${encodeURIComponent(dest)}`);
                                setIsMenuOpen(false);
                              } else {
                                setShowConsultModal(true);
                                setIsMenuOpen(false);
                              }
                            }}
                            className="w-full text-left px-8 py-3 mb-1 uppercase text-[10px] tracking-[0.2em] font-bold text-[#C1A173] bg-transparent hover:bg-white transition-colors"
                          >
                            Consultation
                          </button>

                          <div>
                            <button
                              onClick={() => setShowServices(s => !s)}
                              className="w-full text-left px-8 py-3 mb-1 uppercase text-[10px] tracking-[0.2em] font-bold text-[#C1A173] bg-transparent hover:bg-white transition-colors flex justify-between items-center"
                            >
                              <span>Services</span>
                              <span className="text-sm">{showServices ? '−' : '+'}</span>
                            </button>
                            {showServices && (
                              <div className="pl-8">
                                <MobileServices onNavigate={() => { setIsMenuOpen(false); setShowServices(false); }} />
                              </div>
                            )}
                          </div>
                        </div>
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