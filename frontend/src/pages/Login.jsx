import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { socialAuth } from '../services/socialAuth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, user, loading, refreshUserFromStorage } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ User already logged in, redirecting:', user);
      
      // Check for pending booking data first
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900" />
      </div>
    );
  }

  const redirectAfterLogin = (userData) => {
    console.log('🔄 Redirecting after login:', userData);
    console.log('📍 Location state:', location.state);
    
    // First check for pending booking data (most important)
    const pendingData = localStorage.getItem('pendingBookingData');
    if (pendingData) {
      try {
        const { propertyId } = JSON.parse(pendingData);
        console.log('✅ Found pending booking data, redirecting to payment for property:', propertyId);
        // Don't clear pendingData here - let payment page handle it
        navigate(`/payment/${propertyId}`);
        return;
      } catch (e) {
        console.error('Error parsing pending data:', e);
        localStorage.removeItem('pendingBookingData');
      }
    }
    
    // Check for consultation intent
    const consultIntent = localStorage.getItem('consultationIntent');
    if (consultIntent) {
      localStorage.removeItem('consultationIntent');
      console.log('📅 Found consultation intent, redirecting to my-consultations');
      navigate('/my-consultations');
      return;
    }
    
    // Then check for redirect from location.state (from BookingPage)
    if (location.state?.from) {
      console.log('📍 Redirecting to location.state.from:', location.state.from);
      navigate(location.state.from);
      return;
    }
    
    // Check for saved intent (from property clicks)
    const intent = localStorage.getItem('redirectIntent');
    if (intent) {
      try {
        const { type, propertyId } = JSON.parse(intent);
        localStorage.removeItem('redirectIntent');
        
        if (type === 'book' && propertyId) {
          console.log('📚 Found booking intent, redirecting to property:', propertyId);
          navigate(`/booking/${propertyId}`);
          return;
        }
      } catch (e) {
        console.error('Error parsing redirect intent:', e);
      }
    }
    
    // Default redirect
    if (userData?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || '/');
    }
  };

  // ── Standard email/password login ────────────────────────────────────────
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
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleSuccess = async (data) => {
    console.log('✅ Google auth success - received data:', data);
    
    setIsLoading(false);
    
    // Check if user was saved
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      console.log('✅ User saved to localStorage, refreshing AuthContext...');
      
      const refreshed = refreshUserFromStorage();
      
      if (refreshed) {
        console.log('✅ AuthContext refreshed, redirecting...');
        
        // Check for pending booking data first
        const pendingData = localStorage.getItem('pendingBookingData');
        if (pendingData) {
          try {
            const { propertyId } = JSON.parse(pendingData);
            console.log('✅ Found pending booking data, redirecting to payment for property:', propertyId);
            setTimeout(() => navigate(`/payment/${propertyId}`), 50);
            return;
          } catch (e) {
            console.error('Error parsing pending data:', e);
            localStorage.removeItem('pendingBookingData');
          }
        }
        
        // Check for consultation intent
        const consultIntent = localStorage.getItem('consultationIntent');
        if (consultIntent) {
          localStorage.removeItem('consultationIntent');
          console.log('📅 Found consultation intent, redirecting to my-consultations');
          setTimeout(() => navigate('/my-consultations'), 50);
          return;
        }
        
        // Then check location state
        if (location.state?.from) {
          setTimeout(() => navigate(location.state.from), 50);
          return;
        }
        
        // Then check intent
        const intent = localStorage.getItem('redirectIntent');
        if (intent) {
          try {
            const { type, propertyId } = JSON.parse(intent);
            localStorage.removeItem('redirectIntent');
            
            if (type === 'book' && propertyId) {
              setTimeout(() => navigate(`/booking/${propertyId}`), 50);
              return;
            }
          } catch (e) {
            console.error('Error parsing redirect intent:', e);
          }
        }
        
        // Default redirect
        setTimeout(() => {
          redirectAfterLogin(JSON.parse(savedUser));
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
        className="w-full max-w-md bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-900" />

        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-stone-400">Homes By Mwema</p>
          <h2 className="text-3xl font-serif italic text-stone-900 mb-3">Login</h2>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
             <div className="flex justify-end mt-2">
    <Link
      to="/forgot-password"
      className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
    >
      Forgot password?
    </Link>
  </div>
          </div>



          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-stone-900 text-white uppercase tracking-widest text-xs font-bold rounded hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
              className="text-stone-900 italic border-b border-stone-300 hover:border-stone-900 transition-all"
            >
              Register
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}