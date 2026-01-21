import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaLock, FaCreditCard, FaMobileAlt, FaGoogle, FaEnvelope, FaUser,
  FaCalendarAlt, FaUserFriends, FaHome, FaStar, FaWhatsapp, FaChevronLeft,
  FaCheckCircle, FaShieldAlt, FaInfoCircle, FaEye, FaEyeSlash, FaPhone,
  FaKey, FaArrowRight, FaCheck, FaFacebook, FaTwitter, FaApple,
  FaHeart, FaCrown, FaSpinner, FaTag, FaMapMarkerAlt, FaCommentDots,
  FaHeadset, FaPaperPlane, FaTimes, FaExpand
} from "react-icons/fa";
import api from "../services/api";

// Chat component for client side
const ChatWidget = ({ isOpen, onClose, onToggle, user }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [chatId, setChatId] = useState(null);

  useEffect(() => {
    if (!isOpen || !user) return;

    let mounted = true;

    const initChat = async () => {
      try {
        const chatsResp = await api.chats.getUserChats(user.id);
        const chats = chatsResp.data || [];

        let chat = chats.length ? chats[0] : null;

        if (!chat) {
          const startResp = await api.chats.startChat(user.id, null, null);
          chat = startResp.data?.chat || null;
        }

        if (chat && mounted) {
          setChatId(chat.id);
          const msgsResp = await api.chats.getMessages(chat.id);
          setChatMessages(msgsResp.data || []);
        }
      } catch (err) {
        console.error('Chat init error', err);
      }
    };

    initChat();

    return () => { mounted = false; };
  }, [isOpen, user]);

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      setIsTyping(true);

      // Ensure chat exists
      let cid = chatId;
      if (!cid) {
        const startResp = await api.chats.startChat(user.id, null, null);
        cid = startResp.data?.chat?.id;
        setChatId(cid);
      }

      // Send message
      const payload = { message, sender_id: user.id, sender_name: user.name, is_host: false };
      await api.chats.sendMessage(cid, payload);

      // Refresh messages
      const msgsResp = await api.chats.getMessages(cid);
      setChatMessages(msgsResp.data || []);
      setMessage('');
    } catch (err) {
      console.error('Send message error', err);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "Is M-Pesa secure?",
    "When will I get confirmation?",
    "What if payment fails?",
    "Can I pay partial amount?"
  ];

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:bg-teal-700 transition-all duration-300 flex items-center justify-center group"
        style={{ boxShadow: '0 10px 25px rgba(13, 148, 136, 0.3)' }}
      >
        <div className="relative">
          <FaCommentDots className="text-xl" />
          <span className="absolute -top-2 -right-2 bg-green-400 text-white text-xs w-3 h-3 rounded-full"></span>
        </div>
        <span className="ml-2 text-sm font-medium hidden md:inline">Payment Help</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 md:bottom-6 md:right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-50"
      style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
    >
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FaHeadset className="text-lg" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-teal-600"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Payment Support</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-teal-100">Online • Quick replies</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
            title="Minimize"
          >
            <FaExpand className="transform rotate-45" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-teal-800 rounded-lg transition-colors"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white h-[calc(100%-140px)]">
        <div className="space-y-4">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-teal-200' : 'text-gray-500'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-xs text-gray-600 ml-2">Support is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setMessage(question)}
              className="flex-shrink-0 text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your payment..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-lg flex items-center gap-2 ${
              message.trim()
                ? 'bg-teal-600 text-white hover:bg-teal-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } transition-colors`}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  
  // Get booking details from previous page or use defaults for demo
  const { bookingDetails: passedDetails } = location.state || {};
  
  /* ================= STATE MANAGEMENT ================= */
  const [currentStep, setCurrentStep] = useState(1); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // Payment Form State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(""); 
  const [paymentType, setPaymentType] = useState("full"); 
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [cardDetails, setCardDetails] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [messageToHost, setMessageToHost] = useState("");
  
  // Data State
  const [property, setProperty] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: "", checkOut: "", guests: { adults: 1, children: 0 }, nights: 0, total: 0
  });

  /* ================= INITIALIZATION ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Check Auth Status
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
          setCurrentStep(2); // Skip auth if logged in
        }

        // 2. Fetch Property Data from API
        const propertyResponse = await api.properties.getById(id);
        setProperty(propertyResponse.data);

        // 3. Set Booking Details
        if (passedDetails) {
          setBookingDetails(passedDetails);
        } else {
          // Fallback demo data
          const today = new Date();
          const checkIn = new Date(today.setDate(today.getDate() + 2));
          const checkOut = new Date(today.setDate(today.getDate() + 3));
          setBookingDetails({
            checkIn: checkIn.toISOString().split('T')[0],
            checkOut: checkOut.toISOString().split('T')[0],
            guests: { adults: 2, children: 0 },
            nights: 3,
            total: 18500
          });
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
        // Set fallback property data
        setProperty({
          id: id,
          title: "Property Not Found",
          price: 0,
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
          rating: 0,
          reviewCount: 0,
          location: "Unknown Location"
        });
      }
    };

    fetchData();
  }, [id, passedDetails]);

  // Calculate Partial Payment Logic
  const calculatePartialPayment = () => {
    if (!bookingDetails.total) return { now: 0, later: 0, dueDate: '' };
    const now = Math.floor(bookingDetails.total * 0.5);
    const later = bookingDetails.total - now;
    const dueDate = new Date(bookingDetails.checkIn);
    dueDate.setDate(dueDate.getDate() - 2); 
    return { now, later, dueDate: dueDate.toLocaleDateString() };
  };

  const partialPayment = calculatePartialPayment();

  /* ================= HANDLERS ================= */
  const handleAuth = async () => {
    setIsLoading(true);
    try {
      let response;
      if (authMode === "login") {
        response = await api.auth.login({ email, password });
      } else {
        response = await api.auth.register({
          name: fullName,
          email,
          password,
          phone: phoneNumber
        });
      }

      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      setCurrentStep(2);
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestCheckout = () => {
    const guestUser = { id: `guest_${Date.now()}`, name: "Guest", email: "guest@example.com", isGuest: true };
    localStorage.setItem('user', JSON.stringify(guestUser));
    setUser(guestUser);
    setIsLoggedIn(true);
    setCurrentStep(2);
  };

  const completeBooking = async () => {
    setIsLoading(true);
    try {
      // Create booking via API
      const bookingData = {
        propertyId: id,
        checkIn: bookingDetails.checkIn,
        checkOut: bookingDetails.checkOut,
        guests: bookingDetails.guests,
        totalAmount: bookingDetails.total,
        paymentType: paymentType,
        paymentMethod: selectedPaymentMethod,
        messageToHost: messageToHost
      };

      const response = await api.bookings.create(bookingData);
      const newBooking = response.data;

      setIsLoading(false);
      navigate("/my-bookings", { state: { newBooking: true } });
    } catch (error) {
      console.error('Booking creation error:', error);
      alert('Failed to create booking. Please try again.');
      setIsLoading(false);
    }
  };

  const formatCurrency = (val) => `KSh ${val?.toLocaleString() || '0'}`;

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-800">
      
      {/* Chat Widget */}
      <ChatWidget 
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onToggle={() => setShowChat(!showChat)}
        user={user}
      />
      
      {/* 1. COMPACT HEADER */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to={`/properties`} className="flex items-center gap-2 text-stone-500 hover:text-teal-900 transition-colors">
            <FaChevronLeft className="text-xs" />
            <span className="text-sm font-medium uppercase tracking-wider">Cancel Payment</span>
          </Link>
          <div className="flex items-center gap-4">
            {/* Chat Help Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full border border-teal-100 hover:bg-teal-100 transition-colors"
            >
              <FaCommentDots className="text-sm" />
              <span className="text-sm font-medium">Payment Help</span>
            </button>
            
            <div className="flex items-center gap-2 text-teal-700 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100">
              <FaLock className="text-xs" />
              <span className="text-xs font-bold uppercase tracking-widest">Bank-Level Security</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: STEPS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PROGRESS INDICATOR */}
            <div className="flex items-center justify-between mb-8 px-2">
              {[
                { n: 1, label: "Identity" },
                { n: 2, label: "Payment" },
                { n: 3, label: "Confirm" }
              ].map((step) => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    currentStep >= step.n ? "bg-teal-900 text-white" : "bg-stone-200 text-stone-500"
                  }`}>
                    {currentStep > step.n ? <FaCheck /> : step.n}
                  </div>
                  <span className={`text-sm uppercase tracking-widest ${currentStep >= step.n ? "text-teal-900" : "text-stone-400"}`}>
                    {step.label}
                  </span>
                  {step.n < 3 && <div className="w-12 h-px bg-stone-200 ml-3 hidden sm:block" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: AUTHENTICATION */}
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-lg border border-stone-200 shadow-xl shadow-stone-200/50 overflow-hidden"
                >
                  <div className="p-8">
                    <h2 className="text-2xl font-serif text-teal-950 mb-2">Begin Your Journey</h2>
                    <p className="text-stone-500 mb-8">Log in or sign up to secure your reservation.</p>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <button onClick={handleAuth} className="flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-sm hover:bg-stone-50 transition-colors">
                        <FaGoogle className="text-red-500" /> <span className="text-sm font-medium">Google</span>
                      </button>
                      <button className="flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-sm hover:bg-stone-50 transition-colors">
                        <FaApple className="text-stone-800" /> <span className="text-sm font-medium">Apple</span>
                      </button>
                    </div>

                    <div className="relative mb-8 text-center">
                      <span className="bg-white px-4 text-xs text-stone-400 uppercase tracking-widest relative z-10">Or continue with email</span>
                      <div className="absolute top-1/2 left-0 w-full h-px bg-stone-200 -z-0"></div>
                    </div>

                    {/* Form Inputs */}
                    <div className="space-y-4">
                      {authMode === 'signup' && (
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            type="text" placeholder="Full Name" 
                            value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm focus:outline-none focus:border-teal-900 transition-colors"
                          />
                          <input 
                            type="tel" placeholder="Phone" 
                            value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                            className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm focus:outline-none focus:border-teal-900 transition-colors"
                          />
                        </div>
                      )}
                      <input 
                        type="email" placeholder="Email Address" 
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm focus:outline-none focus:border-teal-900 transition-colors"
                      />
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} placeholder="Password" 
                          value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm focus:outline-none focus:border-teal-900 transition-colors"
                        />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-stone-400">
                          {showPassword ? <FaEyeSlash/> : <FaEye/>}
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={handleAuth} disabled={isLoading}
                      className="w-full mt-8 bg-teal-950 text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-teal-900 transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoading ? <FaSpinner className="animate-spin"/> : (authMode === 'login' ? "Secure Login" : "Create Account")}
                    </button>

                    <div className="mt-6 flex justify-between items-center text-sm">
                      <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-teal-700 underline">
                        {authMode === 'login' ? "No account? Sign up" : "Have an account? Login"}
                      </button>
                      <button onClick={handleGuestCheckout} className="text-stone-500 hover:text-stone-800">Continue as Guest</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PAYMENT DETAILS */}
              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Payment Help Banner */}
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center">
                        <FaHeadset />
                      </div>
                      <div>
                        <p className="font-medium text-teal-900">Need help with payment?</p>
                        <p className="text-sm text-teal-700">Chat with our support team for assistance</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChat(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                    >
                      <FaCommentDots /> Chat Now
                    </button>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <h3 className="font-serif text-xl text-teal-950 mb-4">Payment Method</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setSelectedPaymentMethod('mpesa')}
                        className={`p-4 border rounded-sm flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === 'mpesa' ? 'border-teal-600 bg-teal-50' : 'border-stone-200 hover:border-teal-300'}`}
                      >
                        <FaMobileAlt className="text-2xl text-green-600" />
                        <span className="text-sm font-bold text-stone-700">M-PESA</span>
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={`p-4 border rounded-sm flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === 'card' ? 'border-teal-600 bg-teal-50' : 'border-stone-200 hover:border-teal-300'}`}
                      >
                        <FaCreditCard className="text-2xl text-blue-600" />
                        <span className="text-sm font-bold text-stone-700">Card</span>
                      </button>
                    </div>

                    {/* Inputs based on selection */}
                    <div className="mt-6">
                      {selectedPaymentMethod === 'mpesa' && (
                        <div className="relative">
                          <FaPhone className="absolute top-4 left-4 text-stone-400" />
                          <input 
                            type="tel" placeholder="M-PESA Number (e.g., 0712...)" 
                            value={mpesaNumber} onChange={e => setMpesaNumber(e.target.value)}
                            className="w-full pl-10 p-4 bg-stone-50 border border-stone-200 rounded-sm focus:border-teal-900 outline-none"
                          />
                          <p className="text-xs text-stone-500 mt-2 flex items-center gap-1"><FaInfoCircle/> You will receive an STK prompt on your phone.</p>
                        </div>
                      )}
                      {selectedPaymentMethod === 'card' && (
                        <div className="space-y-4">
                          <input type="text" placeholder="Card Number" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm" />
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="MM/YY" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm" />
                            <input type="text" placeholder="CVV" className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Type (Full vs Partial) */}
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <h3 className="font-serif text-xl text-teal-950 mb-4">Payment Schedule</h3>
                    
                    <button 
                      onClick={() => setPaymentType('full')}
                      className={`w-full text-left p-4 border rounded-sm mb-3 flex justify-between items-center transition-all ${paymentType === 'full' ? 'border-teal-600 bg-teal-50' : 'border-stone-200'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-teal-900">Pay Full Amount</span>
                          <span className="bg-teal-200 text-teal-900 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Best Value</span>
                        </div>
                        <p className="text-sm text-stone-500">Settle the entire bill today.</p>
                      </div>
                      <span className="text-lg font-bold text-teal-900">{formatCurrency(bookingDetails.total)}</span>
                    </button>

                    <button 
                      onClick={() => setPaymentType('partial')}
                      className={`w-full text-left p-4 border rounded-sm flex justify-between items-center transition-all ${paymentType === 'partial' ? 'border-amber-500 bg-amber-50' : 'border-stone-200'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">Pay 50% Deposit</span>
                          <FaTag className="text-amber-500 text-sm" />
                        </div>
                        <p className="text-sm text-stone-500">Pay {formatCurrency(partialPayment.later)} by {partialPayment.dueDate}</p>
                      </div>
                      <span className="text-lg font-bold text-stone-900">{formatCurrency(partialPayment.now)}</span>
                    </button>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button onClick={() => setCurrentStep(1)} className="text-stone-500 underline text-sm">Back to Login</button>
                    <button 
                      onClick={() => setCurrentStep(3)} 
                      disabled={!selectedPaymentMethod}
                      className="px-8 py-3 bg-teal-950 text-white uppercase text-xs font-bold tracking-widest hover:bg-teal-900 disabled:opacity-50 transition-colors"
                    >
                      Review Booking
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: REVIEW & CONFIRM */}
              {currentStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-lg border border-stone-200 p-6">
                    <h3 className="font-serif text-xl text-teal-950 mb-6">Final Review</h3>
                    
                    {/* User Summary */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-100">
                      <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-bold text-xl">
                        {user?.name?.charAt(0) || 'G'}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">Booking for {user?.name || 'Guest'}</p>
                        <p className="text-sm text-stone-500">{user?.email || 'guest@example.com'}</p>
                      </div>
                    </div>

                    {/* Message to Host */}
                    <div className="mb-6">
                      <label className="block text-sm font-bold text-stone-700 mb-2">Message to Host (Optional)</label>
                      <textarea 
                        className="w-full p-4 bg-stone-50 border border-stone-200 rounded-sm text-sm"
                        placeholder="Share your arrival time or special requests..."
                        rows="3"
                        value={messageToHost}
                        onChange={e => setMessageToHost(e.target.value)}
                      ></textarea>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-stone-50 p-4 rounded-sm space-y-2 mb-6">
                      <div className="flex justify-between text-sm text-stone-600">
                        <span>Payment Method</span>
                        <span className="font-bold capitalize">{selectedPaymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-sm text-stone-600">
                        <span>Payment Type</span>
                        <span className="font-bold capitalize">{paymentType}</span>
                      </div>
                      <div className="border-t border-stone-200 pt-2 flex justify-between items-center mt-2">
                        <span className="font-bold text-teal-950">Due Now</span>
                        <span className="text-2xl font-serif text-teal-900">
                          {formatCurrency(paymentType === 'full' ? bookingDetails.total : partialPayment.now)}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={completeBooking}
                      disabled={isLoading}
                      className="w-full py-4 bg-gradient-to-r from-teal-800 to-teal-950 text-white uppercase tracking-widest font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <FaSpinner className="animate-spin" /> : <><FaLock /> Confirm & Pay</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN: STICKY SUMMARY */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-2xl shadow-stone-200/50 border border-stone-100 overflow-hidden">
                {/* Image */}
                <div className="relative h-48">
                  <img src={property?.image} alt={property?.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="font-serif text-lg leading-tight line-clamp-2">{property?.title}</h4>
                    <p className="text-xs opacity-90 mt-1 flex items-center gap-1"><FaMapMarkerAlt /> {property?.location}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm border-b border-stone-100 pb-4">
                    <div className="text-stone-500">
                      <p className="uppercase text-[10px] tracking-widest mb-1">Check In</p>
                      <p className="font-bold text-stone-800">{new Date(bookingDetails.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right text-stone-500">
                      <p className="uppercase text-[10px] tracking-widest mb-1">Check Out</p>
                      <p className="font-bold text-stone-800">{new Date(bookingDetails.checkOut).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-stone-600">
                    <span>{bookingDetails.nights} Nights × {formatCurrency(property?.price)}</span>
                    <span>{formatCurrency(property?.price * bookingDetails.nights)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Service Fee</span>
                    <span>{formatCurrency(2500)}</span>
                  </div>

                  <div className="border-t border-stone-200 pt-4 flex justify-between items-center">
                    <span className="font-bold text-stone-900">Total</span>
                    <span className="font-bold text-xl text-teal-900">{formatCurrency(bookingDetails.total)}</span>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
                  <p className="text-xs text-stone-400 flex items-center justify-center gap-2">
                    <FaShieldAlt /> 100% Secure Payment Process
                  </p>
                </div>
              </div>

              {/* Chat Support Card */}
              <div className="mt-6 bg-white rounded-lg border border-stone-200 p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                    <FaCommentDots className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-teal-900">Payment Support</h3>
                    <p className="text-sm text-gray-600">Questions about your payment?</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-teal-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Online support available</span>
                  </div>
                  
                  <button
                    onClick={() => setShowChat(true)}
                    className="w-full bg-teal-50 text-teal-700 py-3 rounded-lg font-medium hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 border border-teal-200"
                  >
                    <FaCommentDots />
                    Chat with Support
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500">Or call: +254 700 123 456</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}