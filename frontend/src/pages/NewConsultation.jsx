import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaComment,
  FaArrowLeft,
  FaCheckCircle,
  FaSpinner,
  FaVideo,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaGraduationCap,
  FaChartLine
} from 'react-icons/fa';

// Consultation topics
const CONSULTATION_TOPICS = [
  { id: 'property-investment', label: 'Property Investment', icon: <FaChartLine />, description: 'Discuss investment opportunities and property portfolios' },
  { id: 'property-management', label: 'Property Management', icon: <FaBuilding />, description: 'Learn about our property management services' },
  { id: 'buying-property', label: 'Buying a Property', icon: <FaHome />, description: 'Guidance on purchasing your dream home' },
  { id: 'selling-property', label: 'Selling a Property', icon: <FaBriefcase />, description: 'Get advice on selling your property' },
  { id: 'real-estate-advice', label: 'General Real Estate Advice', icon: <FaGraduationCap />, description: 'General questions about the real estate market' },
  { id: 'other', label: 'Other', icon: <FaComment />, description: 'Custom inquiry' }
];

// Time slots (15-minute intervals)
const TIME_SLOTS = [];
for (let h = 8; h <= 20; h++) {
  [0, 15, 30, 45].forEach(m => {
    if (h === 20 && m > 0) return; // End at 8:00 PM
    TIME_SLOTS.push({
      hour: h,
      minute: m,
      label: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    });
  });
}

export default function NewConsultation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    date: '',
    timeSlot: '',
    topic: '',
    otherTopic: '',
    notes: '',
    useAccountInfo: true
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  // Calendar helpers
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const isPast = date < today;
    calendarDays.push({ date, day: d, isPast });
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
    setShowTimeSlots(false);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
    setShowTimeSlots(false);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowTimeSlots(true);
    setFormData({ ...formData, date: date.toISOString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Parse time slot
      const [hour, minute] = formData.timeSlot.split(':').map(Number);
      
      // Prepare payload
      const payload = {
        date: formData.date,
        hour,
        minute,
        topic: formData.topic === 'other' ? formData.otherTopic : CONSULTATION_TOPICS.find(t => t.id === formData.topic)?.label,
        notes: formData.notes,
        name: formData.useAccountInfo ? user?.name : formData.name,
        email: formData.useAccountInfo ? user?.email : formData.email,
        phone: formData.useAccountInfo ? user?.phone : formData.phone,
      };

      await api.consultations.create(payload);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/my-consultations');
      }, 2000);
    } catch (err) {
      console.error('Error creating consultation:', err);
      setError(err.response?.data?.error || 'Failed to create consultation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/consultation/new');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-6"
        >
          <FaArrowLeft size={14} />
          <span className="text-xs uppercase tracking-widest">Back</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 shadow-xl overflow-hidden"
        >
          {/* Decorative header */}
          <div className="h-1 bg-[#C1A173] w-full" />
          
          <div className="p-8 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-3">
                Schedule a Consultation
              </h1>
              <p className="text-stone-500 text-sm max-w-xl mx-auto">
                Book a one-on-one consultation with our expert team. We'll get back to you within 24 hours to confirm your appointment.
              </p>
            </div>

            {/* Success message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center"
                >
                  <FaCheckCircle className="text-green-500 text-3xl mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-green-800 mb-2">Request Sent Successfully!</h3>
                  <p className="text-green-600 text-sm">
                    Your consultation request has been submitted. Redirecting to your consultations...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Account info toggle */}
              <div className="bg-stone-50 p-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useAccountInfo}
                    onChange={(e) => setFormData({ ...formData, useAccountInfo: e.target.checked })}
                    className="w-4 h-4 text-[#C1A173] focus:ring-[#C1A173] border-stone-300 rounded"
                  />
                  <span className="text-sm text-stone-700">
                    Use my account information (name, email, phone from my profile)
                  </span>
                </label>
              </div>

              {/* Contact Information */}
              {!formData.useAccountInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-200 pb-2">
                    Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                          placeholder="+254 700 000 000"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Topic Selection */}
              <div>
                <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-200 pb-2 mb-4">
                  What would you like to discuss? <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CONSULTATION_TOPICS.map((topic) => (
                    <label
                      key={topic.id}
                      className={`relative p-4 border-2 cursor-pointer transition-all ${
                        formData.topic === topic.id
                          ? 'border-[#C1A173] bg-stone-50'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={topic.id}
                        checked={formData.topic === topic.id}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value, otherTopic: '' })}
                        className="sr-only"
                        required
                      />
                      <div className="flex items-start gap-3">
                        <span className={`text-xl ${formData.topic === topic.id ? 'text-[#C1A173]' : 'text-stone-400'}`}>
                          {topic.icon}
                        </span>
                        <div>
                          <h4 className="font-medium text-[#1C1917]">{topic.label}</h4>
                          <p className="text-xs text-stone-500 mt-1">{topic.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {formData.topic === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                      Please specify your topic
                    </label>
                    <input
                      type="text"
                      value={formData.otherTopic}
                      onChange={(e) => setFormData({ ...formData, otherTopic: e.target.value })}
                      className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                      placeholder="e.g., Property Valuation, Market Analysis..."
                      required={formData.topic === 'other'}
                    />
                  </motion.div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-200 pb-2 mb-4">
                  Select a Date <span className="text-red-500">*</span>
                </h3>
                
                {/* Calendar */}
                <div className="bg-stone-50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-2 text-stone-500 hover:text-stone-800 transition-colors"
                    >
                      ←
                    </button>
                    <h4 className="font-serif text-lg text-[#1C1917]">
                      {months[currentMonth]} {currentYear}
                    </h4>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-2 text-stone-500 hover:text-stone-800 transition-colors"
                    >
                      →
                    </button>
                  </div>

                  {/* Week days */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-xs uppercase tracking-widest text-stone-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <div key={index}>
                        {day ? (
                          <button
                            type="button"
                            onClick={() => !day.isPast && handleDateSelect(day.date)}
                            disabled={day.isPast}
                            className={`w-full aspect-square flex items-center justify-center text-sm transition-colors ${
                              selectedDate && day.date.toDateString() === selectedDate.toDateString()
                                ? 'bg-[#C1A173] text-white'
                                : day.isPast
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'hover:bg-stone-200 text-stone-700'
                            }`}
                          >
                            {day.day}
                          </button>
                        ) : (
                          <div className="w-full aspect-square" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <AnimatePresence>
                {showTimeSlots && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                  >
                    <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-200 pb-2 mb-4">
                      Select a Time <span className="text-red-500">*</span>
                    </h3>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, timeSlot: slot.label })}
                          className={`p-3 text-sm border transition-all ${
                            formData.timeSlot === slot.label
                              ? 'border-[#C1A173] bg-stone-100 text-[#C1A173]'
                              : 'border-stone-200 hover:border-stone-400 text-stone-600'
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                  placeholder="Tell us more about what you'd like to discuss..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={isLoading || !formData.topic || !selectedDate || !formData.timeSlot}
                  className="w-full py-4 bg-[#C1A173] text-white hover:bg-[#a8895e] transition-colors uppercase tracking-widest text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    'Schedule Consultation'
                  )}
                </button>

                <p className="text-center text-xs text-stone-400 mt-4">
                  By scheduling a consultation, you agree to our terms and privacy policy.
                  We'll confirm your appointment via email within 24 hours.
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}