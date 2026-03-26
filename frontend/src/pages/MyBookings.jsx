import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt, FaStar, FaDownload, FaWhatsapp, 
  FaPhone, FaQuestionCircle, FaBed, FaSearch, 
  FaFilter, FaChevronRight, FaCalendarAlt, FaHistory, 
  FaExclamationTriangle, FaEye, FaTimes, 
  FaCheck, FaClock, FaSpinner, FaUserCircle, FaChevronDown,
  FaCreditCard, FaRegClock, FaCalendarCheck, FaChartLine,
  FaMap, FaGlobe, FaPlane, FaHotel, FaHeart, FaShareAlt
} from "react-icons/fa";
import api, { IMAGE_BASE_URL } from "../services/api";
import GoogleMap from "../components/GoogleMap";

export default function MyBookings() {
  const navigate = useNavigate();
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
  const [viewMode, setViewMode] = useState("list"); // "list" or "map"
  const [mapCenter, setMapCenter] = useState({ lat: -1.286389, lng: 36.817223 });
  
  // Timer state for pending bookings
  const [timers, setTimers] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.bookings.getUserBookings();
        
        const transformedBookings = (response.data || []).map(booking => ({
          id: booking.id,
          propertyName: booking.property_name || booking.propertyName || 'Unknown Property',
          propertyLocation: booking.property_location || booking.propertyLocation || 'Nairobi',
          propertyImage: booking.property_image || booking.propertyImage,
          propertyLatitude: booking.property_latitude || booking.latitude,
          propertyLongitude: booking.property_longitude || booking.longitude,
          checkIn: booking.check_in || booking.checkIn,
          checkOut: booking.check_out || booking.checkOut,
          nights: booking.nights || 0,
          guests: booking.guests || { adults: 1, children: 0 },
          totalAmount: booking.total_amount || booking.totalAmount || 0,
          baseAmount: booking.base_amount || booking.baseAmount || 0,
          pendingAmount: booking.pending_amount || booking.pendingAmount || 0,
          paidAmount: (booking.total_amount || 0) - (booking.pending_amount || 0),
          status: booking.status || 'pending',
          paymentStatus: booking.payment_status || booking.paymentStatus || 'pending',
          createdAt: booking.created_at || booking.createdAt,
          expiresAt: booking.expires_at || booking.expiresAt
        }));
        
        setBookings(transformedBookings);
        
        // Calculate map center from bookings with coordinates
        const bookingsWithCoords = transformedBookings.filter(b => b.propertyLatitude && b.propertyLongitude);
        if (bookingsWithCoords.length > 0) {
          const avgLat = bookingsWithCoords.reduce((sum, b) => sum + b.propertyLatitude, 0) / bookingsWithCoords.length;
          const avgLng = bookingsWithCoords.reduce((sum, b) => sum + b.propertyLongitude, 0) / bookingsWithCoords.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
        
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
  }, []);

  // REAL-TIME EXPIRY CHECK
  useEffect(() => {
    const checkPendingBookings = async () => {
      const pendingIds = bookings
        .filter(b => b.status === 'pending' && b.expiresAt)
        .map(b => b.id);
      
      if (pendingIds.length === 0) return;
      
      try {
        const promises = pendingIds.map(id => api.bookings.getStatus(id));
        const responses = await Promise.all(promises);
        
        let needsRefresh = false;
        const newTimers = {};
        
        responses.forEach((response, index) => {
          const bookingId = pendingIds[index];
          if (response.data.is_expired) {
            needsRefresh = true;
          } else if (response.data.time_left) {
            newTimers[bookingId] = `${response.data.time_left.minutes}:${response.data.time_left.seconds.toString().padStart(2, '0')}`;
          }
        });
        
        if (needsRefresh) {
          window.location.reload();
        } else {
          setTimers(newTimers);
        }
        
      } catch (error) {
        console.error('Error checking booking statuses:', error);
      }
    };
    
    checkPendingBookings();
    const interval = setInterval(checkPendingBookings, 5000);
    return () => clearInterval(interval);
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

  const handleCancelClick = (booking, e) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    
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
    
    setCancelCalculation({ refundAmount, message, daysUntilCheckIn });
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!selectedBooking) return;
    setCancelling(true);
    try {
      const response = await api.bookings.cancel(selectedBooking.id);
      alert(response.data.message || 'Booking cancelled successfully');
      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

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
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "current" && !["pending", "confirmed", "upcoming", "active"].includes(booking.status)) return false;
    if (activeTab === "history" && !["completed", "cancelled", "expired", "failed"].includes(booking.status)) return false;
    if (searchTerm && !booking.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== "all" && booking.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    upcomingNights: bookings.filter(b => ["confirmed", "upcoming"].includes(b.status)).reduce((sum, b) => sum + (b.nights || 0), 0),
    completedStays: bookings.filter(b => b.status === "completed").length,
    pendingPayments: bookings.filter(b => b.status === "pending").length,
    favoriteDestination: getFavoriteDestination(bookings),
    averageStay: getAverageStay(bookings)
  };

  function getFavoriteDestination(bookings) {
    const locations = bookings.filter(b => b.status === "completed").map(b => b.propertyLocation);
    if (locations.length === 0) return 'Nairobi';
    const counts = {};
    locations.forEach(l => counts[l] = (counts[l] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  function getAverageStay(bookings) {
    const completed = bookings.filter(b => b.status === "completed");
    if (completed.length === 0) return 0;
    const totalNights = completed.reduce((sum, b) => sum + (b.nights || 0), 0);
    return Math.round(totalNights / completed.length);
  }

  // Prepare map markers for bookings
  const mapMarkers = filteredBookings
    .filter(b => b.propertyLatitude && b.propertyLongitude)
    .map(b => ({
      id: b.id,
      lat: b.propertyLatitude,
      lng: b.propertyLongitude,
      title: b.propertyName,
      status: b.status,
      checkIn: b.checkIn,
      nights: b.nights
    }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">Loading your journey</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] text-stone-900 pb-20 pt-8">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-full bg-[#093A3E] flex items-center justify-center">
            <FaUserCircle className="text-[#ED9B40] text-2xl" />
          </div>
          <div>
            <p className="text-sm text-stone-500">Welcome back,</p>
            <h1 className="text-3xl md:text-4xl font-serif text-stone-900">
              {user?.name?.split(' ')[0] || 'Guest'}
            </h1>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 border border-stone-100 shadow-sm">
            <FaCalendarCheck className="text-[#093A3E] mb-2" size={20} />
            <p className="text-2xl font-serif">{stats.upcomingNights}</p>
            <p className="text-xs text-stone-500">Nights ahead</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-stone-100 shadow-sm">
            <FaHistory className="text-[#093A3E] mb-2" size={20} />
            <p className="text-2xl font-serif">{stats.completedStays}</p>
            <p className="text-xs text-stone-500">Stays completed</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-stone-100 shadow-sm">
            <FaRegClock className="text-[#093A3E] mb-2" size={20} />
            <p className="text-2xl font-serif">{stats.pendingPayments}</p>
            <p className="text-xs text-stone-500">Pending payments</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-stone-100 shadow-sm">
            <FaGlobe className="text-[#093A3E] mb-2" size={20} />
            <p className="text-lg font-serif truncate">{stats.favoriteDestination}</p>
            <p className="text-xs text-stone-500">Favorite spot</p>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div className="flex gap-8 border-b border-stone-200 w-full md:w-auto">
            {[
              { id: "current", label: "Upcoming Stays", icon: <FaCalendarAlt /> },
              { id: "history", label: "Past Stays", icon: <FaHistory /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${
                  activeTab === tab.id ? "text-[#093A3E]" : "text-stone-400 hover:text-stone-600"
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-[#ED9B40]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
              <input 
                type="text"
                placeholder="Search properties..."
                className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-[#093A3E] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-sm flex items-center gap-2"
            >
              <FaFilter size={14} /> Filter
            </button>
            <button
              onClick={() => setViewMode(viewMode === "list" ? "map" : "list")}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                viewMode === "map" 
                  ? "bg-[#093A3E] text-white" 
                  : "border border-stone-200 bg-white hover:bg-stone-50"
              }`}
            >
              {viewMode === "list" ? <FaMap /> : <FaHotel />}
              {viewMode === "list" ? "Map View" : "List View"}
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-sm text-stone-600">Status:</span>
                  {["all", "pending", "confirmed", "completed", "cancelled"].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${
                        filterStatus === status
                          ? "bg-[#093A3E] text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map View */}
        {viewMode === "map" && filteredBookings.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
              <div className="h-[400px] relative">
                <GoogleMap
                  location="Your bookings"
                  propertyTitle={`${filteredBookings.length} bookings`}
                  coordinates={mapCenter}
                />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg text-sm">
                  <FaMapMarkerAlt className="inline text-[#ED9B40] mr-1" />
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} on map
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-stone-200">
                <div className="max-w-md mx-auto">
                  <FaCalendarAlt className="text-4xl text-stone-300 mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-stone-800 mb-2">No bookings found</h3>
                  <p className="text-stone-500 mb-6">
                    {activeTab === "current" 
                      ? "You don't have any upcoming stays. Time to plan your next getaway!" 
                      : "Your past stays will appear here."}
                  </p>
                  <Link 
                    to="/properties" 
                    className="inline-block px-6 py-2 bg-[#093A3E] text-white rounded-lg hover:bg-[#0a4a52] transition-colors"
                  >
                    Browse Properties
                  </Link>
                </div>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <motion.div 
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-56 h-48 md:h-auto relative bg-stone-100">
                      <img 
                        src={booking.propertyImage && !booking.propertyImage.startsWith('http') 
                          ? `${IMAGE_BASE_URL}${booking.propertyImage}` 
                          : booking.propertyImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400'} 
                        className="w-full h-full object-cover"
                        alt={booking.propertyName}
                      />
                      <div className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-medium rounded ${getStatusStyle(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                      {booking.status === 'pending' && timers[booking.id] && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded text-[10px] font-mono">
                          <FaClock className="inline mr-1" size={10} /> {timers[booking.id]}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif text-xl text-stone-900">{booking.propertyName}</h3>
                        <div className="flex items-center gap-1 text-amber-500">
                          <FaStar size={12} /><FaStar size={12} /><FaStar size={12} /><FaStar size={12} /><FaStar size={12} />
                        </div>
                      </div>
                      
                      <p className="text-stone-500 text-sm flex items-center gap-1 mb-3">
                        <FaMapMarkerAlt size={12} /> {booking.propertyLocation}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">Check In</p>
                          <p className="text-sm font-medium">{formatDate(booking.checkIn)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">Check Out</p>
                          <p className="text-sm font-medium">{formatDate(booking.checkOut)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">Guests</p>
                          <p className="text-sm font-medium">{booking.guests?.adults || 1} Adults{booking.guests?.children > 0 ? `, ${booking.guests.children} Children` : ''}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">Nights</p>
                          <p className="text-sm font-medium">{booking.nights}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs text-stone-500">Total amount</p>
                          <p className="text-xl font-serif text-stone-900">{formatCurrency(booking.totalAmount)}</p>
                          {booking.pendingAmount > 0 && (
                            <p className="text-xs text-amber-600">Balance due: {formatCurrency(booking.pendingAmount)}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedBooking(booking)}
                            className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-sm flex items-center gap-2"
                          >
                            <FaEye size={14} /> Details
                          </button>
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => navigate(`/payment/${booking.id}`)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm flex items-center gap-2"
                            >
                              <FaCreditCard size={14} /> Pay Now
                            </button>
                          )}
                          {['pending', 'confirmed', 'upcoming'].includes(booking.status) && (
                            <button 
                              onClick={(e) => handleCancelClick(booking, e)}
                              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
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
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <button onClick={() => setShowCancelModal(false)} className="p-2 hover:bg-stone-100 rounded-full">
                    <FaTimes />
                  </button>
                </div>

                <h3 className="font-serif text-xl mb-2">Cancel Booking?</h3>
                <p className="text-stone-500 text-sm mb-6">
                  Are you sure you want to cancel your stay at <span className="font-medium text-stone-900">{selectedBooking?.propertyName}</span>?
                </p>

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
                    {cancelling ? <><FaSpinner className="animate-spin" /> Cancelling...</> : 'Yes, Cancel'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedBooking && !showCancelModal && (
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
                      Booked on {new Date(selectedBooking.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-stone-100 rounded-full">
                    <FaTimes />
                  </button>
                </div>

                <div className="flex gap-2 mb-6">
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusStyle(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-stone-100">
                    Payment: {selectedBooking.paymentStatus}
                  </span>
                </div>

                <div className="h-48 rounded-lg overflow-hidden mb-6">
                  <img
                    src={selectedBooking.propertyImage && !selectedBooking.propertyImage.startsWith('http') 
                      ? `${IMAGE_BASE_URL}${selectedBooking.propertyImage}` 
                      : selectedBooking.propertyImage || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'}
                    alt={selectedBooking.propertyName}
                    className="w-full h-full object-cover"
                  />
                </div>

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

                <div className="border-t border-stone-200 pt-4 mb-6">
                  <h4 className="font-medium mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Base amount ({selectedBooking.nights} nights)</span>
                      <span>{formatCurrency(selectedBooking.baseAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedBooking.totalAmount)}</span>
                    </div>
                  </div>
                </div>

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
                      // Download invoice functionality
                      alert('Invoice download coming soon');
                    }}
                    className="flex-1 border border-stone-200 py-3 rounded-lg hover:bg-stone-50 flex items-center justify-center gap-2"
                  >
                    <FaDownload size={14} /> Download Invoice
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Concierge Section */}
      <div className="max-w-7xl mx-auto px-6 mt-12">
        <div className="bg-gradient-to-r from-[#093A3E] to-[#0a4a52] text-white rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#ED9B40]/20 rounded-full flex items-center justify-center">
                <FaPhone className="text-[#ED9B40] text-xl" />
              </div>
              <div>
                <h3 className="font-serif text-xl md:text-2xl">Need assistance with your stay?</h3>
                <p className="text-white/80 text-sm mt-1">
                  Our concierge team is here 24/7 to help with special requests or questions
                </p>
              </div>
            </div>
            <Link
              to="/contact"
              className="px-6 py-2.5 bg-[#ED9B40] text-[#093A3E] rounded-lg hover:bg-white transition-colors font-medium text-sm"
            >
              Contact Concierge
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}