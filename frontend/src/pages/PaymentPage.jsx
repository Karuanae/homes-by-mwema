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

// Helper: safely parse UTC date strings from backend (which may lack 'Z')
function parseUTCDate(dateStr) {
  if (!dateStr) return null;
  const str = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
  return new Date(str);
}

// Chat Drawer Component
function ChatDrawer({ isOpen, onClose, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState(null);
  const messagesEndRef = useRef(null);
  const [sending, setSending] = useState(false);

  // Initialize or fetch existing chat
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    const initChat = async () => {
      setLoading(true);
      try {
        // Try to get existing chat or create new one
        let chatId = localStorage.getItem('paymentChatId');
        
        if (!chatId) {
          // Create a new chat for payment assistance
          const response = await api.chats.startChat(user.id, null, null);
          chatId = response.data.chat.id;
          localStorage.setItem('paymentChatId', chatId);
        }
        
        setChat({ id: chatId });
        
        // Load messages
        const messagesRes = await api.chats.getMessages(chatId);
        setMessages(messagesRes.data || []);
        
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      // Don't clear chatId on close - keep it for next time
    };
  }, [isOpen, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat?.id || sending) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: tempId,
      content: newMessage,
      sender_id: user.id,
      sender_name: user.name || 'Guest',
      is_host: false,
      timestamp: new Date().toISOString(),
      is_read: false,
      is_temp: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    scrollToBottom();
    setSending(true);

    try {
      const response = await api.chats.sendMessage(chat.id, {
        content: newMessage,
        sender_id: user.id,
        sender_name: user.name || 'Guest',
        is_host: false,
      });

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...response.data, is_temp: false } : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] bg-white rounded-t-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between bg-[#093A3E] text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ED9B40] flex items-center justify-center">
                  <MessageCircle size={16} className="text-[#093A3E]" />
                </div>
                <div>
                  <h3 className="font-serif text-base">Concierge Support</h3>
                  <p className="text-[10px] text-white/60">Typically replies in minutes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-stone-50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-stone-300 border-t-[#093A3E] rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={40} className="text-stone-300 mb-3" />
                  <p className="text-stone-500 text-sm">How can we help you with your booking?</p>
                  <p className="text-stone-400 text-xs mt-1">Send a message and we'll reply shortly</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`relative px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-[#093A3E] text-white rounded-br-none'
                                : 'bg-white text-stone-900 rounded-bl-none shadow-sm'
                            }`}
                          >
                            <p className="text-sm pr-12">{msg.content}</p>
                            <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${
                              isOwn ? 'text-white/60' : 'text-stone-400'
                            }`}>
                              <span>{formatTime(msg.timestamp)}</span>
                              {isOwn && (
                                <span>
                                  {msg.is_temp ? (
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : msg.is_read ? (
                                    <CheckCheck size={12} className="text-blue-400" />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                </span>
                              )}
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

            {/* Input */}
            <div className="p-4 border-t border-stone-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-stone-50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#093A3E]"
                  style={{ minHeight: '44px' }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-[#093A3E] text-white p-3 rounded-full hover:bg-[#0a4a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  
  // ========== STATE ==========
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [property, setProperty] = useState(null);
  const [booking, setBooking] = useState(null);
  const [showChat, setShowChat] = useState(false);
  
  // Payment method state
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  
  // M-PESA state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);
  
  // PayPal state
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paypalApprovalUrl, setPaypalApprovalUrl] = useState(null);
  const [paypalLoading, setPaypalLoading] = useState(false);
  
  // Payment status
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [checkoutRequestId, setCheckoutRequestId] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  // Mobile view state
  const [showSummary, setShowSummary] = useState(false);
  const [copied, setCopied] = useState(false);

  // ========== INITIALIZATION ==========
  useEffect(() => {
    window.scrollTo(0, 0);
    initializePayment();
  }, []);

// REAL-TIME EXPIRY CHECK - Check every 10 seconds
useEffect(() => {
  const checkExpiry = async () => {
    if (!booking?.id) return;
    
    try {
      const response = await api.bookings.getStatus(booking.id);
      
      if (response.data.is_expired) {
        setIsExpired(true);
        setErrorMessage('Your booking session has expired. Please start over.');
      }
      
      // Update timer if still pending
      if (response.data.time_left && booking.status === 'pending') {
        setTimeLeft({
          minutes: response.data.time_left.minutes,
          seconds: response.data.time_left.seconds
        });
      }
      
    } catch (error) {
      console.error('Error checking expiry:', error);
    }
  };
  
  checkExpiry();
  
  // Check every 10 seconds while on the page
  const interval = setInterval(checkExpiry, 10000);
  
  return () => clearInterval(interval);
}, [booking?.id]);

  // Check if returning from PayPal redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paypalReturn = params.get('paypal');
    const orderId = params.get('token'); // PayPal sends token = order_id on return

    if (paypalReturn === 'success' && orderId) {
      handlePaypalReturn(orderId);
    } else if (paypalReturn === 'cancel') {
      setErrorMessage('PayPal payment was cancelled. You can try again.');
      setPaymentStatus('pending');
    }
  }, []);

  // Timer effect - only runs after booking is set
  useEffect(() => {
    if (!booking?.expires_at) return;

    const expiresAt = parseUTCDate(booking.expires_at);
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt - now;
      
      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        setShowTimerWarning(true);
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, total: diff });
      
      if (diff <= 300000 && !showTimerWarning) {
        setShowTimerWarning(true);
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  // M-PESA status poller
  useEffect(() => {
    let interval;
    if (checkoutRequestId && paymentStatus === 'processing') {
      interval = setInterval(checkMpesaStatus, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [checkoutRequestId, paymentStatus]);

  // ========== INIT ==========
const initializePayment = async () => {
  setLoading(true);
  console.log('🔍 PaymentPage initialized for property:', id);
  console.log('🔍 isAuthenticated:', isAuthenticated);
  console.log('🔍 user:', user);
  
  try {
    // STEP 1: Check if we have pending booking data that needs to be created
    const pendingData = localStorage.getItem('pendingBookingData');
    console.log('🔍 pendingBookingData:', pendingData);
    
    if (pendingData && isAuthenticated) {
      try {
        const formData = JSON.parse(pendingData);
        console.log('📝 Found pending data:', formData);
        
        // Only proceed if this is the same property
        if (formData.propertyId === id && formData.action === 'create-booking') {
          console.log('📝 Creating booking from pending data for property:', formData.propertyId);
          
          // Call the new backend endpoint to create booking
          const response = await fetch(`${API_BASE_URL}/bookings/create-from-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              property_id: formData.propertyId,
              check_in: formData.checkInDate,
              check_out: formData.checkOutDate,
              guests: formData.guests,
              payment_type: 'full'
            })
          });
          
          console.log('📝 Create booking response status:', response.status);
          const data = await response.json();
          console.log('📝 Create booking response data:', data);
          
          if (!response.ok) {
            if (response.status === 409) {
              // Dates no longer available
              localStorage.removeItem('pendingBookingData');
              setErrorMessage('These dates are no longer available. Please try different dates.');
              setLoading(false);
              return;
            }
            throw new Error(data.error || 'Failed to create booking');
          }
          
          // Success - clear pending data and set booking
          console.log('✅ Booking created successfully:', data.booking);
          localStorage.removeItem('pendingBookingData');
          setBooking(data.booking);
          
          // Fetch property data
          const propertyRes = await api.properties.getById(data.booking.property_id);
          setProperty(propertyRes.data);
          
          if (user?.phone) setPhoneNumber(user.phone);
          setLoading(false);
          return;
        } else {
          console.log('❌ Property mismatch or wrong action:', {
            pendingPropertyId: formData.propertyId,
            currentId: id,
            action: formData.action
          });
          localStorage.removeItem('pendingBookingData');
        }
      } catch (e) {
        console.error('Error creating booking from session:', e);
        localStorage.removeItem('pendingBookingData');
        if (e.message.includes('no longer available')) {
          setErrorMessage(e.message);
        } else {
          setErrorMessage('Failed to create booking. Please try again.');
        }
        setLoading(false);
        return;
      }
    } else {
      console.log('🔍 No pending data or not authenticated:', { 
        hasPendingData: !!pendingData, 
        isAuthenticated 
      });
    }
    
    // STEP 2: If no pending data, check for booking in state or localStorage
    console.log('🔍 Checking for booking in state or localStorage');
    let bookingData = location.state?.bookingDetails;
    console.log('🔍 location.state.bookingDetails:', bookingData);
    
    if (!bookingData) {
      const pendingBooking = localStorage.getItem('pendingBooking');
      console.log('🔍 pendingBooking:', pendingBooking);
      if (pendingBooking) {
        bookingData = JSON.parse(pendingBooking);
        localStorage.removeItem('pendingBooking');
      }
    }
    
    // STEP 3: If still no booking data, show error
    if (!bookingData) {
      console.log('❌ No booking data found anywhere');
      setErrorMessage('Booking information not found. Please start over.');
      setLoading(false);
      return;
    }

    // STEP 4: Only check expiry AFTER we have booking data
    console.log('🔍 Checking expiry for booking:', bookingData);
    if (bookingData.expires_at) {
      const expiresAt = parseUTCDate(bookingData.expires_at);
      console.log('🔍 expiresAt:', expiresAt);
      if (expiresAt && expiresAt < new Date()) {
        console.log('❌ Booking expired');
        setIsExpired(true);
        setLoading(false);
        return;
      }
    }
    
    // STEP 5: Set booking and fetch property data
    console.log('✅ Setting booking data:', bookingData);
    setBooking(bookingData);
    const propertyRes = await api.properties.getById(bookingData.property_id || id);
    setProperty(propertyRes.data);
    
    if (user?.phone) setPhoneNumber(user.phone);
    
  } catch (error) {
    console.error('Initialization error:', error);
    setErrorMessage('Failed to load payment details. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // ========== M-PESA ==========
  const checkMpesaStatus = async () => {
    if (!checkoutRequestId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/payments/mpesa/status/${checkoutRequestId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        if (data.payment?.status === 'completed') {
          setPaymentStatus('success');
          setSuccessMessage('Payment completed successfully!');
          localStorage.removeItem('pendingBooking');
          setTimeout(() => {
            navigate('/payment/success', {
              state: {
                bookingId: data.booking?.id,
                amount: data.payment?.amount,
                receipt: data.payment?.mpesa_receipt
              }
            });
          }, 2000);
        } else if (data.payment?.status === 'failed') {
          setPaymentStatus('failed');
          setErrorMessage('Payment failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const validatePhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 9 && cleaned.startsWith('7'))
      return { valid: true, formatted: '254' + cleaned };
    if (cleaned.length === 10 && cleaned.startsWith('07'))
      return { valid: true, formatted: '254' + cleaned.substring(1) };
    if (cleaned.length === 12 && cleaned.startsWith('254'))
      return { valid: true, formatted: cleaned };
    if (cleaned.length === 13 && cleaned.startsWith('+254'))
      return { valid: true, formatted: cleaned.substring(1) };
    return { valid: false, formatted: phone };
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    if (value.length > 3) {
      const validation = validatePhoneNumber(value);
      setPhoneError(validation.valid ? '' : 'Enter a valid M-PESA number (e.g., 0712345678)');
    } else {
      setPhoneError('');
    }
  };

  const initiateMpesaPayment = async () => {
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) { setPhoneError('Please enter a valid M-PESA number'); return; }
    if (!booking) { setErrorMessage('Booking information missing'); return; }
    
    setProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/payments/mpesa/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          booking_id: booking.id,
          phone_number: validation.formatted,
          amount: Math.round(booking.total_amount)
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.expired) { setIsExpired(true); throw new Error('Booking session expired.'); }
        throw new Error(data.error || 'Payment initiation failed');
      }
      
      setCheckoutRequestId(data.checkout_request_id);
      setPaymentId(data.payment_id);
      setSuccessMessage('STK Push sent! Check your phone and enter PIN.');
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
      setErrorMessage(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ========== PAYPAL ==========
  const initiatePaypalPayment = async () => {
    if (!booking) { setErrorMessage('Booking information missing'); return; }
    
    setPaypalLoading(true);
    setErrorMessage('');
    
    try {
      // Build return/cancel URLs so PayPal redirects back here
      const currentUrl = window.location.origin + window.location.pathname;
      const returnUrl = `${currentUrl}?paypal=success`;
      const cancelUrl = `${currentUrl}?paypal=cancel`;

      const response = await fetch(`${API_BASE_URL}/payments/paypal/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          booking_id: booking.id,
          amount: Math.round(booking.total_amount),
          currency: 'KES',
          return_url: returnUrl,
          cancel_url: cancelUrl
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PayPal order');
      }
      
      if (data.success && data.approval_url) {
        // Store booking in localStorage in case user returns from PayPal
        localStorage.setItem('pendingBooking', JSON.stringify(booking));
        localStorage.setItem('pendingPaypalOrderId', data.order_id);
        
        // Redirect to PayPal approval page
        window.location.href = data.approval_url;
      } else {
        throw new Error('No PayPal approval URL received');
      }
      
    } catch (error) {
      console.error('PayPal initiation error:', error);
      setErrorMessage(error.message || 'Failed to initiate PayPal payment. Please try again.');
    } finally {
      setPaypalLoading(false);
    }
  };

  const handlePaypalReturn = async (orderId) => {
    // User returned from PayPal — capture the payment
    setPaymentStatus('processing');
    setSuccessMessage('Completing your PayPal payment...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/payments/paypal/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ order_id: orderId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentStatus('success');
        localStorage.removeItem('pendingBooking');
        localStorage.removeItem('pendingPaypalOrderId');
        
        setTimeout(() => {
          navigate('/payment/success', {
            state: {
              bookingId: booking?.id,
              amount: booking?.total_amount,
              receipt: data.transaction_id
            }
          });
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to capture PayPal payment');
      }
    } catch (error) {
      console.error('PayPal capture error:', error);
      setPaymentStatus('failed');
      setErrorMessage(error.message || 'Failed to complete PayPal payment. Please try again.');
    }
  };

  // ========== SHARED HANDLERS ==========
  const handleRetry = () => {
    setPaymentStatus('pending');
    setErrorMessage('');
    setSuccessMessage('');
    setCheckoutRequestId(null);
    setPaypalOrderId(null);
    setPaypalApprovalUrl(null);
    // Clear paypal params from URL
    window.history.replaceState({}, '', window.location.pathname);
  };

  const handleStartOver = () => navigate(`/booking/${id}`);

  const copyPhoneExample = () => {
    navigator.clipboard.writeText('0712345678');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount) => `KSh ${amount?.toLocaleString() || '0'}`;

  const getImageSrc = (url) => {
    if (!url) return '/default-property.jpg'; // Add fallback image
    return url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`;
  };

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-stone-600">Preparing secure payment...</p>
        </div>
      </div>
    );
  }

  // ========== EXPIRED STATE ==========
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
          <button onClick={handleStartOver} className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
            Start New Booking
          </button>
        </div>
      </div>
    );
  }

  // ========== SUCCESS STATE ==========
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 md:p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-serif text-xl md:text-2xl mb-2">Payment Successful!</h2>
          <p className="text-stone-600 text-sm mb-4">{successMessage}</p>
          <p className="text-xs text-stone-400 mb-6">Redirecting to your bookings...</p>
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="min-h-screen bg-[#f5f2ee] pb-16 md:pb-24">
      
      {/* Chat Drawer */}
      {isAuthenticated && (
        <ChatDrawer 
          isOpen={showChat} 
          onClose={() => setShowChat(false)} 
          user={user}
        />
      )}
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 px-4 py-2.5 flex items-center justify-between"
        style={{ background: '#093A3E', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#ED9B40]" />
        </button>
        <h1 className="text-base font-medium text-[#ED9B40] truncate max-w-[200px]" style={{ fontFamily: 'system-ui' }}>Complete Payment</h1>
        <button onClick={() => setShowSummary(!showSummary)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
          <Eye className={`w-4 h-4 text-[#ED9B40] transition-transform ${showSummary ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* MOBILE SUMMARY DROPDOWN */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden fixed top-[49px] left-0 right-0 bg-white border-b border-stone-200 z-40 overflow-hidden shadow-lg"
          >
            <div className="p-4">
              <div className="flex gap-3">
                <img 
                  src={getImageSrc(property?.cover_image || property?.images?.[0])} 
                  alt={property?.name || 'Property'} 
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={(e) => { e.target.src = '/default-property.jpg'; }}
                />
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{property?.name || 'Property'}</h3>
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
                    <span className={`font-mono font-bold ${showTimerWarning ? 'text-red-600' : 'text-stone-900'}`}>
                      {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-12">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-3 mb-8">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-stone-200 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-serif text-xl">Complete Your Payment</h1>
        </div>

        {/* Timer Warning - Desktop */}
        {showTimerWarning && timeLeft && (
          <div className="hidden md:block mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-amber-800 font-medium">Complete payment in {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}</p>
                <p className="text-amber-600 text-sm">Your booking will expire if not completed in time</p>
              </div>
            </div>
          </div>
        )}

        {/* Timer Warning - Mobile */}
        {showTimerWarning && timeLeft && (
          <div className="md:hidden mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-amber-800 text-xs">
                Complete in <span className="font-mono font-bold">{timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}</span>
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 md:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-700 text-xs md:text-sm">{errorMessage}</p>
                {paymentStatus === 'failed' && (
                  <button onClick={handleRetry} className="text-xs text-red-600 underline mt-1">Try again</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success / Processing Message */}
        <AnimatePresence>
          {successMessage && paymentStatus === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 md:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 flex items-start gap-2"
            >
              <Smartphone className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-xs md:text-sm">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          
          {/* LEFT COLUMN - PAYMENT FORM */}
          <div className="md:col-span-2 order-2 md:order-1">
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
              
              {/* Payment Method Selection */}
              <div className="p-4 md:p-6 border-b border-stone-200">
                <h2 className="font-serif text-lg md:text-xl mb-4">Payment Method</h2>
                
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {/* M-PESA */}
                  <button
                    onClick={() => { setSelectedMethod('mpesa'); handleRetry(); }}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 ${
                      selectedMethod === 'mpesa' ? 'border-green-500 bg-green-50' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 md:w-5 md:h-5 ${selectedMethod === 'mpesa' ? 'text-green-600' : 'text-stone-400'}`} />
                    <div className="text-left">
                      <p className="text-xs md:text-sm font-medium">M-PESA</p>
                      <p className="text-[10px] md:text-xs text-stone-500">Mobile money</p>
                    </div>
                  </button>

                  {/* PayPal */}
                  <button
                    onClick={() => { setSelectedMethod('paypal'); handleRetry(); }}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 ${
                      selectedMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {/* PayPal logo mark */}
                    <div className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center flex-shrink-0`}>
                      <svg viewBox="0 0 24 24" className={`w-4 h-4 md:w-5 md:h-5 ${selectedMethod === 'paypal' ? 'opacity-100' : 'opacity-40'}`} fill="none">
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

              {/* ========== M-PESA FORM ========== */}
              {selectedMethod === 'mpesa' && (
                <div className="p-4 md:p-6">
                  <h3 className="font-medium text-sm md:text-base mb-3">M-PESA Phone Number</h3>
                  
                  <div className="relative">
                    <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden focus-within:border-stone-900 transition-colors">
                      <div className="bg-stone-100 px-3 py-3 md:px-4 md:py-3.5 border-r border-stone-200">
                        <Phone className="w-4 h-4 text-stone-500" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        placeholder="0712345678"
                        disabled={paymentStatus === 'processing'}
                        className="flex-1 px-3 md:px-4 py-3 md:py-3.5 outline-none text-sm disabled:bg-stone-50"
                      />
                    </div>
                    
                    <button onClick={() => setShowPhoneHelp(!showPhoneHelp)} className="text-xs text-stone-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>What format should I use?</span>
                    </button>
                    
                    <AnimatePresence>
                      {showPhoneHelp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="bg-stone-50 p-3 rounded-lg mt-2 text-xs space-y-2">
                            <p>✅ <span className="font-mono">0712345678</span> (10 digits)</p>
                            <p>✅ <span className="font-mono">254712345678</span> (12 digits)</p>
                            <p>✅ <span className="font-mono">+254712345678</span> (13 digits)</p>
                            <button onClick={copyPhoneExample} className="text-green-600 flex items-center gap-1 mt-1">
                              <Copy className="w-3 h-3" />
                              <span>{copied ? 'Copied!' : 'Copy example'}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {phoneError && <p className="text-red-500 text-xs mt-2">{phoneError}</p>}
                  </div>

                  {paymentStatus === 'pending' && (
                    <button
                      onClick={initiateMpesaPayment}
                      disabled={processing || !phoneNumber || !!phoneError}
                      className="w-full mt-6 py-3 md:py-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Processing...</>
                      ) : (
                        <><Wallet className="w-4 h-4" /> Pay {formatCurrency(booking?.total_amount)}</>
                      )}
                    </button>
                  )}

                  {paymentStatus === 'processing' && (
                    <div className="mt-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 border-4 border-stone-200 border-t-green-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium">Waiting for M-PESA confirmation</p>
                      <p className="text-xs text-stone-500 mt-1">Check your phone and enter PIN</p>
                      <button onClick={checkMpesaStatus} className="mt-4 text-xs text-green-600 underline">
                        Check status manually
                      </button>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <button onClick={handleRetry} className="w-full mt-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                      Try Again
                    </button>
                  )}
                </div>
              )}

              {/* ========== PAYPAL FORM ========== */}
              {selectedMethod === 'paypal' && (
                <div className="p-4 md:p-6">
                  <h3 className="font-medium text-sm md:text-base mb-2">Pay with PayPal</h3>
                  <p className="text-xs text-stone-500 mb-6">
                    You'll be redirected to PayPal to complete your payment securely. Once approved, you'll return here automatically.
                  </p>

                  {/* Amount in USD estimate */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-600">Amount</span>
                      <span className="font-serif font-bold">{formatCurrency(booking?.total_amount)}</span>
                    </div>
                    <p className="text-[10px] text-stone-400 mt-1">
                      Approximate USD equivalent charged at PayPal's current exchange rate
                    </p>
                  </div>

                  {paymentStatus === 'pending' && (
                    <button
                      onClick={initiatePaypalPayment}
                      disabled={paypalLoading}
                      className="w-full py-3 md:py-4 bg-[#0070ba] hover:bg-[#005ea6] text-white rounded-lg text-sm font-medium transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {paypalLoading ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Connecting to PayPal...</>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                            <path d="M19.5 6.5C19.5 9.5 17.5 12 14 12H11.5L10.5 17.5H7.5L9.5 6.5H14C17 6.5 19.5 4 19.5 6.5Z" fillOpacity="0.9"/>
                            <path d="M17 9.5C17 12.5 15 15 11.5 15H9L8 20.5H5L7 9.5H11.5C14.5 9.5 17 7 17 9.5Z" fillOpacity="0.7"/>
                          </svg>
                          Pay with PayPal
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </>
                      )}
                    </button>
                  )}

                  {paymentStatus === 'processing' && (
                    <div className="mt-2 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 border-4 border-stone-200 border-t-blue-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium">Completing PayPal payment...</p>
                      <p className="text-xs text-stone-500 mt-1">Please wait</p>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <button onClick={handleRetry} className="w-full mt-4 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
                      Try Again
                    </button>
                  )}

                  <p className="text-[10px] text-stone-400 text-center mt-4">
                    You will be redirected to PayPal's secure checkout
                  </p>
                </div>
              )}

              {/* Security Note */}
              <div className="p-4 md:p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Secure Payment</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                      {selectedMethod === 'mpesa' 
                        ? "Your payment information is encrypted. We never store your M-PESA PIN."
                        : "You'll be redirected to PayPal's encrypted checkout. We never see your PayPal credentials."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - ORDER SUMMARY */}
          <div className="md:col-span-1 order-1 md:order-2">
            <div className="md:sticky md:top-24">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                
                {/* Property Preview - Desktop */}
                <div className="hidden md:block p-4 border-b border-stone-200">
                  <div className="flex gap-3">
                    <img
                      src={getImageSrc(property?.cover_image || property?.images?.[0])}
                      alt={property?.name || 'Property'}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => { e.target.src = '/default-property.jpg'; }}
                    />
                    <div>
                      <h3 className="font-medium text-sm">{property?.name || 'Property'}</h3>
                      <p className="text-xs text-stone-500 mt-1">{property?.location}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="p-4 md:p-5 space-y-3">
                  <h3 className="font-serif text-base md:text-lg mb-3">Booking Summary</h3>
                  
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Dates</span>
                    <span className="font-medium">
                      {booking?.check_in_display || booking?.check_in} - {booking?.check_out_display || booking?.check_out}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Nights</span>
                    <span className="font-medium">{booking?.nights}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs md:text-sm">
                    <span className="text-stone-600">Guests</span>
                    <span className="font-medium">
                      {booking?.guests?.adults || 1} Adult{booking?.guests?.adults !== 1 ? 's' : ''}
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
                    <div className={`p-3 rounded-lg ${showTimerWarning ? 'bg-red-50' : 'bg-stone-50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Time to complete:</span>
                        <span className={`font-mono font-bold ${showTimerWarning ? 'text-red-600' : ''}`}>
                          {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Concierge Button */}
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowChat(true)}
                      className="w-full mt-4 py-3 border border-[#093A3E] text-[#093A3E] rounded-lg hover:bg-[#093A3E] hover:text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Contact Concierge
                    </button>
                  )}
                </div>

                {/* Help Section */}
                <div className="p-4 bg-stone-50 border-t border-stone-200">
                  <p className="text-[10px] md:text-xs text-stone-500 text-center">
                    Need help? <button onClick={() => setShowChat(true)} className="text-stone-900 underline">Contact Concierge</button>
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