// PaymentPage.jsx - COMPLETE UPDATED VERSION WITH REAL-TIME CHAT
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaTimes } from "react-icons/fa";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import ChatWindow from "../components/Chat/ChatWindow";
import socketService from "../services/socketService";

// Helper: prepend backend URL to image paths (same as Home.jsx)
const getImageSrc = (url) => url && !url.startsWith('http') ? `${IMAGE_BASE_URL}${url}` : url;

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [showChat, setShowChat] = useState(false);
  const [userChatId, setUserChatId] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const { bookingDetails: passedDetails } = location.state || {};
  const [currentStep, setCurrentStep] = useState(1); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth Form
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Payment Form
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); 
  const [paymentType, setPaymentType] = useState("full"); 
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [messageToHost, setMessageToHost] = useState("");
  
  // PayPal state
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  
  // Data
  const [property, setProperty] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: "", checkOut: "", guests: { adults: 1, children: 0 }, 
    nights: 0, baseAmount: 0, cleaningFee: 0, serviceFee: 0, taxes: 0, total: 0
  });

  // Initialize socket
  useEffect(() => {
    socketService.connect();
    
    socketService.on('socket_connected', () => {
      setSocketConnected(true);
      console.log('✅ Socket connected as client');
      
      // Authenticate if user is logged in
      if (user) {
        socketService.authenticate(user.id, user.role || 'user');
      }
    });
    
    socketService.on('socket_disconnected', () => {
      setSocketConnected(false);
      console.log('❌ Socket disconnected');
    });
    
    socketService.on('new_message', (message) => {
      console.log('📨 New message received:', message);
      // The ChatWindow component handles displaying messages
    });
    
    return () => {
      socketService.off('socket_connected');
      socketService.off('socket_disconnected');
      socketService.off('new_message');
    };
  }, [user]);

  // Initialization
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsLoggedIn(true);
          setCurrentStep(2);
          
          // Try to find existing chat for user
          const chatsResponse = await api.chats.getUserChats(userData.id);
          const chats = chatsResponse.data || [];
          if (chats.length > 0) {
            setUserChatId(chats[0].id);
          }
        }

        const propertyResponse = await api.properties.getById(id);
        setProperty(propertyResponse.data);

        // Always prefer navigation state, then localStorage, then fallback
        if (passedDetails) {
          setBookingDetails(passedDetails);
        } else {
          const pending = localStorage.getItem('pendingBooking');
          if (pending) {
            setBookingDetails(JSON.parse(pending));
            localStorage.removeItem('pendingBooking');
          } else {
            // Demo fallback
            const today = new Date();
            const checkIn = new Date(today.setDate(today.getDate() + 2));
            const checkOut = new Date(today.setDate(today.getDate() + 3));
            setBookingDetails({
              checkIn: checkIn.toISOString().split('T')[0],
              checkOut: checkOut.toISOString().split('T')[0],
              guests: { adults: 2, children: 0 },
              nights: 3,
              baseAmount: 15000,
              cleaningFee: 1500,
              serviceFee: 2000,
              taxes: 0,
              total: 18500
            });
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchData();
  }, [id, passedDetails]);

  // Logic
  const calculatePartialPayment = () => {
    if (!bookingDetails.total) return { now: 0, later: 0, dueDate: '' };
    const now = Math.floor(bookingDetails.total * 0.5);
    const later = bookingDetails.total - now;
    const dueDate = new Date(bookingDetails.checkIn);
    dueDate.setDate(dueDate.getDate() - 2); 
    return { now, later, dueDate: dueDate.toLocaleDateString() };
  };
  const partialPayment = calculatePartialPayment();

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      let response;
      if (authMode === "login") response = await api.auth.login({ email, password });
      else response = await api.auth.register({ name: fullName, email, password, phone: phoneNumber });
      
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      setCurrentStep(2);
      
      // Authenticate with socket
      socketService.authenticate(userData.id, userData.role || 'user');
    } catch (error) {
      alert('Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const createBooking = async () => {
    return await api.bookings.create({
      propertyId: id,
      checkIn: bookingDetails.checkIn,
      checkOut: bookingDetails.checkOut,
      guests: bookingDetails.guests,
      totalAmount: bookingDetails.total,
      paymentType,
      paymentMethod: selectedPaymentMethod,
      messageToHost
    });
  };

  const completeBooking = async () => {
    setIsLoading(true);
    try {
      await createBooking();
      navigate("/my-bookings", { state: { newBooking: true } });
    } catch (error) {
      alert('Failed to create booking.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendStkPush = async () => {
    if (!mpesaNumber.trim()) { alert('Enter M-PESA number.'); return; }
    setSelectedPaymentMethod('mpesa');
    setIsLoading(true);
    try {
      const amountDue = paymentType === 'full' ? bookingDetails.total : partialPayment.now;
      const newBooking = await createBooking().then(res => res.data);
      if (!newBooking) throw new Error('Booking failed');
      
      const result = await api.payments.initiateMpesa(newBooking.id, mpesaNumber, amountDue);
      if (result.success) {
        alert('Check your phone for M-PESA prompt');
        // Simple mock success for demo
        setTimeout(() => {
          setIsLoading(false);
          setCurrentStep(3); // Go to confirmation
        }, 5000);
      }
    } catch (error) {
      alert('STK Push failed.');
      setIsLoading(false);
    }
  };

  // PayPal payment handler
  const handlePayPalPayment = async () => {
    setPaypalProcessing(true);
    setIsLoading(true);
    try {
      const amountDue = paymentType === 'full' ? bookingDetails.total : partialPayment.now;
      
      // Create booking first
      const newBooking = await createBooking().then(res => res.data);
      if (!newBooking) throw new Error('Booking failed');
      
      // Create PayPal order
      const returnUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;
      
      const result = await api.payments.createPayPalOrder(
        newBooking.id, 
        amountDue, 
        'KES',
        returnUrl,
        cancelUrl
      );
      
      if (result.success && result.approval_url) {
        // Store order ID for later capture
        localStorage.setItem('paypal_order_id', result.order_id);
        localStorage.setItem('paypal_payment_id', result.payment_id);
        localStorage.setItem('paypal_booking_id', newBooking.id);
        
        // Redirect to PayPal for approval
        window.location.href = result.approval_url;
      } else {
        throw new Error(result.error || 'Failed to create PayPal order');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      alert(`PayPal payment failed: ${error.message || 'Unknown error'}`);
      setPaypalProcessing(false);
      setIsLoading(false);
    }
  };

  // Handle PayPal return (success)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // PayPal order ID
    
    if (token && location.pathname.includes('/payment/success')) {
      const capturePayPalPayment = async () => {
        setIsLoading(true);
        setPaypalProcessing(true);
        try {
          const result = await api.payments.capturePayPalOrder(token);
          
          if (result.success) {
            // Clear stored PayPal data
            localStorage.removeItem('paypal_order_id');
            localStorage.removeItem('paypal_payment_id');
            localStorage.removeItem('paypal_booking_id');
            
            // Go to confirmation step
            setSelectedPaymentMethod('paypal');
            setCurrentStep(3);
          } else {
            throw new Error(result.error || 'Payment capture failed');
          }
        } catch (error) {
          console.error('PayPal capture error:', error);
          alert(`Payment completion failed: ${error.message}`);
        } finally {
          setIsLoading(false);
          setPaypalProcessing(false);
        }
      };
      
      capturePayPalPayment();
    }
  }, [location]);

// FIXED handleStartChat for PaymentPage.jsx
// Replace the current handleStartChat function with this one

const handleStartChat = async () => {
  if (!user) {
    alert('Please login or continue as guest first');
    return;
  }

  setIsCreatingChat(true);
  try {
    console.log('🔄 Creating chat for user:', user.id, 'property:', id);
    
    // ✅ STEP 1: Create chat in database via REST API
    const chatResponse = await api.chats.startChat(
      user.id, 
      null, // hostId - not needed, backend will handle
      id // propertyId from URL params
    );
    
    console.log('📨 Chat API response:', chatResponse.data);
    
    const chat = chatResponse.data.chat;
    if (!chat || !chat.id) {
      throw new Error('Invalid chat response from server');
    }
    
    console.log('✅ Chat created/found in database:', chat.id);
    
    setUserChatId(chat.id);
    setShowChat(true);
    
    // ✅ STEP 2: Authenticate with WebSocket if connected
    if (socketConnected) {
      console.log('🔌 Authenticating with WebSocket...');
      socketService.authenticate(user.id, user.role || 'user');
      socketService.joinChat(chat.id);
    } else {
      console.log('⚠️  WebSocket not connected, skipping socket setup');
    }
    
    // ✅ STEP 3: Send initial message via REST API (will save to DB)
    console.log('📤 Sending initial message...');
    await api.chats.sendMessage(chat.id, {
      message: `Hi, I'm interested in ${property?.title}. Can you help me with some questions about booking?`,
      sender_id: user.id,
      sender_name: user.name || 'Guest',
      is_host: false
    });
    
    console.log('✅ Chat setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
    alert(`Could not start chat: ${errorMsg}`);
  } finally {
    setIsCreatingChat(false);
  }
};


  const formatCurrency = (val) => `KES ${val?.toLocaleString() || '0'}`;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      
      {/* Chat Widget */}
      {showChat && user && userChatId ? (
        <div className="fixed bottom-8 right-8 w-96 h-[500px] z-50 shadow-2xl border border-stone-200">
          <ChatWindow
            chatId={userChatId}
            currentUser={user}
            onClose={() => setShowChat(false)}
            propertyName={property?.title}
          />
        </div>
      ) : (
        <button
          onClick={handleStartChat}
          disabled={isCreatingChat || !user}
          className="fixed bottom-8 right-8 z-50 bg-stone-900 text-stone-50 px-6 py-3 font-serif italic text-sm shadow-xl hover:bg-black transition-all duration-500 border border-stone-800 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isCreatingChat ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-stone-300 border-t-white rounded-full animate-spin"></span>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
              <span>💬</span>
              <span>Chat with Concierge</span>
            </span>
          )}
        </button>
      )}
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* Minimalist Progress Header */}
        <div className="mb-16 border-b border-stone-200 pb-4 flex justify-between items-end">
          <h1 className="font-serif text-3xl italic text-stone-900">
            {currentStep === 1 ? "Identity" : currentStep === 2 ? "Secure Payment" : "Confirmation"}
          </h1>
          <div className="hidden md:flex gap-8 text-[10px] uppercase tracking-[0.2em] font-medium">
            <span className={currentStep === 1 ? "text-stone-900 border-b border-stone-900 pb-4 -mb-4.5" : "text-stone-400"}>01 Identity</span>
            <span className={currentStep === 2 ? "text-stone-900 border-b border-stone-900 pb-4 -mb-4.5" : "text-stone-400"}>02 Payment</span>
            <span className={currentStep === 3 ? "text-stone-900 border-b border-stone-900 pb-4 -mb-4.5" : "text-stone-400"}>03 Confirmed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT COLUMN: INTERACTION */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: AUTHENTICATION */}
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="bg-white p-12 border border-stone-100 shadow-sm"
                >
                  <p className="font-serif text-xl mb-8 text-stone-600 italic">Please identify yourself to continue.</p>
                  
                  <div className="space-y-8">
                    {authMode === 'signup' && (
                      <div className="grid grid-cols-2 gap-8">
                        <div className="group">
                          <label className="text-[10px] uppercase tracking-widest text-stone-500">Full Name</label>
                          <input 
                            type="text" 
                            value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full pt-2 pb-3 bg-transparent border-b border-stone-300 focus:border-stone-900 outline-none transition-colors font-serif"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="group">
                          <label className="text-[10px] uppercase tracking-widest text-stone-500">Phone</label>
                          <input 
                            type="tel" 
                            value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                            className="w-full pt-2 pb-3 bg-transparent border-b border-stone-300 focus:border-stone-900 outline-none transition-colors font-serif"
                            placeholder="+254..."
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="group">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500">Email Address</label>
                      <input 
                        type="email" 
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pt-2 pb-3 bg-transparent border-b border-stone-300 focus:border-stone-900 outline-none transition-colors font-serif"
                        placeholder="name@example.com"
                      />
                    </div>
                    
                    <div className="group">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500">Password</label>
                      <input 
                        type="password" 
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pt-2 pb-3 bg-transparent border-b border-stone-300 focus:border-stone-900 outline-none transition-colors font-serif"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={handleAuth} disabled={isLoading}
                        className="w-full bg-stone-900 text-white py-4 text-xs uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50"
                      >
                        {isLoading ? "PROCESSING..." : (authMode === 'login' ? "ACCESS ACCOUNT" : "CREATE ACCOUNT")}
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-xs tracking-wide pt-4">
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-stone-500 hover:text-stone-900 underline decoration-stone-300 underline-offset-4">
                        {authMode === 'login' ? "New Client? Register" : "Existing Client? Login"}
                      </button>
                      <button onClick={() => {
                        const guestUser = { id: `guest_${Date.now()}`, name: "Guest", email: "guest@client.com", role: "user" };
                        setUser(guestUser);
                        setIsLoggedIn(true);
                        setCurrentStep(2);
                        localStorage.setItem('user', JSON.stringify(guestUser));
                        socketService.authenticate(guestUser.id, 'user');
                      }} className="text-stone-400 hover:text-stone-600">
                        Continue as Guest
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PAYMENT */}
              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {/* Payment Method - Text Only Selection */}
                  <section>
                    <h3 className="font-serif text-lg mb-6 italic text-stone-600">Select Method</h3>
                    <div className="grid grid-cols-3 gap-0 border border-stone-200">
                      <button 
                        onClick={() => setSelectedPaymentMethod('mpesa')}
                        className={`py-6 text-xs uppercase tracking-[0.2em] transition-all ${selectedPaymentMethod === 'mpesa' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900'}`}
                      >
                        M-PESA Mobile
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('paypal')}
                        className={`py-6 text-xs uppercase tracking-[0.2em] border-l border-stone-200 transition-all ${selectedPaymentMethod === 'paypal' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900'}`}
                      >
                        PayPal / Card
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`py-6 text-xs uppercase tracking-[0.2em] border-l border-stone-200 transition-all ${selectedPaymentMethod === 'card' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900'}`}
                      >
                        Credit Card
                      </button>
                    </div>

                    {/* Dynamic Inputs */}
                    <div className="mt-8 bg-white p-8 border border-stone-100 shadow-sm">
                      {selectedPaymentMethod === 'mpesa' && (
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-stone-500">M-PESA Number</label>
                          <input 
                            type="tel" placeholder="07XX XXX XXX"
                            value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)}
                            className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"
                          />
                          <p className="text-[10px] text-stone-400 pt-2 uppercase tracking-wide">An STK prompt will be sent to your device.</p>
                        </div>
                      )}
                      {selectedPaymentMethod === 'paypal' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center py-6">
                            <svg className="h-8" viewBox="0 0 101 32" xmlns="http://www.w3.org/2000/svg">
                              <path fill="#003087" d="M12.237 5.986h-6.88c-.47 0-.87.34-.944.803L2.033 22.63a.57.57 0 0 0 .563.66h3.287c.47 0 .87-.34.943-.804l.643-4.071a.96.96 0 0 1 .944-.803h2.18c4.531 0 7.145-2.193 7.83-6.538.308-1.9.012-3.393-.88-4.438-1.182-1.387-3.278-2.15-6.306-2.15zm.79 6.444c-.377 2.454-2.263 2.454-4.089 2.454h-1.038l.729-4.607a.574.574 0 0 1 .567-.485h.476c1.243 0 2.416 0 3.022.708.362.423.472 1.05.333 1.93z"/>
                              <path fill="#003087" d="M35.11 12.336h-3.292a.574.574 0 0 0-.567.485l-.144.917-.23-.333c-.712-1.032-2.298-1.377-3.882-1.377-3.631 0-6.732 2.749-7.334 6.604-.313 1.924.132 3.764 1.22 5.047 1 1.18 2.426 1.672 4.126 1.672 2.918 0 4.535-1.875 4.535-1.875l-.146.91a.57.57 0 0 0 .563.66h2.965a.96.96 0 0 0 .944-.804l1.78-11.246a.57.57 0 0 0-.538-.66zm-4.567 6.394c-.314 1.863-1.796 3.115-3.684 3.115-.945 0-1.702-.304-2.19-.878-.485-.571-.667-1.384-.513-2.29.293-1.847 1.8-3.139 3.658-3.139.926 0 1.678.307 2.175.887.5.585.698 1.403.554 2.305z"/>
                              <path fill="#009cde" d="M55.924 12.336h-3.306a.958.958 0 0 0-.792.418l-4.575 6.738-1.939-6.476a.96.96 0 0 0-.92-.68h-3.247a.57.57 0 0 0-.54.753l3.653 10.723-3.437 4.85a.57.57 0 0 0 .466.897h3.303a.957.957 0 0 0 .788-.412l11.035-15.933a.57.57 0 0 0-.489-.878z"/>
                              <path fill="#003087" d="M67.688 5.986h-6.88c-.47 0-.87.34-.944.803l-2.38 15.841a.57.57 0 0 0 .563.66h3.508c.33 0 .61-.238.661-.565l.675-4.31a.96.96 0 0 1 .943-.804h2.18c4.532 0 7.145-2.193 7.83-6.538.309-1.9.013-3.393-.88-4.438-1.18-1.387-3.277-2.15-6.276-2.15zm.79 6.444c-.377 2.454-2.263 2.454-4.088 2.454h-1.04l.73-4.607a.575.575 0 0 1 .566-.485h.476c1.243 0 2.416 0 3.022.708.361.423.472 1.05.333 1.93z"/>
                              <path fill="#009cde" d="M90.561 12.336h-3.291a.574.574 0 0 0-.567.485l-.145.917-.229-.333c-.712-1.032-2.298-1.377-3.882-1.377-3.631 0-6.732 2.749-7.334 6.604-.313 1.924.13 3.764 1.22 5.047 1 1.18 2.425 1.672 4.125 1.672 2.918 0 4.536-1.875 4.536-1.875l-.147.91a.57.57 0 0 0 .564.66h2.965a.96.96 0 0 0 .943-.804l1.78-11.246a.57.57 0 0 0-.538-.66zm-4.567 6.394c-.314 1.863-1.797 3.115-3.684 3.115-.946 0-1.703-.304-2.19-.878-.486-.571-.668-1.384-.514-2.29.294-1.847 1.8-3.139 3.659-3.139.925 0 1.678.307 2.174.887.501.585.699 1.403.555 2.305z"/>
                              <path fill="#009cde" d="M95.073 6.37l-2.418 15.38a.57.57 0 0 0 .563.66h2.835a.96.96 0 0 0 .943-.804l2.38-15.841a.57.57 0 0 0-.563-.66h-3.177a.574.574 0 0 0-.563.486z"/>
                            </svg>
                          </div>
                          <p className="text-center text-sm text-stone-600 font-serif">
                            Pay securely with PayPal or any credit/debit card
                          </p>
                          <p className="text-center text-[10px] text-stone-400 uppercase tracking-wide">
                            You will be redirected to PayPal to complete your payment
                          </p>
                          <div className="flex justify-center gap-2 pt-4">
                            <div className="flex items-center gap-1 text-[10px] text-stone-500">
                              <svg className="w-6 h-4" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg"><rect fill="#fff" height="22" rx="3" width="36" x="1" y="1"/><rect fill="none" height="22" rx="3" stroke="#D9D9D9" width="36" x="1" y="1"/><path d="M7 15.5V11.93c0-.4-.23-.65-.64-.65-.21 0-.44.07-.61.3a.57.57 0 0 0-.55-.3c-.17 0-.36.05-.51.24v-.2h-.35v4.18h.36v-2.32c0-.3.16-.44.4-.44.25 0 .36.15.36.44v2.32h.35v-2.32c0-.3.17-.44.41-.44s.37.15.37.44v2.32h.2zm8.33-4.18h-.56v-.76h-.36v.76h-.32v.32h.32v1.91c0 .49.18.78.72.78.2 0 .4-.06.54-.12l-.1-.3c-.13.05-.27.08-.38.08-.23 0-.3-.14-.3-.36v-1.97h.56v-.34h-.12zm4.76-.06c-.2 0-.34.1-.43.25v-.19h-.36v4.18h.36v-2.45c.1.15.24.24.44.24.4 0 .77-.31.77-.97v-.08c0-.65-.37-.98-.78-.98zm.41 1.05c0 .41-.16.66-.44.66-.21 0-.37-.16-.42-.34v-.7c.05-.17.22-.35.42-.35.29 0 .44.24.44.65v.08zm9.16-.99c-.21 0-.34.1-.43.26v-.2h-.35v4.18h.35v-2.45c.1.15.24.24.44.24.4 0 .77-.31.77-.97v-.08c0-.65-.37-.98-.78-.98zm.41 1.06c0 .41-.16.65-.44.65-.21 0-.37-.15-.42-.34v-.7c.05-.17.22-.34.42-.34.29 0 .44.23.44.65v.08zm-6.58-.99c-.25 0-.5.06-.68.24l.1.25c.13-.12.32-.18.56-.18.27 0 .41.14.41.39v.04c-.14-.02-.3-.04-.49-.04-.4 0-.73.13-.73.55v.02c0 .36.27.58.61.58.23 0 .41-.08.51-.22l.06.18h.4v-1.15c0-.47-.26-.66-.75-.66zm.39 1.19c0 .21-.2.38-.49.38-.2 0-.36-.1-.36-.27v-.02c0-.21.18-.3.41-.3.15 0 .3.02.44.04v.17zm-3.88-1.19c-.42 0-.72.32-.72.98v.08c0 .66.33.98.77.98.2 0 .4-.06.6-.2l-.13-.25c-.14.1-.3.15-.47.15-.24 0-.43-.13-.46-.52h1.13v-.17c-.02-.68-.28-1.05-.72-1.05zm.38.84H19.1c.02-.38.17-.54.4-.54.24 0 .36.17.38.54z" fill="#000"/><path d="M35.95 13.48v-.18h-.06l-.07.13-.08-.13h-.05v.18h.04v-.14l.07.12h.04l.08-.12v.14h.03zm-.4 0v-.15h.09v-.03h-.22v.03h.08v.15h.05z" fill="#F79410"/><path d="M24.02 11.12h-1.77v2.76h1.77v-.3h-1.41v-.92h1.29v-.3h-1.29v-.92h1.41v-.32z" fill="#000"/><path d="M24.78 14.21c.38 0 .54-.24.54-.52v-.02c0-.31-.2-.45-.53-.53-.27-.07-.36-.14-.36-.29v-.02c0-.13.11-.23.32-.23.16 0 .33.06.47.16l.13-.26a.95.95 0 0 0-.58-.18c-.35 0-.52.21-.52.49v.02c0 .35.2.46.53.55.27.07.36.15.36.29v.02c0 .15-.12.24-.34.24a.82.82 0 0 1-.56-.2l-.15.24c.19.15.45.24.69.24z" fill="#000"/><path d="M26.17 11.12h-.36v3.05h.36v-3.05z" fill="#000"/><path d="M26.93 11.12h-.36v3.05h.36v-3.05z" fill="#000"/><path d="M27.36 11.31c0 .12.1.21.23.21a.2.2 0 0 0 .21-.21c0-.12-.09-.21-.21-.21-.13 0-.23.09-.23.21zm.05 2.9h.36v-2.08h-.36v2.08z" fill="#000"/><g fill="#F79410"><path d="M37 4.06C37 2.92 36.08 2 34.94 2H21.06C19.92 2 19 2.92 19 4.06v15.88c0 1.14.92 2.06 2.06 2.06h13.88c1.14 0 2.06-.92 2.06-2.06V4.06z"/></g><path d="M31.46 17.58h-5.04v-8.6h5.04l-2.52 4.3 2.52 4.3z" fill="#F16622"/><path d="M26.74 12.98c0-1.75.82-3.3 2.1-4.3A5.46 5.46 0 0 0 22 12.98a5.46 5.46 0 0 0 6.84 4.3 5.43 5.43 0 0 1-2.1-4.3z" fill="#E41B24"/><path d="M37 12.98a5.47 5.47 0 0 1-8.16 4.76 5.45 5.45 0 0 0 0-9.52A5.47 5.47 0 0 1 37 12.98z" fill="#F79410"/></svg>
                              <svg className="w-6 h-4" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg"><rect fill="#fff" height="22" rx="3" width="36" x="1" y="1"/><rect fill="none" height="22" rx="3" stroke="#D9D9D9" width="36" x="1" y="1"/><path d="M10.75 17.29h2.5V6.71h-2.5v10.58zM21.17 7.17a6.2 6.2 0 0 0-2.25-.42c-2.48 0-4.23 1.3-4.25 3.17-.02 1.38 1.26 2.15 2.22 2.6.98.47 1.31.77 1.31 1.19-.01.64-.79.93-1.52.93-1.01 0-1.55-.14-2.38-.5l-.32-.16-.36 2.15c.59.27 1.68.5 2.82.51 2.64 0 4.35-1.28 4.37-3.28.01-1.09-.66-1.92-2.12-2.6-.88-.44-1.42-.74-1.42-1.18 0-.4.46-.82 1.45-.82.82-.01 1.42.17 1.88.37l.23.11.34-2.07z" fill="#00579F"/><path d="M24.4 13.55c.2-.55 1.01-2.67 1.01-2.67-.02.03.2-.56.34-.92l.17.83s.48 2.32.59 2.8h-2.1v-.04zM27.2 6.72h-1.94c-.6 0-1.05.17-1.32.79l-3.74 8.78h2.65l.53-1.44h3.23c.08.34.3 1.44.3 1.44h2.33l-2.04-9.57z" fill="#00579F"/><path d="M8.16 6.71L5.71 13.9l-.26-1.32C5.02 11.05 3.6 9.45 2 8.56l2.26 7.72h2.67l3.97-9.57H8.16z" fill="#00579F"/><path d="M3.78 6.71H.04l-.04.22c3.18.8 5.29 2.72 6.16 5.03L5.2 7.51c-.17-.6-.58-.78-1.13-.8h-.29z" fill="#FAA61A"/></svg>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedPaymentMethod === 'card' && (
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] uppercase tracking-widest text-stone-500">Card Number</label>
                              <input 
                                type="text" 
                                placeholder="0000 0000 0000 0000" 
                                value={cardNumber}
                                onChange={e => setCardNumber(e.target.value)}
                                className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-stone-500">Expiry</label>
                                <input 
                                  type="text" 
                                  placeholder="MM/YY" 
                                  value={cardExpiry}
                                  onChange={e => setCardExpiry(e.target.value)}
                                  className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-stone-500">CVC</label>
                                <input 
                                  type="text" 
                                  placeholder="123" 
                                  value={cardCvc}
                                  onChange={e => setCardCvc(e.target.value)}
                                  className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"
                                />
                              </div>
                           </div>
                           <p className="text-[10px] text-stone-400 uppercase tracking-wide pt-2">
                             For direct card payments, we recommend using PayPal for secure processing
                           </p>
                        </div>
                      )}
                      {!selectedPaymentMethod && <p className="text-sm text-stone-400 italic">Please select a payment method above.</p>}
                    </div>
                  </section>

                  {/* Payment Type */}
                  <section>
                    <h3 className="font-serif text-lg mb-6 italic text-stone-600">Payment Schedule</h3>
                    <div className="space-y-4">
                      <button 
                        onClick={() => setPaymentType('full')}
                        className={`w-full flex justify-between items-center p-6 border transition-all ${paymentType === 'full' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                      >
                        <span className="text-xs uppercase tracking-widest">Settle in Full</span>
                        <span className="font-serif text-lg">{formatCurrency(bookingDetails.total)}</span>
                      </button>
                      <button 
                        onClick={() => setPaymentType('partial')}
                        className={`w-full flex justify-between items-center p-6 border transition-all ${paymentType === 'partial' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 bg-white hover:border-stone-400'}`}
                      >
                        <div className="text-left">
                          <span className="block text-xs uppercase tracking-widest mb-1">50% Deposit</span>
                          <span className="block text-[10px] text-stone-500">Balance due by {partialPayment.dueDate}</span>
                        </div>
                        <span className="font-serif text-lg">{formatCurrency(partialPayment.now)}</span>
                      </button>
                    </div>
                  </section>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-8 border-t border-stone-200">
                    <button onClick={() => setCurrentStep(1)} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">
                      Back
                    </button>
                    <button 
                      onClick={() => {
                        if (selectedPaymentMethod === 'mpesa') {
                          handleSendStkPush();
                        } else if (selectedPaymentMethod === 'paypal') {
                          handlePayPalPayment();
                        } else {
                          completeBooking();
                        }
                      }}
                      disabled={isLoading || !selectedPaymentMethod || paypalProcessing}
                      className="bg-stone-900 text-white px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-black disabled:bg-stone-200 disabled:text-stone-400 transition-all shadow-lg"
                    >
                      {isLoading || paypalProcessing 
                        ? "PROCESSING..." 
                        : selectedPaymentMethod === 'paypal'
                          ? `PAY WITH PAYPAL`
                          : `PAY ${formatCurrency(paymentType === 'full' ? bookingDetails.total : partialPayment.now)}`
                      }
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: CONFIRMATION */}
              {currentStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white border border-stone-200 p-16 text-center shadow-lg"
                >
                  <h2 className="font-serif text-4xl italic text-stone-900 mb-6">Reservation Confirmed</h2>
                  <div className="w-16 h-px bg-stone-300 mx-auto mb-6"></div>
                  <p className="text-stone-500 font-serif text-lg mb-10 max-w-md mx-auto">
                    We have secured your stay at <span className="text-stone-900">{property?.title}</span>. A detailed itinerary has been sent to {user?.email}.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-px bg-stone-200 border border-stone-200 max-w-sm mx-auto mb-10">
                     <div className="bg-stone-50 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Ref No.</p>
                        <p className="font-serif text-stone-900">BK-{Math.floor(Math.random()*10000)}</p>
                     </div>
                     <div className="bg-stone-50 p-4">
                        <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Paid</p>
                        <p className="font-serif text-stone-900">{formatCurrency(paymentType === 'full' ? bookingDetails.total : partialPayment.now)}</p>
                     </div>
                  </div>

                  <div className="flex justify-center gap-6">
                    <Link to="/my-bookings" className="border-b border-stone-900 pb-1 text-xs uppercase tracking-widest text-stone-900 hover:opacity-70">
                      View Bookings
                    </Link>
                    <Link to="/" className="border-b border-transparent pb-1 text-xs uppercase tracking-widest text-stone-400 hover:text-stone-600">
                      Return Home
                    </Link>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-32 bg-white border border-stone-200 shadow-xl shadow-stone-200/50">
              
              {/* Image with No Gradient - Just Pure Image */}
              <div className="h-64 overflow-hidden relative border-b border-stone-100">
                 <img
                  src={getImageSrc(property?.cover_image || property?.images?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800")}
                  alt="Property"
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-1000"
                />
              </div>

              <div className="p-8">
                <h2 className="font-serif text-2xl text-stone-900 mb-1">{property?.title || "Luxury Villa"}</h2>
                <p className="text-xs uppercase tracking-widest text-stone-400 mb-8">{property?.location || "Nairobi, Kenya"}</p>

                <div className="space-y-6">
                   {/* Dates */}
                   <div className="flex justify-between items-baseline border-b border-stone-100 pb-4">
                      <span className="text-[10px] uppercase tracking-widest text-stone-500">Dates</span>
                      <div className="text-right">
                         <span className="block font-serif text-stone-900">
                            {new Date(bookingDetails.checkIn).toLocaleDateString(undefined, {month:'short', day:'numeric'})} — {new Date(bookingDetails.checkOut).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                         </span>
                         <span className="text-[10px] text-stone-400">{bookingDetails.nights} Nights</span>
                      </div>
                   </div>

                   {/* Guests */}
                   <div className="flex justify-between items-baseline border-b border-stone-100 pb-4">
                      <span className="text-[10px] uppercase tracking-widest text-stone-500">Guests</span>
                      <span className="font-serif text-stone-900">{bookingDetails.guests.adults} Adults, {bookingDetails.guests.children} Children</span>
                   </div>

                   {/* Pricing */}
                   <div className="pt-2 space-y-2 text-sm text-stone-600 font-serif">
                      <div className="flex justify-between">
                         <span>Accommodation</span>
                         <span>{formatCurrency(bookingDetails.baseAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                         <span>Cleaning & Service</span>
                         <span>{formatCurrency(bookingDetails.cleaningFee + bookingDetails.serviceFee)}</span>
                      </div>
                   </div>

                   {/* Total */}
                   <div className="pt-6 border-t border-stone-900 flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-stone-900 font-bold">Total Due</span>
                      <span className="font-serif text-2xl text-stone-900 italic">{formatCurrency(bookingDetails.total)}</span>
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">
                     Secure Encrypted Transaction
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}