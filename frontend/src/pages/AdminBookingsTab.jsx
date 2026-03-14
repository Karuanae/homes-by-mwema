import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt, FaUser, FaHome, FaMoneyBillWave,
  FaSearch, FaEye, FaCheck, FaTimes, FaClock,
  FaFilter, FaSync, FaDownload, FaChevronDown,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaCreditCard,
  FaTrash, FaExclamationTriangle, FaHistory, FaChartLine,
  FaRegCalendarCheck, FaRegClock, FaDollarSign, FaPercentage
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL } from "../services/api";

const AdminBookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 0,
    totalRefunds: 0,
    netRevenue: 0,
    pendingPayments: 0,
    averageBookingValue: 0,
    occupancyRate: 0,
    cancellationRate: 0,
    successfulStays: 0
  });

  // Status options for display only
  const statusOptions = [
    { value: "pending", label: "Pending Payment", color: "bg-amber-500" },
    { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
    { value: "completed", label: "Completed", color: "bg-stone-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
    { value: "expired", label: "Expired", color: "bg-stone-400" }
  ];

  // Fetch bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.getBookings();
      const data = response.data || [];
      
      // Process bookings to determine if expired
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const processedData = data.map(booking => {
  const now = new Date();
  
  // Timer-expired: booking is pending AND the expires_at timestamp has passed
  const isTimerExpired = 
    booking.status === 'pending' &&
    booking.expires_at &&
    new Date(booking.expires_at) < now;

  // Use the DB status as truth, but catch the scheduler gap window
  const effectiveStatus = isTimerExpired ? 'expired' : booking.status;

  const refundAmount = booking.refund_amount || 0;
  const cancellationFee = booking.cancellation_fee || 0;
  const netEarnings = booking.payment_status === 'completed'
    ? (booking.total_amount - refundAmount)
    : 0;

  return {
    ...booking,
    isExpired: effectiveStatus === 'expired',
    displayStatus: effectiveStatus,
    refundAmount,
    cancellationFee,
    netEarnings,
    profitMargin: booking.total_amount > 0
      ? ((booking.total_amount - refundAmount) / booking.total_amount * 100).toFixed(1)
      : 0
  };
});
      
      setBookings(processedData);
      
      // Separate bookings by status
      const cancelled = processedData.filter(b => b.status === 'cancelled');
      const expired = processedData.filter(b => b.isExpired);
      const active = processedData.filter(b => !b.isExpired && b.status !== 'cancelled');
      
      setCancelledBookings(cancelled);
      setExpiredBookings(expired);
      
      // Calculate financial statistics
      const totalRevenue = processedData
        .filter(b => b.payment_status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      const totalRefunds = processedData
        .filter(b => b.status === 'cancelled')
        .reduce((sum, b) => sum + (b.refundAmount || 0), 0);
      
      const pendingPayments = processedData
        .filter(b => b.payment_status === 'pending')
        .reduce((sum, b) => sum + (b.pending_amount || b.total_amount || 0), 0);
      
      const completedBookings = processedData.filter(b => b.status === 'completed').length;
      const totalBookings = processedData.length;
      const cancelledCount = processedData.filter(b => b.status === 'cancelled').length;
      
      // Calculate average booking value (excluding cancelled)
      const paidBookings = processedData.filter(b => b.payment_status === 'completed');
      const avgBookingValue = paidBookings.length > 0
        ? paidBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0) / paidBookings.length
        : 0;
      
      // Calculate occupancy rate (simplified - based on completed vs total)
      const occupancyRate = totalBookings > 0 
        ? (completedBookings / totalBookings * 100).toFixed(1)
        : 0;
      
      // Calculate cancellation rate
      const cancellationRate = totalBookings > 0
        ? (cancelledCount / totalBookings * 100).toFixed(1)
        : 0;
      
      setFinancialStats({
        totalRevenue,
        totalRefunds,
        netRevenue: totalRevenue - totalRefunds,
        pendingPayments,
        averageBookingValue: avgBookingValue, // Fixed: using avgBookingValue variable
        occupancyRate,
        cancellationRate,
        successfulStays: completedBookings
      });
      
      // Apply filters
      applyFilters(processedData, searchTerm, dateRange);
      
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Apply filters
  const applyFilters = (data, search, range) => {
    let filtered = [...data];
    
    // Search filter
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(b => 
        b.property_name?.toLowerCase().includes(term) ||
        b.guest_name?.toLowerCase().includes(term) ||
        b.guest_email?.toLowerCase().includes(term) ||
        b.id?.toString().includes(term)
      );
    }
    
    // Date range filter
    if (range.start) {
      filtered = filtered.filter(b => b.check_in >= range.start);
    }
    if (range.end) {
      filtered = filtered.filter(b => b.check_out <= range.end);
    }
    
    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Separate by status
    const expired = filtered.filter(b => b.isExpired);
    const cancelled = filtered.filter(b => b.status === 'cancelled' && !b.isExpired);
    const active = filtered.filter(b => !b.isExpired && b.status !== 'cancelled');
    
    setExpiredBookings(expired);
    setCancelledBookings(cancelled);
    setFilteredBookings(active);
  };

  useEffect(() => {
    applyFilters(bookings, searchTerm, dateRange);
  }, [searchTerm, dateRange]);

  // Handle delete booking
const handleDeleteBooking = async (bookingId) => {
  if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
    return;
  }
  
  setDeleting(true);
  try {
    // Use the admin delete endpoint instead of user cancel
    await api.admin.deleteBooking(bookingId);
    
    // Refresh bookings after successful deletion
    await fetchBookings();
    
    // Close modal if open
    if (selectedBooking?.id === bookingId) {
      setSelectedBooking(null);
    }
    
    alert('Booking deleted successfully');
    
  } catch (error) {
    console.error('Delete error:', error);
    alert(error.response?.data?.error || 'Failed to delete booking');
  } finally {
    setDeleting(false);
  }
};

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  const formatTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-amber-100 text-amber-700 border-amber-200',
      'confirmed': 'bg-green-100 text-green-700 border-green-200',
      'completed': 'bg-stone-100 text-stone-600 border-stone-200',
      'cancelled': 'bg-red-50 text-red-700 border-red-200',
      'expired': 'bg-stone-100 text-stone-500 border-stone-200'
    };
    return colors[status] || 'bg-stone-100 text-stone-600 border-stone-200';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'completed': 'text-green-600',
      'partial': 'text-amber-600',
      'pending': 'text-stone-400',
      'failed': 'text-red-600'
    };
    return colors[status] || 'text-stone-400';
  };

  // Get bookings based on active tab
  const getCurrentBookings = () => {
    if (activeTab === 'expired') return expiredBookings;
    if (activeTab === 'cancelled') return cancelledBookings;
    return filteredBookings.filter(b => b.status === activeTab && !b.isExpired);
  };

  const currentBookings = getCurrentBookings();

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Property', 'Guest', 'Email', 'Check In', 'Check Out', 'Nights', 'Total', 'Refund', 'Net', 'Status', 'Payment', 'Created'];
    const csvData = (activeTab === 'expired' ? expiredBookings : 
                     activeTab === 'cancelled' ? cancelledBookings : 
                     filteredBookings).map(b => [
      b.id,
      b.property_name,
      b.guest_name,
      b.guest_email,
      b.check_in,
      b.check_out,
      b.nights,
      b.total_amount,
      b.refundAmount || 0,
      b.netEarnings || b.total_amount,
      b.displayStatus || b.status,
      b.payment_status,
      new Date(b.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-[#093A3E] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Statistics Dashboard */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="font-serif text-lg mb-4 flex items-center gap-2">
          <FaChartLine className="text-[#093A3E]" /> Financial Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Revenue</p>
            <p className="text-lg font-serif text-green-600">{formatCurrency(financialStats.totalRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Refunds</p>
            <p className="text-lg font-serif text-red-600">{formatCurrency(financialStats.totalRefunds)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Net</p>
            <p className="text-lg font-serif text-[#093A3E]">{formatCurrency(financialStats.netRevenue)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Pending</p>
            <p className="text-lg font-serif text-amber-600">{formatCurrency(financialStats.pendingPayments)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Avg. Booking</p>
            <p className="text-sm font-medium">{formatCurrency(financialStats.averageBookingValue)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Occupancy</p>
            <p className="text-sm font-medium">{financialStats.occupancyRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Cancellation</p>
            <p className="text-sm font-medium">{financialStats.cancellationRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase text-stone-500">Success</p>
            <p className="text-sm font-medium">{financialStats.successfulStays}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => setActiveTab('pending')}
          className={`bg-white p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'pending' ? 'border-amber-500 shadow-md' : 'border-stone-200 hover:border-amber-200'
          }`}
        >
          <p className="text-[10px] uppercase text-amber-600">Pending</p>
          <p className="text-2xl font-serif text-amber-600">{filteredBookings.filter(b => b.status === 'pending').length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('confirmed')}
          className={`bg-white p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'confirmed' ? 'border-green-500 shadow-md' : 'border-stone-200 hover:border-green-200'
          }`}
        >
          <p className="text-[10px] uppercase text-green-600">Confirmed</p>
          <p className="text-2xl font-serif text-green-600">{filteredBookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('completed')}
          className={`bg-white p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'completed' ? 'border-stone-500 shadow-md' : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <p className="text-[10px] uppercase text-stone-500">Completed</p>
          <p className="text-2xl font-serif">{filteredBookings.filter(b => b.status === 'completed').length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('cancelled')}
          className={`bg-white p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'cancelled' ? 'border-red-500 shadow-md' : 'border-stone-200 hover:border-red-200'
          }`}
        >
          <p className="text-[10px] uppercase text-red-600">Cancelled</p>
          <p className="text-2xl font-serif text-red-600">{cancelledBookings.length}</p>
        </div>
        <div 
          onClick={() => setActiveTab('expired')}
          className={`bg-white p-4 rounded-lg border cursor-pointer transition-all ${
            activeTab === 'expired' ? 'border-stone-400 shadow-md' : 'border-stone-200 hover:border-stone-300'
          }`}
        >
          <p className="text-[10px] uppercase text-stone-500">Expired</p>
          <p className="text-2xl font-serif">{expiredBookings.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg border border-stone-200">
        <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by property, guest, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#093A3E]"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-stone-200 rounded-lg flex items-center gap-2 hover:bg-stone-50"
            >
              <FaFilter /> Filters
              <FaChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={fetchBookings}
              className="px-4 py-2 border border-stone-200 rounded-lg flex items-center gap-2 hover:bg-stone-50"
            >
              <FaSync />
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-[#093A3E] text-white rounded-lg flex items-center gap-2 hover:bg-[#0a4a52]"
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-stone-200"
            >
              <div className="p-4 bg-stone-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-stone-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-stone-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">ID</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Property</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Guest</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Dates</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Nights</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Total</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Refund</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Net</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Payment</th>
                {activeTab === 'pending' && (
                  <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Timer</th>
                )}
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBookings.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 13 : 12} className="text-center py-12 text-stone-400">
                    No {activeTab} bookings found
                  </td>
                </tr>
              ) : (
                currentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-3 text-sm">#{booking.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{booking.property_name}</p>
                        <p className="text-xs text-stone-400">{booking.property_location}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{booking.guest_name}</p>
                        <p className="text-xs text-stone-400">{booking.guest_email}</p>
                        {booking.guest_phone && (
                          <p className="text-xs text-stone-400">{booking.guest_phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{formatDate(booking.check_in)}</p>
                      <p className="text-xs text-stone-400">→ {formatDate(booking.check_out)}</p>
                    </td>
                    <td className="px-4 py-3">{booking.nights}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(booking.total_amount)}</td>
                    <td className="px-4 py-3 text-red-600">{formatCurrency(booking.refundAmount || 0)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(booking.netEarnings || booking.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(booking.displayStatus || booking.status)}`}>
                        {booking.displayStatus || booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${getPaymentStatusColor(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                      {booking.pending_amount > 0 && (
                        <p className="text-[10px] text-amber-600">Due: {formatCurrency(booking.pending_amount)}</p>
                      )}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-4 py-3">
                        {booking.expires_at && (
                          <span className="text-xs font-mono">
                            {formatTimeLeft(booking.expires_at)}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1 text-stone-400 hover:text-[#093A3E]"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {(activeTab === 'expired' || activeTab === 'cancelled') && (
                          <button
                            onClick={() => handleDeleteBooking(booking.id)}
                            disabled={deleting}
                            className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50"
                            title="Delete Booking"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary for expired/cancelled tabs */}
        {(activeTab === 'expired' || activeTab === 'cancelled') && currentBookings.length > 0 && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 text-amber-700 text-sm flex items-center gap-2">
            <FaExclamationTriangle />
            <span>
              {activeTab === 'expired' 
                ? 'Expired bookings are past their check-out date and can be safely deleted.'
                : 'Cancelled bookings show refund amounts and can be deleted from the system.'}
            </span>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
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
                      Created: {new Date(selectedBooking.created_at).toLocaleString()}
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
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.displayStatus || selectedBooking.status)}`}>
                    {selectedBooking.displayStatus || selectedBooking.status}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-stone-100">
                    Payment: {selectedBooking.payment_status}
                  </span>
                  {selectedBooking.status === 'cancelled' && (
                    <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700">
                      Refund: {formatCurrency(selectedBooking.refundAmount || 0)}
                    </span>
                  )}
                </div>

                {/* Property Info */}
                <div className="bg-stone-50 p-4 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <FaHome className="text-stone-400" />
                    <div>
                      <h4 className="font-medium">{selectedBooking.property_name}</h4>
                      <p className="text-sm text-stone-500 flex items-center gap-1">
                        <FaMapMarkerAlt className="text-xs" />
                        {selectedBooking.property_location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Guest</p>
                    <p className="font-medium">{selectedBooking.guest_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Contact</p>
                    <p className="text-sm flex items-center gap-2">
                      <FaEnvelope className="text-stone-400" /> {selectedBooking.guest_email}
                    </p>
                    {selectedBooking.guest_phone && (
                      <p className="text-sm flex items-center gap-2 mt-1">
                        <FaPhone className="text-stone-400" /> {selectedBooking.guest_phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-stone-50 p-3 rounded">
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Check In</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_in)}</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded">
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Check Out</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_out)}</p>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div className="border-t border-stone-200 pt-4 mb-6">
                  <h4 className="font-medium mb-3">Financial Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Base amount ({selectedBooking.nights} nights)</span>
                      <span>{formatCurrency(selectedBooking.base_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Cleaning fee</span>
                      <span>{formatCurrency(selectedBooking.cleaning_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Service fee</span>
                      <span>{formatCurrency(selectedBooking.service_fee)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedBooking.total_amount)}</span>
                    </div>
                    
                    {/* Cancellation details if applicable */}
                    {selectedBooking.status === 'cancelled' && (
                      <>
                        <div className="flex justify-between text-red-600 pt-2">
                          <span>Refund issued</span>
                          <span>-{formatCurrency(selectedBooking.refundAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span>Cancellation fee</span>
                          <span>{formatCurrency(selectedBooking.cancellation_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 font-bold pt-2 border-t">
                          <span>Net earnings</span>
                          <span>{formatCurrency(selectedBooking.netEarnings || 0)}</span>
                        </div>
                        {selectedBooking.cancelled_at && (
                          <p className="text-xs text-stone-500 mt-2">
                            Cancelled on: {new Date(selectedBooking.cancelled_at).toLocaleString()}
                          </p>
                        )}
                      </>
                    )}
                    
                    {/* Payment status */}
                    {selectedBooking.paid_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Paid</span>
                        <span>{formatCurrency(selectedBooking.paid_amount)}</span>
                      </div>
                    )}
                    {selectedBooking.pending_amount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Balance due</span>
                        <span>{formatCurrency(selectedBooking.pending_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {(activeTab === 'expired' || activeTab === 'cancelled') && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => handleDeleteBooking(selectedBooking.id)}
                      disabled={deleting}
                      className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash /> Delete Booking
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBookingsTab;