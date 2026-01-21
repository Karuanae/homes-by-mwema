import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaGoogle, 
  FaFacebook, 
  FaApple,
  FaArrowRight
} from 'react-icons/fa';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        console.log('Register:', formData);
        setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-stone-900 overflow-hidden font-sans">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop')" }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-teal-950/90 via-teal-900/80 to-stone-900/90" />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden border border-white/20">
          
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-3xl font-serif font-bold text-teal-950 mb-2">Create Account</h2>
            <p className="text-stone-500 text-sm">Join our exclusive community of travelers</p>
          </div>

          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
                  placeholder="Full Name"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
                  placeholder="Email Address"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-11 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
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

              {/* Confirm Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaLock className="text-stone-400 group-focus-within:text-teal-600 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-11 pr-11 py-3.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-stone-800 placeholder-stone-400"
                  placeholder="Confirm Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start pl-1">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="w-4 h-4 text-teal-600 border-stone-300 rounded focus:ring-teal-500 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-light text-stone-600">
                    I agree to the{' '}
                    <Link to="/terms" className="font-medium text-teal-700 hover:text-teal-900 underline decoration-teal-700/30">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="font-medium text-teal-700 hover:text-teal-900 underline decoration-teal-700/30">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-teal-700 to-teal-900 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg hover:shadow-xl shadow-teal-900/20 hover:from-teal-800 hover:to-teal-950 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        Sign Up <FaArrowRight />
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
                <span className="px-4 bg-white text-stone-400 font-light">or register with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button className="flex items-center justify-center py-3 border border-stone-200 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all text-stone-600">
                <FaGoogle className="text-xl" />
              </button>
          

            </div>

            {/* Login Link */}
            <div className="mt-8 text-center">
              <p className="text-stone-600">
                Already a member?{' '}
                <Link to="/login" className="font-bold text-teal-800 hover:text-teal-600 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}