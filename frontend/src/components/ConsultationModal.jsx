import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ConsultationModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const [consultMonth, setConsultMonth] = useState(today.getMonth());
  const [consultYear, setConsultYear] = useState(today.getFullYear());
  const [consultDate, setConsultDate] = useState(null);
  const [consultHour, setConsultHour] = useState(10);
  const [consultMinute, setConsultMinute] = useState(0);
  const [notes, setNotes] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const consultMonths = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m, y) => new Date(y, m, 1).getDay();

  useEffect(() => {
    if (isOpen) {
      setConsultDate(null);
      setConsultHour(10);
      setConsultMinute(0);
      setNotes('');
      setError('');
      setSuccess('');
      setName(user?.name || '');
      setEmail(user?.email || '');
    }
  }, [isOpen, user]);

  const handleConfirm = async () => {
    if (!consultDate) return;
    setIsLoading(true);
    setError('');
    try {
      const dateTime = new Date(consultDate);
      dateTime.setHours(consultHour, consultMinute);
      const payload = {
        date: dateTime.toISOString(),
        hour: consultHour,
        minute: consultMinute,
        notes: notes || undefined,
        name: name || undefined,
        email: email || undefined,
        user_id: user?.id || undefined,
      };
      const res = await api.consultations.create(payload);
      setSuccess('Consultation request sent. Redirecting to chat…');
      setTimeout(() => {
        setConsultDate(null);
        setSuccess('');
        onClose();
        if (res.data?.chat?.id) {
          navigate(`/chat?chat_id=${res.data.chat.id}`);
        }
      }, 800);
    } catch (err) {
      console.error('consultation error', err);
      setError(err.response?.data?.error || 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const listener = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      // basic tab trap
      if (e.key === 'Tab' && isOpen) {
        const modal = document.getElementById('consultation-modal');
        if (!modal) return;
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    if (isOpen) document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1C1917]/60 backdrop-blur-sm pointer-events-auto"
          onClick={onClose} // clicking overlay closes
        >
          <motion.div
            id="consultation-modal"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="bg-[#F5F2EE] border border-[#EBE5DE] shadow-2xl p-6 w-full max-w-md relative rounded-lg pointer-events-auto"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()} // prevent overlay click
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900">×</button>
            <div className="text-center mb-4">
              <h3 className="font-serif text-2xl text-stone-900 mb-1 italic">Private Consultation</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Select a Date</p>
            </div>

            {error && <div className="mb-4 p-3 bg-stone-50 border-l-2 border-red-900 text-red-900 text-xs">{error}</div>}
            {success && <div className="mb-4 p-3 bg-stone-50 border-l-2 border-green-900 text-green-900 text-xs">{success}</div>}

            <div className="border border-stone-200 p-4 bg-white mb-4">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setConsultMonth(m => m === 0 ? 11 : m - 1)} className="text-stone-400 hover:text-stone-900">←</button>
                <div className="font-serif text-sm text-stone-800">{consultMonths[consultMonth]} <span className="text-stone-400">{consultYear}</span></div>
                <button onClick={() => setConsultMonth(m => m === 11 ? 0 : m + 1)} className="text-stone-400 hover:text-stone-900">→</button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                {['S','M','T','W','T','F','S'].map((d,i) => <div key={`dow-${i}`}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: getStartDay(consultMonth, consultYear) }, (_, i) => <div key={`pad-${i}`} />)}
                {Array.from({ length: getDaysInMonth(consultMonth, consultYear) }, (_, i) => {
                  const d = i + 1;
                  const dateObj = new Date(consultYear, consultMonth, d);
                  const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isSel = consultDate && dateObj.toDateString() === new Date(consultDate).toDateString();
                  return (
                    <button key={d} disabled={isPast} onClick={() => setConsultDate(dateObj)} className={`h-8 w-8 text-xs flex items-center justify-center transition-all duration-200 font-serif ${isSel ? 'bg-[#1C1917] text-[#F5F2EE]' : 'hover:bg-[#F5F2EE] text-stone-600'} ${isPast ? 'opacity-20 cursor-not-allowed' : ''}`}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" className="w-full px-3 py-2 border border-stone-200 rounded bg-white text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="w-full px-3 py-2 border border-stone-200 rounded bg-white text-sm" />
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 block mb-1">Hour</label>
                  <select value={consultHour} onChange={(e) => setConsultHour(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 rounded bg-white text-sm">
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 block mb-1">Minute</label>
                  <select value={consultMinute} onChange={(e) => setConsultMinute(Number(e.target.value))} className="w-full px-3 py-2 border border-stone-200 rounded bg-white text-sm">
                    {[0, 15, 30, 45].map(m => (
                      <option key={m} value={m}>
                        {String(m).padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase tracking-widest text-stone-500 block mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any additional notes or preferences..." className="w-full px-3 py-2 border border-stone-200 rounded bg-white text-sm h-20 resize-none" />
              </div>
            </div>

            <button disabled={!consultDate || isLoading} onClick={handleConfirm} className={`w-full py-3 uppercase text-xs tracking-widest font-bold rounded ${!consultDate ? 'opacity-50 cursor-not-allowed bg-transparent border border-stone-200 text-stone-400' : 'bg-[#1C1917] text-[#F5F2EE]'}`}>
              {isLoading ? 'Sending…' : 'Confirm Appointment'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
