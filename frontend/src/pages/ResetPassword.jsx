import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaLock, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        setValidToken(false);
        return;
      }

      try {
        const response = await api.auth.verifyResetToken(token);
        setValidToken(true);
        setEmail(response.data.email);
      } catch (err) {
        setValidToken(false);
        setError(err.response?.data?.error || 'Invalid or expired token');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.auth.resetPassword(token, password);
      setResetComplete(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4 pt-24">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-stone-200 border-t-[#093A3E] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-stone-500">Verifying your request...</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (!validToken) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 shadow-xl p-8 md:p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-500 text-2xl" />
          </div>
          <h2 className="font-serif text-xl text-stone-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-stone-500 text-sm mb-6">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2 bg-[#093A3E] text-white text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-[#0a4a52] transition-colors"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-stone-200 shadow-xl p-8 md:p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="text-green-600 text-2xl" />
          </div>
          <h2 className="font-serif text-xl text-stone-900 mb-2">Password Reset!</h2>
          <p className="text-stone-500 text-sm mb-6">
            Your password has been successfully updated.
          </p>
          <p className="text-stone-400 text-xs">
            Redirecting you to login...
          </p>
        </motion.div>
      </div>
    );
  }

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
              Reset Password
            </h1>
            <p className="text-stone-500 text-sm">
              For {email}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                New Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                  placeholder="••••••"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                  placeholder="••••••"
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
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold rounded-lg hover:bg-[#0a4a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}