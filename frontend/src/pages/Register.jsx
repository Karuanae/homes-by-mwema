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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // NEW: Terms & Policy state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ User already logged in, redirecting:', user);
      
      // Check for consultation intent
      const consultIntent = localStorage.getItem('consultationIntent');
      if (consultIntent) {
        localStorage.removeItem('consultationIntent');
        navigate('/my-consultations');
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
    console.log('🔄 Redirecting after auth:', userData);
    
    // Check for consultation intent
    const consultIntent = localStorage.getItem('consultationIntent');
    if (consultIntent) {
      localStorage.removeItem('consultationIntent');
      setTimeout(() => navigate('/my-consultations'), 1200);
      return;
    }
    
    if (userData?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      const redirectUrl = searchParams.get('redirect');
      setTimeout(() => navigate(redirectUrl || '/'), 1200);
    }
  };

  // ── Standard registration ─────────────────────────────────────────────────
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
    
    // NEW: Validate terms acceptance
    if (!termsAccepted) {
      setTermsError('You must accept the Terms & Policy to register.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setTermsError('');
    
    try {
      const { user } = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '',
      });
      setSuccess('Account created.');
      redirectAfterAuth(user);
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Sign-Up ────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (data) => {
    console.log('✅ Google auth success - received data:', data);
    
    setIsLoading(false);
    setSuccess('Account created.');
    
    // Check if user was saved
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      console.log('✅ User saved to localStorage, refreshing AuthContext...');
      
      const refreshed = refreshUserFromStorage();
      
      if (refreshed) {
        console.log('✅ AuthContext refreshed, redirecting...');
        
        // Check for consultation intent
        const consultIntent = localStorage.getItem('consultationIntent');
        if (consultIntent) {
          localStorage.removeItem('consultationIntent');
          setTimeout(() => navigate('/my-consultations'), 50);
          return;
        }
        
        setTimeout(() => {
          redirectAfterAuth(JSON.parse(savedUser));
        }, 50);
      } else {
        console.log('⚠️ AuthContext refresh failed, reloading page...');
        window.location.reload();
      }
    } else {
      console.error('❌ User not saved to localStorage!');
      setError('Authentication succeeded but failed to save session');
    }
  };

  const handleGoogleError = (err) => {
    console.error('❌ Google auth error:', err);
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
        
        {success && (
          <div className="mb-8 p-4 bg-stone-50 border-l-2 border-green-900 text-green-900 text-xs tracking-wide">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="name" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
            />
          </div>

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
            <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Phone (optional)
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
                autoComplete="new-password"
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
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm pr-10"
              />
            </div>
          </div>

          {/* NEW: Terms & Policy Checkbox */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => {
                  setTermsAccepted(e.target.checked);
                  setTermsError('');
                }}
                className="w-4 h-4 mt-1 accent-[#093A3E] flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs text-stone-600 leading-relaxed">
                I agree to the{' '}
                <Link 
                  to="/terms" 
                  target="_blank"
                  className="text-[#093A3E] font-medium hover:underline"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link 
                  to="/privacy" 
                  target="_blank"
                  className="text-[#093A3E] font-medium hover:underline"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            {/* Terms Error Message */}
            {termsError && (
              <p className="text-xs text-red-600 pl-7">{termsError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#093A3E] text-white uppercase tracking-widest text-xs font-bold rounded hover:bg-[#0c4e52] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-stone-100 text-center">
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <FaGoogle className="text-lg" /> Register with Google
            </button>
          </div>

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
  );
}