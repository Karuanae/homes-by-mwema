import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaCalendarAlt, FaClock, FaUser, FaEnvelope, FaPhone,
  FaComment, FaArrowLeft, FaCheckCircle, FaSpinner,
  FaBuilding, FaHome, FaBriefcase, FaGraduationCap, FaChartLine,
  FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';

// ─── Topics ───────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: 'property-investment',  label: 'Property Investment',    icon: FaChartLine,     desc: 'Investment opportunities and portfolios' },
  { id: 'property-management',  label: 'Property Management',    icon: FaBuilding,      desc: 'Our property management services' },
  { id: 'buying-property',      label: 'Buying a Property',      icon: FaHome,          desc: 'Guidance on purchasing your home' },
  { id: 'selling-property',     label: 'Selling a Property',     icon: FaBriefcase,     desc: 'Advice on selling your property' },
  { id: 'real-estate-advice',   label: 'General Real Estate',    icon: FaGraduationCap, desc: 'General market questions' },
  { id: 'other',                label: 'Other',                  icon: FaComment,       desc: 'Custom inquiry' },
];

// ─── Time slots (8am–8pm, 15-min intervals) ───────────────────────────────────
const TIME_SLOTS = [];
for (let h = 8; h <= 20; h++) {
  for (const m of [0, 15, 30, 45]) {
    if (h === 20 && m > 0) break;
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    TIME_SLOTS.push({
      hour: h,
      minute: m,
      label: `${h12}:${String(m).padStart(2, '0')} ${period}`,
    });
  }
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ═══════════════════════════════════════════════════════════════════════════════
export default function NewConsultation() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name:            user?.name  || '',
    email:           user?.email || '',
    phone:           user?.phone || '',
    topic:           '',
    otherTopic:      '',
    notes:           '',
    useAccountInfo:  true,
  });

  const [selectedDate,  setSelectedDate]  = useState(null);
  const [selectedSlot,  setSelectedSlot]  = useState(null);
  const [calMonth,      setCalMonth]      = useState(new Date().getMonth());
  const [calYear,       setCalYear]       = useState(new Date().getFullYear());
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState(false);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) navigate('/login?redirect=/consultation/new');
  }, [user, navigate]);

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const today = new Date(); today.setHours(0,0,0,0);
  const daysInMonth   = new Date(calYear, calMonth + 1, 0).getDate();
  const firstWeekday  = new Date(calYear, calMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (calYear === today.getFullYear() && calMonth === today.getMonth()) return;
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null); setSelectedSlot(null);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null); setSelectedSlot(null);
  };

  const handleDateSelect = (d) => {
    setSelectedDate(new Date(calYear, calMonth, d));
    setSelectedSlot(null);
  };

  const isDatePast  = (d) => new Date(calYear, calMonth, d) < today;
  const isDateSel   = (d) => selectedDate && new Date(calYear, calMonth, d).toDateString() === selectedDate.toDateString();
  const isDateToday = (d) => new Date(calYear, calMonth, d).toDateString() === today.toDateString();

  // ── Resolve the topic label to send to the API ────────────────────────────
  // formData.topic holds the preset ID (e.g. 'property-investment') or 'other'.
  // We always send the human-readable label, never the ID, so it saves correctly.
  const resolveTopicLabel = () => {
    if (!formData.topic) return '';
    if (formData.topic === 'other') {
      return formData.otherTopic.trim();
    }
    const found = TOPICS.find(t => t.id === formData.topic);
    // found?.label is the correct value; fall back to the ID only if find somehow fails
    return found?.label || formData.topic;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !formData.topic) return;

    const topicLabel = resolveTopicLabel();

    // Guard: should never happen given canSubmit, but be safe
    if (!topicLabel) {
      setError('Please select or enter a consultation topic.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const dateTime = new Date(selectedDate);
      dateTime.setHours(selectedSlot.hour, selectedSlot.minute);

      await api.consultations.create({
        date:   dateTime.toISOString(),
        hour:   selectedSlot.hour,
        minute: selectedSlot.minute,
        topic:  topicLabel,               // always a non-empty label string
        notes:  formData.notes.trim() || undefined,
        name:   formData.useAccountInfo ? user?.name  : formData.name  || undefined,
        email:  formData.useAccountInfo ? user?.email : formData.email || undefined,
        phone:  formData.useAccountInfo ? user?.phone : formData.phone || undefined,
      });

      setSuccess(true);
      setTimeout(() => navigate('/dashboard?tab=consultations'), 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !!formData.topic && !!selectedDate && !!selectedSlot &&
    (formData.topic !== 'other' || !!formData.otherTopic.trim());

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f5f2ee] pt-24 sm:pt-28 px-4 pb-16">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors mb-5"
        >
          <FaArrowLeft size={13} />
          <span className="text-[11px] uppercase tracking-widest">Back</span>
        </button>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-stone-200 shadow-xl overflow-hidden rounded-2xl"
        >
          {/* Top accent */}
          <div className="h-1 bg-[#C1A173] w-full" />

          {/* Header */}
          <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-stone-100 text-center">
            <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 mb-2">Homes by Mwema</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#1C1917] mb-3">
              Schedule a Consultation
            </h1>
            <div className="inline-flex items-center gap-3 bg-[#1C1917] text-white px-5 py-2.5 rounded-full mb-3">
              <span className="text-[10px] uppercase tracking-widest text-stone-400">Consultation Fee</span>
              <span className="text-[#C1A173] font-bold text-lg">KSh 20,000</span>
            </div>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              Book a private one-on-one session with our estate experts. We'll confirm your slot within 24 hours.
            </p>
          </div>

          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-8 text-center rounded-2xl"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-500 text-3xl" />
                </div>
                <h3 className="font-serif text-2xl text-[#1C1917] mb-2">Request Submitted!</h3>
                <p className="text-stone-500 text-sm mb-1">Your consultation request has been sent.</p>
                <p className="text-stone-400 text-sm">Redirecting to your dashboard…</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="px-6 sm:px-10 py-8 space-y-8 relative">

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border-l-2 border-red-400 text-red-700 text-sm rounded-r-xl">
                {error}
              </div>
            )}

            {/* ── Account info toggle ───────────────────────────────────────── */}
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useAccountInfo}
                  onChange={e => setFormData(f => ({ ...f, useAccountInfo: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-[#C1A173] flex-shrink-0"
                />
                <div>
                  <span className="text-sm font-medium text-stone-700">Use my account details</span>
                  <p className="text-xs text-stone-400 mt-0.5">Pre-fill name, email and phone from your profile</p>
                </div>
              </label>
            </div>

            {/* ── Custom contact fields ─────────────────────────────────────── */}
            <AnimatePresence>
              {!formData.useAccountInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-100 pb-2">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs" />
                        <input
                          type="text"
                          value={formData.name}
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                          className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:border-[#C1A173] focus:outline-none text-sm"
                          placeholder="Full name"
                          required={!formData.useAccountInfo}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">
                        Email <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                          className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:border-[#C1A173] focus:outline-none text-sm"
                          placeholder="your@email.com"
                          required={!formData.useAccountInfo}
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">Phone</label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                          className="w-full pl-9 pr-4 py-3 border border-stone-200 rounded-xl focus:border-[#C1A173] focus:outline-none text-sm"
                          placeholder="+25459170780"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Topic selection ───────────────────────────────────────────── */}
            <div>
              <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-100 pb-2 mb-4">
                What would you like to discuss? <span className="text-red-400 text-sm">*</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPICS.map(t => {
                  const Icon = t.icon;
                  const active = formData.topic === t.id;
                  return (
                    <label
                      key={t.id}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        active ? 'border-[#C1A173] bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="topic"
                        value={t.id}
                        checked={active}
                        onChange={() => setFormData(f => ({ ...f, topic: t.id, otherTopic: '' }))}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-3">
                        <Icon className={`text-lg mt-0.5 flex-shrink-0 ${active ? 'text-[#C1A173]' : 'text-stone-300'}`} />
                        <div>
                          <p className="font-medium text-sm text-[#1C1917]">{t.label}</p>
                          <p className="text-xs text-stone-400 mt-0.5">{t.desc}</p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Custom topic input — shown when "Other" is selected */}
              <AnimatePresence>
                {formData.topic === 'other' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <input
                      type="text"
                      value={formData.otherTopic}
                      onChange={e => setFormData(f => ({ ...f, otherTopic: e.target.value }))}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:border-[#C1A173] focus:outline-none text-sm"
                      placeholder="Describe your topic…"
                      required={formData.topic === 'other'}
                      autoFocus
                    />
                    {/* Live preview of what will be saved */}
                    {formData.otherTopic.trim() && (
                      <p className="text-[11px] text-stone-400 mt-1.5 px-1">
                        Will be saved as: <span className="text-[#C1A173] font-medium">"{formData.otherTopic.trim()}"</span>
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live preview for preset topics */}
              {formData.topic && formData.topic !== 'other' && (
                <p className="text-[11px] text-stone-400 mt-2 px-1">
                  Topic: <span className="text-stone-600 font-medium">{TOPICS.find(t => t.id === formData.topic)?.label}</span>
                </p>
              )}
            </div>

            {/* ── Date picker ───────────────────────────────────────────────── */}
            <div>
              <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-100 pb-2 mb-4">
                Select a Date <span className="text-red-400 text-sm">*</span>
              </h3>
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={calYear === today.getFullYear() && calMonth === today.getMonth()}
                    className="p-2 text-stone-400 hover:text-stone-700 disabled:opacity-20 transition-colors rounded-lg hover:bg-stone-100"
                  >
                    <FaChevronLeft size={12} />
                  </button>
                  <span className="font-serif text-base text-stone-800">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-lg hover:bg-stone-100"
                  >
                    <FaChevronRight size={12} />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="h-8 flex items-center justify-center text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: firstWeekday }, (_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const past = isDatePast(d);
                    const sel  = isDateSel(d);
                    const tod  = isDateToday(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={past}
                        onClick={() => handleDateSelect(d)}
                        className={`h-10 w-full flex items-center justify-center text-sm rounded-lg transition-all font-medium
                          ${sel  ? 'bg-[#1C1917] text-white shadow-sm' :
                            tod  ? 'border border-[#C1A173] text-[#C1A173]' :
                            past ? 'text-stone-200 cursor-not-allowed' :
                                   'hover:bg-white text-stone-700'}`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-stone-500 flex items-center gap-1.5 px-1"
                >
                  <FaCalendarAlt size={10} className="text-[#C1A173]" />
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </motion.p>
              )}
            </div>

            {/* ── Time slots ────────────────────────────────────────────────── */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="font-serif text-lg text-[#1C1917] border-b border-stone-100 pb-2 mb-4">
                    Select a Time <span className="text-red-400 text-sm">*</span>
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const active = selectedSlot?.label === slot.label;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 text-xs sm:text-sm rounded-xl border transition-all font-medium active:scale-95 ${
                            active
                              ? 'border-[#1C1917] bg-[#1C1917] text-white shadow-sm'
                              : 'border-stone-200 text-stone-600 hover:border-stone-400 hover:bg-stone-50'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Notes ────────────────────────────────────────────────────── */}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">
                Additional Notes <span className="text-stone-300 normal-case">(optional)</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:border-[#C1A173] focus:outline-none text-sm resize-none"
                placeholder="Tell us more about what you'd like to discuss, or any specific properties in mind…"
              />
            </div>

            {/* ── Summary + Submit ─────────────────────────────────────────── */}
            <div className="pt-4 border-t border-stone-100 space-y-4">
              {(selectedDate || selectedSlot || formData.topic) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-sm space-y-2"
                >
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">Summary</p>
                  {formData.topic && (
                    <div className="flex justify-between text-stone-600">
                      <span>Topic</span>
                      <span className="font-medium text-stone-800 text-right max-w-[60%] truncate">
                        {/* Show the resolved label, not the internal ID */}
                        {resolveTopicLabel() || '—'}
                      </span>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="flex justify-between text-stone-600">
                      <span>Date</span>
                      <span className="font-medium text-stone-800">
                        {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex justify-between text-stone-600">
                      <span>Time</span>
                      <span className="font-medium text-stone-800">{selectedSlot.label}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-stone-200">
                    <span className="text-stone-600">Consultation fee</span>
                    <span className="font-bold text-[#1C1917]">KSh 20,000</span>
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading || !canSubmit}
                className="w-full py-4 bg-[#1C1917] text-white hover:bg-stone-800 active:scale-[0.98] transition-all uppercase tracking-widest text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-xl"
              >
                {isLoading ? (
                  <><FaSpinner className="animate-spin" /> Submitting…</>
                ) : (
                  'Confirm Consultation — KSh 20,000'
                )}
              </button>

              <p className="text-center text-[11px] text-stone-400 leading-relaxed">
                Payment will be arranged after your slot is approved. We'll confirm via email within 24 hours.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}