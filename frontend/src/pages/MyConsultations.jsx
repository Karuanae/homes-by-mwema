import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaComment, 
  FaPhone, 
  FaEnvelope,
  FaTimes,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaCalendarCheck,
  FaVideo,
  FaExclamationTriangle,
  FaArrowLeft,
  FaSync
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      icon: <FaHourglassHalf className="text-amber-500" />,
      text: 'Pending Review',
      className: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    confirmed: {
      icon: <FaCheckCircle className="text-green-500" />,
      text: 'Confirmed',
      className: 'bg-green-50 text-green-700 border-green-200'
    },
    completed: {
      icon: <FaCheckCircle className="text-stone-500" />,
      text: 'Completed',
      className: 'bg-stone-50 text-stone-600 border-stone-200'
    },
    cancelled: {
      icon: <FaTimesCircle className="text-red-500" />,
      text: 'Cancelled',
      className: 'bg-red-50 text-red-600 border-red-200'
    },
    rejected: {
      icon: <FaExclamationTriangle className="text-red-500" />,
      text: 'Not Approved',
      className: 'bg-red-50 text-red-600 border-red-200'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.icon}
      {config.text}
    </span>
  );
};

// Consultation card component
const ConsultationCard = ({ consultation, onCancel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (hour, minute) => {
    const h = hour || 0;
    const m = minute || 0;
    const date = new Date();
    date.setHours(h, m);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCancel = ['pending', 'confirmed'].includes(consultation.status);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this consultation?')) return;
    
    setIsCancelling(true);
    try {
      await api.consultations.cancel(consultation.id);
      onCancel(consultation.id);
    } catch (error) {
      console.error('Failed to cancel consultation:', error);
      alert('Failed to cancel consultation. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-stone-200 overflow-hidden hover:border-[#C1A173] transition-all duration-300"
    >
      {/* Header - always visible */}
      <div 
        className="p-6 cursor-pointer hover:bg-stone-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={consultation.status} />
              <span className="text-xs text-stone-400">
                Request #{consultation.id}
              </span>
            </div>
            
            <h3 className="font-serif text-lg text-[#1C1917] mb-2">
              {consultation.topic || 'General Consultation'}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-stone-600">
              <span className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-stone-400" size={12} />
                {formatDate(consultation.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <FaClock className="text-stone-400" size={12} />
                {formatTime(consultation.hour, consultation.minute)}
              </span>
            </div>
          </div>
          
          <button className="text-stone-400 hover:text-stone-600 transition-colors">
            <FaCalendarCheck className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-stone-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Contact info */}
                {(consultation.email || consultation.phone) && (
                  <div className="bg-stone-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                      Contact Information
                    </p>
                    {consultation.email && (
                      <p className="text-sm text-stone-600 flex items-center gap-2 mb-1">
                        <FaEnvelope className="text-stone-400" size={12} />
                        {consultation.email}
                      </p>
                    )}
                    {consultation.phone && (
                      <p className="text-sm text-stone-600 flex items-center gap-2">
                        <FaPhone className="text-stone-400" size={12} />
                        {consultation.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Meeting link for confirmed consultations */}
                {consultation.status === 'confirmed' && consultation.meeting_link && (
                  <div className="bg-green-50 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-green-600 mb-2">
                      Meeting Details
                    </p>
                    <a 
                      href={consultation.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 flex items-center gap-2 hover:underline"
                    >
                      <FaVideo className="text-green-500" size={12} />
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>

              {/* Notes */}
              {consultation.notes && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                    Your Notes
                  </p>
                  <p className="text-sm text-stone-600 font-light leading-relaxed bg-stone-50 p-4">
                    <FaComment className="inline mr-2 text-stone-400" size={12} />
                    {consultation.notes}
                  </p>
                </div>
              )}

              {/* Admin notes (if any) */}
              {consultation.admin_notes && (
                <div className="mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                    Message from Admin
                  </p>
                  <p className="text-sm text-stone-600 italic bg-amber-50 p-4 border-l-2 border-amber-400">
                    {consultation.admin_notes}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="flex items-center gap-4 text-xs text-stone-400 mt-4 pt-4 border-t border-stone-100">
                <span>Requested: {new Date(consultation.created_at).toLocaleDateString()}</span>
                {consultation.confirmed_at && (
                  <span>Confirmed: {new Date(consultation.confirmed_at).toLocaleDateString()}</span>
                )}
                {consultation.completed_at && (
                  <span>Completed: {new Date(consultation.completed_at).toLocaleDateString()}</span>
                )}
              </div>

              {/* Cancel button */}
              {canCancel && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    className="px-4 py-2 text-xs uppercase tracking-widest text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCancelling ? (
                      <>
                        <FaSync className="animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <FaTimes />
                        Cancel Request
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Main component
export default function MyConsultations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await api.consultations.getMyConsultations();
      setConsultations(response.data || []);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Failed to load your consultations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (cancelledId) => {
    setConsultations(prev => 
      prev.map(c => 
        c.id === cancelledId 
          ? { ...c, status: 'cancelled', cancelled_at: new Date().toISOString() }
          : c
      )
    );
  };

  // Filter consultations
  const filteredConsultations = consultations.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Count by status
  const counts = consultations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const filters = [
    { key: 'all', label: 'All', count: consultations.length },
    { key: 'pending', label: 'Pending', count: counts.pending || 0 },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
    { key: 'completed', label: 'Completed', count: counts.completed || 0 },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
    { key: 'rejected', label: 'Rejected', count: counts.rejected || 0 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
              <p className="font-serif text-stone-500">Loading your consultations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-4"
          >
            <FaArrowLeft size={14} />
            <span className="text-xs uppercase tracking-widest">Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-2">
                My Consultations
              </h1>
              <p className="text-stone-500 text-sm">
                Track and manage your consultation requests
              </p>
            </div>
            
            <button
              onClick={() => navigate('/consultation/new')}
              className="px-6 py-3 bg-[#C1A173] text-white hover:bg-[#a8895e] transition-colors text-xs uppercase tracking-widest"
            >
              New Consultation
            </button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {filters.slice(0, 4).map((f) => (
            <div 
              key={f.key}
              className={`bg-white p-4 border-l-4 cursor-pointer transition-all ${
                filter === f.key 
                  ? 'border-[#C1A173] bg-stone-50' 
                  : 'border-stone-200 hover:border-stone-400'
              }`}
              onClick={() => setFilter(f.key)}
            >
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">
                {f.label}
              </p>
              <p className="text-2xl font-serif text-[#1C1917]">{f.count}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs for mobile */}
        <div className="md:hidden mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-min pb-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-xs whitespace-nowrap border transition-colors ${
                  filter === f.key
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Consultations list */}
        {filteredConsultations.length === 0 ? (
          <div className="bg-white border border-stone-200 p-12 text-center">
            <FaCalendarAlt className="text-4xl text-stone-300 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-stone-600 mb-2">No Consultations Found</h3>
            <p className="text-stone-500 mb-6">
              {filter === 'all' 
                ? "You haven't made any consultation requests yet."
                : `You don't have any ${filter} consultations.`}
            </p>
            <button
              onClick={() => navigate('/consultation/new')}
              className="px-6 py-3 bg-[#C1A173] text-white hover:bg-[#a8895e] transition-colors text-xs uppercase tracking-widest"
            >
              Request a Consultation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <ConsultationCard
                key={consultation.id}
                consultation={consultation}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchConsultations}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <FaSync /> Refresh
          </button>
        </div>
      </div>
    </div>
  );
}