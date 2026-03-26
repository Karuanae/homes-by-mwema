import React, { useState, Suspense, lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Calendar,
  User,
  LogOut,
  Home,
  X,
  Heart,
  CalendarCheck,
  PlusCircle,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

// Lazy-load each tab's content
const MyBookings = lazy(() => import("./MyBookings"));
const SavedProperties = lazy(() => import("./SavedProperties"));
const MyConsultations = lazy(() => import("./MyConsultations"));
const NewConsultation = lazy(() => import("./NewConsultation"));
const Chat = lazy(() => import("./Chat"));
const ProfileSettings = lazy(() => import("./ProfileSettings"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-[#093A3E] animate-spin" />
      <p className="text-xs uppercase tracking-widest text-stone-400">Loading</p>
    </div>
  </div>
);

const navItems = [
  { id: "bookings",        label: "My Bookings",      shortLabel: "Bookings",        icon: Calendar },
  { id: "saved",           label: "Saved Properties",  shortLabel: "Saved",           icon: Heart },
  { id: "consultations",   label: "My Consultations",  shortLabel: "Consultations",   icon: CalendarCheck },
  { id: "new-consultation", label: "New Consultation", shortLabel: "New Consultation", icon: PlusCircle },
  { id: "chat",            label: "Chat", shortLabel: "Chat",       icon: MessageSquare },
  { id: "profile",         label: "Profile Settings",  shortLabel: "Profile",         icon: User },
];

export default function UserDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const activeTab = searchParams.get("tab") || "bookings";
  const setActiveTab = (tab) => setSearchParams({ tab });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  // ── Mobile Menu ─────────────────────────────────────────────────────────────
  const MobileMenu = () => (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-[#093A3E] text-white z-50 flex flex-col lg:hidden"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-serif tracking-wider text-white">
                  MWEMA<span className="text-[#ED9B40]">.</span>
                </h1>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-2">
                Member Account
              </p>
            </div>

            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ED9B40] flex items-center justify-center text-sm text-[#093A3E] font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate">
                    {user?.name || user?.email?.split("@")[0] || "Guest"}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-white/40">
                    Member
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 relative ${
                      activeTab === item.id
                        ? "bg-white/10 text-white border-r-2 border-[#ED9B40]"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className={activeTab === item.id ? "scale-110 text-[#ED9B40]" : ""}
                    />
                    <span
                      className={`font-serif text-sm tracking-wide ${
                        activeTab === item.id ? "font-medium" : "font-light"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ED9B40] flex items-center justify-center text-xs text-[#093A3E] font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
                <span className="text-xs text-white/80">
                  {user?.name || user?.email?.split("@")[0] || "Guest"}
                </span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
                className="w-full flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase tracking-widest text-[10px] py-1.5"
              >
                <Home size={12} strokeWidth={1.5} /> Back to Home
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-white/40 hover:text-red-300 transition-colors uppercase tracking-widest text-[10px] py-1.5"
              >
                <LogOut size={12} strokeWidth={1.5} /> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // ── Tab content renderer ────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "bookings":
        return <MyBookings />;
      case "saved":
        return <SavedProperties />;
      case "consultations":
        return <MyConsultations />;
      case "new-consultation":
        return <NewConsultation />;
      case "chat":
        return <Chat />;
      case "profile":
        return <ProfileSettings />;
      default:
        return <MyBookings />;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 bg-[#093A3E] text-white p-3 rounded-lg shadow-lg"
      >
        <Menu size={20} />
      </button>

      <MobileMenu />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex lg:w-72 bg-[#093A3E] text-white flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-10 border-b border-white/10">
          <h1 className="text-2xl font-serif tracking-wider text-white">
            MWEMA<span className="text-[#ED9B40]">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-2">
            Member Account
          </p>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group relative ${
                  activeTab === item.id
                    ? "bg-white/10 text-white border-r-2 border-[#ED9B40]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className={`${
                    activeTab === item.id
                      ? "scale-110 text-[#ED9B40]"
                      : "group-hover:text-white"
                  }`}
                />
                <span
                  className={`font-serif tracking-wide ${
                    activeTab === item.id ? "font-medium" : "font-light"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ED9B40] flex items-center justify-center text-sm text-[#093A3E] font-bold">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <span className="text-sm text-white/80">
              {user?.name || user?.email?.split("@")[0] || "Guest"}
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 text-white/40 hover:text-white transition-colors uppercase tracking-widest text-xs py-2"
          >
            <Home size={14} strokeWidth={1.5} /> Back to Home
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-white/40 hover:text-red-300 transition-colors uppercase tracking-widest text-xs py-2"
          >
            <LogOut size={14} strokeWidth={1.5} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative pt-16 lg:pt-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 border-b border-stone-200 pb-4 md:pb-6">
          <div className="ml-12 lg:ml-0">
            <h2 className="text-2xl md:text-4xl font-serif text-[#1C2321] mb-2">
              {navItems.find((i) => i.id === activeTab)?.label}
            </h2>
            <p className="text-stone-500 font-serif italic text-sm md:text-base">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0 ml-12 lg:ml-0">
            <div className="w-10 h-10 rounded-full bg-[#093A3E] text-[#ED9B40] flex items-center justify-center font-serif text-lg">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* Mobile secondary nav */}
        <div className="lg:hidden mb-6 -mx-4 px-4 pb-4 border-b border-stone-200 overflow-x-auto">
          <div className="flex gap-2 min-w-min">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded text-xs whitespace-nowrap transition-all relative ${
                  activeTab === item.id
                    ? "bg-[#093A3E] text-white"
                    : "bg-stone-100 text-stone-600 border border-stone-200"
                }`}
              >
                {item.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Suspense fallback={<TabLoader />}>
            {renderContent()}
          </Suspense>
        </motion.div>
      </main>
    </div>
  );
}
