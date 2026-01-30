import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa'; // minimal icons only
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
          
          {/* Email Input */}
          <div className="group">
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border-b border-stone-300 py-2 font-serif text-lg text-stone-900 bg-transparent focus:border-stone-900 outline-none transition-colors placeholder-stone-300"
              placeholder="name@example.com"
              required
            />
          </div>

          {/* Password Input */}
          <div className="group relative">
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border-b border-stone-300 py-2 font-serif text-lg text-stone-900 bg-transparent focus:border-stone-900 outline-none transition-colors placeholder-stone-300"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 bottom-3 text-stone-400 hover:text-stone-900 transition-colors"
            >
              {showPassword ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}
            </button>
          </div>

          {/* Extras */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="appearance-none w-3 h-3 border border-stone-300 checked:bg-stone-900 rounded-none transition-all"
              />
              <span className="text-[10px] uppercase tracking-widest text-stone-500">Remember Me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-serif italic text-stone-500 hover:text-stone-900 border-b border-transparent hover:border-stone-300 transition-all">
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-900 text-white py-4 text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition-all disabled:opacity-70 flex justify-center items-center gap-3"
          >
            {isLoading ? <FaSpinner className="animate-spin" /> : "ENTER"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-stone-100 text-center space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <button className="py-3 border border-stone-200 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors">
               Google
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