import React, { useState, useEffect, useRef } from 'react';
import { useNavbarState } from '../hooks/useNavbarState';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, MessageSquare, Bell, ChevronRight, Calendar, ChevronDown, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import MenuLink from './MenuLink';

const MINIMAL_NAVBAR_ROUTES = [
  '/booking',
  '/payment',
  '/checkout',
];

const OTHER_SERVICES = [
  { label: 'Photography & Videography', to: '/photography-videography' },
  { label: 'Listing Optimization', to: '/listing-optimization' },
  { label: 'Social Media Marketing', to: '/social-media-marketing' },
  { label: 'Interior Design Setup', to: '/interior-design' },
  { label: 'Car Hire Services', to: '/car-hire' },
  { label: 'Fully Furnished Units', to: '/fully-furnished-units' },
  { label: 'Safari Tours', to: '/safari-tours' },
  { label: 'Airport & SGR Transfers', to: '/airport-transfers' },
  { label: 'Chef Services', to: '/chef-services' },
];

const ScrollSpy = ({ onScroll }) => {
  useEffect(() => {
    const handleScroll = () => {
      onScroll(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onScroll]);
  
  return null;
};

const Navbar = () => {
  const { isMenuOpen, setIsMenuOpen, menuRef } = useNavbarState();
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [scrollY, setScrollY] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [otherServicesOpen, setOtherServicesOpen] = useState(false);
  const [mobileOtherServicesOpen, setMobileOtherServicesOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const otherServicesRef = useRef(null);
  const notifRef = useRef(null);

  const isHomePage = location.pathname === '/';

  const isMinimalRoute = MINIMAL_NAVBAR_ROUTES.some(route =>
    location.pathname.startsWith(route)
  );

  const isAtTop = isHomePage ? scrollY < 50 : false;

  const isActiveRoute = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setOtherServicesOpen(false);
    setNotifPanelOpen(false);
  }, [location, setIsMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let isMounted = true;
    const fetchNotifications = async () => {
      try {
        const notificationsList = [];

        if (user.role === 'admin') {
          try {
            const notifRes = await api.settings.getAdminNotifications();
            const dbNotifications = notifRes.data || [];
            
            dbNotifications.forEach(notification => {
              let route = '/admin?tab=dashboard';
              let action = 'View Details';
              
              if (notification.type === 'chat') {
                route = '/admin?tab=messages';
                action = 'View Messages';
              } else if (notification.type === 'consultation') {
                route = '/admin?tab=consultations';
                action = 'View Consultation';
              } else if (notification.type === 'booking') {
                route = '/admin?tab=bookings';
                action = 'View Booking';
              }
              
              notificationsList.push({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                icon: notification.type === 'chat' ? 'message' : notification.type === 'consultation' ? 'calendar' : 'bell',
                action: action,
                route: route,
                timestamp: new Date(notification.created_at),
                isRead: notification.is_read
              });
            });

            const chatRes = await api.chats.getUnreadCount();
            const unreadCount = chatRes.data?.unread_count ?? chatRes.data?.count ?? chatRes.data?.unread ?? 0;
            if (unreadCount > 0) {
              notificationsList.push({
                id: 'chat-legacy-' + Date.now(),
                type: 'message',
                title: 'New Guest Messages',
                message: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''} from guests.`,
                icon: 'message',
                action: 'View Messages',
                route: '/admin?tab=messages',
                timestamp: new Date(),
              });
            }
          } catch (err) {
            console.error('Admin notification fetch error', err);
          }
        }

        if (user.role !== 'admin') {
          try {
            const notifRes = await api.settings.getNotifications();
            const dbNotifications = notifRes.data || [];
            
            dbNotifications.forEach(notification => {
              let route = '/dashboard?tab=bookings';
              let action = 'View Details';
              
              if (notification.type === 'booking') {
                route = notification.related_id
                  ? `/dashboard?tab=bookings&booking=${notification.related_id}`
                  : '/dashboard?tab=bookings';
                action = 'View Booking';
              }
              
              notificationsList.push({
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                icon: notification.type === 'booking' ? 'calendar' : 'bell',
                action: action,
                route: route,
                timestamp: new Date(notification.created_at),
                isRead: notification.is_read
              });
            });
          } catch (err) {
            console.error('User notification fetch error', err);
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

    // Listen for custom real-time status change events
    window.addEventListener("bookingStatusChanged", fetchNotifications);

    return () => {
      isMounted = false;
      window.removeEventListener("bookingStatusChanged", fetchNotifications);
    };
  }, [isAuthenticated, user, location]);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 5000);
    return () => clearTimeout(timer);
  }, [showToast]);

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
      localStorage.setItem('consultationIntent', 'true');
      navigate('/login?redirect=/dashboard?tab=consultations');
    } else {
      navigate('/dashboard?tab=consultations');
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

  const dismissNotification = async (id) => {
    if (typeof id === 'number' || (typeof id === 'string' && !isNaN(id))) {
      try {
        if (user?.role === 'admin') {
          await api.settings.markAdminNotificationRead(id);
        } else {
          await api.settings.markNotificationRead(id);
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const openNotification = async (notification) => {
    setNotifPanelOpen(false);
    setShowToast(false);
    if (typeof notification.id === 'number') {
      try {
        if (user?.role === 'admin') {
          await api.settings.markAdminNotificationRead(notification.id);
        } else {
          await api.settings.markNotificationRead(notification.id);
        }
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    navigate(notification.route);
  };

  if (isMinimalRoute) {
    return (
      <>
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed top-0 left-0 w-full z-[100] bg-[#093A3E] py-2 shadow-md"
        >
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" aria-label="Go to homepage">
                  <img
                    src="/Logo3.png"
                    alt="Homes by Mwema"
                    className="w-32 h-20 object-contain drop-shadow-2xl cursor-pointer"
                  />
                </Link>
              </div>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#ED9B40] hover:text-white transition-colors duration-300 group"
              >
                <ArrowLeft
                  size={14}
                  strokeWidth={1.5}
                  className="group-hover:-translate-x-1 transition-transform duration-300"
                />
                <span className="font-sans text-[9px] uppercase tracking-[0.18em] font-medium">
                  Back
                </span>
              </button>
            </div>
          </div>
        </motion.header>
        <ScrollSpy onScroll={setScrollY} />
      </>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showToast && isAuthenticated && notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 right-8 z-[70]"
          >
            {notifications.map((notification, index) => (
              <div key={notification.id} className={index === 0 ? 'block' : 'hidden'}>
                <div className="bg-[#093A3E] text-[#F5F2EE] p-4 shadow-2xl flex items-start gap-4 max-w-sm border-l-2 border-[#ED9B40]">
                  <div className={`mt-1 ${getTitleColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[9px] uppercase tracking-[0.18em] ${getTitleColor(notification.type)} mb-1`}>
                      {notification.title}
                    </p>
                    <p className="font-serif italic text-xs text-stone-300">"{notification.message}"</p>
                    <div className="flex gap-4 mt-2">
                      <button
                        onClick={() => openNotification(notification)}
                        className="text-[9px] uppercase tracking-widest border-b border-[#F5F2EE] pb-0.5 hover:text-[#ED9B40] hover:border-[#ED9B40] transition-colors"
                      >
                        {notification.action}
                      </button>
                      <button
                        onClick={() => setShowToast(false)}
                        className="text-[9px] uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
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

      <motion.header 
        className="fixed top-0 left-0 w-full z-[100] py-0.5 transition-all duration-300"
        animate={{
          backgroundColor: isHomePage 
            ? (isAtTop ? 'rgba(9, 58, 62, 0)' : '#093A3E')
            : '#093A3E',
          boxShadow: (isHomePage && isAtTop) || (!isHomePage) 
            ? 'none' 
            : '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-[1600px] mx-auto pl-0 pr-6 lg:pl-0 lg:pr-12">
          <div className="flex items-center justify-between">

            <div className="flex-shrink-0 flex items-center m-0 p-0">
              <Link to="/" aria-label="Go to homepage">
                <img
                  src="/Logo3.png"
                  alt="Homes by Mwema"
                  className="w-32 h-20 object-contain drop-shadow-2xl cursor-pointer transition-all duration-300"
                  style={{ 
                    opacity: isHomePage && isAtTop ? 0.9 : 1,
                    filter: isHomePage && isAtTop ? 'brightness(1.1)' : 'none'
                  }}
                />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4 mr-1">
                <Link
                  to="/properties"
                  className="inline-flex items-center justify-center relative group px-4 py-1.5"
                  style={{
                    backgroundColor: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'rgba(237, 155, 64, 0.9)' : '#ED9B40',
                    backdropFilter: (isHomePage && isAtTop) ? 'blur(8px)' : 'none',
                  }}
                >
                  <span className="font-sans text-[10px] uppercase tracking-[0.18em] font-semibold text-[#093A3E] whitespace-nowrap">
                    Reserve a Unit
                  </span>
                </Link>

                <Link
                  to="/host"
                  className="inline-flex items-center justify-center relative group px-1.5 py-1.5"
                >
                  <span 
                    className="font-sans text-[10px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 whitespace-nowrap"
                    style={{
                      color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40',
                      textShadow: (isHomePage && isAtTop) ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Host
                  </span>
                  <span 
                    className={`absolute bottom-0 left-0 h-[1px] transition-all duration-500 ${
                      isActiveRoute('/host') ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                    style={{
                      backgroundColor: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                    }}
                  />
                </Link>

                <Link
                  to="/management"
                  className="inline-flex items-center justify-center relative group px-1.5 py-1.5"
                >
                  <span 
                    className="font-sans text-[10px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 whitespace-nowrap"
                    style={{
                      color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40',
                      textShadow: (isHomePage && isAtTop) ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Management Services
                  </span>
                  <span 
                    className={`absolute bottom-0 left-0 h-[1px] transition-all duration-500 ${
                      isActiveRoute('/management') ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                    style={{
                      backgroundColor: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                    }}
                  />
                </Link>

                <div className="relative" ref={otherServicesRef}>
                  <button
                    onClick={() => setOtherServicesOpen(prev => !prev)}
                    className="inline-flex items-center justify-center relative group px-1.5 py-1.5 gap-1"
                  >
                    <span 
                      className="font-sans text-[10px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 whitespace-nowrap"
                      style={{
                        color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40',
                        textShadow: (isHomePage && isAtTop) ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                      }}
                    >
                      Other Services
                    </span>
                    <ChevronDown
                      size={10}
                      strokeWidth={2}
                      style={{
                        color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                      }}
                      className={`transition-transform duration-300 ${otherServicesOpen ? 'rotate-180' : ''}`}
                    />
                    <span 
                      className={`absolute bottom-0 left-0 h-[1px] transition-all duration-500 w-0 group-hover:w-full`}
                      style={{
                        backgroundColor: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                      }}
                    />
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
                        <div className="max-h-96 overflow-y-auto">
                          {OTHER_SERVICES.map((item) => (
                            <Link
                              key={item.to}
                              to={item.to}
                              onClick={() => setOtherServicesOpen(false)}
                              className="flex items-center justify-between px-4 py-3 text-[9px] uppercase tracking-[0.18em] font-medium text-[#093A3E] hover:bg-white hover:text-[#ED9B40] transition-colors duration-200 group border-b border-[#EBE5DE] last:border-0"
                            >
                              {item.label}
                              <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 text-[#ED9B40] transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleConsultClick}
                  className="inline-flex items-center justify-center relative group px-1.5 py-1.5"
                >
                  <span 
                    className="font-sans text-[10px] uppercase tracking-[0.18em] font-medium transition-colors duration-300 whitespace-nowrap"
                    style={{
                      color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40',
                      textShadow: (isHomePage && isAtTop) ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    Schedule Consultation
                  </span>
                  <span 
                    className={`absolute bottom-0 left-0 h-[1px] transition-all duration-500 ${
                      isActiveRoute('/my-consultations') || isActiveRoute('/consultation/new') ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                    style={{
                      backgroundColor: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                    }}
                  />
                </button>
              </nav>

              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifPanelOpen(prev => !prev)}
                    className="relative p-1.5 transition-opacity hover:opacity-60"
                    style={{
                      color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                    }}
                    title={notifications.length > 0 ? `${notifications.length} notification${notifications.length > 1 ? 's' : ''}` : 'No new notifications'}
                  >
                    <Bell size={16} strokeWidth={1.5} />
                    {notifications.filter(n => !n.isRead).length > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-[#ED9B40] text-[#093A3E] text-[9px] font-bold rounded-full flex items-center justify-center">
                        {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
                      </span>
                    )}
                  </button>

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
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EBE5DE] bg-white flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Bell size={13} className="text-[#ED9B40]" strokeWidth={1.5} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#093A3E]">
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
                                    onClick={() => openNotification(notification)}
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

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center transition-colors duration-300"
                  style={{
                    color: !isHomePage ? '#ED9B40' : (isHomePage && isAtTop) ? 'white' : '#ED9B40'
                  }}
                >
                  <div className={`p-1.5 border rounded-full transition-all duration-300 ${
                    isMenuOpen 
                      ? !isHomePage 
                        ? 'border-[#ED9B40] rotate-90' 
                        : (isHomePage && isAtTop) ? 'border-white rotate-90' : 'border-[#ED9B40] rotate-90'
                      : 'border-transparent hover:border-white/50'
                  }`}>
                    {isMenuOpen ? <X size={16} strokeWidth={1} /> : <Menu size={16} strokeWidth={1} />}
                  </div>
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="absolute right-0 top-14 mt-2 w-72 bg-[#F5F2EE] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-[#EBE5DE] z-50 flex flex-col"
                    >
                      <div className="p-6 border-b border-[#EBE5DE] bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#093A3E] flex items-center justify-center text-[#ED9B40]">
                            <User size={14} strokeWidth={1.5} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[8px] uppercase tracking-widest text-stone-400 mb-0.5">Signed in as</p>
                            <h4 className="font-serif text-base text-[#093A3E] truncate leading-none">
                              {isAuthenticated && user ? user.name || user.email.split('@')[0] : 'Guest'}
                            </h4>
                          </div>
                        </div>
                      </div>

                      <div className="py-3">
                        <div className="px-4 md:hidden">
                          <p className="text-[8px] uppercase tracking-widest text-stone-400 px-6 pt-1 pb-0.5">Navigation</p>

                          <Link
                            to="/properties"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full flex items-center justify-between px-6 py-2 mb-1 text-[9px] uppercase tracking-[0.18em] font-bold text-white bg-[#093A3E] hover:bg-[#062a2d] transition-colors"
                          >
                            Reserve a Unit
                            <ChevronRight size={10} />
                          </Link>

                          <Link
                            to="/host"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full text-left px-6 py-2 mb-1 text-[9px] uppercase tracking-[0.18em] font-bold text-[#ED9B40] hover:bg-white transition-colors block"
                          >
                            Host
                          </Link>

                          <Link
                            to="/management"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full text-left px-6 py-2 mb-1 text-[9px] uppercase tracking-[0.18em] font-bold text-[#093A3E] hover:bg-white transition-colors block"
                          >
                            Management Services
                          </Link>

                          <div>
                            <button
                              onClick={() => setMobileOtherServicesOpen(prev => !prev)}
                              className="w-full flex items-center justify-between px-6 py-2 mb-1 text-[9px] uppercase tracking-[0.18em] font-bold text-[#093A3E] hover:bg-white transition-colors"
                            >
                              Other Services
                              <ChevronDown
                                size={10}
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
                                      className="block px-10 py-2 text-[9px] uppercase tracking-[0.18em] text-[#093A3E]/80 hover:text-[#093A3E] hover:bg-white transition-colors"
                                    >
                                      {item.label}
                                    </Link>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button
                            onClick={() => { handleConsultClick(); setIsMenuOpen(false); }}
                            className="w-full text-left px-6 py-2 mb-1 uppercase text-[9px] tracking-[0.2em] font-bold text-[#093A3E] hover:bg-white transition-colors"
                          >
                            Schedule Consultation
                          </button>

                          <div className="h-px bg-[#EBE5DE] mx-4 my-1.5" />
                        </div>

                        {!isAuthenticated ? (
                          <>
                            <MenuLink to="/login" label="Login" onClick={() => setIsMenuOpen(false)} />
                            <MenuLink to="/register" label="Register" onClick={() => setIsMenuOpen(false)} />
                          </>
                        ) : user?.role === 'admin' ? (
                          <>
                            <MenuLink to="/admin" label="Administration" highlight onClick={() => setIsMenuOpen(false)} />
                            <div className="h-px bg-[#EBE5DE] mx-4 my-1.5" />
                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-6 py-2 text-[9px] uppercase tracking-[0.2em] font-bold text-red-900/60 hover:text-red-900 hover:bg-red-50/50 transition-colors flex items-center justify-between group"
                            >
                              Sign Out
                              <LogOut size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setIsMenuOpen(false)}
                              className="w-full flex items-center justify-between px-6 py-2 text-[9px] uppercase tracking-[0.18em] font-bold text-white bg-[#093A3E] hover:bg-[#062a2d] transition-colors mx-0 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <LayoutDashboard size={12} strokeWidth={2} />
                                My Dashboard
                              </div>
                              <ChevronRight size={10} />
                            </Link>

                            <div className="h-px bg-[#EBE5DE] mx-4 my-1.5" />

                            <button
                              onClick={handleLogout}
                              className="w-full text-left px-6 py-2 text-[9px] uppercase tracking-[0.2em] font-bold text-red-900/60 hover:text-red-900 hover:bg-red-50/50 transition-colors flex items-center justify-between group"
                            >
                              Sign Out
                              <LogOut size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="bg-[#093A3E] p-3 text-center">
                        <Link
                          to="/properties"
                          onClick={() => setIsMenuOpen(false)}
                          className="text-[#ED9B40] text-[8px] uppercase tracking-[0.3em] hover:text-white transition-colors"
                        >
                          View Properties
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

      {isHomePage && <ScrollSpy onScroll={setScrollY} />}
    </>
  );
};

export default Navbar;