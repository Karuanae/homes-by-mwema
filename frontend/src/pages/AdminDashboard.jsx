// admindashboard.jsx - WITH FIXED CONSULTATIONS TAB and Mobile Sidebar
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBuilding, FaCalendarAlt, FaUsers, FaEnvelope,
  FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaSync, FaEye,
  FaSearch, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt,
  FaUpload, FaCamera, FaComments, FaUser, FaClock,
  FaBell, FaTimes, FaPhone, FaEnvelopeOpen, FaCalendarCheck,
  FaClipboardList, FaCheckCircle, FaHourglassHalf, FaTimesCircle,
  FaBars, FaChevronDown,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/Chat/ChatWindow";
import socketService from "../services/socketService";

// ─── helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d) ? raw : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtTime(hour, minute) {
  if (hour == null) return "TBD";
  const h = Number(hour);
  const m = String(minute || 0).padStart(2, "0");
  return `${String(h).padStart(2, "0")}:${m}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { cls: "text-amber-600 bg-amber-50 border-amber-200",   icon: <FaHourglassHalf className="text-[10px]"/>, label: "Pending"   },
  confirmed: { cls: "text-green-700 bg-green-50 border-green-200",   icon: <FaCheckCircle   className="text-[10px]"/>, label: "Confirmed" },
  cancelled: { cls: "text-red-600   bg-red-50   border-red-200",     icon: <FaTimesCircle   className="text-[10px]"/>, label: "Cancelled" },
  completed: { cls: "text-stone-600 bg-stone-50 border-stone-200",   icon: <FaCheckCircle   className="text-[10px]"/>, label: "Completed" },
};

const ConsultStatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 border rounded-full font-medium ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

// ─── Consultation Detail Modal ────────────────────────────────────────────────
function ConsultDetailModal({ consult, onClose, onStatusChange, updating }) {
  if (!consult) return null;

  const ACTIONS = [
    { label: "Confirm",  nextStatus: "confirmed", show: !["confirmed","completed","cancelled"].includes(consult.status), color: "bg-green-700 hover:bg-green-800 text-white" },
    { label: "Complete", nextStatus: "completed", show: consult.status === "confirmed",                                   color: "bg-stone-700 hover:bg-stone-900 text-white" },
    { label: "Cancel",   nextStatus: "cancelled", show: !["cancelled","completed"].includes(consult.status),              color: "border border-red-200 text-red-600 hover:bg-red-50" },
  ].filter(a => a.show);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          className="bg-white w-full max-w-lg shadow-2xl relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="h-1 bg-[#1C2321] w-full" />

          <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">
                  Consultation #{consult.id}
                </p>
                <ConsultStatusBadge status={consult.status} />
              </div>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition-colors p-1">
                <FaTimes />
              </button>
            </div>

            {/* Client section */}
            <div className="bg-stone-50 border border-stone-100 p-5 mb-6 space-y-3">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">Client Information</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C2321] text-white flex items-center justify-center font-serif text-sm flex-shrink-0">
                  {(consult.user_name || consult.user_email || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-serif text-[#1C2321] text-base">
                    {consult.user_name || <span className="italic text-stone-400">Name not provided</span>}
                  </p>
                  {consult.user_email && (
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <FaEnvelopeOpen className="text-[10px]" /> {consult.user_email}
                    </p>
                  )}
                  {consult.user_phone && (
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <FaPhone className="text-[10px]" /> {consult.user_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-stone-50 border border-stone-100 p-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Date</p>
                <p className="font-serif text-[#1C2321]">{fmtDate(consult.date)}</p>
              </div>
              <div className="bg-stone-50 border border-stone-100 p-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Time</p>
                <p className="font-serif text-[#1C2321]">{fmtTime(consult.hour, consult.minute)}</p>
              </div>
            </div>

            {consult.notes && (
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Client Notes</p>
                <p className="text-stone-700 text-sm font-light leading-relaxed border-l-2 border-stone-200 pl-4">
                  {consult.notes}
                </p>
              </div>
            )}

            {/* Action buttons */}
            {ACTIONS.length > 0 && (
              <div className="pt-5 border-t border-stone-100 flex flex-wrap gap-3">
                {ACTIONS.map(a => (
                  <button
                    key={a.nextStatus}
                    onClick={() => onStatusChange(consult.id, a.nextStatus)}
                    disabled={updating}
                    className={`flex-1 py-2.5 text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50 ${a.color}`}
                  >
                    {updating ? "Updating…" : a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Consultations Tab ────────────────────────────────────────────────────────
function ConsultationsTab({ consultations, loading, error, onRefresh, onStatusChange, updatingId }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  // Keep modal in sync if status changes while it's open
  useEffect(() => {
    if (selected) {
      const updated = consultations.find(c => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [consultations]);

  const counts = consultations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key: "all",       label: "All",       count: consultations.length },
    { key: "pending",   label: "Pending",   count: counts.pending   || 0 },
    { key: "confirmed", label: "Confirmed", count: counts.confirmed || 0 },
    { key: "completed", label: "Completed", count: counts.completed || 0 },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled || 0 },
  ];

  const visible = consultations
    .filter(c => filter === "all" || c.status === filter)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (c.user_name  || "").toLowerCase().includes(q) ||
        (c.user_email || "").toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });

  const handleStatusChange = async (id, status) => {
    await onStatusChange(id, status);
    // Refresh selected modal to reflect new status
    const updated = consultations.find(c => c.id === id);
    if (updated && selected?.id === id) setSelected({ ...updated, status });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total",     value: consultations.length,    accent: "border-l-stone-400"  },
          { label: "Pending",   value: counts.pending   || 0,   accent: "border-l-amber-400"  },
          { label: "Confirmed", value: counts.confirmed || 0,   accent: "border-l-green-500"  },
          { label: "Completed", value: counts.completed || 0,   accent: "border-l-stone-300"  },
        ].map((s, i) => (
          <div key={i} className={`bg-white p-5 border border-stone-100 border-l-4 ${s.accent} shadow-sm`}>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">{s.label}</p>
            <p className="text-3xl font-serif text-[#1C2321]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-stone-100 shadow-sm">
        <div className="bg-[#1C2321] text-white px-6 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-[#D4AF37] text-lg" />
            <div>
              <h3 className="font-serif text-lg md:text-xl">Consultation Requests</h3>
              <p className="text-stone-400 text-[10px] uppercase tracking-widest">
                {visible.length} of {consultations.length} shown
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="text-stone-400 hover:text-white transition-colors p-2"
            title="Refresh"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-stone-200 focus:border-[#1C2321] focus:outline-none bg-stone-50"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-colors ${
                  filter === f.key
                    ? "bg-[#1C2321] text-white border-[#1C2321]"
                    : "bg-white text-stone-500 border-stone-200 hover:border-[#1C2321]"
                }`}
              >
                {f.label} {f.count > 0 ? `(${f.count})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-serif text-stone-400 italic">Loading consultations…</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={onRefresh} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600">
              Retry
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="p-20 text-center">
            <FaCalendarCheck className="text-4xl text-stone-200 mx-auto mb-4" />
            <p className="font-serif text-stone-400 italic">
              {search ? "No results match your search." : "No consultation requests yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  {["#", "Client", "Date & Time", "Notes", "Status", "Actions"].map(h => (
                    <th key={h} className="py-4 px-4 md:px-6 text-[10px] uppercase tracking-widest text-stone-500 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visible.map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#F9F8F6] transition-colors group cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    {/* ID */}
                    <td className="py-4 md:py-5 px-4 md:px-6 text-stone-400 text-sm font-light">
                      #{c.id}
                    </td>

                    {/* Client — now shows name + email */}
                    <td className="py-4 md:py-5 px-4 md:px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1C2321] text-white flex items-center justify-center text-xs font-serif flex-shrink-0">
                          {(c.user_name || c.user_email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-serif text-[#1C2321] text-sm leading-tight">
                            {c.user_name || <span className="italic text-stone-400">Unknown</span>}
                          </p>
                          {c.user_email && (
                            <p className="text-xs text-stone-400 mt-0.5">{c.user_email}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 md:py-5 px-4 md:px-6">
                      <p className="text-sm text-stone-700">{fmtDate(c.date)}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{fmtTime(c.hour, c.minute)}</p>
                    </td>

                    {/* Notes */}
                    <td className="py-4 md:py-5 px-4 md:px-6 max-w-[180px]">
                      <p className="text-sm text-stone-600 font-light truncate">
                        {c.notes || <span className="text-stone-300 italic">No notes</span>}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-4 md:py-5 px-4 md:px-6">
                      <ConsultStatusBadge status={c.status} />
                    </td>

                    {/* Quick-action buttons — stop propagation so row click doesn't fire */}
                    <td
                      className="py-4 md:py-5 px-4 md:px-6"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!["confirmed","completed","cancelled"].includes(c.status) && (
                          <button
                            onClick={() => onStatusChange(c.id, "confirmed")}
                            disabled={updatingId === c.id}
                            className="text-[10px] uppercase tracking-widest px-2 py-1 bg-green-700 text-white hover:bg-green-800 transition-colors disabled:opacity-50 rounded"
                          >
                            {updatingId === c.id ? "…" : "Confirm"}
                          </button>
                        )}
                        {c.status === "confirmed" && (
                          <button
                            onClick={() => onStatusChange(c.id, "completed")}
                            disabled={updatingId === c.id}
                            className="text-[10px] uppercase tracking-widest px-2 py-1 bg-stone-700 text-white hover:bg-stone-900 transition-colors disabled:opacity-50 rounded"
                          >
                            {updatingId === c.id ? "…" : "Complete"}
                          </button>
                        )}
                        {!["cancelled","completed"].includes(c.status) && (
                          <button
                            onClick={() => onStatusChange(c.id, "cancelled")}
                            disabled={updatingId === c.id}
                            className="text-[10px] uppercase tracking-widest px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 rounded"
                          >
                            {updatingId === c.id ? "…" : "Cancel"}
                          </button>
                        )}
                        {/* Detail button */}
                        <button
                          onClick={() => setSelected(c)}
                          className="text-[10px] uppercase tracking-widest px-2 py-1 border border-stone-200 text-stone-500 hover:bg-stone-50 rounded"
                          title="View full details"
                        >
                          <FaEye className="text-[10px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <ConsultDetailModal
          consult={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          updating={updatingId === selected.id}
        />
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_properties: 0, active_bookings: 0, total_users: 0, total_revenue: 0,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [properties,    setProperties]    = useState([]);
  const [bookings,      setBookings]      = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [messages,      setMessages]      = useState([]);
  const [consultations, setConsultations] = useState([]);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConsults, setLoadingConsults] = useState(false);
  const [consultsError,   setConsultsError]   = useState("");
  const [updatingConsult, setUpdatingConsult] = useState(null);

  const [selectedChat,    setSelectedChat]    = useState(null);
  const [unreadCount,     setUnreadCount]     = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  const [showAddProperty,  setShowAddProperty]  = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(null);
  const [uploading,        setUploading]        = useState(false);

  const [selectedClient,       setSelectedClient]       = useState(null);
  const [deletingClient,       setDeletingClient]       = useState(false);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  const [newProperty, setNewProperty] = useState({
    name: "", type: "studio", price: "", location: "", description: "",
    coverImage: null, coverPreview: "", galleryImages: [], galleryPreviews: [],
    amenities: [], rooms: 1, bathrooms: 1, maxGuests: 2, area: "",
  });

  const predefinedAmenities = [
    { label: "WiFi",       value: "wifi"       }, { label: "Pool",      value: "pool"      },
    { label: "Parking",    value: "parking"    }, { label: "AC",        value: "ac"        },
    { label: "Kitchen",    value: "kitchen"    }, { label: "TV",        value: "tv"        },
    { label: "Gym",        value: "gym"        }, { label: "Spa",       value: "spa"       },
    { label: "Concierge",  value: "concierge"  }, { label: "Security",  value: "security"  },
    { label: "Laundry",    value: "laundry"    }, { label: "Breakfast", value: "breakfast" },
    { label: "Elevator",   value: "elevator"   }, { label: "Fireplace", value: "fireplace" },
    { label: "BBQ Grill",  value: "bbq"        }, { label: "Balcony",   value: "balcony"   },
  ];

  const navItems = [
    { id: "dashboard",     label: "Dashboard",     icon: FaHome },
    { id: "properties",    label: "Properties",    icon: FaBuilding },
    { id: "bookings",      label: "Bookings",      icon: FaCalendarAlt },
    { id: "customers",     label: "Clients",       icon: FaUsers },
    { id: "consultations", label: "Consultations", icon: FaClipboardList },
    { id: "messages",      label: "Chat",          icon: FaEnvelope, badge: unreadCount > 0 ? unreadCount : null },
  ];

  // ── Blob cleanup ─────────────────────────────────────────────────────────────
  const cleanupBlobUrls = useCallback(() => {
    if (newProperty.coverPreview?.startsWith("blob:")) URL.revokeObjectURL(newProperty.coverPreview);
    newProperty.galleryPreviews.forEach(u => u?.startsWith("blob:") && URL.revokeObjectURL(u));
  }, [newProperty.coverPreview, newProperty.galleryPreviews]);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats(); fetchProperties(); fetchBookings(); fetchCustomers();
    if (user?.role === "admin") initializeSocket();
    return () => {
      socketService.off("socket_connected");
      socketService.off("socket_disconnected");
      socketService.off("chat_notification");
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === "messages")      fetchMessages();
    if (activeTab === "consultations") fetchConsultations();
  }, [activeTab]);

  useEffect(() => () => cleanupBlobUrls(), [cleanupBlobUrls]);

  // ── Socket ────────────────────────────────────────────────────────────────────
  const initializeSocket = () => {
    if (!socketService.isConnected) socketService.connect();
    socketService.on("socket_connected", () => {
      setSocketConnected(true);
      if (user) socketService.authenticate(user.id, "admin");
    });
    socketService.on("socket_disconnected", () => setSocketConnected(false));
    socketService.on("chat_notification", (n) => {
      setUnreadCount(p => p + 1);
      if (activeTab === "messages") fetchMessages();
      if (Notification.permission === "granted")
        new Notification("New Chat Message", { body: `${n.user_name}: ${n.message_preview}`, icon: "/favicon.ico" });
    });
  };

  // ── Fetchers ──────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const r = await api.admin.getStats();
      if (r.data) setStats({
        total_properties: r.data.total_properties || 0,
        active_bookings:  r.data.active_bookings  || 0,
        total_users:      r.data.total_users      || 0,
        total_revenue:    r.data.total_revenue    || 0,
      });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchProperties  = async () => { try { setProperties((await api.properties.getAll()).data || []); } catch(e){} };
  const fetchBookings    = async () => { try { setBookings((await api.admin.getBookings()).data || []); } catch(e){} };
  const fetchCustomers   = async () => {
    try {
      const users = (await api.admin.getUsers()).data || [];
      setCustomers(users.filter(u => u.role !== "admin"));
    } catch(e){}
  };
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const chats = (await api.chats.getAll()).data || [];
      setMessages(chats);
      setUnreadCount(chats.reduce((s, c) => s + (c.unread_count || 0), 0));
    } catch(e){} finally { setLoadingMessages(false); }
  };

  // ── Consultations fetcher ─────────────────────────────────────────────────────
  const fetchConsultations = async () => {
    setLoadingConsults(true);
    setConsultsError("");
    try {
      const res = await api.consultations.list();
      setConsultations(res.data || []);
    } catch (e) {
      console.error("Consultations fetch error:", e);
      setConsultsError("Failed to load consultations. Please try again.");
    } finally {
      setLoadingConsults(false);
    }
  };

  // ── Status update — optimistic + rollback ─────────────────────────────────────
  const updateConsultStatus = async (id, newStatus) => {
    // Optimistic update
    const prev = consultations;
    setConsultations(c => c.map(x => x.id === id ? { ...x, status: newStatus } : x));
    setUpdatingConsult(id);
    try {
      await api.consultations.updateStatus(id, newStatus);
      // Re-fetch to get any server-side enrichment
      await fetchConsultations();
    } catch (e) {
      console.error("Status update error:", e);
      // Rollback
      setConsultations(prev);
      alert(e.response?.data?.error || "Could not update status. Please try again.");
    } finally {
      setUpdatingConsult(null);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  // ── Property CRUD ─────────────────────────────────────────────────────────────
  const handleDeleteProperty = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    try { await api.admin.deleteProperty(id); fetchProperties(); fetchStats(); }
    catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
  };

  const handleAddProperty = async () => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("name", newProperty.name); fd.append("type", newProperty.type);
      fd.append("price", newProperty.price); fd.append("location", newProperty.location);
      fd.append("description", newProperty.description); fd.append("rooms", newProperty.rooms);
      fd.append("bathrooms", newProperty.bathrooms); fd.append("maxGuests", newProperty.maxGuests);
      fd.append("area", newProperty.area); fd.append("amenities", JSON.stringify(newProperty.amenities));
      fd.append("specs", JSON.stringify({ guests: newProperty.maxGuests, bedrooms: newProperty.rooms, beds: newProperty.rooms, bathrooms: newProperty.bathrooms }));
      fd.append("tags", JSON.stringify([]));
      if (newProperty.coverImage) fd.append("coverImage", newProperty.coverImage);
      newProperty.galleryImages.forEach(img => img && fd.append("galleryImages", img));
      await api.admin.createPropertyWithImages(fd);
      cleanupBlobUrls(); setShowAddProperty(false); resetPropertyForm(); fetchProperties(); fetchStats();
    } catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
    finally { setUploading(false); }
  };

  const handleEditClick = (p) => {
    setNewProperty({ name: p.name, type: p.type, price: p.price, location: p.location, description: p.description || "",
      coverImage: null, coverPreview: p.cover_image || "", galleryImages: [], galleryPreviews: p.images?.slice(1) || [],
      amenities: p.amenities || [], rooms: p.rooms || 1, bathrooms: p.bathrooms || 1, maxGuests: p.max_guests || 2, area: p.area || "" });
    setShowEditProperty(p.id);
  };

  const updateProperty = async () => {
    try {
      await api.admin.updateProperty(showEditProperty, {
        name: newProperty.name, title: newProperty.name, type: newProperty.type,
        price: parseFloat(newProperty.price), location: newProperty.location,
        description: newProperty.description, amenities: newProperty.amenities,
        bedrooms: newProperty.rooms, bathrooms: newProperty.bathrooms,
        max_guests: newProperty.maxGuests, area: newProperty.area,
        specs: { guests: newProperty.maxGuests, bedrooms: newProperty.rooms, beds: newProperty.rooms, bathrooms: newProperty.bathrooms }
      });
      if (newProperty.coverImage || newProperty.galleryImages.length > 0) {
        const ifd = new FormData();
        if (newProperty.coverImage) ifd.append("coverImage", newProperty.coverImage);
        newProperty.galleryImages.forEach(img => img && ifd.append("galleryImages", img));
        await api.admin.addPropertyImages(showEditProperty, ifd);
      }
      cleanupBlobUrls(); setShowEditProperty(null); resetPropertyForm(); fetchProperties();
    } catch (e) { alert("Error: " + (e.response?.data?.error || e.message)); }
  };

  const resetPropertyForm = () => {
    cleanupBlobUrls();
    setNewProperty({ name: "", type: "studio", price: "", location: "", description: "",
      coverImage: null, coverPreview: "", galleryImages: [], galleryPreviews: [],
      amenities: [], rooms: 1, bathrooms: 1, maxGuests: 2, area: "" });
  };

  const handleCoverImageUpload  = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (newProperty.coverPreview?.startsWith("blob:")) URL.revokeObjectURL(newProperty.coverPreview);
    setNewProperty({ ...newProperty, coverImage: file, coverPreview: URL.createObjectURL(file) });
  };
  const handleGalleryUpload     = (e) => {
    const files = Array.from(e.target.files); if (!files.length) return;
    setNewProperty({ ...newProperty, galleryImages: [...newProperty.galleryImages, ...files],
      galleryPreviews: [...newProperty.galleryPreviews, ...files.map(f => URL.createObjectURL(f))] });
  };
  const removeGalleryImage = (i) => {
    const u = newProperty.galleryPreviews[i];
    if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
    const imgs = [...newProperty.galleryImages]; const prevs = [...newProperty.galleryPreviews];
    imgs.splice(i,1); prevs.splice(i,1);
    setNewProperty({ ...newProperty, galleryImages: imgs, galleryPreviews: prevs });
  };
  const removeCoverImage = () => {
    if (newProperty.coverPreview?.startsWith("blob:")) URL.revokeObjectURL(newProperty.coverPreview);
    setNewProperty({ ...newProperty, coverImage: null, coverPreview: "" });
  };
  const toggleAmenity     = (v) => setNewProperty({ ...newProperty,
    amenities: newProperty.amenities.includes(v) ? newProperty.amenities.filter(a=>a!==v) : [...newProperty.amenities, v] });
  const addCustomAmenity  = () => {
    const inp = document.getElementById("custom-amenity-input");
    if (inp?.value.trim() && !newProperty.amenities.includes(inp.value.trim())) {
      setNewProperty({ ...newProperty, amenities: [...newProperty.amenities, inp.value.trim()] });
      inp.value = "";
    }
  };
  const removeAmenity     = (i) => { const a = [...newProperty.amenities]; a.splice(i,1); setNewProperty({ ...newProperty, amenities: a }); };

  // ── Client handlers ───────────────────────────────────────────────────────────
  const handleViewClient = async (client) => {
    setLoadingClientDetails(true);
    try {
      const details = (await api.admin.getUserDetails(client.id)).data;
      setSelectedClient({ ...client,
        stats: details.stats || { bookings: client.bookings_count||0, spent: client.total_spent||0, chats: client.chats_count||0 },
        recentActivity: details.recent_activity || [`Joined: ${new Date(client.created_at).toLocaleDateString()}`] });
    } catch {
      setSelectedClient({ ...client,
        stats: { bookings: client.bookings_count||0, spent: client.total_spent||0, chats: client.chats_count||0 },
        recentActivity: [`Joined: ${new Date(client.created_at).toLocaleDateString()}`, "Details temporarily unavailable"] });
    } finally { setLoadingClientDetails(false); }
  };
  const handleMessageClient = async (client) => {
    try {
      const chat = (await api.chats.startChat(client.id, null, null)).data.chat;
      setActiveTab("messages"); setSelectedChat(chat);
    } catch { alert("Could not start chat."); }
  };
  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    setDeletingClient(true);
    try { await api.admin.deleteUser(id); fetchCustomers(); }
    catch (e) { alert(e.response?.data?.error || "Failed to delete."); }
    finally { setDeletingClient(false); }
  };

  // ── Chat helpers ──────────────────────────────────────────────────────────────
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      await api.chats.markRead(chat.id);
      setMessages(p => p.map(c => c.id===chat.id ? {...c,unread_count:0} : c));
      setUnreadCount(p => Math.max(0, p-(chat.unread_count||0)));
    } catch {}
  };
  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts), now = new Date(), mins = Math.floor((now-d)/60000);
    if (mins < 1) return "Just now"; if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return d.toLocaleDateString();
  };
  const getImageUrl = (p) => {
    if (p.cover_image) return p.cover_image.startsWith("http") ? p.cover_image : `${IMAGE_BASE_URL}${p.cover_image}`;
    if (p.images?.length) { const u=p.images[0]; return u.startsWith("http") ? u : `${IMAGE_BASE_URL}${u}`; }
    return "/default-property.jpg";
  };

  const consultCounts = {
    total:     consultations.length,
    pending:   consultations.filter(c => c.status === "pending").length,
    confirmed: consultations.filter(c => c.status === "confirmed").length,
    completed: consultations.filter(c => c.status === "completed").length,
  };

  // ── Mobile menu ───────────────────────────────────────────────────────────────
  const MobileMenu = () => (
    <AnimatePresence>
      {mobileMenuOpen && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}/>
          <motion.div
            initial={{x:"-100%"}} animate={{x:0}} exit={{x:"-100%"}}
            transition={{type:"tween",duration:0.3}}
            className="fixed top-0 left-0 bottom-0 w-64 bg-[#1C2321] text-[#E5E5E0] z-50 flex flex-col md:hidden"
          >
            <div className="p-6 border-b border-stone-700/50">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-serif tracking-wider text-white">MWEMA<span className="text-stone-400">.</span></h1>
                <button onClick={() => setMobileMenuOpen(false)} className="text-stone-400 hover:text-white"><FaTimes size={18}/></button>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-stone-500 mt-2">Estate Administration</p>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); if(item.id!=="messages") setSelectedChat(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 relative ${
                    activeTab===item.id ? "bg-white/5 text-white border-r-2 border-[#D4AF37]" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.02]"}`}
                >
                  <item.icon className={`text-base ${activeTab===item.id?"scale-110 text-[#D4AF37]":""}`}/>
                  <span className={`font-serif text-sm tracking-wide ${activeTab===item.id?"font-medium":"font-light"}`}>{item.label}</span>
                  {item.badge && <span className="absolute right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-stone-700/50 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-stone-700 flex items-center justify-center text-xs">{user?.name?.charAt(0)||"A"}</div>
                <span className="text-xs text-stone-300">{user?.name||"Admin"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-500">
                <div className={`w-1.5 h-1.5 rounded-full ${socketConnected?"bg-green-500":"bg-red-500"}`}/>
                {socketConnected?"Live Chat Active":"Chat Offline"}
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-stone-400 hover:text-red-300 transition-colors uppercase tracking-widest text-[10px] py-1.5">
                <FaSignOutAlt size={12}/> Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4"/>
        <p className="font-serif text-stone-600 tracking-widest uppercase text-sm">Loading Estate Data…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">

      {/* Mobile menu button */}
      <button onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 bg-[#1C2321] text-white p-3 rounded-lg shadow-lg">
        <FaBars size={20}/>
      </button>

      <MobileMenu />

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-72 bg-[#1C2321] text-[#E5E5E0] flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-10 border-b border-stone-700/50">
          <h1 className="text-2xl font-serif tracking-wider text-white">MWEMA<span className="text-stone-400">.</span></h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-2">Estate Administration</p>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); if(item.id!=="messages") setSelectedChat(null); }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group relative ${
                activeTab===item.id ? "bg-white/5 text-white border-r-2 border-[#D4AF37]" : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.02]"}`}
            >
              <item.icon className={`text-lg ${activeTab===item.id?"scale-110 text-[#D4AF37]":"group-hover:text-stone-300"}`}/>
              <span className={`font-serif tracking-wide ${activeTab===item.id?"font-medium":"font-light"}`}>{item.label}</span>
              {item.badge && <span className="absolute right-6 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-stone-700/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm">{user?.name?.charAt(0)||"A"}</div>
            <span className="text-sm text-stone-300">{user?.name||"Admin"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <div className={`w-2 h-2 rounded-full ${socketConnected?"bg-green-500":"bg-red-500"}`}/>
            {socketConnected?"Live Chat Active":"Chat Offline"}
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 text-stone-400 hover:text-red-300 transition-colors uppercase tracking-widest text-xs py-2">
            <FaSignOutAlt/> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative pt-16 md:pt-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 border-b border-stone-200 pb-4 md:pb-6">
          <div className="ml-12 md:ml-0">
            <h2 className="text-2xl md:text-4xl font-serif text-[#1C2321] mb-2">
              {navItems.find(i=>i.id===activeTab)?.label}
            </h2>
            <p className="text-stone-500 font-serif italic text-sm md:text-base">
              {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
            </p>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0 ml-12 md:ml-0">
            <div className="relative hidden md:block">
              <FaSearch className="absolute left-0 top-3 text-stone-400"/>
              <input type="text" placeholder="Search records…"
                className="pl-8 pr-4 py-2 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none w-48 lg:w-64 placeholder-stone-400 text-stone-800 transition-all"/>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1C2321] text-[#D4AF37] flex items-center justify-center font-serif text-lg">A</div>
          </div>
        </header>

        {/* Mobile secondary nav */}
        <div className="md:hidden mb-6 -mx-4 px-4 pb-4 border-b border-stone-200 overflow-x-auto">
          <div className="flex gap-2 min-w-min">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded text-xs whitespace-nowrap transition-all relative ${
                  activeTab===item.id?"bg-[#1C2321] text-white":"bg-stone-100 text-stone-600 border border-stone-200"}`}>
                {item.label}
                {item.badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ══ DASHBOARD ══ */}
        {activeTab === "dashboard" && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="space-y-8 md:space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label:"Total Properties",    value: stats.total_properties,                        icon: FaBuilding    },
                { label:"Active Reservations", value: stats.active_bookings,                         icon: FaCalendarAlt },
                { label:"Total Clientele",     value: stats.total_users,                             icon: FaUsers       },
                { label:"Revenue (YTD)",       value: `Ksh ${stats.total_revenue.toLocaleString()}`, icon: null          },
              ].map((s,i) => (
                <div key={i} className="bg-white p-5 md:p-8 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium leading-tight">{s.label}</p>
                    {s.icon && <s.icon className="text-stone-300 text-lg md:text-xl flex-shrink-0"/>}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif text-[#1C2321]">{s.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              <div className="md:col-span-2 bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Performance Overview</h3>
                <div className="h-48 md:h-64 flex items-center justify-center bg-[#F9F8F6] text-stone-400 italic font-serif">
                  Chart integration requires visualization library
                </div>
              </div>
              <div className="bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Consultations</h3>
                <div className="space-y-4">
                  {[
                    { label:"Total Requests", value: consultCounts.total,     color:"text-stone-800" },
                    { label:"Pending",        value: consultCounts.pending,   color:"text-amber-600"  },
                    { label:"Confirmed",      value: consultCounts.confirmed, color:"text-green-700"  },
                    { label:"Completed",      value: consultCounts.completed, color:"text-stone-500"  },
                  ].map((item,i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-stone-50 last:border-0">
                      <p className="text-sm text-stone-600">{item.label}</p>
                      <span className={`text-lg font-serif ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab("consultations")}
                    className="w-full mt-2 text-[10px] uppercase tracking-widest text-stone-400 hover:text-[#1C2321] border-b border-stone-200 pb-1 transition-colors text-left">
                    View all →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ PROPERTIES ══ */}
        {activeTab === "properties" && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button onClick={() => setShowAddProperty(true)}
                className="bg-[#1C2321] text-white px-6 md:px-8 py-3 hover:bg-[#2C3632] transition-colors flex items-center gap-2 uppercase tracking-widest text-xs font-medium">
                <FaPlus/> Add Residence
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {properties.map(p => (
                <motion.div key={p.id} initial={{opacity:0}} animate={{opacity:1}}
                  className="bg-white group border border-stone-100 hover:border-stone-300 transition-all duration-500">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={getImageUrl(p)} alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85] group-hover:saturate-100"
                      onError={e=>{e.target.src="https://via.placeholder.com/400x300";}}/>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1">
                      <span className="text-xs font-serif font-bold text-[#1C2321]">Ksh {p.price.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-[#1C2321] mb-2">{p.name}</h3>
                    <div className="flex items-center gap-1 text-stone-500 text-xs uppercase mb-4"><FaMapMarkerAlt/> {p.location}</div>
                    <div className="flex items-center justify-between py-4 border-t border-b border-stone-100 text-stone-600 text-sm">
                      <span className="flex items-center gap-2"><FaBed className="text-stone-400"/> {p.rooms}</span>
                      <span className="flex items-center gap-2"><FaBath className="text-stone-400"/> {p.bathrooms}</span>
                      <span className="flex items-center gap-2"><FaRulerCombined className="text-stone-400"/> {p.area||"N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${p.status==="booked"?"border-stone-300 text-stone-400":"border-[#1C2321] text-[#1C2321]"}`}>
                        {p.status||"Available"}
                      </span>
                      <div className="flex gap-4">
                        <button onClick={()=>handleEditClick(p)} className="text-stone-400 hover:text-[#1C2321] transition-colors"><FaEdit/></button>
                        <button onClick={()=>handleDeleteProperty(p.id)} className="text-stone-400 hover:text-red-800 transition-colors"><FaTrash/></button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BOOKINGS ══ */}
        {activeTab === "bookings" && (
          <div className="bg-white border border-stone-100 p-4 md:p-8 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-[#1C2321]">
                  {["Property","Guest","Dates","Status","Amount","Actions"].map(h=>(
                    <th key={h} className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-stone-600">
                {bookings.map(b=>(
                  <tr key={b.id} className="border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors">
                    <td className="py-4 md:py-6 px-4"><p className="font-serif text-[#1C2321]">{b.property_name}</p><p className="text-xs text-stone-400">ID: {b.id}</p></td>
                    <td className="py-4 md:py-6 px-4"><p className="font-medium">{b.guest_name}</p><p className="text-sm text-stone-400">{b.email}</p></td>
                    <td className="py-4 md:py-6 px-4 text-sm font-light">{b.check_in} — {b.check_out}</td>
                    <td className="py-4 md:py-6 px-4">
                      <span className={`text-xs uppercase tracking-widest font-medium ${b.status==="confirmed"?"text-[#1C2321]":b.status==="pending"?"text-[#D4AF37]":"text-stone-400"}`}>{b.status}</span>
                    </td>
                    <td className="py-4 md:py-6 px-4 font-serif">Ksh {b.total_amount?.toLocaleString()}</td>
                    <td className="py-4 md:py-6 px-4"><button className="text-stone-400 hover:text-[#1C2321] uppercase text-xs tracking-widest">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length===0 && (
              <div className="text-center py-20">
                <FaCalendarAlt className="text-4xl text-stone-200 mx-auto mb-4"/>
                <p className="font-serif text-stone-400 italic">No reservations found in the registry.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ CLIENTS ══ */}
        {activeTab === "customers" && (
          <div className="bg-white border border-stone-100 p-4 md:p-8">
            <AnimatePresence>
              {selectedClient && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={()=>setSelectedClient(null)}>
                  <motion.div initial={{scale:0.95,y:20}} animate={{scale:1,y:0}} exit={{scale:0.95,y:20}}
                    className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                    onClick={e=>e.stopPropagation()}>
                    <div className="p-6 md:p-8">
                      <div className="flex justify-between items-start mb-6">
                        <h3 className="text-2xl font-serif text-[#1C2321]">Client Profile</h3>
                        <button onClick={()=>setSelectedClient(null)} className="text-stone-400 hover:text-stone-600"><FaTimes size={20}/></button>
                      </div>
                      {loadingClientDetails ? (
                        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"/></div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center gap-6 pb-6 border-b border-stone-100">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#1C2321] text-white flex items-center justify-center text-2xl font-serif">
                              {selectedClient.name?.charAt(0)||selectedClient.email?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xl font-serif text-[#1C2321]">{selectedClient.name||"Unnamed"}</h4>
                              <p className="text-stone-500 text-sm mt-1">Member since {new Date(selectedClient.created_at).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</p>
                              <span className="inline-block mt-2 text-xs uppercase tracking-widest border border-stone-200 px-2 py-1 text-stone-500">{selectedClient.role||"Guest"}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Email</p><p className="text-stone-800 flex items-center gap-2 text-sm"><FaEnvelopeOpen className="text-stone-400 flex-shrink-0" size={12}/> {selectedClient.email}</p></div>
                            <div><p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Phone</p><p className="text-stone-800 flex items-center gap-2 text-sm"><FaPhone className="text-stone-400" size={12}/> {selectedClient.phone||"Not provided"}</p></div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 py-6 border-y border-stone-100 text-center">
                            <div><p className="text-2xl font-serif text-[#1C2321]">{selectedClient.stats?.bookings||0}</p><p className="text-[10px] uppercase tracking-widest text-stone-400">Bookings</p></div>
                            <div className="border-x border-stone-100"><p className="text-xl md:text-2xl font-serif text-[#1C2321]">Ksh {selectedClient.stats?.spent?.toLocaleString()||0}</p><p className="text-[10px] uppercase tracking-widest text-stone-400">Spent</p></div>
                            <div><p className="text-2xl font-serif text-[#1C2321]">{selectedClient.stats?.chats||0}</p><p className="text-[10px] uppercase tracking-widest text-stone-400">Chats</p></div>
                          </div>
                          <div className="flex gap-3 md:gap-4 pt-4">
                            <button onClick={()=>{handleMessageClient(selectedClient);setSelectedClient(null);}}
                              className="flex-1 bg-[#1C2321] text-white py-3 hover:bg-[#2C3632] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                              <FaComments/> Message
                            </button>
                            <button onClick={()=>{handleDeleteClient(selectedClient.id);setSelectedClient(null);}}
                              className="flex-1 border border-red-200 text-red-600 py-3 hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                              <FaTrash/> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {customers.length===0 ? (
              <div className="text-center py-20"><FaUsers className="text-4xl text-stone-200 mx-auto mb-4"/><p className="font-serif text-stone-400 italic">Registry is currently empty.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead><tr className="border-b-2 border-[#1C2321]">
                    {["Identity","Email","Phone","Role","Joined","Actions"].map(h=>(
                      <th key={h} className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {customers.map(c=>(
                      <tr key={c.id} className="border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors">
                        <td className="py-4 md:py-6 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1C2321] text-white flex items-center justify-center font-serif text-sm flex-shrink-0">{c.name?.charAt(0)||c.email?.charAt(0)}</div>
                            <span className="font-serif text-[#1C2321]">{c.name||"Unnamed"}</span>
                          </div>
                        </td>
                        <td className="py-4 md:py-6 px-4 text-stone-600 font-light text-sm">{c.email}</td>
                        <td className="py-4 md:py-6 px-4 text-stone-600 font-light text-sm">{c.phone||"—"}</td>
                        <td className="py-4 md:py-6 px-4"><span className="text-xs uppercase tracking-widest border border-stone-200 px-2 py-1 text-stone-500">{c.role||"guest"}</span></td>
                        <td className="py-4 md:py-6 px-4 text-stone-500 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-4 md:py-6 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={()=>handleViewClient(c)} className="text-stone-400 hover:text-[#1C2321] p-2 hover:bg-stone-100 rounded-full transition-colors" disabled={deletingClient}><FaEye size={14}/></button>
                            <button onClick={()=>handleMessageClient(c)} className="text-stone-400 hover:text-[#1C2321] p-2 hover:bg-stone-100 rounded-full transition-colors" disabled={deletingClient}><FaComments size={14}/></button>
                            <button onClick={()=>handleDeleteClient(c.id)} className="text-stone-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors" disabled={deletingClient}><FaTrash size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ CONSULTATIONS — uses the extracted component ══ */}
        {activeTab === "consultations" && (
          <ConsultationsTab
            consultations={consultations}
            loading={loadingConsults}
            error={consultsError}
            onRefresh={fetchConsultations}
            onStatusChange={updateConsultStatus}
            updatingId={updatingConsult}
          />
        )}

        {/* ══ MESSAGES ══ */}
        {activeTab === "messages" && (
          <div className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#1C2321]">Concierge Desk</h2>
                <p className="text-stone-500 font-serif italic text-sm">{socketConnected?"🔵 Live client support":"⚪️ Chat offline"}</p>
              </div>
              <button onClick={fetchMessages} className="text-stone-500 hover:text-[#1C2321] flex items-center gap-2 text-sm uppercase tracking-widest">
                <FaSync/> Refresh
              </button>
            </div>

            {selectedChat ? (
              <div className="flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-1 bg-white border border-stone-100 rounded-lg overflow-hidden">
                  <div className="p-4 bg-[#1C2321] text-white">
                    <button onClick={()=>setSelectedChat(null)} className="flex items-center gap-2 text-sm hover:text-stone-300">← Back</button>
                  </div>
                  <div className="p-4 max-h-[400px] overflow-y-auto">
                    {messages.slice(0,5).map(chat=>(
                      <div key={chat.id} onClick={()=>handleSelectChat(chat)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${selectedChat?.id===chat.id?"bg-stone-100 border border-stone-200":"hover:bg-stone-50"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${chat.unread_count>0?"bg-[#D4AF37]":"bg-stone-300"}`}/>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 truncate text-sm">{chat.user_name||"Guest"}</p>
                            <p className="text-xs text-stone-500 truncate">{chat.last_message}</p>
                          </div>
                          {chat.unread_count>0 && <span className="text-xs bg-[#D4AF37] text-white rounded-full px-1.5 py-0.5">{chat.unread_count}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <ChatWindow chatId={selectedChat.id} currentUser={user} onClose={()=>setSelectedChat(null)} propertyName={selectedChat.property_name}/>
                </div>
              </div>
            ) : loadingMessages ? (
              <div className="bg-white border border-stone-100 p-20 text-center">
                <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-4"/>
                <p className="font-serif text-stone-400 italic">Retrieving conversations…</p>
              </div>
            ) : messages.length===0 ? (
              <div className="bg-white border border-stone-100 p-16 md:p-20 text-center">
                <FaComments className="text-4xl text-stone-200 mx-auto mb-4"/>
                <h3 className="font-serif text-stone-400 text-lg mb-2">No Active Conversations</h3>
                <p className="text-stone-400 max-w-md mx-auto text-sm">Client inquiries will appear here in real-time.</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
                <div className="bg-[#1C2321] text-white p-5 md:p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FaComments className="text-[#D4AF37] text-xl"/>
                      <div>
                        <h3 className="font-serif text-lg md:text-xl">Active Conversations</h3>
                        <p className="text-stone-400 text-[10px] uppercase tracking-widest">{messages.length} conversation{messages.length!==1?"s":""} · {unreadCount} unread</p>
                      </div>
                    </div>
                    {unreadCount>0 && <div className="relative"><FaBell className="text-[#D4AF37] text-lg"/><span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span></div>}
                  </div>
                </div>
                <div className="divide-y divide-stone-100">
                  {messages.map(chat=>(
                    <div key={chat.id} onClick={()=>handleSelectChat(chat)} className="p-5 md:p-6 hover:bg-[#F9F8F6] cursor-pointer transition-colors group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-stone-800 text-white flex items-center justify-center"><FaUser/></div>
                            {chat.unread_count>0 && <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center"><span className="text-xs text-white font-bold">{chat.unread_count}</span></div>}
                          </div>
                          <div>
                            <h4 className="font-serif text-base md:text-lg text-[#1C2321]">{chat.user_name}</h4>
                            <p className="text-sm text-stone-500 truncate max-w-[200px] md:max-w-md">{chat.last_message||"No messages yet"}</p>
                            <span className="flex items-center gap-1 text-[10px] text-stone-400 mt-1"><FaClock className="text-xs"/> {formatTime(chat.last_message_time)}</span>
                          </div>
                        </div>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-serif italic text-stone-400 hidden md:block">Open →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══ ADD / EDIT PROPERTY MODAL ══ */}
      <AnimatePresence>
        {(showAddProperty || showEditProperty) && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-[#1C2321]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={()=>{resetPropertyForm();setShowAddProperty(false);setShowEditProperty(null);}}>
            <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
              className="bg-[#F9F8F6] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
              onClick={e=>e.stopPropagation()}>
              <div className="p-6 md:p-10">
                <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-stone-200 pb-4">
                  <h3 className="text-2xl md:text-3xl font-serif text-[#1C2321]">{showEditProperty?"Edit Residence":"New Residence"}</h3>
                  <button onClick={()=>{resetPropertyForm();setShowAddProperty(false);setShowEditProperty(null);}}
                    className="text-stone-400 hover:text-[#1C2321] text-2xl font-light">✕</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-6 md:gap-y-8">
                  {[
                    {label:"Property Name",key:"name",type:"text",placeholder:"e.g. The Kensington Suite"},
                    {label:"Price per Night (Ksh)",key:"price",type:"number",placeholder:"0.00"},
                    {label:"Location",key:"location",type:"text",placeholder:"District, City"},
                    {label:"Floor Area (sq ft)",key:"area",type:"text",placeholder:"e.g. 2,400"},
                  ].map(f=>(
                    <div key={f.key}>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">{f.label}</label>
                      <input type={f.type} value={newProperty[f.key]} placeholder={f.placeholder}
                        onChange={e=>setNewProperty({...newProperty,[f.key]:e.target.value})}
                        className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321] placeholder-stone-300 transition-colors"/>
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Residence Type</label>
                    <select value={newProperty.type} onChange={e=>setNewProperty({...newProperty,type:e.target.value})}
                      className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321]">
                      <option value="studio">Studio Apartment</option>
                      <option value="1_bedroom">One Bedroom Suite</option>
                      <option value="2_bedroom">Two Bedroom Suite</option>
                      <option value="3_bedroom">Three Bedroom Suite</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="villa">Private Villa</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-3 gap-6 md:gap-8">
                    {["rooms","bathrooms","maxGuests"].map(k=>(
                      <div key={k}>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                          {k==="rooms"?"Bedrooms":k==="bathrooms"?"Bathrooms":"Max Guests"}
                        </label>
                        <input type="number" min="1" value={newProperty[k]}
                          onChange={e=>setNewProperty({...newProperty,[k]:parseInt(e.target.value)||1})}
                          className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321]"/>
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Description</label>
                    <textarea value={newProperty.description} rows={4}
                      onChange={e=>setNewProperty({...newProperty,description:e.target.value})}
                      placeholder="Detail the property's features and atmosphere..."
                      className="w-full p-4 bg-white border border-stone-200 focus:border-[#1C2321] outline-none font-sans font-light text-stone-600 leading-relaxed mt-2"/>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">Amenities</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {predefinedAmenities.map(a=>(
                        <label key={a.value} htmlFor={`amenity-${a.value}`}
                          className={`flex items-center justify-center px-3 py-2 rounded-full border cursor-pointer transition-all text-xs font-medium ${
                            newProperty.amenities.includes(a.value)?"bg-[#1C2321] text-white border-[#1C2321]":"bg-white text-stone-600 border-stone-300 hover:border-[#1C2321]"}`}>
                          <input type="checkbox" id={`amenity-${a.value}`} className="hidden" checked={newProperty.amenities.includes(a.value)} onChange={()=>toggleAmenity(a.value)}/>
                          {a.label}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input id="custom-amenity-input" type="text" placeholder="Custom amenity…"
                        className="flex-1 py-2 px-3 border border-stone-300 rounded focus:border-[#1C2321] outline-none text-sm"
                        onKeyPress={e=>{if(e.key==="Enter"){e.preventDefault();addCustomAmenity();}}}/>
                      <button type="button" onClick={addCustomAmenity} className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-[#1C2321] transition-colors text-sm">Add</button>
                    </div>
                    {newProperty.amenities.length>0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {newProperty.amenities.map((a,i)=>(
                          <span key={i} className="flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-sm text-stone-700">
                            {a}<button type="button" onClick={()=>removeAmenity(i)} className="ml-1 text-stone-400 hover:text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">Cover Image</label>
                    <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={handleCoverImageUpload}/>
                    <label htmlFor="cover-upload"
                      className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#1C2321] transition-colors">
                      <FaCamera className="text-stone-400"/> <span className="text-stone-600">{newProperty.coverPreview?"Change Cover Image":"Upload Cover Image"}</span>
                    </label>
                    {newProperty.coverPreview && (
                      <div className="relative w-full max-w-md aspect-[16/10] border border-stone-200 rounded-lg overflow-hidden mt-4">
                        <img src={newProperty.coverPreview.startsWith("blob:")?newProperty.coverPreview:newProperty.coverPreview.startsWith("http")?newProperty.coverPreview:`${API_BASE_URL}${newProperty.coverPreview}`}
                          alt="Cover" className="w-full h-full object-cover"/>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center">
                          <span className="text-white text-sm">Cover Preview</span>
                          <button type="button" onClick={removeCoverImage} className="text-white bg-black/50 hover:bg-black/70 w-6 h-6 rounded-full flex items-center justify-center">×</button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">Gallery Images</label>
                    <input type="file" id="gallery-upload" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload}/>
                    <label htmlFor="gallery-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C2321] text-white rounded-lg cursor-pointer hover:bg-[#2C3632] transition-colors">
                      <FaUpload/> <span>Upload Images</span>
                    </label>
                    {newProperty.galleryPreviews.length>0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {newProperty.galleryPreviews.map((url,i)=>(
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                            <img src={url.startsWith("blob:")?url:url.startsWith("http")?url:`${API_BASE_URL}${url}`} alt="" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button type="button" onClick={()=>removeGalleryImage(i)}
                                className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center"><FaTrash className="text-xs"/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4 md:gap-6 mt-10 md:mt-12 pt-6 border-t border-stone-200">
                  <button onClick={()=>{resetPropertyForm();setShowAddProperty(false);setShowEditProperty(null);}}
                    className="px-6 md:px-8 py-3 text-stone-500 hover:text-[#1C2321] transition-colors uppercase tracking-widest text-xs">Cancel</button>
                  <button onClick={showEditProperty?updateProperty:handleAddProperty}
                    disabled={!newProperty.name||!newProperty.price||!newProperty.location||uploading}
                    className="px-8 md:px-10 py-3 bg-[#1C2321] text-white hover:bg-[#2C3632] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs font-medium">
                    {uploading?"Saving…":showEditProperty?"Update Residence":"Save Property"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}