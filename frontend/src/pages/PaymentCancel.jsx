import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24">
      <div className="max-w-xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 p-12 text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="font-serif text-3xl italic text-stone-900 mb-4">Payment Cancelled</h2>
          <div className="w-16 h-px bg-stone-300 mx-auto mb-6"></div>
          
          <p className="text-stone-600 font-serif text-lg mb-8">
            Your payment was cancelled. No charges have been made to your account.
          </p>

          <p className="text-stone-500 text-sm mb-8">
            If you experienced any issues during checkout, please try again or contact our support team.
          </p>

          <div className="flex justify-center gap-6">
            <Link
              to="/"
              className="border border-stone-300 px-8 py-4 text-xs uppercase tracking-widest text-stone-600 hover:border-stone-900 transition-all"
            >
              Return Home
            </Link>
            <button
              onClick={() => window.history.go(-2)}
              className="bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
