import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaFacebook, 
  FaApple, 
  FaArrowRight
} from 'react-icons/fa';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Call
    setTimeout(() => {
        console.log('Login:', formData);
        setIsLoading(false);
        // Add navigation logic here
    }, 2000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-stone-900 overflow-hidden font-sans">
      
      {/* 1. Cinematic Background with Deep Teal Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 transition-transform duration-[20s] ease-in-out hover:scale-105"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-950/95 via-teal-900/80 to-stone-900/90" />

      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />

      {/* 2. Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/30 overflow-hidden border border-white/20">
          
          <div className="px-8 pt-10 pb-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-teal-950 mb-2">Welcome Back</h2>
              <p className="text-stone-500 text-sm">Sign in to access your luxury itinerary</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaEnvelope className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
                    placeholder="Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Extras: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-teal-600 border-stone-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                  <span className="text-stone-600 group-hover:text-teal-700 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="font-medium text-teal-700 hover:text-teal-900 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-700 to-teal-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg hover:shadow-xl shadow-teal-900/20 hover:from-teal-800 hover:to-teal-950 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        Sign In <FaArrowRight />
                    </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-400 font-light">or continue with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-1 gap-3">
              
             <button className="flex items-center justify-center py-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all text-stone-600">
                <FaGoogle className="text-xl" />
              </button>
          
            </div>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-stone-600">
                New to LuxuryStays?{' '}
                <Link to="/register" className="font-bold text-teal-800 hover:text-teal-600 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}