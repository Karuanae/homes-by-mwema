import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back to Login */}
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6 transition-colors"
        >
          <FaArrowLeft size={14} />
          <span className="text-xs uppercase tracking-widest">Back to Login</span>
        </Link>

        <div className="bg-white border border-stone-200 shadow-xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Homes by Mwema</p>
            <h1 className="text-2xl md:text-3xl font-serif italic text-stone-900 mb-2">
              Forgot Password
            </h1>
            <p className="text-stone-500 text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-green-600 text-2xl" />
              </div>
              <h3 className="font-serif text-lg text-stone-900 mb-2">Check Your Email</h3>
              <p className="text-stone-500 text-sm mb-4">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <p className="text-stone-400 text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[#093A3E] underline hover:no-underline"
                >
                  try again
                </button>
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border-l-2 border-red-500 text-red-700 text-xs">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold rounded-lg hover:bg-[#0a4a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              {/* Help Text */}
              <p className="text-center text-[10px] text-stone-400">
                We'll never share your email with anyone else.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}