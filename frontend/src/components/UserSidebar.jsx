import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  LogOut, 
  Home, 
  X,
  CalendarCheck, // For consultations
  PlusCircle    // For new consultation
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const UserSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { 
      path: '/my-bookings', 
      label: 'My Bookings', 
      icon: Calendar,
      description: 'View your reservations'
    },
    { 
      path: '/my-consultations', 
      label: 'My Consultations', 
      icon: CalendarCheck,
      description: 'Track consultation requests',
      badge: null // You can add count later if needed
    },
    { 
      path: '/consultation/new', 
      label: 'New Consultation', 
      icon: PlusCircle,
      description: 'Schedule a consultation',
      highlight: true // Makes this stand out
    },
    { 
      path: '/chat', 
      label: 'Concierge Service', 
      icon: MessageSquare,
      description: 'Concierge chat'
    },
    { 
      path: '/profile', 
      label: 'Profile Settings', 
      icon: User,
      description: 'Manage your account'
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 bg-stone-900 text-white flex-col shadow-2xl flex-shrink-0`}
      >
        {/* Header */}
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-serif tracking-tighter text-white">
              MWEMA<span className="italic font-light text-stone-500">.</span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-stone-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center">
              <User size={18} className="text-stone-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white truncate">
                {user?.name || user?.email?.split('@')[0] || 'Guest'}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-stone-500">
                Member
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                  active
                    ? 'bg-white/10 text-white'
                    : item.highlight 
                      ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300' 
                      : 'text-stone-400 hover:bg-white/5 hover:text-white'
                }`}
                title={item.description}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
                {item.badge && (
                  <span className="bg-amber-500 text-stone-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-800 space-y-1">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Home size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed top-0 left-0 h-full w-64 bg-stone-900 text-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-800">
              <div className="flex items-center justify-between">
                <Link to="/" className="text-xl font-serif tracking-tighter text-white">
                  MWEMA<span className="italic font-light text-stone-500">.</span>
                </Link>
                <button
                  onClick={onClose}
                  className="p-1 text-stone-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center">
                  <User size={18} className="text-stone-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Guest'}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500">
                    Member
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      active
                        ? 'bg-white/10 text-white'
                        : item.highlight 
                          ? 'text-amber-400 hover:bg-amber-500/10 hover:text-amber-300' 
                          : 'text-stone-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-stone-800 space-y-1">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-stone-400 hover:bg-white/5 hover:text-white transition-all"
              >
                <Home size={18} strokeWidth={1.5} />
                <span className="text-sm font-medium">Back to Home</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
              >
                <LogOut size={18} strokeWidth={1.5} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserSidebar;