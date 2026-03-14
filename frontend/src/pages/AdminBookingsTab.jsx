import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch, FaEye, FaTimes, FaClock, FaFilter, FaSync,
  FaDownload, FaChevronDown, FaPhone, FaEnvelope,
  FaMapMarkerAlt, FaTrash, FaExclamationTriangle,
  FaChartLine, FaUndo, FaCheckCircle, FaHourglassHalf,
  FaArrowDown, FaArrowUp, FaMoneyBillWave, FaHome,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL } from "../services/api";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `KSh ${Number(n || 0).toLocaleString()}`;

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";
  const m = Math.floor(diff / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const statusStyle = (status) => ({
  pending:   "bg-amber-50   text-amber-700   border border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  completed: "bg-slate-100  text-slate-600   border border-slate-200",
  cancelled: "bg-red-50     text-red-700     border border-red-200",
  expired:   "bg-stone-100  text-stone-500   border border-stone-200",
}[status] || "bg-stone-100 text-stone-500 border border-stone-200");

const payStyle = (status) => ({
  completed: "text-emerald-600 font-medium",
  partial:   "text-amber-600  font-medium",
  pending:   "text-stone-400",
  failed:    "text-red-500",
  refunded:  "text-blue-600  font-medium",
}[status] || "text-stone-400");

// ─── component ────────────────────────────────────────────────────────────────
const AdminBookingsTab = () => {
  const [bookings,          setBookings]          = useState([]);
  const [filteredBookings,  setFilteredBookings]  = useState([]);
  const [cancelledBookings, setCancelledBookings] = useState([]);
  const [expiredBookings,   setExpiredBookings]   = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState(null);
  const [selectedBooking,   setSelectedBooking]   = useState(null);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [activeTab,         setActiveTab]         = useState("pending");
  const [dateRange,         setDateRange]         = useState({ start: "", end: "" });
  const [showFilters,       setShowFilters]       = useState(false);
  const [deleting,          setDeleting]          = useState(false);

  // refund state
  const [refundModal,  setRefundModal]  = useState(null);
  const [refundNote,   setRefundNote]   = useState("");
  const [refunding,    setRefunding]    = useState(false);
  const [refundResult, setRefundResult] = useState(null);

  const [stats, setStats] = useState({
    totalRevenue: 0, totalRefunds: 0, netRevenue: 0,
    pendingPayments: 0, averageBookingValue: 0,
    occupancyRate: 0, cancellationRate: 0, successfulStays: 0,
    pendingRefundsTotal: 0, pendingRefundsCount: 0,
  });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data = [] } = await api.admin.getBookings();
      const now = new Date();

      const processed = data.map((b) => {
        const isTimerExpired =
          b.status === "pending" && b.expires_at && new Date(b.expires_at) < now;
        const effectiveStatus = isTimerExpired ? "expired" : b.status;
        const refundAmount    = b.refund_amount || 0;
        const netEarnings     =
          b.payment_status === "completed" ? b.total_amount - refundAmount : 0;
        return {
          ...b,
          isExpired:     effectiveStatus === "expired",
          displayStatus: effectiveStatus,
          refundAmount,
          netEarnings,
          needsRefund:
            b.status === "cancelled" && refundAmount > 0 && !b.refund_processed,
          profitMargin:
            b.total_amount > 0
              ? (((b.total_amount - refundAmount) / b.total_amount) * 100).toFixed(1)
              : 0,
        };
      });

      setBookings(processed);

      const paid      = processed.filter((b) => b.payment_status === "completed");
      const cancelled = processed.filter((b) => b.status === "cancelled");
      const completed = processed.filter((b) => b.status === "completed");
      const total     = processed.length;

      const totalRevenue = paid.reduce((s, b) => s + (b.total_amount || 0), 0);
      const totalRefunds = cancelled.reduce((s, b) => s + (b.refundAmount || 0), 0);
      const needRefund   = processed.filter((b) => b.needsRefund);

      setStats({
        totalRevenue,
        totalRefunds,
        netRevenue:          totalRevenue - totalRefunds,
        pendingPayments:     processed
          .filter((b) => b.payment_status === "pending")
          .reduce((s, b) => s + (b.pending_amount || b.total_amount || 0), 0),
        averageBookingValue:
          paid.length > 0
            ? paid.reduce((s, b) => s + (b.total_amount || 0), 0) / paid.length
            : 0,
        occupancyRate:       total > 0 ? ((completed.length / total) * 100).toFixed(1) : 0,
        cancellationRate:    total > 0 ? ((cancelled.length / total) * 100).toFixed(1) : 0,
        successfulStays:     completed.length,
        pendingRefundsTotal: needRefund.reduce((s, b) => s + b.refundAmount, 0),
        pendingRefundsCount: needRefund.length,
      });

      applyFilters(processed, searchTerm, dateRange);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── filters ────────────────────────────────────────────────────────────────
  const applyFilters = (data, search, range) => {
    let f = [...data];
    if (search) {
      const t = search.toLowerCase();
      f = f.filter(
        (b) =>
          b.property_name?.toLowerCase().includes(t) ||
          b.guest_name?.toLowerCase().includes(t) ||
          b.guest_email?.toLowerCase().includes(t) ||
          String(b.id).includes(t)
      );
    }
    if (range.start) f = f.filter((b) => b.check_in >= range.start);
    if (range.end)   f = f.filter((b) => b.check_out <= range.end);
    f.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setExpiredBookings(f.filter((b) => b.isExpired));
    setCancelledBookings(f.filter((b) => b.status === "cancelled" && !b.isExpired));
    setFilteredBookings(f.filter((b) => !b.isExpired && b.status !== "cancelled"));
  };

  useEffect(() => { applyFilters(bookings, searchTerm, dateRange); }, [searchTerm, dateRange]);

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.admin.deleteBooking(id);
      await fetchBookings();
      if (selectedBooking?.id === id) setSelectedBooking(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete booking");
    } finally {
      setDeleting(false);
    }
  };

  // ── refund ─────────────────────────────────────────────────────────────────
  const openRefund = (booking, e) => {
    e?.stopPropagation();
    setRefundNote("");
    setRefundResult(null);
    setRefundModal(booking);
  };

  const handleRefund = async () => {
    if (!refundModal) return;
    setRefunding(true);
    setRefundResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/payments/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: refundModal.id,
          note: refundNote || `Refund for cancelled booking #${refundModal.id}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRefundResult({
          success: true,
          message: `${fmt(data.refund_amount)} refunded successfully via ${data.method?.toUpperCase()}.`,
        });
        await fetchBookings();
        if (selectedBooking?.id === refundModal.id)
          setSelectedBooking((p) => ({ ...p, refund_processed: true, needsRefund: false }));
      } else {
        setRefundResult({ success: false, message: data.error || "Refund failed." });
      }
    } catch {
      setRefundResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setRefunding(false);
    }
  };

  // ── CSV ────────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows =
      activeTab === "expired"   ? expiredBookings :
      activeTab === "cancelled" ? cancelledBookings :
      filteredBookings;
    const hdrs = ["ID","Property","Guest","Email","Check In","Check Out","Nights",
                  "Total","Refund","Net","Status","Payment","Refund Processed","Created"];
    const csv = [hdrs, ...rows.map((b) => [
      b.id, b.property_name, b.guest_name, b.guest_email,
      b.check_in, b.check_out, b.nights, b.total_amount,
      b.refundAmount || 0, b.netEarnings || b.total_amount,
      b.displayStatus || b.status, b.payment_status,
      b.refund_processed ? "Yes" : "No",
      new Date(b.created_at).toLocaleDateString(),
    ])].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `bookings_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ── derived ────────────────────────────────────────────────────────────────
  const currentBookings =
    activeTab === "expired"   ? expiredBookings :
    activeTab === "cancelled" ? cancelledBookings :
    filteredBookings.filter((b) => b.status === activeTab && !b.isExpired);

  const counts = {
    pending:   filteredBookings.filter((b) => b.status === "pending").length,
    confirmed: filteredBookings.filter((b) => b.status === "confirmed").length,
    completed: filteredBookings.filter((b) => b.status === "completed").length,
    cancelled: cancelledBookings.length,
    expired:   expiredBookings.length,
  };

  // ── loading / error guards ─────────────────────────────────────────────────
  if (loading) return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-2 border-stone-200 border-t-[#093A3E] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
      <FaExclamationTriangle className="mx-auto mb-2 text-2xl" />
      <p>{error}</p>
      <button onClick={fetchBookings} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
    </div>
  );

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* FINANCIAL OVERVIEW */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <FaChartLine className="text-[#093A3E] text-sm" />
          <span className="text-sm font-medium text-stone-700">Financial overview</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y divide-stone-100">
          {[
            { label: "Gross revenue",    val: fmt(stats.totalRevenue),         cls: "text-emerald-600", icon: <FaArrowUp className="text-emerald-400 text-xs" /> },
            { label: "Refunds paid",     val: fmt(stats.totalRefunds),          cls: "text-red-500",     icon: <FaArrowDown className="text-red-400 text-xs" /> },
            { label: "Net revenue",      val: fmt(stats.netRevenue),            cls: "text-[#093A3E]",   icon: <FaMoneyBillWave className="text-[#093A3E]/40 text-xs" /> },
            { label: "Pending payments", val: fmt(stats.pendingPayments),       cls: "text-amber-600",   icon: <FaHourglassHalf className="text-amber-400 text-xs" /> },
            { label: "Avg. booking",     val: fmt(stats.averageBookingValue),   cls: "text-stone-700",   icon: null },
          ].map(({ label, val, cls, icon }) => (
            <div key={label} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wider text-stone-400">{label}</p>
                {icon}
              </div>
              <p className={`text-xl font-serif ${cls}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* pending refunds alert */}
        {stats.pendingRefundsCount > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <FaExclamationTriangle className="text-amber-500 shrink-0" />
              <span>
                <strong>{stats.pendingRefundsCount}</strong> cancelled booking{stats.pendingRefundsCount > 1 ? "s" : ""} awaiting refund payout —{" "}
                <strong>{fmt(stats.pendingRefundsTotal)}</strong> outstanding
              </span>
            </div>
            <button onClick={() => setActiveTab("cancelled")}
              className="text-xs text-amber-700 underline underline-offset-2 whitespace-nowrap shrink-0">
              View cancelled →
            </button>
          </div>
        )}
      </div>

      {/* TAB CARDS */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: "pending",   label: "Pending",   active: "border-amber-400",   text: "text-amber-600" },
          { key: "confirmed", label: "Confirmed", active: "border-emerald-400", text: "text-emerald-600" },
          { key: "completed", label: "Completed", active: "border-stone-500",   text: "text-stone-600" },
          { key: "cancelled", label: "Cancelled", active: "border-red-400",     text: "text-red-600" },
          { key: "expired",   label: "Expired",   active: "border-stone-300",   text: "text-stone-400" },
        ].map(({ key, label, active, text }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`bg-white p-4 rounded-xl border-2 text-left transition-all ${
              activeTab === key ? `${active} shadow-md` : "border-stone-200 hover:border-stone-300"
            }`}>
            <p className={`text-[10px] uppercase tracking-wider ${activeTab === key ? text : "text-stone-400"}`}>{label}</p>
            <p className={`text-2xl font-serif mt-1 ${activeTab === key ? text : "text-stone-700"}`}>{counts[key]}</p>
            {key === "cancelled" && stats.pendingRefundsCount > 0 && (
              <p className="text-[9px] text-amber-500 mt-0.5">{stats.pendingRefundsCount} need refund</p>
            )}
          </button>
        ))}
      </div>

      {/* TABLE CARD */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">

        {/* toolbar */}
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
            <input type="text" placeholder="Search property, guest, ID…"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-[#093A3E]" />
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm border border-stone-200 rounded-lg flex items-center gap-1.5 hover:bg-stone-50">
              <FaFilter className="text-xs" /> Filters
              <FaChevronDown className={`text-xs transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
            <button onClick={fetchBookings}
              className="px-3 py-2 border border-stone-200 rounded-lg hover:bg-stone-50">
              <FaSync className="text-sm text-stone-500" />
            </button>
            <button onClick={exportCSV}
              className="px-3 py-2 bg-[#093A3E] text-white text-sm rounded-lg flex items-center gap-1.5 hover:bg-[#0a4a52]">
              <FaDownload className="text-xs" /> Export
            </button>
          </div>
        </div>

        {/* date filter */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-stone-100">
              <div className="p-4 bg-stone-50 grid grid-cols-2 gap-4">
                {["start", "end"].map((k) => (
                  <div key={k}>
                    <label className="block text-[10px] uppercase text-stone-400 mb-1">
                      {k === "start" ? "From date" : "To date"}
                    </label>
                    <input type="date" value={dateRange[k]}
                      onChange={(e) => setDateRange({ ...dateRange, [k]: e.target.value })}
                      className="w-full p-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:border-[#093A3E]" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {["ID","Property","Guest","Dates","Nts","Total","Refund","Net","Status","Payment",
                  ...(activeTab === "pending" ? ["Timer"] : []),
                  "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-wider text-stone-400 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {currentBookings.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "pending" ? 12 : 11}
                    className="px-4 py-14 text-center text-stone-400 text-sm">
                    No {activeTab} bookings found
                  </td>
                </tr>
              ) : currentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-stone-400">#{b.id}</td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="font-medium text-stone-800 truncate">{b.property_name}</p>
                    <p className="text-xs text-stone-400 truncate">{b.property_location}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="font-medium text-stone-800 truncate">{b.guest_name}</p>
                    <p className="text-xs text-stone-400 truncate">{b.guest_email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-stone-700">{fmtDate(b.check_in)}</p>
                    <p className="text-xs text-stone-400">→ {fmtDate(b.check_out)}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{b.nights}</td>
                  <td className="px-4 py-3 font-medium text-stone-800 whitespace-nowrap">{fmt(b.total_amount)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {b.refundAmount > 0
                      ? <span className="text-red-500">{fmt(b.refundAmount)}</span>
                      : <span className="text-stone-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-emerald-600 font-medium whitespace-nowrap">{fmt(b.netEarnings || b.total_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${statusStyle(b.displayStatus || b.status)}`}>
                      {b.displayStatus || b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs whitespace-nowrap ${payStyle(b.payment_status)}`}>
                      {b.payment_status}
                    </span>
                    {b.pending_amount > 0 && (
                      <p className="text-[10px] text-amber-500 mt-0.5">Due: {fmt(b.pending_amount)}</p>
                    )}
                    {b.status === "cancelled" && b.refundAmount > 0 && (
                      <p className={`text-[10px] mt-0.5 ${b.refund_processed ? "text-emerald-500" : "text-amber-500"}`}>
                        {b.refund_processed ? "✓ Refunded" : "⚠ Pending refund"}
                      </p>
                    )}
                  </td>
                  {activeTab === "pending" && (
                    <td className="px-4 py-3">
                      {b.expires_at && (
                        <span className="font-mono text-xs text-amber-600">{fmtTimeLeft(b.expires_at)}</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedBooking(b)}
                        className="p-1.5 text-stone-400 hover:text-[#093A3E] hover:bg-stone-100 rounded transition-colors"
                        title="View details">
                        <FaEye className="text-xs" />
                      </button>
                      {b.needsRefund && (
                        <button onClick={(e) => openRefund(b, e)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Process refund">
                          <FaUndo className="text-xs" />
                        </button>
                      )}
                      {(activeTab === "expired" || activeTab === "cancelled") && (
                        <button onClick={() => handleDelete(b.id)} disabled={deleting}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                          title="Delete">
                          <FaTrash className="text-xs" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(activeTab === "expired" || activeTab === "cancelled") && currentBookings.length > 0 && (
          <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-400 flex items-center gap-2">
            <FaExclamationTriangle className="text-amber-400 shrink-0" />
            {activeTab === "expired"
              ? "Expired bookings received no payment. Safe to delete."
              : "Process refunds before deleting cancelled bookings."}
          </div>
        )}
      </div>

      {/* BOOKING DETAIL MODAL */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedBooking(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-serif text-2xl text-stone-900">Booking #{selectedBooking.id}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Created {new Date(selectedBooking.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setSelectedBooking(null)}
                    className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <FaTimes className="text-stone-500" />
                  </button>
                </div>

                {/* badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`px-3 py-1 text-xs rounded-full ${statusStyle(selectedBooking.displayStatus || selectedBooking.status)}`}>
                    {selectedBooking.displayStatus || selectedBooking.status}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full bg-stone-100 ${payStyle(selectedBooking.payment_status)}`}>
                    Payment: {selectedBooking.payment_status}
                  </span>
                  {selectedBooking.refund_processed && (
                    <span className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <FaCheckCircle className="text-emerald-500" /> Refund processed
                    </span>
                  )}
                  {selectedBooking.needsRefund && (
                    <span className="px-3 py-1 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      Refund pending
                    </span>
                  )}
                </div>

                {/* property */}
                <div className="bg-stone-50 p-4 rounded-xl mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-stone-200 rounded-lg flex items-center justify-center shrink-0">
                    <FaHome className="text-stone-500" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-800">{selectedBooking.property_name}</p>
                    <p className="text-sm text-stone-400 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-[10px]" /> {selectedBooking.property_location}
                    </p>
                  </div>
                </div>

                {/* guest + dates */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[10px] uppercase text-stone-400 mb-1">Guest</p>
                    <p className="font-medium text-stone-800">{selectedBooking.guest_name}</p>
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                      <FaEnvelope className="text-[10px]" /> {selectedBooking.guest_email}
                    </p>
                    {selectedBooking.guest_phone && (
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <FaPhone className="text-[10px]" /> {selectedBooking.guest_phone}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Check in", selectedBooking.check_in], ["Check out", selectedBooking.check_out]].map(([lbl, d]) => (
                      <div key={lbl} className="bg-stone-50 p-3 rounded-xl">
                        <p className="text-[10px] uppercase text-stone-400 mb-1">{lbl}</p>
                        <p className="text-sm font-medium text-stone-800">{fmtDate(d)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* financials */}
                <div className="border-t border-stone-100 pt-5 mb-5">
                  <p className="text-[10px] uppercase text-stone-400 tracking-wider mb-3">Financial breakdown</p>
                  <div className="space-y-2 text-sm">
                    {[
                      [`Base (${selectedBooking.nights} nights)`, selectedBooking.base_amount],
                      ["Cleaning fee", selectedBooking.cleaning_fee],
                      ["Service fee",  selectedBooking.service_fee],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="flex justify-between text-stone-600">
                        <span>{lbl}</span><span>{fmt(val)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-100">
                      <span>Total</span><span>{fmt(selectedBooking.total_amount)}</span>
                    </div>

                    {selectedBooking.status === "cancelled" && selectedBooking.refundAmount > 0 && (
                      <>
                        <div className="flex justify-between text-red-500 pt-1">
                          <span>Refund issued</span>
                          <span>− {fmt(selectedBooking.refundAmount)}</span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span>Cancellation fee kept</span>
                          <span>{fmt(selectedBooking.cancellation_fee)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-emerald-700 pt-2 border-t border-stone-100">
                          <span>Net earnings</span>
                          <span>{fmt(selectedBooking.netEarnings)}</span>
                        </div>
                        {selectedBooking.cancelled_at && (
                          <p className="text-xs text-stone-400 mt-1">
                            Cancelled {new Date(selectedBooking.cancelled_at).toLocaleString()}
                          </p>
                        )}
                        <div className={`mt-3 px-3 py-2.5 rounded-xl text-xs flex items-center gap-2 ${
                          selectedBooking.refund_processed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {selectedBooking.refund_processed
                            ? <><FaCheckCircle /> Refund paid out{selectedBooking.refund_processed_at && ` on ${fmtDate(selectedBooking.refund_processed_at)}`}</>
                            : <><FaExclamationTriangle /> Refund of {fmt(selectedBooking.refundAmount)} has not been processed yet</>
                          }
                        </div>
                      </>
                    )}

                    {selectedBooking.paid_amount > 0 && (
                      <div className="flex justify-between text-emerald-600 pt-1">
                        <span>Amount paid</span><span>{fmt(selectedBooking.paid_amount)}</span>
                      </div>
                    )}
                    {selectedBooking.pending_amount > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Balance due</span><span>{fmt(selectedBooking.pending_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* modal actions */}
                <div className="flex gap-3 pt-1">
                  {selectedBooking.needsRefund && !selectedBooking.refund_processed && (
                    <button
                      onClick={() => { setSelectedBooking(null); openRefund(selectedBooking); }}
                      className="flex-1 bg-[#093A3E] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#0a4a52] flex items-center justify-center gap-2 transition-colors">
                      <FaUndo /> Process refund
                    </button>
                  )}
                  {(activeTab === "expired" || activeTab === "cancelled") && (
                    <button onClick={() => handleDelete(selectedBooking.id)} disabled={deleting}
                      className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                      {deleting
                        ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting…</>
                        : <><FaTrash /> Delete booking</>}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REFUND MODAL */}
      <AnimatePresence>
        {refundModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => !refunding && setRefundModal(null)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="font-serif text-xl text-stone-900">Process refund</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Booking #{refundModal.id} · {refundModal.guest_name}
                    </p>
                  </div>
                  {!refunding && (
                    <button onClick={() => setRefundModal(null)}
                      className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                      <FaTimes className="text-stone-400" />
                    </button>
                  )}
                </div>

                {/* result banner */}
                <AnimatePresence>
                  {refundResult && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl mb-5 flex items-start gap-3 text-sm border ${
                        refundResult.success
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                      {refundResult.success
                        ? <FaCheckCircle className="mt-0.5 shrink-0" />
                        : <FaExclamationTriangle className="mt-0.5 shrink-0" />}
                      <p>{refundResult.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* amount summary */}
                <div className="bg-stone-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Original booking total</span>
                    <span className="font-medium">{fmt(refundModal.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Cancellation fee retained</span>
                    <span className="font-medium text-amber-600">{fmt(refundModal.cancellation_fee || 0)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-stone-900 pt-2 border-t border-stone-200">
                    <span>Amount to refund</span>
                    <span className="text-emerald-700 text-base">{fmt(refundModal.refundAmount)}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 pt-1">
                    Will be sent via{" "}
                    <strong className="text-stone-600">
                      {refundModal.payment_method?.toUpperCase() || "original payment method"}
                    </strong>
                    {refundModal.payment_method === "mpesa" && " B2C to the customer's registered number."}
                    {refundModal.payment_method === "paypal" && " as a PayPal capture refund."}
                  </p>
                </div>

                {/* note */}
                {!refundResult?.success && (
                  <div className="mb-5">
                    <label className="block text-[10px] uppercase text-stone-400 tracking-wider mb-1.5">
                      Internal note (optional)
                    </label>
                    <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)}
                      disabled={refunding} rows={2}
                      placeholder="Reason for refund, customer request details…"
                      className="w-full p-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:border-[#093A3E] resize-none bg-stone-50 disabled:opacity-50" />
                  </div>
                )}

                {/* actions */}
                <div className="flex gap-3">
                  {refundResult?.success ? (
                    <button onClick={() => setRefundModal(null)}
                      className="flex-1 bg-[#093A3E] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#0a4a52] transition-colors">
                      Done
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setRefundModal(null)} disabled={refunding}
                        className="flex-1 py-3 border border-stone-200 rounded-xl text-sm hover:bg-stone-50 disabled:opacity-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={handleRefund} disabled={refunding}
                        className="flex-1 bg-[#093A3E] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#0a4a52] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                        {refunding
                          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
                          : <><FaUndo /> Refund {fmt(refundModal.refundAmount)}</>}
                      </button>
                    </>
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