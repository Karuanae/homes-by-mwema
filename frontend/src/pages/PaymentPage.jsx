import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Shield, CheckCircle, XCircle,
  AlertCircle, Smartphone, CreditCard, ChevronRight,
  Copy, Phone, Wallet, Loader, Lock, Eye, EyeOff,
  ExternalLink, MessageCircle, X, Send, Home, Check, CheckCheck,
  MapPin, Calendar, Users
} from "lucide-react";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
}

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
  const [completedPayment, setCompletedPayment] = useState(null);
  const [timeLeft,         setTimeLeft]         = useState(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [isExpired,        setIsExpired]        = useState(false);
  const [showSummary,      setShowSummary]      = useState(false);
  const [copied,           setCopied]           = useState(false);
  const [checkingStatus,   setCheckingStatus]   = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    initializePayment();
  }, []);

  useEffect(() => {
    if (!booking?.id || isExpired) return;

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
        if (e.response?.status === 404) {
          setIsExpired(true);
          setErrorMessage("Your booking session has expired. Please start over.");
        } else {
          console.error("Expiry check error:", e);
        }
      }
    };
    check();
    const iv = setInterval(check, 10000);
    return () => clearInterval(iv);
  }, [booking?.id, isExpired]);

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

  useEffect(() => {
    let iv;
    if (checkoutRequestId && paymentStatus === "processing") {
      checkMpesaStatus();
      iv = setInterval(checkMpesaStatus, 3000);
    }
    return () => { if (iv) clearInterval(iv); };
  }, [checkoutRequestId, paymentStatus]);

  const initializePayment = async () => {
    setLoading(true);
    try {
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

      let bookingData = location.state?.bookingDetails;

      if (!bookingData) {
        const stored = localStorage.getItem("pendingBooking");
        if (stored) {
          bookingData = JSON.parse(stored);
          localStorage.removeItem("pendingBooking");
        }
      }

      if (!bookingData && id && isAuthenticated) {
        try {
          const res = await api.bookings.getById(id);
          if (res.data) {
            bookingData = res.data;
          }
        } catch (e) {
          if (e.response?.status === 404) {
            setIsExpired(true);
            setErrorMessage("This booking session has expired or is no longer available. Please start a new booking.");
          } else {
            console.error("Fetch booking by ID failed:", e);
            setErrorMessage("Unable to load this booking. Please try again.");
          }
          setLoading(false);
          return;
        }
      }

      if (!bookingData) {
        setErrorMessage("Booking information not found. Please start over.");
        setLoading(false);
        return;
      }

      if (bookingData.expires_at) {
        const expiresAt = parseUTCDate(bookingData.expires_at);
        if (expiresAt && expiresAt < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }
      }

      if (bookingData.status === "expired") {
        setIsExpired(true);
        setLoading(false);
        return;
      }
      if (bookingData.payment_status === "completed") {
        setErrorMessage("This booking has already been paid. Redirecting to your bookings…");
        setTimeout(() => navigate("/dashboard?tab=bookings"), 2500);
        setLoading(false);
        return;
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

  const completeMpesaPayment = (payment, confirmedBooking) => {
    if (confirmedBooking?.payment_status !== "completed") return;
    const house = confirmedBooking?.house_details;
    setPaymentStatus("success");
    setSuccessMessage("Payment received and booking confirmed!");
    setCompletedPayment(payment);
    setBooking((current) => ({
      ...current,
      ...confirmedBooking,
      ...(house ? {
        property_name: house.name,
        property_location: house.location,
        check_in: house.check_in,
        check_out: house.check_out,
        nights: house.nights,
        total_amount: house.total_amount,
      } : {}),
      status: "confirmed",
      payment_status: "completed",
    }));
    if (confirmedBooking?.property) setProperty(confirmedBooking.property);
    localStorage.removeItem("pendingBooking");
    sessionStorage.setItem("refreshBookings", "true");
    window.dispatchEvent(new Event("bookingStatusChanged"));
  };

  const checkMpesaStatus = async () => {
    if (!checkoutRequestId) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`${API_BASE_URL}/payments/mpesa/status/${checkoutRequestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        // Backend didn't get a definitive result yet, just wait for next poll
      } else if (data.payment?.status === "completed" || data.booking?.payment_status === "completed") {
        completeMpesaPayment(data.payment, data.booking);
        return;
      } else if (data.payment?.status === "failed") {
        setPaymentStatus("failed");
        setProcessing(false);
        const exactError = data.payment?.error_log || "Safaricom rejected the payment. Please check your balance and try again.";
        setErrorMessage(exactError);
        return;
      }

      if (booking?.id) {
        try {
          const bookingStatus = await api.bookings.getStatus(booking.id);
          if (bookingStatus.data?.payment_status === "completed") {
            completeMpesaPayment(data.payment, bookingStatus.data);
          }
        } catch (bookingError) {
          console.debug("Booking confirmation fallback is still pending", bookingError);
        }
      }
    } catch (e) {
      console.error("Status check error:", e);
    } finally {
      setCheckingStatus(false);
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
      if (!data.checkout_request_id) {
        throw new Error(data.error || "M-PESA did not return a checkout request. Please try again.");
      }
      setCheckoutRequestId(data.checkout_request_id);
      setPaymentId(data.payment_id);
      setSuccessMessage("STK Push sent! Check your phone and enter your PIN.");
    } catch (e) {
      setPaymentStatus("failed");
      setProcessing(false);
      setErrorMessage(e.message || "Failed to initiate payment. Please try again.");
    }
  };

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

  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
          <div className="bg-emerald-600 p-6 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-serif text-xl md:text-2xl">Payment Received & Confirmed</h2>
            <p className="text-emerald-100 text-sm mt-1">Your reservation is secured.</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4 items-center bg-stone-50 p-4 rounded-xl">
              <img src={getImageSrc(property?.cover_image || property?.images?.[0])} alt={property?.name || "Booked property"} className="w-24 h-20 object-cover rounded-lg" />
              <div><p className="text-xs uppercase tracking-widest text-amber-600">Booked home</p><h3 className="font-serif text-lg font-semibold">{property?.name || booking?.property_name}</h3><p className="text-xs text-stone-500 flex gap-1 items-center"><MapPin size={13} />{property?.location || booking?.property_location}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-stone-50 p-3 rounded-lg"><p className="text-xs text-stone-500 flex gap-1 items-center"><Calendar size={13} /> Check-in</p><strong>{booking?.check_in_display || booking?.check_in}</strong></div>
              <div className="bg-stone-50 p-3 rounded-lg"><p className="text-xs text-stone-500 flex gap-1 items-center"><Calendar size={13} /> Check-out</p><strong>{booking?.check_out_display || booking?.check_out}</strong></div>
              <div className="bg-stone-50 p-3 rounded-lg"><p className="text-xs text-stone-500 flex gap-1 items-center"><Users size={13} /> Nights</p><strong>{booking?.nights}</strong></div>
              <div className="bg-stone-50 p-3 rounded-lg"><p className="text-xs text-stone-500">Amount paid</p><strong className="text-emerald-600">{formatCurrency(completedPayment?.amount || booking?.total_amount)}</strong></div>
            </div>
            {completedPayment?.mpesa_receipt && <p className="bg-emerald-50 text-emerald-800 rounded-lg p-3 text-xs font-mono">M-PESA receipt: <strong>{completedPayment.mpesa_receipt}</strong></p>}
            <button onClick={() => navigate("/dashboard?tab=bookings")} className="w-full py-3 bg-[#093A3E] text-white rounded-lg text-sm font-medium">View My Bookings</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] pb-16 pt-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white hover:bg-stone-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#093A3E]" />
          </button>
          <h1 className="font-serif text-2xl text-[#1C2321]">Complete Your Reservation</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            
            {/* Show explicit DARAJA Error message prominently if it failed */}
            <AnimatePresence>
              {paymentStatus === "failed" && errorMessage && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center text-center gap-2">
                  <XCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-red-800 font-medium text-lg">Payment Failed</p>
                  <p className="text-red-600 text-sm max-w-md">{errorMessage}</p>
                  <button onClick={handleRetry} className="mt-4 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {paymentStatus !== "failed" && (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
                <h2 className="font-serif text-xl mb-4 text-[#1C2321]">Select Payment Method</h2>
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setSelectedMethod("mpesa")}
                    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMethod === "mpesa" ? "border-emerald-600 bg-emerald-50/30" : "border-stone-200"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-600 mb-2" />
                    <p className="font-semibold text-sm">M-PESA</p>
                    <p className="text-xs text-stone-500">Instant STK Push</p>
                  </button>
                </div>

                {selectedMethod === "mpesa" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2">M-PESA Phone Number</label>
                      <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="e.g. 0712345678"
                        disabled={paymentStatus === "processing"}
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm outline-none focus:border-[#093A3E]"
                      />
                      {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                    </div>

                    {paymentStatus === "processing" ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
                        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <div>
                          <p className="font-semibold text-amber-900 text-sm">STK Push Sent to Your Phone!</p>
                          <p className="text-xs text-amber-700 mt-1">Check your phone screen, enter your M-PESA PIN, and press Send.</p>
                        </div>
                        <button 
                          onClick={checkMpesaStatus}
                          disabled={checkingStatus}
                          className="mt-2 text-xs text-[#093A3E] font-bold underline hover:text-emerald-700"
                        >
                          {checkingStatus ? "Checking status with Safaricom..." : "I have entered my PIN — Verify Payment"}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={initiateMpesa}
                        disabled={processing || !phoneNumber || !!phoneError}
                        className="w-full py-4 bg-emerald-600 text-white font-medium rounded-xl text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Wallet className="w-4 h-4" /> Pay {formatCurrency(booking?.total_amount)}
                      </button>
                    )}

                    {/* Fallback inline error if something else sets errorMessage while not in failed state */}
                    {errorMessage && paymentStatus !== "failed" && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 mt-4">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="p-4 md:p-6 bg-stone-50 border border-stone-200 rounded-2xl">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Secure Payment</p>
                  <p className="text-[10px] md:text-xs text-stone-500">
                    Your payment is encrypted. We never store your M-PESA PIN.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 space-y-4 sticky top-20">
              <h3 className="font-serif text-lg text-[#1C2321]">Reservation Summary</h3>
              <div className="flex gap-3 items-center pb-4 border-b border-stone-100">
                <img 
                  src={getImageSrc(property?.cover_image || property?.images?.[0])} 
                  alt={property?.name} 
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-semibold text-sm">{property?.name}</h4>
                  <p className="text-xs text-stone-500">{property?.location}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Check-in:</span>
                  <span className="font-medium text-stone-900">{booking?.check_in_display || booking?.check_in}</span>
                </div>
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span className="font-medium text-stone-900">{booking?.check_out_display || booking?.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nights:</span>
                  <span className="font-medium text-stone-900">{booking?.nights}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                <span className="font-semibold text-sm">Total Due:</span>
                <span className="font-serif text-xl font-bold text-[#093A3E]">{formatCurrency(booking?.total_amount)}</span>
              </div>

              {timeLeft && (
                <div className="p-3 bg-amber-50 rounded-lg text-center mt-4">
                  <p className="text-[10px] uppercase text-amber-700 font-bold">Hold Time Remaining</p>
                  <p className="font-mono text-sm font-bold text-amber-900">{timeLeft.minutes}:{String(timeLeft.seconds).padStart(2, "0")}</p>
                </div>
              )}
              
              <button onClick={() => setShowChat(true)} className="w-full mt-4 flex items-center justify-center gap-2 border border-stone-300 py-2.5 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">
                <MessageCircle size={14} /> Contact Concierge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}