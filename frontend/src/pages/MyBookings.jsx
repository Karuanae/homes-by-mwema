import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt, FaStar, FaDownload, FaWhatsapp,
  FaPhone, FaQuestionCircle, FaBed, FaSearch,
  FaFilter, FaChevronRight, FaCalendarAlt, FaHistory,
  FaExclamationTriangle, FaEye, FaTimes,
  FaCheck, FaClock, FaSpinner, FaUserCircle, FaChevronDown,
  FaCreditCard, FaRegClock, FaCalendarCheck, FaChartLine,
  FaMap, FaGlobe, FaPlane, FaHotel, FaHeart, FaShareAlt,
  FaDoorOpen,
} from "react-icons/fa";
import api, { IMAGE_BASE_URL } from "../services/api";
import GoogleMap from "../components/GoogleMap";

// ─── Status helpers ───────────────────────────────────────────────────────────
//
//  pending   → 15-min timer running, no payment
//  confirmed → payment done, check-in is in the future
//  active    → payment done, guest is currently staying
//  completed → payment done AND check-out has passed
//  cancelled → cancelled by user; may have refund
//
const STATUS_STYLE = {
  pending:   "bg-amber-100   text-amber-700   border-amber-200",
  confirmed: "bg-green-100   text-green-700   border-green-200",
  active:    "bg-purple-100  text-purple-700  border-purple-200",
  completed: "bg-stone-100   text-stone-500   border-stone-200",
  cancelled: "bg-red-50      text-red-700     border-red-200",
};

const STATUS_TEXT = {
  pending:   "Pending Payment",
  confirmed: "Confirmed",
  active:    "Active Stay",
  completed: "Completed",
  cancelled: "Cancelled",
};

const getStatusStyle = (s) => STATUS_STYLE[s] || STATUS_STYLE.confirmed;
const getStatusText  = (s) => STATUS_TEXT[s]  || s;

// Which statuses count as "upcoming / current"
const CURRENT_STATUSES = ["pending", "confirmed", "active"];
// Which statuses count as history
const HISTORY_STATUSES = ["completed", "cancelled"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatCurrency = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
};

function calculateTimeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return null;
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MyBookings() {
  const navigate = useNavigate();

  const [activeTab,       setActiveTab]       = useState("current");
  const [bookings,        setBookings]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [user,            setUser]            = useState(null);
  const [searchTerm,      setSearchTerm]      = useState("");
  const [showFilters,     setShowFilters]     = useState(false);
  const [filterStatus,    setFilterStatus]    = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelBooking,   setCancelBooking]   = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling,      setCancelling]      = useState(false);
  const [cancelCalc,      setCancelCalc]      = useState(null);
  const [viewMode,        setViewMode]        = useState("list");
  const [mapCenter,       setMapCenter]       = useState({ lat: -1.286389, lng: 36.817223 });
  const [timers,          setTimers]          = useState({});

  // ✅ FIX: Add refs to prevent infinite loops
  const bookingsRef = useRef(bookings);
  const fetchInProgressRef = useRef(false);

  // ── Fetch bookings with protection against concurrent calls ─────────────────
  const fetchBookings = useCallback(async () => {
    // ✅ Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      return;
    }
    
    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      const { data = [] } = await api.bookings.getUserBookings();

      const transformed = data.map((b) => ({
        id:               b.id,
        propertyName:     b.property_name     || "Unknown Property",
        propertyLocation: b.property_location || "Nairobi",
        propertyImage:    b.property_image,
        propertyLatitude: b.property_latitude  || b.latitude,
        propertyLongitude:b.property_longitude || b.longitude,
        checkIn:          b.check_in,
        checkOut:         b.check_out,
        nights:           b.nights || 0,
        guests:           b.guests || { adults: 1, children: 0 },
        totalAmount:      b.total_amount  || 0,
        baseAmount:       b.base_amount   || 0,
        pendingAmount:    b.pending_amount || 0,
        paidAmount:       (b.total_amount || 0) - (b.pending_amount || 0),
        status:           b.status        || "pending",
        paymentStatus:    b.payment_status || "pending",
        createdAt:        b.created_at,
        expiresAt:        b.expires_at,
        canCancel:        b.can_cancel,
        refundInfo:       b.refund_info || null,
      }));

      setBookings(transformed);

      // Map centre
      const withCoords = transformed.filter((b) => b.propertyLatitude && b.propertyLongitude);
      if (withCoords.length > 0) {
        const lat = withCoords.reduce((s, b) => s + b.propertyLatitude,  0) / withCoords.length;
        const lng = withCoords.reduce((s, b) => s + b.propertyLongitude, 0) / withCoords.length;
        setMapCenter({ lat, lng });
      }

      // Initial timers
      const init = {};
      transformed.forEach((b) => {
        if (b.status === "pending" && b.expiresAt) {
          init[b.id] = calculateTimeLeft(b.expiresAt);
        }
      });
      setTimers(init);
    } catch (err) {
      console.error("fetchBookings error:", err);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  // ✅ FIX: Sync ref with bookings state
  useEffect(() => {
    bookingsRef.current = bookings;
  }, [bookings]);

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "null"));
    fetchBookings();
  }, [fetchBookings]);

  // ── Real-time timer polling (SMOOTH & ACCURATE) ─────────────────────────────
  useEffect(() => {
    let localTimerInterval = null;
    let serverCheckInterval = null;

    const updateLocalTimers = () => {
      // Use ref to get current bookings without triggering re-renders
      const currentBookings = bookingsRef.current;
      const pendingBookings = currentBookings.filter((b) => b.status === "pending" && b.expiresAt);

      if (pendingBookings.length === 0) {
        setTimers({});
        return;
      }

      const now = new Date();
      const newTimers = {};
      let needsServerRefresh = false;

      pendingBookings.forEach((b) => {
        const expiry = new Date(b.expiresAt);
        if (expiry <= now) {
          needsServerRefresh = true;
        } else {
          const diff = expiry - now;
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          newTimers[b.id] = `${minutes}:${String(seconds).padStart(2, "0")}`;
        }
      });

      setTimers(newTimers);

      // Only trigger server refresh when a timer actually hits zero
      if (needsServerRefresh && !fetchInProgressRef.current) {
        fetchBookings();
      }
    };

    const checkServerStatus = async () => {
      const currentBookings = bookingsRef.current;
      const pendingBookings = currentBookings.filter((b) => b.status === "pending" && b.expiresAt);
      
      if (pendingBookings.length === 0) return;

      // Check with server every 30 seconds for status updates
      try {
        const results = await Promise.allSettled(
          pendingBookings.map((b) => api.bookings.getStatus(b.id))
        );

        let needsRefresh = false;
        results.forEach((result, i) => {
          const id = pendingBookings[i].id;
          if (result.status === "rejected" || result.value?.data?.is_expired) {
            needsRefresh = true;
          }
        });

        if (needsRefresh && !fetchInProgressRef.current) {
          await fetchBookings();
        }
      } catch (e) {
        console.error("Server status check error:", e);
      }
    };

    // Start local timer that updates EVERY SECOND (smooth countdown)
    localTimerInterval = setInterval(updateLocalTimers, 1000);
    
    // Check with server every 30 seconds (reduces API calls by 83%)
    serverCheckInterval = setInterval(checkServerStatus, 30000);

    // Initial update
    updateLocalTimers();

    // Cleanup on unmount
    return () => {
      if (localTimerInterval) clearInterval(localTimerInterval);
      if (serverCheckInterval) clearInterval(serverCheckInterval);
    };
  }, [fetchBookings]);

  // ── Cancel helpers ──────────────────────────────────────────────────────────
  const handleCancelClick = (booking, e) => {
    e.stopPropagation();
    setCancelBooking(booking);

    const today        = new Date();
    const checkIn      = new Date(booking.checkIn);
    const daysUntil    = Math.ceil((checkIn - today) / 86400000);
    let refundAmount   = 0;
    let message        = "";

    if (daysUntil >= 30) {
      refundAmount = booking.totalAmount;
      message = "Full refund — cancellation more than 30 days before check-in.";
    } else if (daysUntil >= 14) {
      refundAmount = booking.totalAmount * 0.5;
      message = "50% refund — cancellation 14–29 days before check-in.";
    } else {
      message = "No refund — cancellation less than 14 days before check-in.";
    }

    setCancelCalc({ refundAmount, message, daysUntil });
    setShowCancelModal(true);
  };

  const confirmCancellation = async () => {
    if (!cancelBooking) return;
    setCancelling(true);
    try {
      const res = await api.bookings.cancel(cancelBooking.id);
      alert(res.data.message || "Booking cancelled successfully.");
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
      setCancelBooking(null);
    }
  };

  // ── "Return to payment" — fetch booking from API if needed ────────────────
  const handlePayNow = async (booking) => {
    try {
      // Ask the backend for the full booking object (contains expires_at, total_amount, etc.)
      const res = await api.bookings.getById(booking.id);
      navigate(`/payment/${booking.id}`, {
        state: { bookingDetails: res.data },
      });
    } catch (err) {
      console.error("handlePayNow error:", err);
      // Fallback: navigate anyway and let PaymentPage fetch it
      navigate(`/payment/${booking.id}`);
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "current" && !CURRENT_STATUSES.includes(b.status)) return false;
    if (activeTab === "history" && !HISTORY_STATUSES.includes(b.status)) return false;
    if (searchTerm && !b.propertyName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    upcomingNights:    bookings.filter((b) => ["confirmed", "active"].includes(b.status))
                               .reduce((s, b) => s + (b.nights || 0), 0),
    completedStays:    bookings.filter((b) => b.status === "completed").length,
    pendingPayments:   bookings.filter((b) => b.status === "pending").length,
    activeStays:       bookings.filter((b) => b.status === "active").length,
    favoriteDestination: getFavoriteDestination(bookings),
  };

  function getFavoriteDestination(bks) {
    const locs = bks.filter((b) => b.status === "completed").map((b) => b.propertyLocation);
    if (!locs.length) return "Nairobi";
    const counts = {};
    locs.forEach((l) => (counts[l] = (counts[l] || 0) + 1));
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">
          Loading your journey
        </p>
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
              {user?.name?.split(" ")[0] || "Guest"}
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 border border-stone-100 shadow-sm">
            <FaCalendarCheck className="text-[#093A3E] mb-2" size={20} />
            <p className="text-2xl font-serif">{stats.upcomingNights}</p>
            <p className="text-xs text-stone-500">Nights ahead</p>
          </div>
          {stats.activeStays > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 shadow-sm">
              <FaDoorOpen className="text-purple-600 mb-2" size={20} />
              <p className="text-2xl font-serif text-purple-700">{stats.activeStays}</p>
              <p className="text-xs text-purple-500">Active stay{stats.activeStays > 1 ? "s" : ""}</p>
            </div>
          )}
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
            <p className="text-xs text-stone-500">Favourite spot</p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div className="flex gap-8 border-b border-stone-200 w-full md:w-auto">
            {[
              { id: "current", label: "Upcoming & Active", icon: <FaCalendarAlt /> },
              { id: "history", label: "Past Stays",        icon: <FaHistory /> },
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
                placeholder="Search properties…"
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

        {/* Filter dropdown */}
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
                  {["all", "pending", "confirmed", "active", "completed", "cancelled"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs capitalize transition-colors ${
                        filterStatus === s
                          ? "bg-[#093A3E] text-white"
                          : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map view */}
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
                  {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} on map
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-lg border border-stone-200">
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
            ) : (
              filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow ${
                    booking.status === "active"
                      ? "border-purple-200 shadow-purple-50"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-56 h-48 md:h-auto relative bg-stone-100">
                      <img
                        src={
                          booking.propertyImage && !booking.propertyImage.startsWith("http")
                            ? `${IMAGE_BASE_URL}${booking.propertyImage}`
                            : booking.propertyImage ||
                              "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400"
                        }
                        className="w-full h-full object-cover"
                        alt={booking.propertyName}
                      />
                      <div className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-medium rounded border ${getStatusStyle(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                      {/* Active stay pulse badge */}
                      {booking.status === "active" && (
                        <div className="absolute top-3 right-3 bg-purple-600 text-white px-2 py-1 rounded text-[10px] font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse inline-block" />
                          Staying now
                        </div>
                      )}
                      {/* Timer with smooth animation */}
                      {booking.status === "pending" && timers[booking.id] && (
                        <motion.div
                          key={timers[booking.id]}
                          initial={{ scale: 0.95, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-1 rounded text-[10px] font-mono"
                        >
                          <FaClock className="inline mr-1" size={10} />
                          {timers[booking.id]}
                        </motion.div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-serif text-xl text-stone-900">{booking.propertyName}</h3>
                        <div className="flex items-center gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => <FaStar key={i} size={12} />)}
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
                          <p className="text-sm font-medium">
                            {booking.guests?.adults || 1} Adults
                            {booking.guests?.children > 0 && `, ${booking.guests.children} Children`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-stone-400">Nights</p>
                          <p className="text-sm font-medium">{booking.nights}</p>
                        </div>
                      </div>

                      {/* Cancelled — show refund info if any */}
                      {booking.status === "cancelled" && booking.refundInfo && booking.refundInfo.refund_amount > 0 && (
                        <div className={`mb-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                          booking.refundInfo.refund_processed
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {booking.refundInfo.refund_processed ? (
                            <><FaCheck size={10} /> Refund of {formatCurrency(booking.refundInfo.refund_amount)} processed</>
                          ) : (
                            <><FaClock size={10} /> Refund of {formatCurrency(booking.refundInfo.refund_amount)} pending</>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs text-stone-500">Total amount</p>
                          <p className="text-xl font-serif text-stone-900">{formatCurrency(booking.totalAmount)}</p>
                          {/* Balance due only shown while payment is still pending */}
                          {booking.status === "pending" && booking.pendingAmount > 0 && (
                            <p className="text-xs text-amber-600">
                              Balance due: {formatCurrency(booking.pendingAmount)}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {/* Details */}
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className="px-4 py-2 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-sm flex items-center gap-2"
                          >
                            <FaEye size={14} /> Details
                          </button>

                          {/* Pay Now — only for pending bookings */}
                          {booking.status === "pending" && (
                            <button
                              onClick={() => handlePayNow(booking)}
                              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm flex items-center gap-2"
                            >
                              <FaCreditCard size={14} /> Pay Now
                            </button>
                          )}

                          {/* Cancel — pending or confirmed (not active, not completed) */}
                          {["pending", "confirmed"].includes(booking.status) && booking.canCancel && (
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

      {/* ── Cancel Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCancelModal && cancelBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCancelModal(false); setCancelBooking(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaExclamationTriangle className="text-red-600 text-xl" />
                  </div>
                  <button
                    onClick={() => { setShowCancelModal(false); setCancelBooking(null); }}
                    className="p-2 hover:bg-stone-100 rounded-full"
                  >
                    <FaTimes />
                  </button>
                </div>

                <h3 className="font-serif text-xl mb-2">Cancel Booking?</h3>
                <p className="text-stone-500 text-sm mb-6">
                  Are you sure you want to cancel your stay at{" "}
                  <span className="font-medium text-stone-900">{cancelBooking.propertyName}</span>?
                </p>

                <div className="bg-stone-50 p-4 rounded-lg mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Check-in</span>
                    <span className="font-medium">{formatDate(cancelBooking.checkIn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Check-out</span>
                    <span className="font-medium">{formatDate(cancelBooking.checkOut)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total paid</span>
                    <span className="font-medium">{formatCurrency(cancelBooking.totalAmount)}</span>
                  </div>
                </div>

                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">⚠️ Refund Policy</p>
                  <p className="text-xs text-amber-700">{cancelCalc?.message}</p>
                  {cancelCalc?.refundAmount > 0 && (
                    <p className="text-sm font-medium text-amber-800 mt-2">
                      Refund amount: {formatCurrency(cancelCalc.refundAmount)}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCancelModal(false); setCancelBooking(null); }}
                    className="flex-1 px-4 py-3 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors text-sm"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={confirmCancellation}
                    disabled={cancelling}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {cancelling
                      ? <><FaSpinner className="animate-spin" /> Cancelling…</>
                      : "Yes, Cancel"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Details Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
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

                <div className="flex gap-2 mb-6 flex-wrap">
                  <span className={`px-3 py-1 text-xs rounded-full border ${getStatusStyle(selectedBooking.status)}`}>
                    {getStatusText(selectedBooking.status)}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-stone-100 text-stone-600">
                    Payment: {selectedBooking.paymentStatus}
                  </span>
                  {selectedBooking.status === "active" && (
                    <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse inline-block" />
                      Currently staying
                    </span>
                  )}
                </div>

                <div className="h-48 rounded-lg overflow-hidden mb-6">
                  <img
                    src={
                      selectedBooking.propertyImage && !selectedBooking.propertyImage.startsWith("http")
                        ? `${IMAGE_BASE_URL}${selectedBooking.propertyImage}`
                        : selectedBooking.propertyImage ||
                          "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800"
                    }
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
                    {/* Balance due only while actively pending payment — never on other statuses */}
                    {selectedBooking.status === "pending" && selectedBooking.pendingAmount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Balance due</span>
                        <span>{formatCurrency(selectedBooking.pendingAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancelled — refund details only if a refund amount was actually set */}
                {selectedBooking.status === "cancelled" && selectedBooking.refundInfo && selectedBooking.refundInfo.refund_amount > 0 && (
                  <div className="border-t border-stone-200 pt-4 mb-6">
                    <h4 className="font-medium mb-3">Cancellation & Refund</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">Cancellation fee</span>
                        <span className="text-red-600">
                          {formatCurrency(selectedBooking.refundInfo.cancellation_fee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Refund amount</span>
                        <span className="text-green-600">
                          {formatCurrency(selectedBooking.refundInfo.refund_amount)}
                        </span>
                      </div>
                      <div className={`mt-2 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                        selectedBooking.refundInfo.refund_processed
                          ? "bg-green-50 text-green-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {selectedBooking.refundInfo.refund_processed ? (
                          <><FaCheck size={10} /> Refund processed{selectedBooking.refundInfo.refund_processed_at && ` on ${formatDate(selectedBooking.refundInfo.refund_processed_at)}`}</>
                        ) : (
                          <><FaClock size={10} /> Refund pending — will be processed within 5-7 business days</>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedBooking.status === "pending" && (
                    <button
                      onClick={() => { setSelectedBooking(null); handlePayNow(selectedBooking); }}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600"
                    >
                      Complete Payment
                    </button>
                  )}
                  <button
                    onClick={() => alert("Invoice download coming soon")}
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

      {/* Concierge */}
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
                  Our concierge team is here 24/7 to help with special requests or questions.
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