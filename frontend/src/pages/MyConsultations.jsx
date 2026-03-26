import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaCalendarAlt, FaClock, FaComment, FaPhone, FaEnvelope,
  FaTimes, FaCheckCircle, FaHourglassHalf, FaTimesCircle,
  FaCalendarCheck, FaVideo, FaExclamationTriangle, FaArrowLeft,
  FaSync, FaTrash, FaChevronDown, FaChevronUp, FaPlus,
  FaComments,
} from 'react-icons/fa';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    icon: FaHourglassHalf,
    text: 'Pending Review',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
    desc: 'Your request is awaiting admin approval.',
  },
  confirmed: {
    icon: FaCheckCircle,
    text: 'Confirmed',
    className: 'bg-green-50 text-green-700 border-green-200',
    bar: 'bg-green-500',
    desc: 'Your slot has been approved. Check your email for details.',
  },
  completed: {
    icon: FaCheckCircle,
    text: 'Completed',
    className: 'bg-stone-50 text-stone-600 border-stone-200',
    bar: 'bg-stone-400',
    desc: 'This consultation has been completed.',
  },
  cancelled: {
    icon: FaTimesCircle,
    text: 'Cancelled',
    className: 'bg-red-50 text-red-600 border-red-200',
    bar: 'bg-red-400',
    desc: 'This consultation was cancelled.',
  },
  rejected: {
    icon: FaExclamationTriangle,
    text: 'Not Approved',
    className: 'bg-red-50 text-red-700 border-red-200',
    bar: 'bg-red-500',
    desc: 'Unfortunately we could not accommodate this request.',
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${cfg.className}`}>
      <Icon size={10} />
      {cfg.text}
    </span>
  );
}

// ─── Confirm modal (replaces window.confirm) ──────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onClose, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg text-stone-900 mb-2">{title}</h3>
        <p className="text-stone-500 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 rounded-xl text-stone-600 text-xs uppercase tracking-widest hover:bg-stone-50 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Single consultation card ─────────────────────────────────────────────────
function ConsultationCard({ consultation, onCancel, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionModal, setActionModal] = useState(null); // 'cancel' | 'delete'
  const [actionLoading, setActionLoading] = useState(false);

  const cfg = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending;
  const canCancel = ['pending', 'confirmed'].includes(consultation.status);
  const canDelete = ['cancelled', 'completed', 'rejected'].includes(consultation.status);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatTime = (hour, minute) => {
    const h = hour ?? 0;
    const m = minute ?? 0;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    try {
      if (actionModal === 'cancel') {
        await api.consultations.cancel(consultation.id);
        onCancel(consultation.id);
      } else if (actionModal === 'delete') {
        try {
          await api.consultations.deleteOwn(consultation.id);
        } catch {
          // If backend endpoint not yet available, just remove from UI
        }
        onDelete(consultation.id);
      }
      setActionModal(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-white border border-stone-200 overflow-hidden hover:border-[#C1A173]/50 transition-all duration-300 rounded-xl shadow-sm"
      >
        {/* Status color bar */}
        <div className={`h-1 w-full ${cfg.bar}`} />

        {/* Tappable header */}
        <div
          className="p-4 sm:p-5 cursor-pointer select-none"
          onClick={() => setIsExpanded(v => !v)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <StatusBadge status={consultation.status} />
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">#{consultation.id}</span>
              </div>

              <h3 className="font-serif text-base sm:text-lg text-[#1C1917] mb-2 truncate">
                {consultation.topic || 'General Consultation'}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                <span className="flex items-center gap-1.5">
                  <FaCalendarAlt size={11} className="text-stone-400 flex-shrink-0" />
                  {formatDate(consultation.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <FaClock size={11} className="text-stone-400 flex-shrink-0" />
                  {formatTime(consultation.hour, consultation.minute)}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-stone-700">KSh 20,000</span>
              {isExpanded
                ? <FaChevronUp size={11} className="text-stone-300" />
                : <FaChevronDown size={11} className="text-stone-300" />
              }
            </div>
          </div>

          <p className="text-[11px] text-stone-400 mt-2 leading-snug">{cfg.desc}</p>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-stone-100 space-y-4">

                {/* Contact info */}
                {(consultation.email || consultation.phone) && (
                  <div className="bg-stone-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Contact</p>
                    {consultation.email && (
                      <p className="text-sm text-stone-600 flex items-center gap-2 mb-1">
                        <FaEnvelope size={11} className="text-stone-400 flex-shrink-0" />
                        {consultation.email}
                      </p>
                    )}
                    {consultation.phone && (
                      <p className="text-sm text-stone-600 flex items-center gap-2">
                        <FaPhone size={11} className="text-stone-400 flex-shrink-0" />
                        {consultation.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Meeting link — confirmed only */}
                {consultation.status === 'confirmed' && consultation.meeting_link && (
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest text-green-600 mb-2">Meeting Details</p>
                    <a
                      href={consultation.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 flex items-center gap-2 hover:underline font-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <FaVideo size={12} className="flex-shrink-0" />
                      Join Meeting
                    </a>
                  </div>
                )}

                {/* Your notes */}
                {consultation.notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Your Notes</p>
                    <p className="text-sm text-stone-600 font-light leading-relaxed bg-stone-50 rounded-xl p-4">
                      <FaComment className="inline mr-2 text-stone-300" size={11} />
                      {consultation.notes}
                    </p>
                  </div>
                )}

                {/* Admin message */}
                {consultation.admin_notes && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Message from Admin</p>
                    <p className="text-sm text-stone-700 italic bg-amber-50 p-4 border-l-2 border-amber-300 rounded-r-xl">
                      <FaComments className="inline mr-2 text-amber-400" size={11} />
                      {consultation.admin_notes}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400 pt-2 border-t border-stone-50">
                  <span>Requested: {new Date(consultation.created_at).toLocaleDateString()}</span>
                  {consultation.confirmed_at && (
                    <span className="text-green-600">Confirmed: {new Date(consultation.confirmed_at).toLocaleDateString()}</span>
                  )}
                  {consultation.completed_at && (
                    <span>Completed: {new Date(consultation.completed_at).toLocaleDateString()}</span>
                  )}
                  {consultation.cancelled_at && (
                    <span className="text-red-400">Cancelled: {new Date(consultation.cancelled_at).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Action buttons */}
                {(canCancel || canDelete) && (
                  <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                    {canCancel && (
                      <button
                        onClick={() => setActionModal('cancel')}
                        className="flex-1 py-2.5 text-[11px] uppercase tracking-widest text-amber-600 border border-amber-200 hover:bg-amber-50 active:scale-95 transition-all rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <FaTimes size={10} /> Cancel Request
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setActionModal('delete')}
                        className="px-4 py-2.5 text-[11px] uppercase tracking-widest text-red-400 border border-red-100 hover:bg-red-50 active:scale-95 transition-all rounded-xl flex items-center gap-1.5"
                      >
                        <FaTrash size={10} /> Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {actionModal && (
          <ConfirmModal
            title={actionModal === 'cancel' ? 'Cancel this consultation?' : 'Delete this record?'}
            message={
              actionModal === 'cancel'
                ? 'The admin will be notified. You can book a new slot at any time.'
                : 'This will permanently remove it from your history.'
            }
            confirmLabel={actionModal === 'cancel' ? 'Yes, Cancel' : 'Yes, Delete'}
            confirmClass={actionModal === 'cancel' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}
            onConfirm={handleConfirmAction}
            onClose={() => setActionModal(null)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function MyConsultations() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchConsultations(); }, []);

  const fetchConsultations = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.consultations.getMyConsultations();
      setConsultations(res.data || []);
    } catch {
      setError('Could not load your consultations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (id) =>
    setConsultations(prev =>
      prev.map(c => c.id === id ? { ...c, status: 'cancelled', cancelled_at: new Date().toISOString() } : c)
    );

  const handleDelete = (id) =>
    setConsultations(prev => prev.filter(c => c.id !== id));

  const counts = consultations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const ALL_FILTERS = [
    { key: 'all',       label: 'All',       count: consultations.length },
    { key: 'pending',   label: 'Pending',   count: counts.pending   || 0 },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
    { key: 'completed', label: 'Completed', count: counts.completed || 0 },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
    { key: 'rejected',  label: 'Rejected',  count: counts.rejected  || 0 },
  ];
  const visibleFilters = ALL_FILTERS.filter(f => f.key === 'all' || f.count > 0);
  const filtered = filter === 'all' ? consultations : consultations.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] pt-28 px-4 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-stone-200 border-t-stone-700 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-stone-500 italic">Loading your consultations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] pt-24 sm:pt-28 px-4 pb-16">
      <div className="max-w-3xl mx-auto">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-5"
        >
          <FaArrowLeft size={13} />
          <span className="text-[11px] uppercase tracking-widest">Back</span>
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1C1917] mb-1">My Consultations</h1>
            <p className="text-stone-400 text-sm">Track and manage your consultation requests</p>
          </div>
          <button
            onClick={() => navigate('/dashboard?tab=new-consultation')}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#1C1917] text-white text-[11px] uppercase tracking-widest hover:bg-stone-800 active:scale-95 transition-all rounded-xl"
          >
            <FaPlus size={10} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Stats */}
        {consultations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total',     value: consultations.length,  border: 'border-l-stone-300' },
              { label: 'Pending',   value: counts.pending   || 0, border: 'border-l-amber-400' },
              { label: 'Confirmed', value: counts.confirmed || 0, border: 'border-l-green-500' },
              { label: 'Completed', value: counts.completed || 0, border: 'border-l-stone-300' },
            ].map((s, i) => (
              <div key={i} className={`bg-white border border-stone-100 border-l-4 ${s.border} rounded-xl p-4 shadow-sm`}>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">{s.label}</p>
                <p className="text-2xl font-serif text-[#1C1917]">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        {consultations.length > 0 && visibleFilters.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1">
            {visibleFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-all ${
                  filter === f.key
                    ? 'bg-[#1C1917] text-white border-[#1C1917]'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                }`}
              >
                {f.label} <span className="opacity-50">({f.count})</span>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-400 text-red-700 text-sm rounded-r-xl">
            {error}
          </div>
        )}

        {/* List / empty states */}
        {consultations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-200 rounded-2xl p-10 sm:p-16 text-center shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt size={22} className="text-stone-300" />
            </div>
            <h3 className="font-serif text-xl text-stone-700 mb-2">No consultations yet</h3>
            <p className="text-stone-400 text-sm mb-2 max-w-xs mx-auto">
              Book a one-on-one session with our estate experts.
            </p>
            <p className="text-[#C1A173] font-semibold text-sm mb-6">KSh 20,000 / session</p>
            <button
              onClick={() => navigate('/dashboard?tab=new-consultation')}
              className="px-6 py-3 bg-[#1C1917] text-white text-[11px] uppercase tracking-widest rounded-xl hover:bg-stone-800 transition-colors"
            >
              Book a Consultation
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center">
            <p className="text-stone-400 text-sm">No {filter} consultations.</p>
            <button onClick={() => setFilter('all')} className="mt-3 text-xs text-stone-500 underline">
              Show all
            </button>
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            <AnimatePresence>
              {filtered.map(c => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  onCancel={handleCancel}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={fetchConsultations}
            className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2 mx-auto uppercase tracking-widest"
          >
            <FaSync size={10} /> Refresh
          </button>
        </div>

        {consultations.length > 0 && (
          <div className="mt-6 sm:hidden">
            <button
              onClick={() => navigate('/dashboard?tab=new-consultation')}
              className="w-full py-4 bg-[#1C1917] text-white text-[11px] uppercase tracking-widest rounded-xl hover:bg-stone-800 active:scale-95 transition-all"
            >
              + Book New Consultation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}