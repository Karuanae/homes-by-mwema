import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { user } = await authLogin({ email: formData.email, password: formData.password });
      if (user?.role === 'admin') {
        window.location.href = '/admin';
      } else {
        const redirectUrl = searchParams.get('redirect');
        navigate(redirectUrl || '/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };


  // Google Auth Handler (using Google Identity Services)
  const handleGoogleAuth = () => {
    /* global google */
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => handleGoogleAuth();
      document.body.appendChild(script);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
      callback: async (response) => {
        setIsLoading(true);
        setError('');
        try {
          // Send credential to backend for verification
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
          });
          const data = await res.json();
          if (data.token && data.user) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.role === 'admin') {
              window.location.href = '/admin';
            } else {
              const redirectUrl = searchParams.get('redirect');
              navigate(redirectUrl || '/');
            }
          } else {
            setError(data.error || 'Google authentication failed.');
          }
        } catch (err) {
          setError('Google authentication failed.');
        } finally {
          setIsLoading(false);
        }
      },
    });
    window.google.accounts.id.prompt();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-900 p-6 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-900 w-full" />

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
          {/* ...existing code... */}
        </form>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-stone-100 text-center space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <button type="button" onClick={handleGoogleAuth} className="py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
               <FaGoogle className="text-lg" /> Google
             </button>
             <button className="py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors">
               Apple
             </button>
          </div>
          <p className="text-stone-500 font-serif text-sm">
            Not a member?{' '}
            <Link to="/register" className="text-stone-900 italic border-b border-stone-300 hover:border-stone-900 transition-all">
              Apply for access
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}