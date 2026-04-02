import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { socialAuth } from '../services/socialAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, user, loading, refreshUserFromStorage } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      console.log('✅ User already logged in, redirecting:', user);
      
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093A3E]" />
      </div>
    );
  }

  const redirectAfterLogin = (userData) => {
    console.log('🔄 Redirecting after login:', userData);
    
    const pendingData = localStorage.getItem('pendingBookingData');
    if (pendingData) {
      try {
        const { propertyId } = JSON.parse(pendingData);
        navigate(`/payment/${propertyId}`);
        return;
      } catch (e) {
        console.error('Error parsing pending data:', e);
        localStorage.removeItem('pendingBookingData');
      }
    }
    
    const chatIntent = localStorage.getItem('chatIntent');
    if (chatIntent) {
      navigate(chatIntent);
      return;
    }
    
    const wishlistIntent = localStorage.getItem('wishlistIntent');
    if (wishlistIntent) {
      navigate(`/booking/${wishlistIntent}`);
      return;
    }
    
    const consultIntent = localStorage.getItem('consultationIntent');
    if (consultIntent) {
      localStorage.removeItem('consultationIntent');
      navigate('/dashboard?tab=consultations');
      return;
    }
    
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    
    const intent = localStorage.getItem('redirectIntent');
    if (intent) {
      try {
        const { type, propertyId } = JSON.parse(intent);
        localStorage.removeItem('redirectIntent');
        if (type === 'book' && propertyId) {
          navigate(`/booking/${propertyId}`);
          return;
        }
      } catch (e) {
        console.error('Error parsing redirect intent:', e);
      }
    }
    
    if (userData?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || '/');
    }
  };

  // Handle login form submission
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await login({ email: formData.email, password: formData.password });
      redirectAfterLogin(response.user);
    } catch (err) {
      console.error('❌ Login error:', err);
      
      const errorData = err.response?.data;
      if (errorData?.needs_verification) {
        setUserId(errorData.user_id);
        setUserEmail(errorData.email);
        setShowVerificationModal(true);
        setError('');
      } else {
        setError(errorData?.error || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
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
        // Save token and user
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Refresh auth context
        refreshUserFromStorage();
        
        // Close modal and redirect
        setShowVerificationModal(false);
        
        // Check for pending booking
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
        
        redirectAfterLogin(data.user);
      } else {
        setVerificationError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setVerificationError('Failed to verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  // Resend verification code
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

  // Google Sign-In
  const handleGoogleSuccess = async () => {
    setIsLoading(false);
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const refreshed = refreshUserFromStorage();
      if (refreshed) {
        setTimeout(() => redirectAfterLogin(JSON.parse(savedUser)), 50);
      } else {
        window.location.reload();
      }
    } else {
      setError('Authentication succeeded but failed to save session');
    }
  };

  const handleGoogleError = (err) => {
    setIsLoading(false);
    setError(err.message || 'Google authentication failed.');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {}}>
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
          {verifying ? <FaSpinner className="animate-spin mx-auto" /> : 'Verify & Login'}
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
          Back to Login
        </button>
      </motion.div>
    </div>
  );

  // Main login form render
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-900 p-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-full max-w-md bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#093A3E]" />

          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-stone-400">Homes By Mwema</p>
            <h2 className="text-3xl font-serif italic text-[#093A3E] mb-3">Login</h2>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-stone-50 border-l-2 border-red-900 text-red-900 text-xs tracking-wide whitespace-pre-wrap">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#093A3E]"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs text-stone-500 hover:text-[#093A3E] transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold rounded hover:bg-[#0c4e52] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? <FaSpinner className="animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-stone-100 text-center space-y-6">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <FaGoogle className="text-lg" /> Sign in with Google
            </button>

            <p className="text-stone-500 font-serif text-sm">
              Not a member?{' '}
              <Link
                to="/register"
                className="text-[#093A3E] italic border-b border-stone-300 hover:border-[#093A3E] transition-all"
              >
                Register
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