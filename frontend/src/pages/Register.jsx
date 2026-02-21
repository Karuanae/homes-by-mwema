import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner, FaGoogle } from 'react-icons/fa';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await api.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || ''
      });
      
      setSuccess('Account created.');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed.';
      setError(msg);
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
            setSuccess('Account created.');
            setTimeout(() => navigate('/'), 1000);
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
        className="w-full max-w-lg bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-stone-900 w-full" />

        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif italic text-stone-900 mb-3">Create Account</h2>
          <p className="text-xs uppercase tracking-widest text-stone-400">Join the Collective</p>
        </div>

        {error && <div className="mb-6 text-red-900 text-xs tracking-wide text-center">{error}</div>}
        {success && <div className="mb-6 text-stone-900 text-xs tracking-wide text-center font-bold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ...existing code... */}
        </form>

        <div className="mt-10 pt-6 border-t border-stone-100 text-center">
          <div className="mb-6">
            <button type="button" onClick={handleGoogleAuth} className="w-full py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors mb-2 flex items-center justify-center gap-2">
              <FaGoogle className="text-lg" /> Register with Google
            </button>
          </div>
          <p className="text-stone-500 font-serif text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-stone-900 italic border-b border-stone-300 hover:border-stone-900 transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}