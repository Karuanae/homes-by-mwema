import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
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
          
          <div className="space-y-8">
             <div className="group">
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Full Name</label>
                <input
                  type="text" name="name"
                  value={formData.name} onChange={handleChange}
                  className="w-full border-b border-stone-300 py-2 font-serif text-lg bg-transparent focus:border-stone-900 outline-none transition-colors placeholder-stone-300"
                  placeholder="John Doe"
                />
             </div>

             <div className="group">
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Email Address</label>
                <input
                  type="email" name="email"
                  value={formData.email} onChange={handleChange}
                  className="w-full border-b border-stone-300 py-2 font-serif text-lg bg-transparent focus:border-stone-900 outline-none transition-colors placeholder-stone-300"
                  placeholder="name@example.com"
                />
             </div>

             <div className="group">
                <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Phone (Optional)</label>
                <input
                  type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  className="w-full border-b border-stone-300 py-2 font-serif text-lg bg-transparent focus:border-stone-900 outline-none transition-colors placeholder-stone-300"
                  placeholder="+254..."
                />
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password} onChange={handleChange}
                    className="w-full border-b border-stone-300 py-2 font-serif text-lg bg-transparent focus:border-stone-900 outline-none"
                    placeholder="••••••"
                  />
                </div>
                <div className="group relative">
                  <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Confirm</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword} onChange={handleChange}
                    className="w-full border-b border-stone-300 py-2 font-serif text-lg bg-transparent focus:border-stone-900 outline-none"
                    placeholder="••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 bottom-3 text-stone-400 hover:text-stone-900">
                    {showPassword ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}
                  </button>
                </div>
             </div>
          </div>

          <div className="pt-2">
             <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required className="mt-1 appearance-none w-3 h-3 border border-stone-300 checked:bg-stone-900 rounded-none transition-all" />
                <span className="text-xs text-stone-500 font-serif leading-tight">
                   I agree to the <Link to="/terms" className="underline hover:text-stone-900">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-stone-900">Privacy Policy</Link>.
                </span>
             </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 text-white py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center gap-3"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-stone-100 text-center">
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