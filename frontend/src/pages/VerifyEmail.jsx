import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      setIsLoading(false);
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app/api'}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in to your account.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may be expired.');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('Network error. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 font-sans text-stone-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-stone-200 shadow-2xl shadow-stone-200/50 p-12 relative text-center"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#093A3E]" />

        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Homes By Mwema</p>
          <h2 className="text-2xl font-serif italic text-[#093A3E] mb-6">Email Verification</h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-3xl text-[#ED9B40] mb-4" />
            <p className="text-stone-600">Verifying your email...</p>
          </div>
        ) : status === 'success' ? (
          <div className="flex flex-col items-center">
            <FaCheckCircle className="text-4xl text-green-500 mb-4" />
            <p className="text-stone-700 mb-4">{message}</p>
            <p className="text-xs text-stone-500">Redirecting to login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FaTimesCircle className="text-4xl text-red-500 mb-4" />
            <p className="text-stone-700 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="block w-full bg-[#093A3E] text-white py-3 px-6 rounded text-sm font-medium hover:bg-[#093A3E]/90 transition-colors"
              >
                Go to Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="block w-full border border-stone-300 text-stone-700 py-3 px-6 rounded text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Register Again
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}