// pages/HostComingSoon.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaClock, FaEnvelope, FaArrowLeft } from 'react-icons/fa';

export default function HostComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center px-4 pt-24 pb-16">
      <div className="max-w-3xl mx-auto text-center">
        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-block p-4 bg-[#093A3E] rounded-full mb-6">
            <FaHome className="text-4xl text-[#ED9B40]" />
          </div>
        </motion.div>

        {/* Main content */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#093A3E] mb-4"
        >
          Host with <span className="italic text-[#ED9B40]">Mwema</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <FaClock className="text-[#ED9B40] text-xl" />
          <span className="text-stone-600 uppercase tracking-[0.2em] text-sm font-medium">
            Coming Soon
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-stone-600 text-lg mb-8 max-w-xl mx-auto"
        >
          We're preparing something exceptional for property owners who want to elevate their hosting experience. Our host platform will offer powerful tools to manage your properties with ease.
        </motion.p>

        {/* Feature preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {[
            'Smart Pricing Tools',
            'Performance Analytics',
            'Professional Photography'
          ].map((feature, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-stone-100">
              <p className="text-sm font-medium text-[#093A3E]">{feature}</p>
            </div>
          ))}
        </motion.div>

        {/* Contact form/interest capture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-md max-w-md mx-auto mb-8"
        >
          <h3 className="text-lg font-serif text-[#093A3E] mb-4">Be the first to know</h3>
          <p className="text-stone-500 text-sm mb-6">
            Leave your email and we'll notify you when our host platform launches.
          </p>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your email address"
              className="w-full px-4 py-3 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ED9B40] focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-[#d4882d] transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              <FaEnvelope className="text-sm" />
              Notify Me
            </button>
          </form>
        </motion.div>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-stone-500 hover:text-[#093A3E] transition-colors text-sm"
        >
          <FaArrowLeft className="text-xs" />
          Go Back
        </motion.button>
      </div>
    </div>
  );
}