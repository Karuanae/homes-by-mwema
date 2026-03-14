import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt, FaStar, FaDownload, FaWhatsapp, 
  FaPhone, FaQuestionCircle, FaBed, FaSearch, 
  FaFilter, FaChevronRight, FaCrown, FaCalendarAlt, FaHistory, FaMoneyBillWave, FaExclamationTriangle,
  FaEye, FaTimes, FaCheck, FaClock, FaSpinner
} from "react-icons/fa";
import api, { IMAGE_BASE_URL } from "../services/api";

export default function MyBookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("current");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelCalculation, setCancelCalculation] = useState(null);
  

  // Timer state for pending bookings
  const [timers, setTimers] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.bookings.getUserBookings();
        console.log('Bookings data:', response.data);
        
        // Transform data to ensure consistent field names
        const transformedBookings = (response.data || []).map(booking => ({
          id: booking.id,
          propertyName: booking.property_name || booking.propertyName || 'Unknown Property',
          propertyLocation: booking.property_location || booking.propertyLocation || 'Nairobi',
          propertyImage: booking.property_image || booking.propertyImage,
          checkIn: booking.check_in || booking.checkIn,
          checkOut: booking.check_out || booking.checkOut,
          nights: booking.nights || 0,
          guests: booking.guests || { adults: 1, children: 0 },
          totalAmount: booking.total_amount || booking.totalAmount || 0,
          baseAmount: booking.base_amount || booking.baseAmount || 0,
          cleaningFee: booking.cleaning_fee || booking.cleaningFee || 0,
          serviceFee: booking.service_fee || booking.serviceFee || 0,
          pendingAmount: booking.pending_amount || booking.pendingAmount || 0,
          paidAmount: booking.total_amount - (booking.pending_amount || 0),
          status: booking.status || 'pending',
          paymentStatus: booking.payment_status || booking.paymentStatus || 'pending',
          createdAt: booking.created_at || booking.createdAt,
          expiresAt: booking.expires_at || booking.expiresAt
        }));
        
        setBookings(transformedBookings);
        
        // Initialize timers for pending bookings
        const initialTimers = {};
        transformedBookings.forEach(booking => {
          if (booking.status === 'pending' && booking.expiresAt) {
            initialTimers[booking.id] = calculateTimeLeft(booking.expiresAt);
          }
        });
        setTimers(initialTimers);
        
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

  // Timer update effect
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const newTimers = {};
      bookings.forEach(booking => {
        if (booking.status === 'pending' && booking.expiresAt) {
          newTimers[booking.id] = calculateTimeLeft(booking.expiresAt);
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [bookings]);

  const calculateTimeLeft = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cancel button click - show modal with refund calculation
const handleCancelClick = (booking, e) => {
  e.stopPropagation();
  setSelectedBooking(booking);
  
  // Calculate refund based on days until check-in
  const today = new Date();
  const checkIn = new Date(booking.checkIn);
  const daysUntilCheckIn = Math.ceil((checkIn - today) / (1000 * 60 * 60 * 24));
  
  let refundAmount = 0;
  let message = '';
  
  if (daysUntilCheckIn >= 30) {
    refundAmount = booking.totalAmount;
    message = 'Full refund (cancellation more than 30 days before check-in)';
  } else if (daysUntilCheckIn >= 14) {
    refundAmount = booking.totalAmount * 0.5;
    message = '50% refund (cancellation 14-29 days before check-in)';
  } else {
    refundAmount = 0;
    message = 'No refund (cancellation less than 14 days before check-in)';
  }
  
  setCancelCalculation({
    refundAmount,
    message,
    daysUntilCheckIn
  });
  
  setShowCancelModal(true);
};

// Confirm cancellation
const confirmCancellation = async () => {
  if (!selectedBooking) return;
  
  setCancelling(true);
  try {
    const response = await api.bookings.cancel(selectedBooking.id);
    
    // Show success message
    alert(response.data.message || 'Booking cancelled successfully');
    
    // Refresh bookings
    const updatedBookings = await api.bookings.getUserBookings();
    setBookings(updatedBookings.data);
    
    // Close modal
    setShowCancelModal(false);
    setSelectedBooking(null);
    
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to cancel booking');
  } finally {
    setCancelling(false);
  }
};

  /* --- STATUS HELPERS --- */
  const getStatusStyle = (status) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      confirmed: "bg-green-100 text-green-700 border-green-200",
      upcoming: "bg-blue-100 text-blue-700 border-blue-200",
      active: "bg-purple-100 text-purple-700 border-purple-200",
      completed: "bg-stone-100 text-stone-500 border-stone-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
      expired: "bg-stone-100 text-stone-400 border-stone-200",
      failed: "bg-red-50 text-red-700 border-red-200"
    };
    return styles[status] || styles.upcoming;
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending Payment',
      confirmed: 'Confirmed',
      upcoming: 'Upcoming',
      active: 'Active Stay',
      completed: 'Completed',
      cancelled: 'Cancelled',
      expired: 'Expired',
      failed: 'Payment Failed'
    };
    return texts[status] || status;
  };

  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || "0"}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "current" && !["pending", "confirmed", "upcoming", "active"].includes(booking.status)) return false;
    if (activeTab === "history" && !["completed", "cancelled", "expired", "failed"].includes(booking.status)) return false;
    if (searchTerm && !booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== "all" && booking.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    upcoming: bookings.filter(b => ["pending", "confirmed", "upcoming"].includes(b.status)).length,
    completed: bookings.filter(b => b.status === "completed").length,
    spent: bookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0),
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
      
      {/* 1. HERO SECTION */}
      <div className="max-w-7xl mx-auto px-6 mb-16">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-stone-200 pb-12 gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-8 bg-stone-900"></span>
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-500">Guest Portfolio</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif italic mb-6">Your Journeys</h1>
            <p className="text-stone-500 font-light text-lg leading-relaxed">
              Welcome back, {user?.name || "Guest"}. A collection of your past, present, and future stays.
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

        {/* Stats Grid */}
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

        {/* Cancel Booking Modal */}
