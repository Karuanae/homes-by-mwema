import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { socialAuth } from '../services/socialAuth';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin, user, loading } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
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
    if (userData?.role === 'admin') {
      window.location.href = '/admin';
    } else {
      navigate(searchParams.get('redirect') || '/');
    }
  };

  // ── Standard email/password login ────────────────────────────────────────
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user } = await authLogin({ email: formData.email, password: formData.password });
      redirectAfterLogin(user);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google Sign-In ────────────────────────────────────────────────────────
  const handleGoogleClick = () => {
    setError('');
    setIsLoading(true);

    socialAuth.triggerGoogleSignIn(
      // onSuccess — backend already stored token via authAPI.googleAuth inside socialAuth
      (data) => {
        setIsLoading(false);
        redirectAfterLogin(data.user);
      },
      // onError
      (err) => {
        setIsLoading(false);
        setError(err.message || 'Google authentication failed.');
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-900 p-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
      >
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-900" />

        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif italic text-stone-900 mb-3">Member Access</h2>
          <p className="text-xs uppercase tracking-widest text-stone-400">Welcome Back</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-stone-50 border-l-2 border-red-900 text-red-900 text-xs tracking-wide">
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
              placeholder="you@email.com"
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-stone-200 rounded bg-stone-50 focus:outline-none focus:border-stone-400 text-sm pr-10"
              placeholder="Password"
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-3 top-9 -translate-y-1/2 text-stone-400 hover:text-stone-900"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
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
              Apply for access
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}