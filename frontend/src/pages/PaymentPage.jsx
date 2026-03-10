import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Clock, Shield, CheckCircle, XCircle, 
  AlertCircle, Smartphone, CreditCard, ChevronRight,
  Copy, Phone, Wallet, Loader, Lock, Eye, EyeOff
} from "lucide-react";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

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
  
  // Payment method state
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showPhoneHelp, setShowPhoneHelp] = useState(false);
  
  // Payment status
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
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

  // Timer effect
  useEffect(() => {
    if (!booking?.expires_at) return;

    const expiresAt = new Date(booking.expires_at);
    
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

  // Payment status checker
  useEffect(() => {
    let interval;
    
    if (checkoutRequestId && paymentStatus === 'processing') {
      interval = setInterval(checkPaymentStatus, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkoutRequestId, paymentStatus]);

  // ========== API CALLS ==========
  const initializePayment = async () => {
    setLoading(true);
    
    try {
      // Get booking from state or localStorage
      let bookingData = location.state?.bookingDetails;
      
      if (!bookingData && !isAuthenticated) {
        const pending = localStorage.getItem('pendingBooking');
        if (pending) {
          bookingData = JSON.parse(pending);
        }
      }
      
      if (!bookingData) {
        // Try to fetch from API
        // This would need a backend endpoint to get booking by ID
        console.error('No booking data found');
        setErrorMessage('Booking information not found. Please start over.');
        setLoading(false);
        return;
      }
      
      setBooking(bookingData);
      
      // Fetch property details
      const propertyRes = await api.properties.getById(bookingData.property_id || id);
      setProperty(propertyRes.data);
      
      // Pre-fill phone if user has one
      if (user?.phone) {
        setPhoneNumber(user.phone);
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      setErrorMessage('Failed to load payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!checkoutRequestId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/payments/mpesa/status/${checkoutRequestId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (data.payment?.status === 'completed') {
          // Payment successful!
          setPaymentStatus('success');
          setSuccessMessage('Payment completed successfully!');
          
          // Clear any stored pending booking
          localStorage.removeItem('pendingBooking');
          
          // Redirect to success page after 2 seconds
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

  // ========== PAYMENT INITIATION ==========
  const validatePhoneNumber = (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check Kenyan phone formats
    if (cleaned.length === 9 && cleaned.startsWith('7')) {
      return { valid: true, formatted: '254' + cleaned };
    } else if (cleaned.length === 10 && cleaned.startsWith('07')) {
      return { valid: true, formatted: '254' + cleaned.substring(1) };
    } else if (cleaned.length === 12 && cleaned.startsWith('254')) {
      return { valid: true, formatted: cleaned };
    } else if (cleaned.length === 13 && cleaned.startsWith('+254')) {
      return { valid: true, formatted: cleaned.substring(1) };
    }
    
    return { valid: false, formatted: phone };
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (value.length > 3) {
      const validation = validatePhoneNumber(value);
      if (!validation.valid) {
        setPhoneError('Enter a valid M-PESA number (e.g., 0712345678)');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const initiateMpesaPayment = async () => {
    // Validate phone
    const validation = validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      setPhoneError('Please enter a valid M-PESA number');
      return;
    }
    
    if (!booking) {
      setErrorMessage('Booking information missing');
      return;
    }
    
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
        if (data.expired) {
          setIsExpired(true);
          throw new Error('Your booking session has expired. Please start over.');
        }
        throw new Error(data.error || 'Payment initiation failed');
      }
      
      // Success - STK Push sent
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

  const handleRetry = () => {
    setPaymentStatus('pending');
    setErrorMessage('');
    setSuccessMessage('');
    setCheckoutRequestId(null);
  };

  const handleStartOver = () => {
    navigate(`/booking/${id}`);
  };

  const copyPhoneExample = () => {
    navigator.clipboard.writeText('0712345678');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ========== FORMATTING ==========
  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  const getImageSrc = (url) => {
    if (!url) return '';
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
          <button
            onClick={handleStartOver}
            className="w-full py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
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
      
      {/* ========== MOBILE HEADER ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-40 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-lg">Complete Payment</h1>
        <button 
          onClick={() => setShowSummary(!showSummary)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <Eye className={`w-5 h-5 transition-transform ${showSummary ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ========== MOBILE SUMMARY CARD ========== */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden fixed top-[57px] left-0 right-0 bg-white border-b border-stone-200 z-40 overflow-hidden shadow-lg"
          >
            <div className="p-4">
              <div className="flex gap-3">
                <img
                  src={getImageSrc(property?.cover_image || property?.images?.[0])}
                  alt={property?.name}
                  className="w-16 h-16 object-cover rounded-lg"
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

      {/* ========== MAIN CONTENT ========== */}
      <div className="max-w-6xl mx-auto px-4 pt-20 md:pt-12">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-serif text-2xl">Complete Your Payment</h1>
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
                  <button
                    onClick={handleRetry}
                    className="text-xs text-red-600 underline mt-1"
                  >
                    Try again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
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
          
          {/* ========== LEFT COLUMN - PAYMENT FORM ========== */}
          <div className="md:col-span-2 order-2 md:order-1">
            <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
              
              {/* Payment Method Selection */}
              <div className="p-4 md:p-6 border-b border-stone-200">
                <h2 className="font-serif text-lg md:text-xl mb-4">Payment Method</h2>
                
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <button
                    onClick={() => setSelectedMethod('mpesa')}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 ${
                      selectedMethod === 'mpesa'
                        ? 'border-green-500 bg-green-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Smartphone className={`w-4 h-4 md:w-5 md:h-5 ${selectedMethod === 'mpesa' ? 'text-green-600' : 'text-stone-400'}`} />
                    <div className="text-left">
                      <p className="text-xs md:text-sm font-medium">M-PESA</p>
                      <p className="text-[10px] md:text-xs text-stone-500">Mobile money</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSelectedMethod('card')}
                    disabled
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all flex items-center gap-2 md:gap-3 opacity-50 cursor-not-allowed ${
                      selectedMethod === 'card'
                        ? 'border-stone-500 bg-stone-50'
                        : 'border-stone-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
                    <div className="text-left">
                      <p className="text-xs md:text-sm font-medium">Card</p>
                      <p className="text-[10px] md:text-xs text-stone-500">Coming soon</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* M-PESA Form */}
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
                    
                    {/* Phone format helper */}
                    <button
                      onClick={() => setShowPhoneHelp(!showPhoneHelp)}
                      className="text-xs text-stone-500 mt-2 flex items-center gap-1"
                    >
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
                            <button
                              onClick={copyPhoneExample}
                              className="text-green-600 flex items-center gap-1 mt-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copied ? 'Copied!' : 'Copy example'}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {phoneError && (
                      <p className="text-red-500 text-xs mt-2">{phoneError}</p>
                    )}
                  </div>

                  {/* Action Button */}
                  {paymentStatus === 'pending' && (
                    <button
                      onClick={initiateMpesaPayment}
                      disabled={processing || !phoneNumber || phoneError}
                      className="w-full mt-6 py-3 md:py-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4" />
                          Pay {formatCurrency(booking?.total_amount)}
                        </>
                      )}
                    </button>
                  )}

                  {paymentStatus === 'processing' && (
                    <div className="mt-6 text-center">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 border-3 border-stone-200 border-t-green-600 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium">Waiting for M-PESA confirmation</p>
                      <p className="text-xs text-stone-500 mt-1">Check your phone and enter PIN</p>
                      <button
                        onClick={checkPaymentStatus}
                        className="mt-4 text-xs text-green-600 underline"
                      >
                        Check status manually
                      </button>
                    </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <button
                      onClick={handleRetry}
                      className="w-full mt-6 py-3 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              )}

              {/* Security Note */}
              <div className="p-4 md:p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium">Secure Payment</p>
                    <p className="text-[10px] md:text-xs text-stone-500">
                      Your payment information is encrypted. We never store your M-PESA PIN.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========== RIGHT COLUMN - ORDER SUMMARY ========== */}
          <div className="md:col-span-1 order-1 md:order-2">
            <div className="md:sticky md:top-24">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                
                {/* Property Preview - Desktop */}
                <div className="hidden md:block p-4 border-b border-stone-200">
                  <div className="flex gap-3">
                    <img
                      src={getImageSrc(property?.cover_image || property?.images?.[0])}
                      alt={property?.name}
                      className="w-16 h-16 object-cover rounded-lg"
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

                  {/* Timer - Mobile/Desktop */}
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
                </div>

                {/* Help Section */}
                <div className="p-4 bg-stone-50 border-t border-stone-200">
                  <p className="text-[10px] md:text-xs text-stone-500 text-center">
                    Need help? <button className="text-stone-900 underline">Contact Concierge</button>
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