import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Shield, CheckCircle, XCircle,
  AlertCircle, Smartphone, CreditCard, ChevronRight,
  Copy, Phone, Wallet, Loader, Lock, Eye, EyeOff,
  ExternalLink, MessageCircle, X, Send, Home, Check, CheckCheck
} from "lucide-react";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
}

// ─── ChatDrawer (unchanged) ───────────────────────────────────────────────────
function ChatDrawer({ isOpen, onClose, user }) {
  const [messages,    setMessages]    = useState([]);
  const [newMessage,  setNewMessage]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [chat,        setChat]        = useState(null);
  const [sending,     setSending]     = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    const initChat = async () => {
      setLoading(true);
      try {
        const cacheKey = `paymentChatId_${user.id}`;
        let chatId = localStorage.getItem(cacheKey);
        if (!chatId) {
          const res = await api.chats.startChat(user.id, null, null);
          chatId = res.data.chat.id;
          localStorage.setItem(cacheKey, chatId);
        }
        setChat({ id: chatId });
        const msgs = await api.chats.getMessages(chatId);
        setMessages(msgs.data || []);
      } catch (e) {
        console.error("Chat init error:", e);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [isOpen, user?.id]);

  useEffect(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?.id || sending) return;

    const tempId = Date.now();
    const optimistic = {
      id: tempId, content: newMessage, sender_id: user.id,
      sender_name: user.name || "Guest", is_host: false,
      timestamp: new Date().toISOString(), is_temp: true,
    };
    setMessages((p) => [...p, optimistic]);
    setNewMessage("");
    setSending(true);

    try {
      const res = await api.chats.sendMessage(chat.id, {
        content: newMessage, sender_id: user.id,
        sender_name: user.name || "Guest", is_host: false,
      });
      setMessages((p) => p.map((m) => m.id === tempId ? { ...res.data, is_temp: false } : m));
    } catch {
      setMessages((p) => p.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const fmtTime = (ts) => {
    if (!ts) return "";
    try { return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col"
          >
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-[#093A3E] text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ED9B40] flex items-center justify-center">
                  <MessageCircle size={16} className="text-[#093A3E]" />
                </div>
                <div>
                  <h3 className="font-serif text-base">Chat Support</h3>
                  <p className="text-[10px] text-white/60">Typically replies in minutes</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-stone-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-[#093A3E] rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={40} className="text-stone-300 mb-3" />
                  <p className="text-stone-500 text-sm">How can we help with your booking?</p>
                  <p className="text-stone-400 text-xs mt-1">Send a message and we'll reply shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] ${isOwn ? "order-2" : "order-1"}`}>
                          <div className={`relative px-4 py-2 rounded-2xl ${
                            isOwn
                              ? "bg-[#093A3E] text-white rounded-br-none"
                              : "bg-white text-stone-900 rounded-bl-none shadow-sm"
                          }`}>
                            <p className="text-sm pr-12">{msg.content}</p>
                            <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${isOwn ? "text-white/60" : "text-stone-400"}`}>
                              <span>{fmtTime(msg.timestamp)}</span>
                              {isOwn && (msg.is_temp
                                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : msg.is_read
                                  ? <CheckCheck size={12} className="text-blue-400" />
                                  : <Check size={12} />)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-stone-200 bg-white">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message…"
                  className="flex-1 bg-stone-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#093A3E]"
                  style={{ minHeight: "44px" }} />
                <button type="submit" disabled={!newMessage.trim() || sending}
                  className="bg-[#093A3E] text-white p-3 rounded-full hover:bg-[#0a4a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── PaymentPage ──────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const { id } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [loading,          setLoading]          = useState(true);
  const [processing,       setProcessing]       = useState(false);
  const [property,         setProperty]         = useState(null);
  const [booking,          setBooking]          = useState(null);
  const [showChat,         setShowChat]         = useState(false);
  const [selectedMethod,   setSelectedMethod]   = useState("mpesa");
  const [phoneNumber,      setPhoneNumber]      = useState("");
  const [phoneError,       setPhoneError]       = useState("");
  const [showPhoneHelp,    setShowPhoneHelp]    = useState(false);
  const [paypalLoading,    setPaypalLoading]    = useState(false);
  const [paymentStatus,    setPaymentStatus]    = useState("pending");
  const [checkoutRequestId,setCheckoutRequestId]= useState(null);
  const [paymentId,        setPaymentId]        = useState(null);
  const [errorMessage,     setErrorMessage]     = useState("");
  const [successMessage,   setSuccessMessage]   = useState("");
  const [timeLeft,         setTimeLeft]         = useState(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [isExpired,        setIsExpired]        = useState(false);
  const [showSummary,      setShowSummary]      = useState(false);
  const [copied,           setCopied]           = useState(false);

  // ── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
    initializePayment();
  }, []);

  // Real-time expiry check every 10 s
  useEffect(() => {
    if (!booking?.id) return;
    const check = async () => {
      try {
        const res = await api.bookings.getStatus(booking.id);
        if (res.data.is_expired) {
          setIsExpired(true);
          setErrorMessage("Your booking session has expired. Please start over.");
        } else if (res.data.time_left && booking.status === "pending") {
          setTimeLeft({
            minutes: res.data.time_left.minutes,
            seconds: res.data.time_left.seconds,
          });
        }
      } catch (e) {
        console.error("Expiry check error:", e);
      }
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [booking?.id]);

  // PayPal redirect return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypalReturn = params.get("paypal");
    const orderId = params.get("token");
    if (paypalReturn === "success" && orderId) handlePaypalReturn(orderId);
    else if (paypalReturn === "cancel") {
      setErrorMessage("PayPal payment was cancelled. You can try again.");
      setPaymentStatus("pending");
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!booking?.expires_at) return;
    const expiresAt = parseUTCDate(booking.expires_at);
    if (!expiresAt) return;

    const tick = () => {
      const diff = expiresAt - new Date();
      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        setShowTimerWarning(true);
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, total: diff });
      if (diff <= 300000) setShowTimerWarning(true);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [booking]);

  // M-PESA poller
  useEffect(() => {
    let iv;
    if (checkoutRequestId && paymentStatus === "processing") {
      iv = setInterval(checkMpesaStatus, 3000);
    }
    return () => { if (iv) clearInterval(iv); };
  }, [checkoutRequestId, paymentStatus]);

  // ── Initialize payment ──────────────────────────────────────────────────────
  const initializePayment = async () => {
    setLoading(true);
    try {
      // 1. Pending booking data from pre-login flow
      const pendingData = localStorage.getItem("pendingBookingData");
      if (pendingData && isAuthenticated) {
        try {
          const formData = JSON.parse(pendingData);
          if (formData.propertyId === id && formData.action === "create-booking") {
            const res = await fetch(`${API_BASE_URL}/bookings/create-from-session`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                property_id:  formData.propertyId,
                check_in:     formData.checkInDate,
                check_out:    formData.checkOutDate,
                guests:       formData.guests,
                payment_type: "full",
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              if (res.status === 409) {
                localStorage.removeItem("pendingBookingData");
                setErrorMessage("These dates are no longer available. Please try different dates.");
                setLoading(false);
                return;
              }
              throw new Error(data.error || "Failed to create booking");
            }
            localStorage.removeItem("pendingBookingData");
            setBooking(data.booking);
            const propRes = await api.properties.getById(data.booking.property_id);
            setProperty(propRes.data);
            if (user?.phone) setPhoneNumber(user.phone);
            setLoading(false);
            return;
          } else {
            localStorage.removeItem("pendingBookingData");
          }
        } catch (e) {
          localStorage.removeItem("pendingBookingData");
          if (e.message.includes("no longer available")) {
            setErrorMessage(e.message);
          } else {
            setErrorMessage("Failed to create booking. Please try again.");
          }
          setLoading(false);
          return;
        }
      }

      // 2. Booking passed via router state (fresh booking flow)
      let bookingData = location.state?.bookingDetails;

      // 3. Booking saved in localStorage (PayPal return)
      if (!bookingData) {
        const stored = localStorage.getItem("pendingBooking");
        if (stored) {
          bookingData = JSON.parse(stored);
          localStorage.removeItem("pendingBooking");
        }
      }

      // 4. ── KEY FIX: Return-to-payment path ──────────────────────────────
      //    If the user navigated here from MyBookings via "Pay Now", there is
      //    no local state — fetch the booking directly from the API using the
      //    ID in the URL.
      if (!bookingData && id && isAuthenticated) {
        try {
          const res = await api.bookings.getById(id);
          if (res.data) {
            bookingData = res.data;
          }
        } catch (e) {
          console.error("Fetch booking by ID failed:", e);
        }
      }

      if (!bookingData) {
        setErrorMessage("Booking information not found. Please start over.");
        setLoading(false);
        return;
      }

      // 5. Expiry check
      if (bookingData.expires_at) {
        const expiresAt = parseUTCDate(bookingData.expires_at);
        if (expiresAt && expiresAt < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }
      }

      // 6. Also reject if the booking is already not pending
      if (bookingData.status && bookingData.status !== "pending") {
        if (bookingData.status === "expired") {
          setIsExpired(true);
          setLoading(false);
          return;
        }
        if (bookingData.status === "confirmed" || bookingData.payment_status === "completed") {
          setErrorMessage("This booking has already been paid. Redirecting to your bookings…");
          setTimeout(() => navigate("/my-bookings"), 2500);
          setLoading(false);
          return;
        }
      }

      setBooking(bookingData);
      const propRes = await api.properties.getById(bookingData.property_id || id);
      setProperty(propRes.data);
      if (user?.phone) setPhoneNumber(user.phone);
    } catch (err) {
      console.error("Initialization error:", err);
      setErrorMessage("Failed to load payment details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── M-PESA ──────────────────────────────────────────────────────────────────
  const checkMpesaStatus = async () => {
    if (!checkoutRequestId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/payments/mpesa/status/${checkoutRequestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.payment?.status === "completed") {
          setPaymentStatus("success");
          setSuccessMessage("Payment completed successfully!");
          localStorage.removeItem("pendingBooking");
          setTimeout(() => navigate("/payment/success", {
            state: { bookingId: data.booking?.id, amount: data.payment?.amount, receipt: data.payment?.mpesa_receipt },
          }), 2000);
        } else if (data.payment?.status === "failed") {
          setPaymentStatus("failed");
          setErrorMessage("Payment failed. Please try again.");
        }
      }
    } catch (e) {
      console.error("Status check error:", e);
    }
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 9 && cleaned.startsWith("7"))
      return { valid: true, formatted: "254" + cleaned };
    if (cleaned.length === 10 && cleaned.startsWith("07"))
      return { valid: true, formatted: "254" + cleaned.substring(1) };
    if (cleaned.length === 12 && cleaned.startsWith("254"))
      return { valid: true, formatted: cleaned };
    if (cleaned.length === 13 && cleaned.startsWith("+254"))
      return { valid: true, formatted: cleaned.substring(1) };
    return { valid: false, formatted: phone };
  };

  const handlePhoneChange = (e) => {
    const v = e.target.value;
    setPhoneNumber(v);
    if (v.length > 3) {
      setPhoneError(validatePhone(v).valid ? "" : "Enter a valid M-PESA number (e.g. 0712345678)");
    } else {
      setPhoneError("");
    }
  };

  const initiateMpesa = async () => {
    const validation = validatePhone(phoneNumber);
    if (!validation.valid) { setPhoneError("Please enter a valid M-PESA number"); return; }
    if (!booking)          { setErrorMessage("Booking information missing"); return; }

    setProcessing(true);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/payments/mpesa/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          booking_id:   booking.id,
          phone_number: validation.formatted,
          amount:       Math.round(booking.total_amount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.expired) { setIsExpired(true); throw new Error("Booking session expired."); }
        throw new Error(data.error || "Payment initiation failed");
      }
      setCheckoutRequestId(data.checkout_request_id);
      setPaymentId(data.payment_id);
      setSuccessMessage("STK Push sent! Check your phone and enter your PIN.");
    } catch (e) {
      setPaymentStatus("failed");
      setErrorMessage(e.message || "Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // ── PayPal ──────────────────────────────────────────────────────────────────
  const initiatePaypal = async () => {
    if (!booking) { setErrorMessage("Booking information missing"); return; }
    setPaypalLoading(true);
    setErrorMessage("");
    try {
      const base      = window.location.origin + window.location.pathname;
      const returnUrl = `${base}?paypal=success`;
      const cancelUrl = `${base}?paypal=cancel`;

      const res = await fetch(`${API_BASE_URL}/payments/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({
          booking_id: booking.id,
          amount:     Math.round(booking.total_amount),
          currency:   "KES",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create PayPal order");

      if (data.success && data.approval_url) {
        localStorage.setItem("pendingBooking", JSON.stringify(booking));
        localStorage.setItem("pendingPaypalOrderId", data.order_id);
        window.location.href = data.approval_url;
      } else {
        throw new Error("No PayPal approval URL received");
      }
    } catch (e) {
      setErrorMessage(e.message || "Failed to initiate PayPal payment. Please try again.");
    } finally {
      setPaypalLoading(false);
    }
  };

  const handlePaypalReturn = async (orderId) => {
    setPaymentStatus("processing");
    setSuccessMessage("Completing your PayPal payment…");
    try {
      const res = await fetch(`${API_BASE_URL}/payments/paypal/capture-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentStatus("success");
        localStorage.removeItem("pendingBooking");
        localStorage.removeItem("pendingPaypalOrderId");
        setTimeout(() => navigate("/payment/success", {
          state: { bookingId: booking?.id, amount: booking?.total_amount, receipt: data.transaction_id },
        }), 2000);
      } else {
        throw new Error(data.error || "Failed to capture PayPal payment");
      }
    } catch (e) {
      setPaymentStatus("failed");
      setErrorMessage(e.message || "Failed to complete PayPal payment. Please try again.");
    }
  };

  // ── Shared ──────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    setPaymentStatus("pending");
    setErrorMessage("");
    setSuccessMessage("");
    setCheckoutRequestId(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const handleStartOver = () => navigate(`/booking/${id}`);
  const formatCurrency  = (n) => `KSh ${Number(n || 0).toLocaleString()}`;
  const getImageSrc     = (url) => (!url ? "/default-property.jpg" : url.startsWith("http") ? url : `${IMAGE_BASE_URL}${url}`);

  const copyPhone = () => {
    navigator.clipboard.writeText("0712345678");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-stone-600">Preparing secure payment…</p>
        </div>
      </div>
    );
  }

  // ── Expired ─────────────────────────────────────────────────────────────────
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="font-serif text-xl md:text-2xl mb-2">Session Expired</h2>
          <p className="text-stone-600 text-sm mb-6">
            Your 15-minute booking hold has expired. Please start over to book this property.
          </p>
          <button onClick={handleStartOver}
            className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
            Start New Booking
          </button>
        </div>
      </div>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-xl md:text-2xl mb-2">Payment Successful!</h2>
          <p className="text-stone-600 text-sm mb-4">{successMessage}</p>
          <p className="text-xs text-stone-400 mb-6">Redirecting to your bookings…</p>
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f2ee] pb-16 md:pb-24">

      {isAuthenticated && <ChatDrawer isOpen={showChat} onClose={() => setShowChat(false)} user={user} />}

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-2.5 flex items-center justify-between"
        style={{ background: "#093A3E", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#ED9B40]" />
        </button>
        <h1 className="text-base font-medium text-[#ED9B40] truncate max-w-[200px]">Complete Payment</h1>
        <button onClick={() => setShowSummary(!showSummary)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <Eye className={`w-4 h-4 text-[#ED9B40] transition-transform ${showSummary ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Mobile summary dropdown */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden fixed top-[49px] left-0 right-0 bg-white border-b border-stone-200 z-40 overflow-hidden shadow-lg"
          >
            <div className="p-4">
              <div className="flex gap-3">
                <img src={getImageSrc(property?.cover_image || property?.images?.[0])}
                  alt={property?.name || "Property"}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => { e.target.src = "/default-property.jpg"; }} />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{property?.name || "Property"}</h3>
                  <p className="text-xs text-stone-500 mt-1">{property?.location}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm border-t border-stone-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-stone-600">Total Amount</span>
                  <span className="font-serif font-bold">{formatCurrency(booking?.total_amount)}</span>
                </div>
                {timeLeft && (
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Time left</span>
                    <span className={`font-mono font-bold ${showTimerWarning ? "text-red-600" : "text-stone-900"}`}>
                      {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-12">

        {/* Desktop header */}
        <div className="hidden md:flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-stone-200 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif text-xl">Complete Your Payment</h1>
        </div>

        {/* Timer warnings */}
        {showTimerWarning && timeLeft && (
          <>
            <div className="hidden md:block mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-amber-800 font-medium">
                    Complete payment in {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, "0")}
                  </p>
                  <p className="text-amber-600 text-sm">Your booking will expire if not completed in time.</p>
                </div>
              </div>
            </div>
            <div className="md:hidden mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-amber-800 text-xs">
                  Complete in <span className="font-mono font-bold">
                    {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Error */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-xs md:text-sm">{errorMessage}</p>
                {paymentStatus === "failed" && (
                  <button onClick={handleRetry} className="text-xs text-red-600 underline mt-1">Try again</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing banner */}
        <AnimatePresence>
          {successMessage && paymentStatus === "processing" && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-xs md:text-sm">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

          {/* LEFT — Payment form */}
          <div className="md:col-span-2 order-2 md:order-1">
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">

              {/* Method selection */}
              <div className="p-4 md:p-6 border-b border-stone-200">
                <h2 className="font-serif text-lg md:text-xl mb-4">Payment Method</h2>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <button onClick={() => { setSelectedMethod("mpesa"); handleRetry(); }}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 ${
                      selectedMethod === "mpesa" ? "border-green-500 bg-green-50" : "border-stone-200 hover:border-stone-300"
                    }`}>
                    <Smartphone className={`w-4 h-4 md:w-5 md:h-5 ${selectedMethod === "mpesa" ? "text-green-600" : "text-stone-400"}`} />
                    <div className="text-left">
                      <p className="text-xs md:text-sm font-medium">M-PESA</p>
                      <p className="text-[10px] md:text-xs text-stone-500">Mobile money</p>
                    </div>
                  </button>
                  <button onClick={() => { setSelectedMethod("paypal"); handleRetry(); }}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 ${
                      selectedMethod === "paypal" ? "border-blue-500 bg-blue-50" : "border-stone-200 hover:border-stone-300"
                    }`}>
                    <div className="w-4 h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className={`w-4 h-4 md:w-5 md:h-5 ${selectedMethod === "paypal" ? "opacity-100" : "opacity-40"}`} fill="none">
                        <path d="M19.5 6.5C19.5 9.5 17.5 12 14 12H11.5L10.5 17.5H7.5L9.5 6.5H14C17 6.5 19.5 4 19.5 6.5Z" fill="#003087"/>
                        <path d="M17 9.5C17 12.5 15 15 11.5 15H9L8 20.5H5L7 9.5H11.5C14.5 9.5 17 7 17 9.5Z" fill="#009cde"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs md:text-sm font-medium">PayPal</p>
                      <p className="text-[10px] md:text-xs text-stone-500">Pay online</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* M-PESA form */}
              {selectedMethod === "mpesa" && (
                <div className="p-4 md:p-6">
                  <h3 className="font-medium text-sm md:text-base mb-3">M-PESA Phone Number</h3>
                  <div className="relative">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden focus-within:border-stone-900 transition-colors">
                      <div className="bg-stone-100 px-3 py-3 md:px-4 md:py-3.5 border-r border-stone-200">
                        <Phone className="w-4 h-4 text-stone-500" />
                      </div>
                      <input type="tel" value={phoneNumber} onChange={handlePhoneChange}
                        placeholder="0712345678" disabled={paymentStatus === "processing"}
                        className="flex-1 px-3 md:px-4 py-3 md:py-3.5 outline-none text-sm disabled:bg-stone-50" />
                    </div>
                    <button onClick={() => setShowPhoneHelp(!showPhoneHelp)}
                      className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      What format should I use?
                    </button>
                    <AnimatePresence>
                      {showPhoneHelp && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="bg-stone-50 p-3 rounded-lg mt-2 text-xs space-y-2">
                            <p>✅ <span className="font-mono">0712345678</span> (10 digits)</p>
                            <p>✅ <span className="font-mono">254712345678</span> (12 digits)</p>
                            <p>✅ <span className="font-mono">+254712345678</span> (13 digits)</p>
                            <button onClick={copyPhone} className="text-green-600 flex items-center gap-1 mt-1">
                              <Copy className="w-3 h-3" />
                              {copied ? "Copied!" : "Copy example"}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {phoneError && <p className="text-red-500 text-xs mt-2">{phoneError}</p>}
                  </div>

                  {paymentStatus === "pending" && (
                    <button onClick={initiateMpesa} disabled={processing || !phoneNumber || !!phoneError}
                      className="w-full mt-6 py-3 md:py-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {processing
                        ? <><Loader className="w-4 h-4 animate-spin" /> Processing…</>
                        : <><Wallet className="w-4 h-4" /> Pay {formatCurrency(booking?.total_amount)}</>}
                    </button>
                  )}
                  {paymentStatus === "processing" && (
                    <div className="mt-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 border-4 border-stone-200 border-t-green-600 rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-medium">Waiting for M-PESA confirmation</p>
                      <p className="text-xs text-stone-500 mt-1">Check your phone and enter PIN</p>
                      <button onClick={checkMpesaStatus} className="mt-4 text-xs text-green-600 underline">
                        Check status manually
                      </button>
                    </div>
                  )}
                  {paymentStatus === "failed" && (
                    <button onClick={handleRetry}
                      className="w-full mt-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                      Try Again
                    </button>
                  )}
                </div>
              )}

              {/* PayPal form */}
              {selectedMethod === "paypal" && (
                <div className="p-4 md:p-6">
                  <h3 className="font-medium text-sm md:text-base mb-2">Pay with PayPal</h3>
                  <p className="text-xs text-stone-500 mb-6">
                    You'll be redirected to PayPal to complete your payment securely.
                  </p>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-600">Amount</span>
                      <span className="font-serif font-bold">{formatCurrency(booking?.total_amount)}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Approximate USD equivalent charged at PayPal's current exchange rate.
                    </p>
                  </div>
                  {paymentStatus === "pending" && (
                    <button onClick={initiatePaypal} disabled={paypalLoading}
                      className="w-full py-3 md:py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-lg text-sm font-medium transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {paypalLoading
                        ? <><Loader className="w-4 h-4 animate-spin" /> Connecting to PayPal…</>
                        : <>
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                              <path d="M19.5 6.5C19.5 9.5 17.5 12 14 12H11.5L10.5 17.5H7.5L9.5 6.5H14C17 6.5 19.5 4 19.5 6.5Z" fillOpacity="0.9"/>
                              <path d="M17 9.5C17 12.5 15 15 11.5 15H9L8 20.5H5L7 9.5H11.5C14.5 9.5 17 7 17 9.5Z" fillOpacity="0.7"/>
                            </svg>
                            Pay with PayPal <ExternalLink className="w-3 h-3 opacity-70" />
                          </>}
                    </button>
                  )}
                  {paymentStatus === "processing" && (
                    <div className="mt-2 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 border-4 border-stone-200 border-t-blue-600 rounded-full animate-spin" />
                      </div>
                      <p className="text-sm font-medium">Completing PayPal payment…</p>
                    </div>
                  )}
                  {paymentStatus === "failed" && (
                    <button onClick={handleRetry}
                      className="w-full mt-4 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                      Try Again
                    </button>
                  )}
                  <p className="text-[10px] text-stone-400 text-center mt-4">
                    You will be redirected to PayPal's secure checkout.
                  </p>
                </div>
              )}

              {/* Security note */}
              <div className="p-4 md:p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Secure Payment</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                      {selectedMethod === "mpesa"
                        ? "Your payment is encrypted. We never store your M-PESA PIN."
                        : "You'll be redirected to PayPal's encrypted checkout. We never see your PayPal credentials."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Summary */}
          <div className="md:col-span-1 order-1 md:order-2">
            <div className="md:sticky md:top-24">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">

                {/* Property preview (desktop) */}
                <div className="hidden md:block p-4 border-b border-stone-200">
                  <div className="flex gap-3">
                    <img src={getImageSrc(property?.cover_image || property?.images?.[0])}
                      alt={property?.name || "Property"}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { e.target.src = "/default-property.jpg"; }} />
                    <div>
                      <h3 className="font-medium text-sm">{property?.name || "Property"}</h3>
                      <p className="text-xs text-stone-500 mt-1">{property?.location}</p>
                    </div>
                  </div>
                </div>

                {/* Booking summary */}
                <div className="p-4 md:p-5 space-y-3">
                  <h3 className="font-serif text-base md:text-lg mb-3">Booking Summary</h3>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Dates</span>
                    <span className="font-medium">
                      {booking?.check_in_display || booking?.check_in} — {booking?.check_out_display || booking?.check_out}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Nights</span>
                    <span className="font-medium">{booking?.nights}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Guests</span>
                    <span className="font-medium">
                      {booking?.guests?.adults || 1} Adult{booking?.guests?.adults !== 1 ? "s" : ""}
                      {booking?.guests?.children > 0 && `, ${booking?.guests?.children} Children`}
                    </span>
                  </div>
                  <div className="border-t border-stone-200 my-3 pt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total Amount</span>
                      <span className="font-serif text-lg md:text-xl">
                        {formatCurrency(booking?.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  {timeLeft && (
                    <div className={`p-3 rounded-lg ${showTimerWarning ? "bg-red-50" : "bg-stone-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Time to complete:</span>
                        <span className={`font-mono font-bold ${showTimerWarning ? "text-red-600" : ""}`}>
                          {timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  )}

                  {isAuthenticated && (
                    <button onClick={() => setShowChat(true)}
                      className="w-full mt-4 py-3 border border-[#093A3E] text-[#093A3E] rounded-lg hover:bg-[#093A3E] hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2">
                      <MessageCircle size={18} /> Contact Concierge
                    </button>
                  )}
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-200">
                  <p className="text-[10px] md:text-xs text-stone-500 text-center">
                    Need help?{" "}
                    <button onClick={() => setShowChat(true)} className="text-stone-900 underline">
                      Chat with us
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}