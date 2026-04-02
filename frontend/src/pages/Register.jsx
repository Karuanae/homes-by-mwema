import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { socialAuth } from '../services/socialAuth';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup, user, loading, refreshUserFromStorage } = useAuth();

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [showPassword, setShowPassword]     = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState('');
  const [termsAccepted, setTermsAccepted]   = useState(false);
  const [termsError, setTermsError]         = useState('');

  // ── After successful registration (unverified) ───────────────────────────
  // Show this panel instead of the form so the user knows to check their email
  const [pendingEmail, setPendingEmail]     = useState('');
  const [resendLoading, setResendLoading]   = useState(false);
  const [resendMessage, setResendMessage]   = useState('');

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093A3E]" />
      </div>
    );
  }

  const redirectAfterAuth = (userData) => {
    const chatIntent = localStorage.getItem('chatIntent');
    if (chatIntent) { setTimeout(() => navigate(chatIntent), 1200); return; }

    const wishlistIntent = localStorage.getItem('wishlistIntent');
    if (wishlistIntent) { setTimeout(() => navigate(`/booking/${wishlistIntent}`), 1200); return; }

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

  // ── Form helpers ──────────────────────────────────────────────────────────
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

  // ── Email + password registration ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setTermsError('');

    try {
      const response = await signup({
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
        phone:    formData.phone || '',
      });

      // Backend always returns email_verified: false for new registrations.
      // Show the "check your inbox" panel — do NOT log the user in.
      if (response.user && !response.user.email_verified) {
        setPendingEmail(formData.email);
      } else {
        // Fallback: shouldn't happen, but handle gracefully
        redirectAfterAuth(response.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend verification email ─────────────────────────────────────────────
  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app/api'}/auth/resend-verification`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: pendingEmail }),
        }
      );
      const data = await res.json();
      setResendMessage(data.message || 'Verification email sent!');
    } catch {
      setResendMessage('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Google Sign-Up ────────────────────────────────────────────────────────
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

  // ── "Check your inbox" panel (shown after successful registration) ─────────
  if (pendingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md bg-white border border-stone-200 shadow-2xl p-12 relative text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#093A3E]" />

          {/* Envelope icon */}
          <div className="w-16 h-16 bg-[#093A3E]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#093A3E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Almost there</p>
          <h2 className="text-2xl font-serif italic text-[#093A3E] mb-4">Check your inbox</h2>

          <p className="text-sm text-stone-600 leading-relaxed mb-2">
            We've sent a verification link to
          </p>
          <p className="font-medium text-[#093A3E] mb-6">{pendingEmail}</p>

          <p className="text-xs text-stone-500 leading-relaxed mb-8">
            Click the link in that email to activate your account. If you don't see it,
            check your <strong>spam or junk</strong> folder.
          </p>

          {resendMessage && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-3 mb-4">
              {resendMessage}
            </p>
          )}

          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-xs text-[#093A3E] underline underline-offset-2 hover:text-[#0c4e52]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendLoading ? 'Sending…' : "Didn't receive it? Resend verification email"}
          </button>

          <div className="mt-8 pt-6 border-t border-stone-100">
            <Link to="/login" className="text-xs text-stone-500 hover:text-[#093A3E] transition-colors">
              ← Back to login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main registration form ────────────────────────────────────────────────
  return (
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
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text" id="name" name="name"
              value={formData.name} onChange={handleChange} required
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50
                         focus:outline-none focus:border-stone-400 text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email" id="email" name="email"
              value={formData.email} onChange={handleChange} required autoComplete="email"
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50
                         focus:outline-none focus:border-stone-400 text-sm"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Phone (optional)
            </label>
            <input
              type="tel" id="phone" name="phone"
              value={formData.phone} onChange={handleChange}
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50
                         focus:outline-none focus:border-stone-400 text-sm"
            />
          </div>

          {/* Password */}
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
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50
                           focus:outline-none focus:border-stone-400 text-sm pr-10"
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword" name="confirmPassword"
              value={formData.confirmPassword} onChange={handleChange}
              required autoComplete="new-password"
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50
                         focus:outline-none focus:border-stone-400 text-sm"
            />
          </div>

          {/* Terms */}
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
            className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold
                       rounded hover:bg-[#0c4e52] transition-colors flex items-center justify-center
                       gap-2 disabled:opacity-60"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        {/* Google option */}
        <div className="mt-10 pt-6 border-t border-stone-100 text-center">
          <p className="text-xs text-stone-400 mb-4 uppercase tracking-widest">or</p>
          <button
            type="button" onClick={handleGoogleClick} disabled={isLoading}
            className="w-full py-3 border border-stone-200 text-[10px] uppercase tracking-widest
                       hover:bg-stone-50 transition-colors flex items-center justify-center
                       gap-2 disabled:opacity-60"
          >
            <FaGoogle className="text-lg" /> Register with Google
          </button>

          <p className="text-stone-500 font-serif text-sm mt-6">
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
  );
}