import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle, Calendar, MapPin, Users, 
  Clock, Download, Share2, Home, Phone,
  Mail, Copy, Check, ChevronRight, Star
} from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingData, setBookingData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Get booking data from navigation state
  useEffect(() => {
    const data = location.state || {};
    
    // If no data, try to get from localStorage
    if (!data.bookingId) {
      const lastBooking = localStorage.getItem('lastBooking');
      if (lastBooking) {
        setBookingData(JSON.parse(lastBooking));
      }
    } else {
      setBookingData(data);
      // Store for reference
      localStorage.setItem('lastBooking', JSON.stringify(data));
    }
    
    // Auto redirect to bookings after 10 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard?tab=bookings');
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [location, navigate]);

  const copyReference = () => {
    if (bookingData?.bookingId) {
      navigator.clipboard.writeText(bookingData.bookingId.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (amount) => {
    return `KSh ${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Generate random reference if none provided
  const bookingRef = bookingData?.bookingId || 
                     `HB${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Main Success Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Success Header */}
          <div className="bg-green-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-white font-serif text-xl md:text-2xl mb-1">
              Payment Successful!
            </h1>
            <p className="text-green-100 text-xs md:text-sm">
              Your booking is confirmed
            </p>
          </div>

          {/* Booking Reference */}
          <div className="p-6 border-b border-stone-100">
            <div className="bg-stone-50 rounded-lg p-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">
                Booking Reference
              </p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl md:text-2xl font-bold">
                  {bookingRef}
                </span>
                <button
                  onClick={copyReference}
                  className="p-2 hover:bg-stone-200 rounded-lg transition-colors"
                  title="Copy reference"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-stone-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-6 space-y-4">
            <h2 className="font-serif text-lg">Booking Details</h2>
            
            {/* Property */}
            {bookingData?.propertyName && (
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-stone-400" />
                </div>
                <div>
                  <p className="font-medium">{bookingData.propertyName}</p>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {bookingData.propertyLocation || 'Nairobi, Kenya'}
                  </p>
                </div>
              </div>
            )}

            {/* Date & Guests Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-stone-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">Check-in</span>
                </div>
                <p className="font-serif text-sm">
                  {formatDate(bookingData?.checkIn) || 'Today'}
                </p>
              </div>
              
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-stone-500 mb-1">
                  <Calendar className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">Check-out</span>
                </div>
                <p className="font-serif text-sm">
                  {formatDate(bookingData?.checkOut) || 'In 3 days'}
                </p>
              </div>
              
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-stone-500 mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">Guests</span>
                </div>
                <p className="font-serif text-sm">
                  {bookingData?.guests || '2 Adults'}
                </p>
              </div>
              
              <div className="bg-stone-50 p-3 rounded-lg">
                <div className="flex items-center gap-1 text-stone-500 mb-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-widest">Nights</span>
                </div>
                <p className="font-serif text-sm">
                  {bookingData?.nights || '3'} nights
                </p>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-stone-100 pt-4 mt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-stone-600 text-sm">Amount paid</span>
                <span className="font-serif text-xl font-bold text-green-600">
                  {formatCurrency(bookingData?.amount)}
                </span>
              </div>
              {bookingData?.receipt && (
                <p className="text-[10px] text-stone-400">
                  Receipt: {bookingData.receipt}
                </p>
              )}
            </div>

            {/* Share/Download Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowShare(!showShare)}
                className="flex-1 py-2 border border-stone-200 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-stone-50 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                Share
              </button>
              <button
                className="flex-1 py-2 border border-stone-200 rounded-lg text-xs flex items-center justify-center gap-1 hover:bg-stone-50 transition-colors"
              >
                <Download className="w-3 h-3" />
                Receipt
              </button>
            </div>

            {/* Share Options (expandable) */}
            {showShare && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden"
              >
                <div className="bg-stone-50 rounded-lg p-3 mt-2 grid grid-cols-3 gap-2">
                  <button className="py-2 px-3 bg-[#25D366] text-white rounded-lg text-xs flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" />
                    WhatsApp
                  </button>
                  <button className="py-2 px-3 bg-[#0088cc] text-white rounded-lg text-xs flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                  <button className="py-2 px-3 bg-stone-800 text-white rounded-lg text-xs flex items-center justify-center gap-1">
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* What's Next */}
          <div className="px-6 pb-6">
            <h3 className="font-serif text-sm mb-3">What's next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <p className="text-xs text-stone-600">
                  Check your email for confirmation and details
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-3 h-3 text-stone-600" />
                </div>
                <p className="text-xs text-stone-600">
                  You'll receive check-in instructions 24h before arrival
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone className="w-3 h-3 text-stone-600" />
                </div>
                <p className="text-xs text-stone-600">
                  Our concierge is available 24/7 for any questions
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard?tab=bookings"
              className="flex-1 bg-stone-900 text-white py-3 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-stone-800 transition-colors text-center"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="flex-1 border border-stone-300 py-3 rounded-lg text-xs uppercase tracking-widest hover:bg-white transition-colors text-center"
            >
              Return Home
            </Link>
          </div>

          {/* Auto-redirect notice */}
          <div className="p-3 text-center border-t border-stone-100">
            <p className="text-[9px] text-stone-400">
              Redirecting to your bookings in 10 seconds...
            </p>
          </div>
        </div>

        {/* Support Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-500">
            Need assistance?{' '}
            <button className="text-stone-900 underline font-medium">
              Contact Concierge
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}