<AnimatePresence>
  {showCancelModal && selectedBooking && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setShowCancelModal(false)}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <FaExclamationTriangle className="text-red-600 text-xl" />
            </div>
            <button
              onClick={() => setShowCancelModal(false)}
              className="p-2 hover:bg-stone-100 rounded-full"
            >
              <FaTimes />
            </button>
          </div>

          <h3 className="font-serif text-xl mb-2">Cancel Booking?</h3>
          <p className="text-stone-500 text-sm mb-6">
            Are you sure you want to cancel your stay at <span className="font-medium text-stone-900">{selectedBooking?.propertyName}</span>?
          </p>

          {/* Booking Summary */}
          <div className="bg-stone-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">Check-in</span>
              <span className="font-medium">{formatDate(selectedBooking?.checkIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Check-out</span>
              <span className="font-medium">{formatDate(selectedBooking?.checkOut)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-600">Total paid</span>
              <span className="font-medium">{formatCurrency(selectedBooking?.totalAmount)}</span>
            </div>
          </div>

          {/* Refund Info */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 mb-2">⚠️ Refund Policy</p>
            <p className="text-xs text-amber-700">
              {cancelCalculation?.message || "Refund amount will be calculated based on days until check-in."}
            </p>
            {cancelCalculation?.refundAmount > 0 && (
              <p className="text-sm font-medium text-amber-800 mt-2">
                Refund amount: {formatCurrency(cancelCalculation.refundAmount)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowCancelModal(false)}
              className="flex-1 px-4 py-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-sm"
            >
              Keep Booking
            </button>
            <button
              onClick={confirmCancellation}
              disabled={cancelling}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cancelling ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
        
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
                className="grid grid-cols-12 gap-0 md:gap-12 group cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedBooking(booking)}
              >
                {/* Visual Side */}
                <div className="col-span-12 md:col-span-5 mb-6 md:mb-0">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img 
                      src={booking.propertyImage && !booking.propertyImage.startsWith('http') ? `${IMAGE_BASE_URL}${booking.propertyImage}` : booking.propertyImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'} 
                      className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105" 
                      alt={booking.propertyName}
                    />
                    <div className={`absolute top-6 left-6 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-bold shadow-2xl ${getStatusStyle(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </div>
                    
                    {/* Timer for pending bookings */}
                    {booking.status === 'pending' && timers[booking.id] && (
                      <div className="absolute top-6 right-6 bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-mono">
                        <FaClock className="inline mr-1" /> {timers[booking.id]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Side */}
                <div className="col-span-12 md:col-span-7 flex flex-col justify-center border-b border-stone-100 pb-12">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-bold">Ref: #{String(booking.id).padStart(6, '0')}</p>
                    <div className="flex text-amber-500 gap-1">
                      <FaStar size={10} /><FaStar size={10} /><FaStar size={10} />
                    </div>
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
                      <p className="text-stone-800 font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Total Investment</p>
                      <p className="text-stone-800 font-medium">{formatCurrency(booking.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Guests</p>
                      <p className="text-stone-800 font-medium">
                        {booking.guests?.adults || 1} Adults
                        {booking.guests?.children > 0 ? `, ${booking.guests.children} Children` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1">Nights</p>
                      <p className="text-stone-800 font-medium">{booking.nights}</p>
                    </div>
                    {booking.pendingAmount > 0 && (
                      <div className="col-span-2 bg-amber-50 p-3 border-l-2 border-amber-500">
                        <p className="text-[9px] uppercase tracking-widest text-amber-600 font-bold mb-1">Balance Due</p>
                        <p className="text-amber-800 font-serif">{formatCurrency(booking.pendingAmount)}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-4 mt-auto">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                      className="bg-stone-900 text-[#f5f2ee] px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-stone-800 transition-all flex items-center gap-3"
                    >
                      View Details <FaChevronRight size={10} />
                    </button>
                    {booking.status === 'pending' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/payment/${booking.id}`);
                        }}
                        className="bg-amber-500 text-white px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-amber-600 transition-all"
                      >
                        Complete Payment
                      </button>
                    )}

                      {/* CANCEL BUTTON - Show for pending/confirmed/upcoming bookings */}
  {['pending', 'confirmed', 'upcoming'].includes(booking.status) && (
    <button 
      onClick={(e) => handleCancelClick(booking, e)}
      className="border border-red-300 text-red-600 px-10 py-4 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-red-50 transition-all"
    >
      Cancel Booking
    </button>
  )}

                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 4. DETAILS MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-serif text-2xl">Booking #{selectedBooking.id}</h3>
                    <p className="text-sm text-stone-500">
                      Created: {new Date(selectedBooking.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 hover:bg-stone-100 rounded-full"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 mb-6">
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusStyle(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-stone-100">
                    Payment: {selectedBooking.paymentStatus}
                  </span>
                </div>

                {/* Property Image */}
                <div className="h-48 rounded-lg overflow-hidden mb-6">
                  <img
                    src={selectedBooking.propertyImage && !selectedBooking.propertyImage.startsWith('http') ? `${IMAGE_BASE_URL}${selectedBooking.propertyImage}` : selectedBooking.propertyImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'}
                    alt={selectedBooking.propertyName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-stone-50 p-3 rounded">
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Check In</p>
                    <p className="font-medium">{formatDate(selectedBooking.checkIn)}</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded">
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Check Out</p>
                    <p className="font-medium">{formatDate(selectedBooking.checkOut)}</p>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-stone-200 pt-4 mb-6">
                  <h4 className="font-medium mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Base amount ({selectedBooking.nights} nights)</span>
                      <span>{formatCurrency(selectedBooking.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Cleaning fee</span>
                      <span>{formatCurrency(selectedBooking.cleaningFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Service fee</span>
                      <span>{formatCurrency(selectedBooking.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedBooking.totalAmount)}</span>
                    </div>
                    {selectedBooking.paidAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid</span>
                        <span>{formatCurrency(selectedBooking.paidAmount)}</span>
                      </div>
                    )}
                    {selectedBooking.pendingAmount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Balance due</span>
                        <span>{formatCurrency(selectedBooking.pendingAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedBooking(null);
                        navigate(`/payment/${selectedBooking.id}`);
                      }}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600"
                    >
                      Complete Payment
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      // Download invoice functionality
                    }}
                    className="flex-1 border border-stone-200 py-3 rounded-lg hover:bg-stone-50"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. CONCIERGE FOOTER */}
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