import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt, FaUser, FaHome, FaMoneyBillWave,
  FaSearch, FaEye, FaCheck, FaTimes, FaClock,
  FaFilter, FaSync, FaDownload, FaChevronDown,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaCreditCard
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL } from "../services/api";

const AdminBookingsTab = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    revenue: 0
  });

  // Status options
  const statusOptions = [
    { value: "all", label: "All Bookings", color: "bg-stone-500" },
    { value: "pending", label: "Pending", color: "bg-amber-500" },
    { value: "confirmed", label: "Confirmed", color: "bg-green-500" },
    { value: "upcoming", label: "Upcoming", color: "bg-blue-500" },
    { value: "active", label: "Active", color: "bg-purple-500" },
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
      setBookings(data);
      applyFilters(data, searchTerm, statusFilter, dateRange);
      
      // Calculate stats
      const total = data.length;
      const pending = data.filter(b => b.status === 'pending').length;
      const confirmed = data.filter(b => b.status === 'confirmed').length;
      const completed = data.filter(b => b.status === 'completed').length;
      const revenue = data
        .filter(b => b.payment_status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      setStats({ total, pending, confirmed, completed, revenue });
      
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
  const applyFilters = (data, search, status, range) => {
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
    
    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(b => b.status === status);
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
    
    setFilteredBookings(filtered);
  };

  useEffect(() => {
    applyFilters(bookings, searchTerm, statusFilter, dateRange);
  }, [searchTerm, statusFilter, dateRange]);

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await api.admin.updateBookingStatus(bookingId, newStatus);
      fetchBookings(); // Refresh
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      alert('Failed to update booking status');
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
      'upcoming': 'bg-blue-100 text-blue-700 border-blue-200',
      'active': 'bg-purple-100 text-purple-700 border-purple-200',
      'completed': 'bg-stone-100 text-stone-600 border-stone-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200',
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

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Property', 'Guest', 'Email', 'Check In', 'Check Out', 'Nights', 'Total', 'Status', 'Payment', 'Created'];
    const csvData = filteredBookings.map(b => [
      b.id,
      b.property_name,
      b.guest_name,
      b.guest_email,
      b.check_in,
      b.check_out,
      b.nights,
      b.total_amount,
      b.status,
      b.payment_status,
      new Date(b.created_at).toLocaleDateString()
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <p className="text-[10px] uppercase text-stone-500">Total</p>
          <p className="text-2xl font-serif">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <p className="text-[10px] uppercase text-amber-600">Pending</p>
          <p className="text-2xl font-serif text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-green-200">
          <p className="text-[10px] uppercase text-green-600">Confirmed</p>
          <p className="text-2xl font-serif text-green-600">{stats.confirmed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <p className="text-[10px] uppercase text-stone-500">Completed</p>
          <p className="text-2xl font-serif">{stats.completed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-stone-200">
          <p className="text-[10px] uppercase text-stone-500">Revenue</p>
          <p className="text-lg font-serif">{formatCurrency(stats.revenue)}</p>
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
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-900"
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
              className="px-4 py-2 bg-stone-900 text-white rounded-lg flex items-center gap-2 hover:bg-stone-800"
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
              <div className="p-4 bg-stone-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase text-stone-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-stone-200 rounded-lg bg-white"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
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
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Payment</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Timer</th>
                <th className="px-4 py-3 text-[10px] uppercase text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-12 text-stone-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
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
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                        {booking.status}
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
                    <td className="px-4 py-3">
                      {booking.status === 'pending' && booking.expires_at && (
                        <span className="text-xs font-mono">
                          {formatTimeLeft(booking.expires_at)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="p-1 text-stone-400 hover:text-stone-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="p-1 text-green-600 hover:text-green-700"
                            title="Confirm"
                          >
                            <FaCheck />
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            className="p-1 text-stone-600 hover:text-stone-700"
                            title="Complete"
                          >
                            <FaCheck />
                          </button>
                        )}
                        {!['cancelled', 'completed'].includes(booking.status) && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                            className="p-1 text-red-400 hover:text-red-600"
                            title="Cancel"
                          >
                            <FaTimes />
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
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full bg-stone-100`}>
                    Payment: {selectedBooking.payment_status}
                  </span>
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
                    <p className="text-xs text-stone-500">After 2:00 PM</p>
                  </div>
                  <div className="bg-stone-50 p-3 rounded">
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Check Out</p>
                    <p className="font-medium">{formatDate(selectedBooking.check_out)}</p>
                    <p className="text-xs text-stone-500">Before 11:00 AM</p>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-stone-200 pt-4 mb-6">
                  <h4 className="font-medium mb-3">Payment Details</h4>
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

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedBooking.id, 'confirmed');
                        setSelectedBooking(null);
                      }}
                      className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                    >
                      Confirm Booking
                    </button>
                  )}
                  {selectedBooking.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedBooking.id, 'completed');
                        setSelectedBooking(null);
                      }}
                      className="flex-1 bg-stone-900 text-white py-3 rounded-lg hover:bg-stone-800"
                    >
                      Mark Completed
                    </button>
                  )}
                  {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedBooking.id, 'cancelled');
                        setSelectedBooking(null);
                      }}
                      className="flex-1 border border-red-200 text-red-600 py-3 rounded-lg hover:bg-red-50"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBookingsTab;