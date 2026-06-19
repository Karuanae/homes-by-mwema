import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  XCircle, AlertCircle, RefreshCw, Home, 
  Phone, MessageCircle, HelpCircle, ArrowLeft
} from "lucide-react";

export default function PaymentCancel() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Countdown for auto-redirect
  useEffect(() => {
    if (timeLeft <= 0) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, navigate]);

  const reasons = [
    "You didn't enter the M-PESA PIN",
    "You cancelled the transaction on your phone",
    "Insufficient M-PESA balance",
    "Network timeout with M-PESA",
    "You entered the wrong PIN too many times"
  ];

  return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Main Cancel Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Cancel Header */}
          <div className="bg-red-600 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3"
            >
              <XCircle className="w-8 h-8 text-red-600" />
            </motion.div>
            <h1 className="text-white font-serif text-xl md:text-2xl mb-1">
              Payment Cancelled
            </h1>
            <p className="text-red-100 text-xs md:text-sm">
              Your transaction was not completed
            </p>
          </div>

          {/* Message */}
          <div className="p-6 text-center border-b border-stone-100">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-stone-700 text-sm mb-2">
              No money has been deducted from your account.
            </p>
            <p className="text-xs text-stone-500">
              Your property is still available, but the 15-minute hold has expired.
            </p>
          </div>

          {/* Common Reasons */}
          <div className="p-6 border-b border-stone-100">
            <h3 className="font-serif text-base mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Common reasons:
            </h3>
            <ul className="space-y-2">
              {reasons.map((reason, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 text-xs text-stone-600"
                >
                  <span className="text-red-400 font-bold">•</span>
                  {reason}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* What You Can Do */}
          <div className="p-6 bg-stone-50">
            <h3 className="font-serif text-sm mb-3">What would you like to do?</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(-1)}
                className="w-full bg-stone-900 text-white py-3 rounded-lg text-xs uppercase tracking-widest font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
              
              <Link
                to="/"
                className="w-full border border-stone-300 py-3 rounded-lg text-xs uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-3 h-3" />
                Browse Other Properties
              </Link>
              
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="w-full text-xs text-stone-500 hover:text-stone-700 transition-colors flex items-center justify-center gap-1"
              >
                <Phone className="w-3 h-3" />
                Need help? Contact support
              </button>
            </div>

            {/* Help Options */}
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="overflow-hidden mt-4"
              >
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                  <h4 className="font-medium text-sm mb-3">Contact Concierge</h4>
                  <div className="space-y-2">
                    <a
                      href="tel:+25459170780"
                      className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      <Phone className="w-4 h-4 text-stone-600" />
                      <span className="text-sm">+25459170780</span>
                    </a>
                    <a
                      href="https://wa.me/25459170780"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">WhatsApp</span>
                    </a>
                    <a
                      href="mailto:support@homesbymwema.com"
                      className="flex items-center gap-2 p-2 hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      <Mail className="w-4 h-4 text-stone-600" />
                      <span className="text-sm">Email support</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Auto-redirect notice */}
          <div className="p-3 text-center border-t border-stone-100">
            <p className="text-[9px] text-stone-400">
              Redirecting to homepage in {timeLeft} seconds...
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-[10px] text-stone-500 underline mt-1"
            >
              Go now
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 mx-auto"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to payment
        </button>
      </motion.div>
    </div>
  );
}