import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt, FaStar, FaDownload, FaWhatsapp, 
  FaPhone, FaQuestionCircle, FaBed, FaSearch, 
  FaFilter, FaChevronRight, FaCrown, FaCalendarAlt, FaHistory, FaMoneyBillWave, FaExclamationTriangle
} from "react-icons/fa";
import api, { IMAGE_BASE_URL } from "../services/api";

export default function MyBookings() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("current");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.bookings.getUserBookings();
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    fetchBookings();
  }, [location]);

  /* --- LUXE HELPERS --- */
  const getStatusStyle = (status) => {
    const styles = {
      upcoming: "bg-stone-900 text-[#f5f2ee]",
      active: "bg-stone-900 text-[#f5f2ee]",
      completed: "bg-stone-100 text-stone-500",
      cancelled: "bg-red-50 text-red-700"
    };
    return styles[status] || styles.upcoming;
  };

  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || "0"}`;

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "current" && !["upcoming", "active"].includes(booking.status)) return false;
    if (activeTab === "history" && !["completed", "cancelled"].includes(booking.status)) return false;
    if (searchTerm && !booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== "all" && booking.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    upcoming: bookings.filter(b => b.status === "upcoming").length,
    completed: bookings.filter(b => b.status === "completed").length,
    spent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    pending: bookings.reduce((sum, b) => sum + (b.pendingAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">Curating Itinerary</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] text-stone-900 pb-20 pt-8">
      
      {/* 1. HERO SECTION - Minimal & Elegant */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-stone-200 pb-12 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-8 bg-stone-900"></span>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-500">Guest Portfolio</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic mb-6">Your Journeys</h1>
            <p className="text-stone-500 font-light text-lg leading-relaxed">
              Welcome back, {user?.name || "Guest"}. A collection of your past, present, and future stays with our elite properties.
            </p>
          </div>

          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-100 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center">
              <FaCrown className="text-[#f5f2ee]" size={18} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Status</p>
              <p className="font-serif italic text-xl">Elite Member</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Subtle Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: "Upcoming", value: stats.upcoming, icon: FaCalendarAlt },
            { label: "Completed", value: stats.completed, icon: FaHistory },
            { label: "Invested", value: formatCurrency(stats.spent), icon: FaMoneyBillWave },
            { label: "Dues", value: formatCurrency(stats.pending), icon: FaExclamationTriangle, alert: stats.pending > 0 }
          ].map((stat, i) => (
            <div key={i} className="bg-white/50 border border-stone-200 p-6 rounded-sm">
              <div className="flex items-center gap-2 text-stone-400 mb-2">
                <stat.icon size={10} />
                <span className="text-[9px] uppercase tracking-widest font-bold">{stat.label}</span>
              </div>
              <p className={`text-xl font-serif ${stat.alert ? 'text-amber-700' : 'text-stone-900'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        
        {/* 2. TABS & FILTER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="flex gap-10 border-b border-stone-200 w-full md:w-auto">
            {["current", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all relative ${
                  activeTab === tab ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab === "current" ? "Upcoming Stays" : "Past History"}
                {activeTab === tab && (
                  <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-[2px] bg-stone-900" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={12} />
              <input 
                type="text"
                placeholder="Find property..."
                className="w-full bg-white border border-stone-200 rounded-sm py-3 pl-10 pr-4 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none placeholder:italic"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 border border-stone-200 bg-white hover:bg-stone-50 transition-all text-[10px] uppercase tracking-widest font-bold flex items-center gap-2"
            >
              <FaFilter size={10} /> Filter
            </button>
          </div>
        </div>

        {/* 3. BOOKINGS CARDS */}
        <div className="space-y-16">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-32 border border-dashed border-stone-300">
              <h3 className="font-serif text-2xl italic text-stone-400">Your itinerary is currently empty</h3>
              <Link to="/properties" className="mt-6 inline-block text-[10px] uppercase tracking-[0.3em] font-bold underline underline-offset-8">Discover Collections</Link>
            </div>
          ) : (
            filteredBookings.map((booking, idx) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-12 gap-0 md:gap-12 group"
              >
                {/* Visual Side */}
                <div className="col-span-12 md:col-span-5 mb-6 md:mb-0">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={booking.propertyImage && !booking.propertyImage.startsWith('http') ? `${IMAGE_BASE_URL}${booking.propertyImage}` : booking.propertyImage} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" alt="" />
                    <div className={`absolute top-6 left-6 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold shadow-2xl ${getStatusStyle(booking.status)}`}>
                      {booking.status}
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="col-span-12 md:col-span-7 flex flex-col justify-center border-b border-stone-100 pb-12">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Ref: #{String(booking.id).padStart(6, '0')}</p>
                    <div className="flex text-amber-500 gap-1"><FaStar size={10} /><FaStar size={10} /><FaStar size={10} /></div>
                  </div>

                  <h3 className="text-4xl md:text-5xl font-serif text-stone-900 mb-2 leading-tight">
                    {booking.propertyName}
                  </h3>
                  <div className="flex items-center gap-2 text-stone-500 mb-8 italic font-light">
                    <FaMapMarkerAlt size={12} className="text-stone-900" />
                    {booking.propertyLocation}
                  </div>

                  {/* Stay Details Grid */}
                  <div className="grid grid-cols-2 gap-y-8 gap-x-12 mb-10">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Check In</p>
                      <p className="text-stone-800 font-medium">{new Date(booking.checkIn).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Total Investment</p>
                      <p className="text-stone-800 font-medium">{formatCurrency(booking.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Guests</p>
                      <p className="text-stone-800 font-medium">{booking.guests.adults} Adults, {booking.guests.children || 0} Children</p>
                    </div>
                    {booking.pendingAmount > 0 && (
                      <div className="bg-amber-50 p-3 border-l-2 border-amber-500">
                        <p className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1">Balance Due</p>
                        <p className="text-amber-800 font-serif">{formatCurrency(booking.pendingAmount)}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions - Luxury Styled */}
                  <div className="flex flex-wrap gap-4 mt-auto">
                    <button className="bg-stone-900 text-[#f5f2ee] px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-800 transition-all flex items-center gap-3">
                      Manage Booking <FaChevronRight size={10} />
                    </button>
                    <button className="border border-stone-200 px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white transition-all flex items-center gap-3">
                      <FaDownload size={12} /> Invoice
                    </button>
                    <button className="px-4 py-4 text-stone-400 hover:text-stone-900 transition-all">
                      <FaWhatsapp size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 4. CONCIERGE FOOTER */}
      <div className="max-w-7xl mx-auto px-6 mt-32">
        <div className="bg-stone-900 text-[#f5f2ee] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-32" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="max-w-md text-center md:text-left">
              <h4 className="font-serif text-3xl md:text-4xl mb-4">Dedicated Assistance</h4>
              <p className="text-stone-400 font-light text-sm leading-relaxed">
                Our private concierge is available 24/7 to adjust your itinerary, arrange transport, or fulfill special requests.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              <button className="bg-[#f5f2ee] text-stone-900 px-10 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white transition-all flex items-center justify-center gap-3">
                <FaPhone size={12} /> Call Concierge
              </button>
              <button className="border border-stone-700 px-10 py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-3">
                <FaQuestionCircle size={12} /> FAQ Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}