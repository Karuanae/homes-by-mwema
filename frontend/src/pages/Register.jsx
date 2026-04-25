import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { socialAuth } from '../services/socialAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app/api';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, user, loading, refreshUserFromStorage } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verificationError, setVerificationError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const consultIntent = localStorage.getItem('consultationIntent');
      if (consultIntent) {
        localStorage.removeItem('consultationIntent');
        navigate('/dashboard?tab=consultations');
        return;
      }
      navigate(user?.role === 'admin' ? '/admin' : '/');
    }
  }, [user, loading, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093A3E]" />
      </div>
    );
  }

  const redirectAfterAuth = (userData) => {
    const chatIntent = localStorage.getItem('chatIntent');
    if (chatIntent) {
      setTimeout(() => navigate(chatIntent), 1200);
      return;
    }

    const wishlistIntent = localStorage.getItem('wishlistIntent');
    if (wishlistIntent) {
      setTimeout(() => navigate(`/booking/${wishlistIntent}`), 1200);
      return;
    }

    const consultIntent = localStorage.getItem('consultationIntent');
    if (consultIntent) {
      localStorage.removeItem('consultationIntent');
      setTimeout(() => navigate('/dashboard?tab=consultations'), 1200);
      return;
    }

    if (userData?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      const redirectUrl = searchParams.get('redirect');
      setTimeout(() => navigate(redirectUrl || '/'), 1200);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setTermsError('');
  };

  const validateForm = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('All marked fields are required.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!termsAccepted) {
      setTermsError('You must accept the Terms & Policy to register.');
      return false;
    }
    return true;
  };

  // Register submission - shows verification modal instead of redirecting
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '',
      });

      if (response.requires_verification) {
        // Show verification modal instead of redirecting
        setUserId(response.user_id);
        setUserEmail(response.email);
        setShowVerificationModal(true);
      } else if (response.user?.email_verified && response.token) {
        redirectAfterAuth(response.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code submission - auto logs in after success
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerificationError('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code: verificationCode })
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Refresh auth context
        refreshUserFromStorage();
        
        // Close modal
        setShowVerificationModal(false);
        
        // Check for pending booking and redirect
        const pendingData = localStorage.getItem('pendingBookingData');
        if (pendingData) {
          try {
            const { propertyId } = JSON.parse(pendingData);
            navigate(`/payment/${propertyId}`);
            return;
          } catch (e) {
            console.error('Error parsing pending data:', e);
          }
        }
        
        redirectAfterAuth(data.user);
      } else {
        setVerificationError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setVerificationError('Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Resend verification code with countdown
  const handleResendCode = async () => {
    setVerificationError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResendCountdown(60);
        setVerificationError('');
      } else {
        setVerificationError(data.error || 'Failed to resend code');
      }
    } catch (err) {
      setVerificationError('Failed to resend code. Please try again.');
    }
  };

  // Google Sign-Up
  const handleGoogleSuccess = async () => {
    setIsLoading(false);
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const refreshed = refreshUserFromStorage();
      if (refreshed) {
        setTimeout(() => redirectAfterAuth(JSON.parse(savedUser)), 50);
      } else {
        window.location.reload();
      }
    } else {
      setError('Authentication succeeded but failed to save session. Please try again.');
    }
  };

  const handleGoogleError = (err) => {
    setIsLoading(false);
    setError(err.message || 'Google authentication failed. Please try again.');
  };

  const handleGoogleClick = async () => {
    setError('');
    setIsLoading(true);
    try {
      await socialAuth.triggerGoogleSignIn(handleGoogleSuccess, handleGoogleError);
    } catch (err) {
      handleGoogleError(err);
    }
  };

  // Verification Modal Component
  const VerificationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-[#093A3E]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#093A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-serif text-xl mb-1">Verify Your Email</h3>
          <p className="text-stone-500 text-sm">
            We've sent a 6-digit code to <strong className="text-[#093A3E]">{userEmail}</strong>
          </p>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-stone-200 rounded-lg focus:outline-none focus:border-[#093A3E]"
            autoFocus
          />
        </div>
        
        {verificationError && (
          <p className="text-red-500 text-xs text-center mb-4">{verificationError}</p>
        )}
        
        <button
          onClick={handleVerifyCode}
          disabled={verifying}
          className="w-full py-3 bg-[#093A3E] text-white rounded-lg font-medium hover:bg-[#0c4e52] transition-colors disabled:opacity-50 mb-3"
        >
          {verifying ? <FaSpinner className="animate-spin mx-auto" /> : 'Verify & Continue'}
        </button>
        
        <button
          onClick={handleResendCode}
          disabled={resendCountdown > 0}
          className="w-full text-sm text-stone-500 hover:text-[#093A3E] transition-colors disabled:opacity-50"
        >
          {resendCountdown > 0 
            ? `Resend code in ${resendCountdown}s` 
            : "Didn't receive code? Resend"}
        </button>
        
        <button
          onClick={() => {
            setShowVerificationModal(false);
            setVerificationCode('');
            setVerificationError('');
          }}
          className="w-full text-sm text-stone-400 hover:text-stone-600 transition-colors mt-4 pt-3 border-t border-stone-100"
        >
          Back to Registration
        </button>
      </motion.div>
    </div>
  );

  // Main registration form render
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-900 p-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#093A3E]" />

          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-stone-400">Homes By Mwema</p>
            <h2 className="text-3xl font-serif italic text-[#093A3E] mb-3">Register</h2>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-stone-50 border-l-2 border-red-900 text-red-900 text-xs tracking-wide whitespace-pre-wrap">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="name" name="name"
                value={formData.name} onChange={handleChange} required
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" id="email" name="email"
                value={formData.email} onChange={handleChange} required autoComplete="email"
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Phone (optional)
              </label>
              <input
                type="tel" id="phone" name="phone"
                value={formData.phone} onChange={handleChange}
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password" name="password"
                  value={formData.password} onChange={handleChange}
                  required autoComplete="new-password"
                  className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm pr-10"
                />
                <button
                  type="button" tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#093A3E]"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                required autoComplete="new-password"
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox" id="terms"
                  checked={termsAccepted}
                  onChange={(e) => { setTermsAccepted(e.target.checked); setTermsError(''); }}
                  className="w-4 h-4 mt-1 accent-[#093A3E] flex-shrink-0"
                />
                <label htmlFor="terms" className="text-xs text-stone-600 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" target="_blank" className="text-[#093A3E] font-medium hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" target="_blank" className="text-[#093A3E] font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {termsError && <p className="text-xs text-red-600 pl-7">{termsError}</p>}
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold rounded hover:bg-[#0c4e52] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-stone-100 text-center space-y-6">
            <button
              type="button" onClick={handleGoogleClick} disabled={isLoading}
              className="w-full py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <FcGoogle className="text-lg" /> Register with Google
            </button>

            <p className="text-stone-500 font-serif text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#093A3E] italic border-b border-stone-300 hover:border-[#093A3E] transition-all"
              >
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && <VerificationModal />}
    </>
  );
}