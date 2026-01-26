import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaTimes } from "react-icons/fa"; // Kept only essential functional icons
import api from "../services/api";

// --- MINIMALIST CHAT WIDGET ---
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
      let cid = chatId;
      if (!cid) {
        const startResp = await api.chats.startChat(user.id, null, null);
        cid = startResp.data?.chat?.id;
        setChatId(cid);
      }
      const payload = { message, sender_id: user.id, sender_name: user.name, is_host: false };
      await api.chats.sendMessage(cid, payload);
      const msgsResp = await api.chats.getMessages(cid);
      setChatMessages(msgsResp.data || []);
      setMessage('');
    } catch (err) {
      console.error('Send message error', err);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-8 right-8 z-50 bg-stone-900 text-stone-50 px-6 py-3 font-serif italic text-sm shadow-xl hover:bg-black transition-all duration-500 border border-stone-800"
      >
        Concierge
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 right-8 w-80 h-[450px] bg-stone-50 border border-stone-200 shadow-2xl z-50 flex flex-col"
    >
      {/* Minimal Header */}
      <div className="bg-stone-900 text-stone-50 p-4 flex items-center justify-between">
        <span className="font-serif italic">Concierge Support</span>
        <button onClick={onClose} className="hover:text-stone-300"><FaTimes /></button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-white space-y-4">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 text-xs ${
              msg.sender === 'user' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-800'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-stone-400 italic">Concierge is typing...</div>}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-stone-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your inquiry..."
            className="flex-1 border-b border-stone-300 focus:border-stone-900 outline-none text-sm py-2 bg-transparent placeholder-stone-400 font-serif"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="text-xs uppercase tracking-widest font-bold text-stone-900 hover:text-stone-600 disabled:opacity-30"
          >
            SEND
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- MAIN PAYMENT PAGE ---
export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State
  const [showChat, setShowChat] = useState(false);
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
  
  // Data
  const [property, setProperty] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    checkIn: "", checkOut: "", guests: { adults: 1, children: 0 }, 
    nights: 0, baseAmount: 0, cleaningFee: 0, serviceFee: 0, taxes: 0, total: 0
  });

  // Initialization
  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsLoggedIn(true);
          setCurrentStep(2);
        }

        const propertyResponse = await api.properties.getById(id);
        setProperty(propertyResponse.data);

        // Logic for booking details (same as before)
        if (passedDetails) {
          setBookingDetails(passedDetails);
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

  const formatCurrency = (val) => `KES ${val?.toLocaleString() || '0'}`;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      
      <ChatWidget isOpen={showChat} onClose={() => setShowChat(false)} onToggle={() => setShowChat(!showChat)} user={user} />
      
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
                        setUser({ name: "Guest", email: "guest@client.com" }); setIsLoggedIn(true); setCurrentStep(2);
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
                    <div className="grid grid-cols-2 gap-0 border border-stone-200">
                      <button 
                        onClick={() => setSelectedPaymentMethod('mpesa')}
                        className={`py-6 text-xs uppercase tracking-[0.2em] transition-all ${selectedPaymentMethod === 'mpesa' ? 'bg-stone-900 text-white' : 'bg-white text-stone-400 hover:text-stone-900'}`}
                      >
                        M-PESA Mobile
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
                      {selectedPaymentMethod === 'card' && (
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] uppercase tracking-widest text-stone-500">Card Number</label>
                              <input type="text" placeholder="0000 0000 0000 0000" className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"/>
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-stone-500">Expiry</label>
                                <input type="text" placeholder="MM/YY" className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"/>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase tracking-widest text-stone-500">CVC</label>
                                <input type="text" placeholder="123" className="w-full text-xl font-serif py-3 border-b border-stone-200 focus:border-stone-900 outline-none bg-transparent placeholder-stone-300"/>
                              </div>
                           </div>
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
                      onClick={selectedPaymentMethod === 'mpesa' ? handleSendStkPush : completeBooking}
                      disabled={isLoading || !selectedPaymentMethod}
                      className="bg-stone-900 text-white px-10 py-4 text-xs uppercase tracking-[0.2em] hover:bg-black disabled:bg-stone-200 disabled:text-stone-400 transition-all shadow-lg"
                    >
                      {isLoading ? "PROCESSING..." : `PAY ${formatCurrency(paymentType === 'full' ? bookingDetails.total : partialPayment.now)}`}
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
                  src={property?.images?.[0] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"} 
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