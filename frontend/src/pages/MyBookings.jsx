// pages/MyBookings.jsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome, FaCalendarAlt, FaMapMarkerAlt, FaUserFriends, FaBed, FaBath,
  FaStar, FaCheckCircle, FaClock, FaHistory, FaWhatsapp, FaDownload,
  FaPrint, FaShareAlt, FaTrash, FaChevronRight, FaInfoCircle,
  FaCreditCard, FaMobileAlt, FaExclamationTriangle, FaCheck, FaPhone,
  FaShieldAlt, FaSync, FaFilter, FaSearch, FaSort, FaMoneyBillWave,
  FaReceipt, FaQuestionCircle, FaCog, FaCrown
} from "react-icons/fa";import api from "../services/api";
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
  const [filterPayment, setFilterPayment] = useState("all");
  const [showNewBookingNotification, setShowNewBookingNotification] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.bookings.getUserBookings();
        setBookings(response.data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);

    if (location.state?.newBooking) {
      setShowNewBookingNotification(true);
      setTimeout(() => setShowNewBookingNotification(false), 5000);
    }

    fetchBookings();
  }, [location]);



  /* --- HELPERS --- */
  const getStatusBadge = (status) => {
    const styles = {
      upcoming: "bg-teal-900 text-white border-teal-800",
      active: "bg-emerald-600 text-white border-emerald-500",
      completed: "bg-stone-200 text-stone-600 border-stone-300",
      cancelled: "bg-red-50 text-red-600 border-red-200"
    };
    return styles[status] || styles.upcoming;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || "0"}`;

  const calculateDaysUntil = (dateStr) => {
    const today = new Date();
    const target = new Date(dateStr);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  // Filter Logic
  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "current" && !["upcoming", "active"].includes(booking.status)) return false;
    if (activeTab === "history" && !["completed", "cancelled"].includes(booking.status)) return false;
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      if (!booking.propertyName.toLowerCase().includes(lower) && !booking.propertyLocation.toLowerCase().includes(lower)) return false;
    }
    if (filterStatus !== "all" && booking.status !== filterStatus) return false;
    if (filterPayment !== "all" && booking.paymentType !== filterPayment) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "date-asc") return new Date(a.checkIn) - new Date(b.checkIn);
    if (sortBy === "date-desc") return new Date(b.checkIn) - new Date(a.checkIn);
    return 0;
  });

  const stats = {
    upcoming: bookings.filter(b => b.status === "upcoming").length,
    completed: bookings.filter(b => b.status === "completed").length,
    spent: bookings.reduce((sum, b) => sum + b.amount, 0),
    pending: bookings.reduce((sum, b) => sum + b.pendingAmount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900 mb-4"></div>
          <p className="text-teal-900 font-serif tracking-widest text-sm uppercase">Loading Itinerary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-700 pb-20">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-teal-950 text-white pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-900 rounded-full blur-[100px] opacity-30 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <p className="text-amber-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Concierge</p>
              <h1 className="text-4xl md:text-5xl font-serif mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Itinerary
              </h1>
              <p className="text-teal-200/80 font-light">
                Welcome back, {user?.name || "Guest"}. You have {stats.upcoming} upcoming stays.
              </p>
            </div>
            
            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-xs text-teal-300 uppercase tracking-widest">Membership Status</p>
                  <div className="flex items-center justify-end gap-2 text-white">
                    <FaCrown className="text-amber-400" />
                    <span className="font-serif italic">Elite Member</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
             {[
               { label: "Upcoming Stays", value: stats.upcoming, icon: FaCalendarAlt },
               { label: "Past Journeys", value: stats.completed, icon: FaHistory },
               { label: "Total Invested", value: formatCurrency(stats.spent), icon: FaMoneyBillWave },
               { label: "Pending Dues", value: formatCurrency(stats.pending), icon: FaExclamationTriangle, alert: stats.pending > 0 }
             ].map((stat, i) => (
               <div key={i} className={`bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-sm ${stat.alert ? 'border-amber-500/50 bg-amber-900/20' : ''}`}>
                  <div className="flex items-center gap-3 text-teal-200 mb-1">
                    <stat.icon className="text-xs" />
                    <span className="text-[10px] uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <p className="text-xl md:text-2xl font-serif text-white">{stat.value}</p>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        
        {/* 2. CONTROLS & TABS */}
        <div className="bg-white rounded-lg shadow-xl shadow-stone-200/50 border border-stone-100 p-2 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
           
           {/* Tabs */}
           <div className="flex bg-stone-100 p-1 rounded-md w-full md:w-auto">
              <button 
                onClick={() => setActiveTab("current")}
                className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-sm transition-all ${activeTab === "current" ? "bg-white text-teal-950 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                Current & Upcoming
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex-1 md:flex-none px-6 py-2 text-sm font-medium rounded-sm transition-all ${activeTab === "history" ? "bg-white text-teal-950 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
              >
                Past History
              </button>
           </div>

           {/* Filters */}
           <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-grow">
                <FaSearch className="absolute left-3 top-3 text-stone-400 text-xs" />
                <input 
                  type="text" 
                  placeholder="Search properties..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-sm text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 border border-stone-200 rounded-sm text-sm flex items-center gap-2 hover:bg-stone-50 ${showFilters ? 'bg-teal-50 border-teal-200 text-teal-800' : 'text-stone-600'}`}
              >
                <FaFilter className="text-xs" /> 
                <span className="hidden sm:inline">Filters</span>
              </button>
           </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-lg border border-stone-100 shadow-sm">
                 <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="p-2 border border-stone-200 rounded-sm text-sm bg-stone-50">
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="price-desc">Highest Price</option>
                 </select>
                 <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border border-stone-200 rounded-sm text-sm bg-stone-50">
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                 </select>
                 <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="p-2 border border-stone-200 rounded-sm text-sm bg-stone-50">
                    <option value="all">All Payments</option>
                    <option value="full">Fully Paid</option>
                    <option value="partial">Partial</option>
                 </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. BOOKINGS LIST */}
        <div className="space-y-8">
          {filteredBookings.length === 0 ? (
             <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-lg">
                <FaBed className="text-4xl text-stone-200 mx-auto mb-4" />
                <h3 className="text-xl font-serif text-teal-950 mb-2">No itineraries found</h3>
                <p className="text-stone-500 mb-6">You have no bookings matching your criteria.</p>
                <Link to="/properties" className="inline-block bg-teal-950 text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:bg-teal-900 transition-colors">
                  Explore Collections
                </Link>
             </div>
          ) : (
            filteredBookings.map((booking, idx) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white group hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300 border border-stone-100 rounded-sm overflow-hidden flex flex-col md:flex-row"
              >
                {/* Image Section */}
                <div className="w-full md:w-80 h-64 md:h-auto relative overflow-hidden">
                   <img src={booking.propertyImage} alt={booking.propertyName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                   
                   {/* Status Badge */}
                   <div className={`absolute top-4 left-4 px-3 py-1 text-[10px] uppercase font-bold tracking-widest border ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                   </div>
                </div>

                {/* Details Section */}
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                   <div>
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <div className="flex items-center gap-2 text-amber-500 text-xs mb-1">
                               <FaStar /> <FaStar /> <FaStar /> <FaStar /> <FaStar />
                            </div>
                            <h3 className="text-2xl font-serif text-teal-950 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {booking.propertyName}
                            </h3>
                            <p className="text-stone-500 text-sm flex items-center gap-1">
                              <FaMapMarkerAlt className="text-teal-600" /> {booking.propertyLocation}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-serif text-teal-900">{formatCurrency(booking.totalAmount)}</p>
                            {booking.pendingAmount > 0 && (
                              <p className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-sm mt-1 inline-block">
                                Due: {formatCurrency(booking.pendingAmount)}
                              </p>
                            )}
                         </div>
                      </div>

                      {/* Dates Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-6 border-t border-b border-stone-100 py-4">
                         <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Check In</p>
                            <p className="font-medium text-stone-800">{formatDate(booking.checkIn)}</p>
                            <p className="text-xs text-stone-400">2:00 PM</p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Check Out</p>
                            <p className="font-medium text-stone-800">{formatDate(booking.checkOut)}</p>
                            <p className="text-xs text-stone-400">11:00 AM</p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Guests</p>
                            <p className="font-medium text-stone-800">{booking.guests.adults} Adults</p>
                            <p className="text-xs text-stone-400">{booking.guests.children || 0} Children</p>
                         </div>
                         <div>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Reference</p>
                            <p className="font-mono text-stone-600 text-xs uppercase">#{String(booking.id).padStart(6, '0')}</p>
                         </div>
                      </div>
                   </div>

                   {/* Actions */}
                   <div className="flex flex-wrap gap-3 pt-2">
                      <button className="flex-1 md:flex-none border border-teal-900 text-teal-900 px-6 py-2 text-xs uppercase tracking-widest font-bold hover:bg-teal-900 hover:text-white transition-colors">
                         View Details
                      </button>
                      <button className="flex-1 md:flex-none border border-stone-200 text-stone-600 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:border-stone-400 transition-colors flex items-center justify-center gap-2">
                         <FaDownload /> Invoice
                      </button>
                      
                      {booking.status === 'upcoming' && (
                        <button className="flex-1 md:flex-none text-red-400 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:text-red-600 transition-colors">
                           Cancel Stay
                        </button>
                      )}
                      
                      {booking.status === 'upcoming' && (
                        <button className="ml-auto flex items-center gap-2 text-teal-600 text-sm hover:text-teal-800 font-medium">
                           <FaWhatsapp /> Concierge
                        </button>
                      )}
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 4. HELP FOOTER */}
      <div className="max-w-7xl mx-auto px-6 mt-16">
         <div className="bg-stone-100 rounded-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
               <h4 className="font-serif text-xl text-teal-950 mb-2">Require Assistance?</h4>
               <p className="text-stone-500 text-sm">Our dedicated concierge team is available 24/7 to assist with your itinerary.</p>
            </div>
            <div className="flex gap-4">
               <Link to="/contact" className="flex items-center gap-2 bg-white px-5 py-3 rounded-sm shadow-sm text-xs font-bold uppercase tracking-widest text-teal-950 hover:shadow-md transition-shadow">
                  <FaPhone /> Contact Support
               </Link>
               <Link to="/faq" className="flex items-center gap-2 bg-transparent border border-stone-300 px-5 py-3 rounded-sm text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-white transition-colors">
                  <FaQuestionCircle /> FAQ
               </Link>
            </div>
         </div>
      </div>

    </div>
  );
}