import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const capturePayment = async () => {
      // Get PayPal token (order ID) from URL params
      const token = searchParams.get('token');
      
      if (!token) {
        setError('No payment token found');
        setIsLoading(false);
        return;
      }

      try {
        // Capture the PayPal payment
        const result = await api.payments.capturePayPalOrder(token);
        
        if (result.success) {
          setPaymentStatus({
            success: true,
            orderId: result.order_id,
            transactionId: result.transaction_id,
            paymentId: result.payment_id
          });
          
          // Clear stored PayPal data
          localStorage.removeItem('paypal_order_id');
          localStorage.removeItem('paypal_payment_id');
          localStorage.removeItem('paypal_booking_id');
        } else {
          setError(result.error || 'Payment capture failed');
        }
      } catch (err) {
        console.error('Payment capture error:', err);
        setError(err.response?.data?.error || err.message || 'Failed to complete payment');
      } finally {
        setIsLoading(false);
      }
    };

    capturePayment();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="font-serif text-2xl italic text-stone-900">Completing your payment...</h2>
          <p className="text-stone-500 mt-2">Please wait while we confirm your transaction</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 pt-32 pb-24">
        <div className="max-w-xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-red-200 p-12 text-center shadow-lg"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl italic text-stone-900 mb-4">Payment Failed</h2>
            <p className="text-stone-600 mb-8">{error}</p>
            <div className="flex justify-center gap-4">
              <Link
                to="/"
                className="border border-stone-300 px-8 py-3 text-xs uppercase tracking-widest text-stone-600 hover:border-stone-900 transition-all"
              >
                Go Home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="bg-stone-900 text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-black transition-all"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-32 pb-24">
      <div className="max-w-xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-stone-200 p-12 text-center shadow-lg"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="font-serif text-4xl italic text-stone-900 mb-4">Payment Successful</h2>
          <div className="w-16 h-px bg-stone-300 mx-auto mb-6"></div>
          
          <p className="text-stone-600 font-serif text-lg mb-8">
            Your PayPal payment has been processed successfully. A confirmation email has been sent to your registered email address.
          </p>

          {paymentStatus && (
            <div className="grid grid-cols-2 gap-px bg-stone-200 border border-stone-200 max-w-sm mx-auto mb-10">
              <div className="bg-stone-50 p-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Order ID</p>
                <p className="font-serif text-stone-900 text-sm truncate">{paymentStatus.orderId}</p>
              </div>
              <div className="bg-stone-50 p-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Status</p>
                <p className="font-serif text-green-600">Completed</p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6">
            <Link
              to="/my-bookings"
              className="bg-stone-900 text-white px-8 py-4 text-xs uppercase tracking-widest hover:bg-black transition-all"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="border border-stone-300 px-8 py-4 text-xs uppercase tracking-widest text-stone-600 hover:border-stone-900 transition-all"
            >
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
