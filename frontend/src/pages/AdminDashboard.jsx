import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome, FaBuilding, FaCalendarAlt, FaUsers, FaEnvelope,
  FaSignOutAlt, FaPlus, FaTrash, FaEdit, FaSync, FaEye,
  FaSearch, FaBed, FaBath, FaRulerCombined, FaMapMarkerAlt,
  FaUpload, FaCamera, FaComments, FaUser, FaClock,
  FaBell, FaTimes, FaPhone, FaEnvelopeOpen,
  FaClipboardList, FaBars, FaCheck, FaCheckDouble, FaPaperPlane,
  FaArrowLeft, FaMoneyBillWave, FaCreditCard, FaCalendarCheck
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/Chat/ChatWindow";
import socketService from "../services/socketService";
import AdminConsultations from '../pages/AdminConsultations';
import AdminBookingsTab from '../pages/AdminBookingsTab';
import AdminPropertiesTab from '../pages/AdminPropertiesTab'; // NEW IMPORT


// ─── helpers ─────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d) ? raw : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
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
    total_properties: 0,
    active_bookings: 0,
    total_users: 0,
    total_revenue: 0,
    occupancy_rate: 0,
    pending_payments: 0,
    completed_bookings: 0,
    monthly_revenue: 0,
    popular_property: null
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [properties,    setProperties]    = useState([]);
  const [bookings,      setBookings]      = useState([]);
  const [customers,     setCustomers]     = useState([]);
  const [messages,      setMessages]      = useState([]);

  // Chat states
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState({});
  const messagesEndRef = useRef(null);

  // Consultation counts for the dashboard summary widget only
  const [consultSummary, setConsultSummary] = useState({
    total: 0, pending: 0, confirmed: 0, completed: 0,
  });

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [unreadCount,     setUnreadCount]     = useState(0);
  const [socketConnected, setSocketConnected] = useState(false);

  const [selectedClient,       setSelectedClient]       = useState(null);
  const [deletingClient,       setDeletingClient]       = useState(false);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  const navItems = [
    { id: "dashboard",     label: "Dashboard",     icon: FaHome },
    { id: "properties",    label: "Properties",    icon: FaBuilding },
    { id: "bookings",      label: "Bookings",      icon: FaCalendarAlt },
    { id: "customers",     label: "Clients",       icon: FaUsers },
    { id: "consultations", label: "Consultations", icon: FaClipboardList },
    { id: "messages",      label: "Chat",          icon: FaEnvelope, badge: unreadCount > 0 ? unreadCount : null },
  ];

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchStats(); fetchProperties(); fetchBookings(); fetchCustomers();
    fetchConsultSummary();
    if (user?.role === "admin") initializeSocket();
    return () => {
      socketService.off("socket_connected");
      socketService.off("socket_disconnected");
      socketService.off("chat_notification");
    };
  }, [user]);

  useEffect(() => {
    if (activeTab === "messages") fetchMessages();
  }, [activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

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
    socketService.on("new_message", (message) => {
      // Update messages for the affected chat
      setChatMessages(prev => ({
        ...prev,
        [message.chat_id]: [...(prev[message.chat_id] || []), message]
      }));
    });
  };

  // ── Fetchers ──────────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const [statsRes, bookingsRes, propertiesRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getBookings(),
        api.properties.getAll()
      ]);
      
      const bookingsData = bookingsRes.data || [];
      const propertiesData = propertiesRes.data || [];
      const statsData = statsRes.data || {};
      
      // Calculate real stats
      const totalRevenue = bookingsData
        .filter(b => b.payment_status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
      
      const pendingPayments = bookingsData
        .filter(b => b.payment_status === 'pending' || b.pending_amount > 0)
        .reduce((sum, b) => sum + (b.pending_amount || b.total_amount || 0), 0);
      
      const completedBookings = bookingsData
        .filter(b => b.status === 'completed').length;
      
      const activeBookings = bookingsData
        .filter(b => ['pending', 'confirmed', 'upcoming', 'active'].includes(b.status)).length;
      
      // Find most popular property
      const propertyBookings = {};
      bookingsData.forEach(b => {
        propertyBookings[b.property_id] = (propertyBookings[b.property_id] || 0) + 1;
      });
      
      let popularProperty = null;
      let maxBookings = 0;
      Object.entries(propertyBookings).forEach(([propId, count]) => {
        if (count > maxBookings) {
          maxBookings = count;
          const prop = propertiesData.find(p => p.id === parseInt(propId));
          if (prop) popularProperty = prop.name;
        }
      });
      
      setStats({
        total_properties: statsData.total_properties || propertiesData.length || 0,
        active_bookings: activeBookings,
        total_users: statsData.total_users || 0,
        total_revenue: totalRevenue,
        occupancy_rate: propertiesData.length ? Math.round((activeBookings / (propertiesData.length * 30)) * 100) : 0,
        pending_payments: pendingPayments,
        completed_bookings: completedBookings,
        monthly_revenue: totalRevenue / 12,
        popular_property: popularProperty
      });
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
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

  // Lightweight summary for the dashboard widget only — doesn't need full list
  const fetchConsultSummary = async () => {
    try {
      const res = await api.consultations.adminList();
      const list = res.data || [];
      setConsultSummary({
        total:     list.length,
        pending:   list.filter(c => c.status === "pending").length,
        confirmed: list.filter(c => c.status === "confirmed").length,
        completed: list.filter(c => c.status === "completed").length,
      });
    } catch(e){}
  };

  // ── Chat Functions ────────────────────────────────────────────────────────────
  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    
    // Load messages for this chat if not already loaded
    if (!chatMessages[chat.id]) {
      try {
        const response = await api.chats.getMessages(chat.id);
        setChatMessages(prev => ({
          ...prev,
          [chat.id]: response.data || []
        }));
        
        // Mark as read
        await api.chats.markRead(chat.id);
        
        // Update unread count in list
        setMessages(prev => prev.map(c => 
          c.id === chat.id ? { ...c, unread_count: 0 } : c
        ));
        setUnreadCount(prev => Math.max(0, prev - (chat.unread_count || 0)));
        
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }
    
    // Scroll to bottom after loading
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (chatId) => {
    const messageContent = newMessage[chatId]?.trim();
    if (!messageContent) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      sender_id: user.id,
      sender_name: user.name || 'Admin',
      is_host: true,
      timestamp: new Date().toISOString(),
      is_read: false,
      is_temp: true
    };

    // Optimistic update
    setChatMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), optimisticMessage]
    }));
    setNewMessage(prev => ({ ...prev, [chatId]: '' }));

    try {
      const response = await api.chats.sendMessage(chatId, {
        message: messageContent,
        sender_id: user.id,
        sender_name: user.name || 'Admin',
        is_host: true
      });

      // Replace optimistic message with real one
      setChatMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId].map(msg => 
          msg.id === tempId ? response.data : msg
        )
      }));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setChatMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId].filter(msg => msg.id !== tempId)
      }));
      alert('Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

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
      setActiveTab("messages"); 
      setSelectedChat(chat);
      handleSelectChat(chat);
    } catch { alert("Could not start chat."); }
  };
  
  const handleDeleteClient = async (id) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    setDeletingClient(true);
    try { await api.admin.deleteUser(id); fetchCustomers(); }
    catch (e) { alert(e.response?.data?.error || "Failed to delete."); }
    finally { setDeletingClient(false); }
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
            className="fixed top-0 left-0 bottom-0 w-64 bg-[#093A3E] text-white z-50 flex flex-col md:hidden"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-serif tracking-wider text-white">MWEMA<span className="text-[#ED9B40]">.</span></h1>
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white"><FaTimes size={18}/></button>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/40 mt-2">Estate Administration</p>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); if(item.id!=="messages") setSelectedChat(null); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 relative ${
                    activeTab===item.id ? "bg-white/10 text-white border-r-2 border-[#ED9B40]" : "text-white/60 hover:text-white hover:bg-white/5"}`}
                >
                  <item.icon className={`text-base ${activeTab===item.id?"scale-110 text-[#ED9B40]":""}`}/>
                  <span className={`font-serif text-sm tracking-wide ${activeTab===item.id?"font-medium":"font-light"}`}>{item.label}</span>
                  {item.badge && <span className="absolute right-4 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#ED9B40] flex items-center justify-center text-xs text-[#093A3E] font-bold">{user?.name?.charAt(0)||"A"}</div>
                <span className="text-xs text-white/80">{user?.name||"Admin"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                <div className={`w-1.5 h-1.5 rounded-full ${socketConnected?"bg-green-500":"bg-red-500"}`}/>
                {socketConnected?"Live Chat Active":"Chat Offline"}
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 text-white/40 hover:text-red-300 transition-colors uppercase tracking-widest text-[10px] py-1.5">
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
        <div className="w-16 h-16 border-4 border-stone-200 border-t-[#093A3E] rounded-full animate-spin mx-auto mb-4"/>
        <p className="font-serif text-stone-600 tracking-widest uppercase text-sm">Loading Estate Data…</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">

      {/* Mobile menu button */}
      <button onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 bg-[#093A3E] text-white p-3 rounded-lg shadow-lg">
        <FaBars size={20}/>
      </button>

      <MobileMenu />

      {/* ── Desktop Sidebar - Updated to match client dashboard green ── */}
      <aside className="hidden md:flex md:w-72 bg-[#093A3E] text-white flex-col shadow-2xl z-20 flex-shrink-0">
        <div className="p-10 border-b border-white/10">
          <h1 className="text-2xl font-serif tracking-wider text-white">MWEMA<span className="text-[#ED9B40]">.</span></h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-2">Estate Administration</p>
        </div>
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); if(item.id!=="messages") setSelectedChat(null); }}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 group relative ${
                activeTab===item.id ? "bg-white/10 text-white border-r-2 border-[#ED9B40]" : "text-white/60 hover:text-white hover:bg-white/5"}`}
            >
              <item.icon className={`text-lg ${activeTab===item.id?"scale-110 text-[#ED9B40]":"group-hover:text-white"}`}/>
              <span className={`font-serif tracking-wide ${activeTab===item.id?"font-medium":"font-light"}`}>{item.label}</span>
              {item.badge && <span className="absolute right-6 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ED9B40] flex items-center justify-center text-sm text-[#093A3E] font-bold">{user?.name?.charAt(0)||"A"}</div>
            <span className="text-sm text-white/80">{user?.name||"Admin"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className={`w-2 h-2 rounded-full ${socketConnected?"bg-green-500":"bg-red-500"}`}/>
            {socketConnected?"Live Chat Active":"Chat Offline"}
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 text-white/40 hover:text-red-300 transition-colors uppercase tracking-widest text-xs py-2">
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
            <div className="w-10 h-10 rounded-full bg-[#093A3E] text-[#ED9B40] flex items-center justify-center font-serif text-lg">A</div>
          </div>
        </header>

        {/* Mobile secondary nav */}
        <div className="md:hidden mb-6 -mx-4 px-4 pb-4 border-b border-stone-200 overflow-x-auto">
          <div className="flex gap-2 min-w-min">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded text-xs whitespace-nowrap transition-all relative ${
                  activeTab===item.id?"bg-[#093A3E] text-white":"bg-stone-100 text-stone-600 border border-stone-200"}`}>
                {item.label}
                {item.badge && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ══ DASHBOARD - Updated with real stats ══ */}
        {activeTab === "dashboard" && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="space-y-8 md:space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {[
                { label:"Total Properties",    value: stats.total_properties, icon: FaBuilding, color: "text-[#093A3E]" },
                { label:"Active Bookings",     value: stats.active_bookings,  icon: FaCalendarAlt, color: "text-amber-600" },
                { label:"Completed Bookings",  value: stats.completed_bookings, icon: FaCalendarCheck, color: "text-green-600" },
                { label:"Total Revenue",       value: `Ksh ${stats.total_revenue.toLocaleString()}`, icon: FaMoneyBillWave, color: "text-[#093A3E]" },
              ].map((s,i) => (
                <div key={i} className="bg-white p-5 md:p-8 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 font-medium leading-tight">{s.label}</p>
                    <s.icon className={`text-stone-300 text-lg md:text-xl flex-shrink-0 ${s.color}`}/>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif text-[#1C2321]">{s.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              <div className="bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Financial Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Total Revenue</span>
                    <span className="text-2xl font-serif text-[#093A3E]">Ksh {stats.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Pending Payments</span>
                    <span className="text-xl font-serif text-amber-600">Ksh {stats.pending_payments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Monthly Average</span>
                    <span className="text-lg font-serif">Ksh {Math.round(stats.monthly_revenue).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Performance Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-stone-600">Occupancy Rate</span>
                      <span className="font-medium">{stats.occupancy_rate}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#093A3E] rounded-full" 
                        style={{ width: `${Math.min(stats.occupancy_rate, 100)}%` }}
                      />
                    </div>
                  </div>
                  {stats.popular_property && (
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-[10px] uppercase text-stone-400 mb-1">Most Popular Property</p>
                      <p className="font-serif text-lg text-[#093A3E]">{stats.popular_property}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {/* Consultation summary widget */}
              <div className="bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Consultations</h3>
                <div className="space-y-4">
                  {[
                    { label:"Total Requests", value: consultSummary.total,     color:"text-stone-800" },
                    { label:"Pending",        value: consultSummary.pending,   color:"text-amber-600" },
                    { label:"Confirmed",      value: consultSummary.confirmed, color:"text-green-700" },
                    { label:"Completed",      value: consultSummary.completed, color:"text-stone-500" },
                  ].map((item,i) => (
                    <div key={i} className="flex items-center justify-between pb-3 border-b border-stone-50 last:border-0">
                      <p className="text-sm text-stone-600">{item.label}</p>
                      <span className={`text-lg font-serif ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                  <button onClick={() => setActiveTab("consultations")}
                    className="w-full mt-2 text-[10px] uppercase tracking-widest text-stone-400 hover:text-[#093A3E] border-b border-stone-200 pb-1 transition-colors text-left">
                    View all →
                  </button>
                </div>
              </div>
              
              {/* Recent Activity Placeholder */}
              <div className="md:col-span-2 bg-white p-6 md:p-8 border border-stone-100 shadow-sm">
                <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <FaCalendarAlt className="text-[#093A3E]" />
                    </div>
                    <div>
                      <p className="font-medium">New booking confirmed</p>
                      <p className="text-sm text-stone-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <FaUser className="text-[#ED9B40]" />
                    </div>
                    <div>
                      <p className="font-medium">New client registered</p>
                      <p className="text-sm text-stone-500">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <FaMoneyBillWave className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Payment received</p>
                      <p className="text-sm text-stone-500">Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ PROPERTIES - Using dedicated component ══ */}
        {activeTab === "properties" && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
            <AdminPropertiesTab onRefreshStats={fetchStats} />
          </motion.div>
        )}

        {/* ══ BOOKINGS ══ */}
        {activeTab === "bookings" && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
            <AdminBookingsTab />
          </motion.div>
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
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#093A3E] text-white flex items-center justify-center text-2xl font-serif">
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
                              className="flex-1 bg-[#093A3E] text-white py-3 hover:bg-[#0a4a52] transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
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
                  <thead><tr className="border-b-2 border-[#093A3E]">
                    {["Identity","Email","Phone","Role","Joined","Actions"].map(h=>(
                      <th key={h} className="py-4 px-4 font-serif text-[#093A3E] text-lg font-normal">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {customers.map(c=>(
                      <tr key={c.id} className="border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors">
                        <td className="py-4 md:py-6 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#093A3E] text-white flex items-center justify-center font-serif text-sm flex-shrink-0">{c.name?.charAt(0)||c.email?.charAt(0)}</div>
                            <span className="font-serif text-[#1C2321]">{c.name||"Unnamed"}</span>
                          </div>
                        </td>
                        <td className="py-4 md:py-6 px-4 text-stone-600 font-light text-sm">{c.email}</td>
                        <td className="py-4 md:py-6 px-4 text-stone-600 font-light text-sm">{c.phone||"—"}</td>
                        <td className="py-4 md:py-6 px-4"><span className="text-xs uppercase tracking-widest border border-stone-200 px-2 py-1 text-stone-500">{c.role||"guest"}</span></td>
                        <td className="py-4 md:py-6 px-4 text-stone-500 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td className="py-4 md:py-6 px-4">
                          <div className="flex items-center gap-2">
                            <button onClick={()=>handleViewClient(c)} className="text-stone-400 hover:text-[#093A3E] p-2 hover:bg-stone-100 rounded-full transition-colors" disabled={deletingClient}><FaEye size={14}/></button>
                            <button onClick={()=>handleMessageClient(c)} className="text-stone-400 hover:text-[#093A3E] p-2 hover:bg-stone-100 rounded-full transition-colors" disabled={deletingClient}><FaComments size={14}/></button>
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

        {/* ══ CONSULTATIONS — delegated entirely to AdminConsultations ══ */}
        {activeTab === "consultations" && <AdminConsultations />}

        {/* ══ MESSAGES - UPDATED CHAT SECTION ══ */}
        {activeTab === "messages" && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-serif text-[#1C2321]">Chat Desk</h2>
                <p className="text-stone-500 font-serif italic text-sm">
                  {socketConnected ? "🟢 Live client support" : "⚪️ Chat offline"}
                </p>
              </div>
              <button 
                onClick={fetchMessages} 
                className="text-stone-500 hover:text-[#093A3E] flex items-center gap-2 text-sm uppercase tracking-widest touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <FaSync className={loadingMessages ? 'animate-spin' : ''}/> Refresh
              </button>
            </div>

            {/* Main Chat Area - Two column on desktop, stack on mobile */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Chat List - Left Column (hidden on mobile when chat is open) */}
              <div className={`${
                selectedChat ? 'hidden md:block md:w-80' : 'block w-full md:w-80'
              } flex-shrink-0`}>
                {loadingMessages ? (
                  // Loading skeletons for chat list
                  <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
                    <div className="bg-[#093A3E] p-4">
                      <div className="h-6 bg-white/20 animate-pulse rounded w-32"></div>
                    </div>
                    <div className="divide-y divide-stone-100">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-200 animate-pulse rounded-full"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-stone-200 animate-pulse rounded w-24 mb-2"></div>
                              <div className="h-3 bg-stone-200 animate-pulse rounded w-32"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="bg-white border border-stone-100 rounded-lg p-8 text-center">
                    <FaComments className="text-4xl text-stone-200 mx-auto mb-4"/>
                    <h3 className="font-serif text-stone-400 text-lg mb-2">No Active Conversations</h3>
                    <p className="text-stone-400 text-sm">Client inquiries will appear here in real-time.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
                    {/* List Header */}
                    <div className="bg-[#093A3E] text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-serif">Active Chats</h3>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {messages.length}
                        </span>
                      </div>
                    </div>
                    
                    {/* Scrollable Chat List */}
                    <div className="max-h-[600px] overflow-y-auto">
                      {messages.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => handleSelectChat(chat)}
                          className={`w-full p-4 text-left border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors flex items-center gap-3 touch-manipulation ${
                            selectedChat?.id === chat.id ? 'bg-stone-50' : ''
                          }`}
                          style={{ minHeight: '72px' }}
                        >
                          {/* Avatar with status */}
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-[#093A3E] text-white flex items-center justify-center">
                              <FaUser />
                            </div>
                            {chat.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ED9B40] text-white text-xs rounded-full flex items-center justify-center">
                                {chat.unread_count}
                              </span>
                            )}
                          </div>

                          {/* Chat Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-medium text-stone-900 truncate">
                                {chat.user_name || `Client ${chat.user_id}`}
                              </h4>
                              <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                                {formatTime(chat.last_message_time)}
                              </span>
                            </div>
                            <p className="text-sm text-stone-500 truncate">
                              {chat.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Window - Right Column */}
              <div className={`${
                selectedChat ? 'block' : 'hidden md:block'
              } flex-1 bg-white border border-stone-100 rounded-lg overflow-hidden`}>
                {selectedChat ? (
                  <div className="h-full flex flex-col">
                    {/* Chat Header with Back Button */}
                    <div className="bg-[#093A3E] text-white p-4 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors touch-manipulation"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                      >
                        <FaArrowLeft className="text-lg" />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-[#ED9B40] flex items-center justify-center flex-shrink-0 text-[#093A3E] font-bold">
                        {selectedChat.user_name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif truncate">
                          {selectedChat.user_name || `Client ${selectedChat.user_id}`}
                        </h3>
                        <p className="text-xs text-white/60">
                          {socketConnected ? '🟢 Online' : '⚪️ Offline'}
                        </p>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-stone-50">
                      {!chatMessages[selectedChat.id] || chatMessages[selectedChat.id].length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-stone-400 text-sm">No messages yet. Say hello!</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {(() => {
                            // Group messages by date
                            const messages = chatMessages[selectedChat.id] || [];
                            const groups = {};
                            
                            messages.forEach(msg => {
                              if (!msg.timestamp) return;
                              const date = new Date(msg.timestamp);
                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(yesterday.getDate() - 1);
                              
                              let dateKey;
                              if (date.toDateString() === today.toDateString()) {
                                dateKey = 'Today';
                              } else if (date.toDateString() === yesterday.toDateString()) {
                                dateKey = 'Yesterday';
                              } else {
                                dateKey = date.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                });
                              }
                              
                              if (!groups[dateKey]) groups[dateKey] = [];
                              groups[dateKey].push(msg);
                            });
                            
                            // Render grouped messages
                            return Object.entries(groups).map(([date, dateMessages]) => (
                              <div key={date}>
                                {/* Date Separator */}
                                <div className="flex justify-center mb-4">
                                  <span className="text-xs bg-white px-3 py-1 rounded-full text-stone-500 shadow-sm">
                                    {date}
                                  </span>
                                </div>
                                
                                {/* Messages for this date */}
                                <div className="space-y-4">
                                  {dateMessages.map((msg, idx) => {
                                    const isOwn = msg.sender_id === user?.id;
                                    return (
                                      <div
                                        key={msg.id}
                                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                      >
                                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                          <div
                                            className={`relative px-4 py-2 rounded-2xl ${
                                              isOwn
                                                ? 'bg-[#093A3E] text-white rounded-br-none'
                                                : 'bg-white text-stone-900 rounded-bl-none shadow-sm'
                                            }`}
                                          >
                                            <p className="text-sm pr-16">{msg.content}</p>
                                            <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${
                                              isOwn ? 'text-white/60' : 'text-stone-400'
                                            }`}>
                                              <span>{formatTime(msg.timestamp)}</span>
                                              {isOwn && (
                                                <span>
                                                  {msg.is_read ? (
                                                    <FaCheckDouble className="text-sm text-blue-400" />
                                                  ) : (
                                                    <FaCheck className="text-sm" />
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ));
                          })()}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-stone-200">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage(selectedChat.id);
                        }} 
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newMessage[selectedChat.id] || ''}
                          onChange={(e) => setNewMessage({
                            ...newMessage,
                            [selectedChat.id]: e.target.value
                          })}
                          placeholder="Type a message..."
                          className="flex-1 bg-stone-50 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#093A3E] transition-all"
                          style={{ minHeight: '44px' }}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage[selectedChat.id]?.trim()}
                          className="bg-[#093A3E] text-white p-3 rounded-full hover:bg-[#0a4a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                        >
                          <FaPaperPlane />
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-8">
                    <div>
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaComments className="text-3xl text-stone-400" />
                      </div>
                      <h3 className="font-serif text-lg text-stone-600 mb-2">Select a conversation</h3>
                      <p className="text-stone-400 text-sm">Choose a chat from the list to start responding</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}