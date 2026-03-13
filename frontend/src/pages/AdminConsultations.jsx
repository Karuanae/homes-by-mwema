// components/admin/AdminConsultations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaEnvelope,
  FaPhone, FaTrash, FaEye, FaSync, FaSearch, FaCalendarCheck,
  FaClipboardList, FaTimes, FaEnvelopeOpen, FaBan,
  FaChevronDown, FaChevronUp, FaExternalLinkAlt,
} from 'react-icons/fa';
import api from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDate(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  return isNaN(d) ? raw : `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtTime(hour, minute) {
  if (hour == null) return 'TBD';
  const h = Number(hour);
  const m = String(minute || 0).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${m} ${period}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { cls: 'text-amber-700 bg-amber-50 border-amber-200',   icon: FaHourglassHalf, label: 'Pending'   },
  confirmed: { cls: 'text-green-700 bg-green-50 border-green-200',   icon: FaCheckCircle,   label: 'Confirmed' },
  cancelled: { cls: 'text-red-600 bg-red-50 border-red-200',         icon: FaTimesCircle,   label: 'Cancelled' },
  completed: { cls: 'text-stone-600 bg-stone-50 border-stone-200',   icon: FaCheckCircle,   label: 'Completed' },
  rejected:  { cls: 'text-red-800 bg-red-100 border-red-300',        icon: FaBan,           label: 'Rejected'  },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 border rounded-full font-semibold ${s.cls}`}>
      <Icon className="text-[9px]" /> {s.label}
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
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
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
            Cancel
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

// ─── Email compose modal ──────────────────────────────────────────────────────
function EmailModal({ consult, onSend, onClose, sending }) {
  const clientName  = consult.name  || consult.user_name  || 'Valued Client';
  const clientEmail = consult.email || consult.user_email || '';
  const dateStr = fmtDate(consult.date);
  const timeStr = fmtTime(consult.hour, consult.minute);

  const [subject,     setSubject]     = useState(`Your Consultation is Confirmed – ${dateStr}`);
  const [body,        setBody]        = useState(
`Dear ${clientName},

We are pleased to confirm your private consultation with Homes by Mwema.

📅 Date: ${dateStr}
⏰ Time: ${timeStr}
💰 Consultation Fee: KSh 20,000

Please ensure payment is made before your session. Our team will reach out with payment details shortly.

If you have any questions or need to reschedule, please don't hesitate to contact us.

We look forward to speaking with you.

Warm regards,
The Homes by Mwema Team
homesbymwema@gmail.com`
  );
  const [meetingLink, setMeetingLink] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.97, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.97, y: 12 }}
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1C2321] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <FaEnvelope className="text-[#D4AF37] text-sm" />
            </div>
            <div>
              <p className="font-medium text-sm">Confirm & Notify Client</p>
              <p className="text-[10px] text-stone-400">To: {clientEmail || 'No email on file'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-1">
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div className="p-5 space-y-4">
            {/* To (read-only) */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 block mb-1.5">To</label>
              <div className="px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-600">
                {clientName} {clientEmail && <span className="text-stone-400">&lt;{clientEmail}&gt;</span>}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 block mb-1.5">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:border-stone-400 focus:outline-none"
              />
            </div>

            {/* Meeting link */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 block mb-1.5">
                Meeting Link <span className="normal-case text-stone-300">(optional)</span>
              </label>
              <div className="relative">
                <FaExternalLinkAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-[10px]" />
                <input
                  value={meetingLink}
                  onChange={e => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full pl-8 pr-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:border-stone-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-stone-400 block mb-1.5">Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm font-mono text-stone-700 leading-relaxed focus:border-stone-400 focus:outline-none resize-none"
                rows={12}
              />
              <p className="text-[10px] text-stone-300 mt-1">Edit the message above before sending.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 flex gap-3 bg-stone-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 text-stone-600 text-xs uppercase tracking-widest rounded-lg hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend({ subject, body, meeting_link: meetingLink || undefined })}
            disabled={sending || !clientEmail}
            className="flex-1 py-2.5 bg-green-700 text-white text-xs uppercase tracking-widest rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
              : <><FaEnvelope /> Confirm & Send</>
            }
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Detail / action modal ────────────────────────────────────────────────────
function DetailModal({ consult, onClose, onAction, updating, onOpenEmail }) {
  const [showNotes,    setShowNotes]    = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // { action, title, message }
  const [confirming,   setConfirming]   = useState(false);

  const canConfirm  = !['confirmed','completed','cancelled','rejected'].includes(consult.status);
  const canComplete = consult.status === 'confirmed';
  const canCancel   = !['cancelled','completed','rejected'].includes(consult.status);
  const canReject   = !['rejected','completed','cancelled'].includes(consult.status);
  const canDelete   = ['completed','cancelled','rejected'].includes(consult.status);

  const barColor =
    consult.status === 'confirmed' ? 'bg-green-500' :
    consult.status === 'completed' ? 'bg-stone-400' :
    ['cancelled','rejected'].includes(consult.status) ? 'bg-red-400' :
    'bg-amber-400';

  const triggerAction = (action) => {
    const labels = {
      cancelled: { title: 'Cancel this consultation?',   message: 'The client will not be automatically notified unless you send an email.' },
      rejected:  { title: 'Reject this consultation?',   message: 'The client will not be automatically notified unless you send a rejection email.' },
      delete:    { title: 'Delete this record?',         message: 'This permanently removes the consultation. This cannot be undone.' },
      completed: { title: 'Mark as completed?',          message: 'This will mark the consultation as done.' },
    };
    setConfirmModal({ action, ...(labels[action] || { title: 'Confirm action', message: '' }) });
  };

  const handleConfirmed = async () => {
    if (!confirmModal) return;
    setConfirming(true);
    await onAction(consult.id, confirmModal.action);
    setConfirming(false);
    setConfirmModal(null);
    if (confirmModal.action === 'delete') onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.96, y: 16 }}
          className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Status accent bar */}
          <div className={`h-1 w-full ${barColor}`} />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                  Consultation #{consult.id}
                </p>
                <StatusBadge status={consult.status} />
              </div>
              <button onClick={onClose} className="text-stone-300 hover:text-stone-600 p-1 -mt-1 -mr-1">
                <FaTimes size={16} />
              </button>
            </div>

            {/* Client */}
            <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-3">Client</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1C2321] text-white flex items-center justify-center font-serif text-sm flex-shrink-0">
                  {(consult.name || consult.user_name || consult.user_email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900 truncate">
                    {consult.name || consult.user_name || <span className="italic text-stone-400">No name</span>}
                  </p>
                  {(consult.email || consult.user_email) && (
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5 truncate">
                      <FaEnvelopeOpen className="text-[9px] flex-shrink-0" />
                      {consult.email || consult.user_email}
                    </p>
                  )}
                  {(consult.phone || consult.user_phone) && (
                    <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                      <FaPhone className="text-[9px]" />
                      {consult.phone || consult.user_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Topic */}
            {consult.topic && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Topic</p>
                <p className="text-sm text-stone-700">{consult.topic}</p>
              </div>
            )}

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Date</p>
                <p className="font-medium text-stone-800 text-sm">{fmtDate(consult.date)}</p>
              </div>
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Time</p>
                <p className="font-medium text-stone-800 text-sm">{fmtTime(consult.hour, consult.minute)}</p>
              </div>
            </div>

            {/* Fee */}
            <div className="mb-4 bg-stone-50 border border-stone-100 rounded-xl p-3 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-stone-400">Consultation Fee</p>
              <p className="font-bold text-stone-800 text-sm">KSh 20,000</p>
            </div>

            {/* Client notes */}
            {consult.notes && (
              <div className="mb-4">
                <button
                  onClick={() => setShowNotes(v => !v)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400 mb-2 w-full"
                >
                  Client Notes
                  {showNotes ? <FaChevronUp className="text-[8px]" /> : <FaChevronDown className="text-[8px]" />}
                </button>
                <AnimatePresence>
                  {showNotes && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-sm text-stone-600 font-light leading-relaxed border-l-2 border-stone-200 pl-3 overflow-hidden"
                    >
                      {consult.notes}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Admin notes */}
            {consult.admin_notes && (
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Admin Notes</p>
                <p className="text-sm text-stone-600 italic bg-amber-50 border-l-2 border-amber-300 pl-3 py-2 rounded-r-lg">
                  {consult.admin_notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-[10px] text-stone-300 mb-5 space-y-0.5">
              <p>Submitted: {fmtDate(consult.created_at)}</p>
              {consult.confirmed_at && <p className="text-green-500">Confirmed: {fmtDate(consult.confirmed_at)}</p>}
              {consult.completed_at && <p>Completed: {fmtDate(consult.completed_at)}</p>}
              {consult.cancelled_at && <p className="text-red-400">Cancelled/Rejected: {fmtDate(consult.cancelled_at)}</p>}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-stone-100">
              {canConfirm && (
                <button
                  onClick={() => { onClose(); onOpenEmail(consult); }}
                  className="w-full py-3 bg-green-700 hover:bg-green-800 text-white text-xs uppercase tracking-widest rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <FaEnvelope /> Confirm & Send Email
                </button>
              )}

              <div className="flex gap-2">
                {canComplete && (
                  <button
                    onClick={() => triggerAction('completed')}
                    disabled={updating}
                    className="flex-1 py-2.5 bg-stone-700 hover:bg-stone-900 text-white text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                  >
                    {updating ? '…' : 'Mark Complete'}
                  </button>
                )}
                {canReject && (
                  <button
                    onClick={() => triggerAction('rejected')}
                    disabled={updating}
                    className="flex-1 py-2.5 border border-red-200 text-red-600 text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => triggerAction('cancelled')}
                    disabled={updating}
                    className="flex-1 py-2.5 border border-stone-200 text-stone-500 text-xs uppercase tracking-widest rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {canDelete && (
                <button
                  onClick={() => triggerAction('delete')}
                  disabled={updating}
                  className="w-full py-2.5 border border-red-100 text-red-400 text-xs uppercase tracking-widest rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaTrash className="text-[10px]" /> Delete Record
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Nested confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            confirmLabel={confirmModal.action === 'delete' ? 'Yes, Delete' : 'Yes, Confirm'}
            confirmClass={
              confirmModal.action === 'delete' ? 'bg-red-500 hover:bg-red-600' :
              confirmModal.action === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
              'bg-stone-800 hover:bg-stone-900'
            }
            onConfirm={handleConfirmed}
            onClose={() => setConfirmModal(null)}
            loading={confirming}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Row card (mobile-friendly) ───────────────────────────────────────────────
function ConsultRow({ consult, onView, onQuickAction, updating }) {
  const canConfirm  = !['confirmed','completed','cancelled','rejected'].includes(consult.status);
  const canComplete = consult.status === 'confirmed';
  const canDelete   = ['completed','cancelled','rejected'].includes(consult.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-xl p-4 hover:border-stone-200 transition-all shadow-sm cursor-pointer"
      onClick={() => onView(consult)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#1C2321] text-white flex items-center justify-center text-sm font-serif flex-shrink-0">
            {(consult.name || consult.user_name || consult.user_email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-stone-900 text-sm truncate">
              {consult.name || consult.user_name || <span className="italic text-stone-400 font-normal">No name</span>}
            </p>
            <p className="text-xs text-stone-400 truncate">{consult.email || consult.user_email || '—'}</p>
          </div>
        </div>
        <StatusBadge status={consult.status} />
      </div>

      {/* Date / time */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-stone-50">
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <FaCalendarCheck className="text-stone-300 text-[10px]" />
          {fmtDate(consult.date)}
        </div>
        <div className="text-xs text-stone-400">{fmtTime(consult.hour, consult.minute)}</div>
        {consult.topic && (
          <div className="ml-auto text-[10px] text-stone-300 truncate max-w-[120px]">{consult.topic}</div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-50" onClick={e => e.stopPropagation()}>
        {canConfirm && (
          <button
            onClick={() => onQuickAction(consult, 'email')}
            disabled={updating}
            className="flex-1 py-2 bg-green-700 text-white text-[10px] uppercase tracking-widest rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95"
          >
            <FaEnvelope className="text-[9px]" /> Confirm
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => onQuickAction(consult, 'completed')}
            disabled={updating}
            className="flex-1 py-2 bg-stone-700 text-white text-[10px] uppercase tracking-widest rounded-lg hover:bg-stone-900 transition-colors disabled:opacity-50 active:scale-95"
          >
            {updating ? '…' : 'Complete'}
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onQuickAction(consult, 'delete')}
            disabled={updating}
            className="px-3 py-2 border border-red-100 text-red-400 text-[10px] rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 active:scale-95"
          >
            <FaTrash className="text-[9px]" />
          </button>
        )}
        <button
          onClick={() => onView(consult)}
          className="px-3 py-2 border border-stone-100 text-stone-400 text-[10px] rounded-lg hover:bg-stone-50 transition-colors"
        >
          <FaEye className="text-[9px]" />
        </button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AdminConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [updatingId,    setUpdatingId]    = useState(null);
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState('all');
  const [selected,      setSelected]      = useState(null);
  const [emailTarget,   setEmailTarget]   = useState(null);
  const [sendingEmail,  setSendingEmail]  = useState(false);
  const [toast,         setToast]         = useState(null);
  const [deleteTarget,  setDeleteTarget]  = useState(null); // row-level delete confirm
  const [deleting,      setDeleting]      = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.consultations.adminList();
      setConsultations(res.data || []);
    } catch {
      setError('Failed to load consultations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConsultations(); }, [fetchConsultations]);

  // ── Generic status / delete handler ───────────────────────────────────────
  const handleAction = async (id, action) => {
    if (action === 'delete') {
      setUpdatingId(id);
      try {
        await api.consultations.delete(id);
        setConsultations(prev => prev.filter(c => c.id !== id));
        setSelected(null);
        showToast('Consultation deleted.');
      } catch (e) {
        showToast(e.response?.data?.error || 'Delete failed.', 'error');
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    setUpdatingId(id);
    try {
      await api.consultations.updateStatus(id, { status: action });
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: action } : c));
      if (selected?.id === id) setSelected(prev => ({ ...prev, status: action }));
      showToast(`Consultation marked as ${action}.`);
    } catch (e) {
      showToast(e.response?.data?.error || 'Update failed.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Quick-action from row (opens email modal or triggers action) ───────────
  const handleQuickAction = (consult, action) => {
    if (action === 'email') { setEmailTarget(consult); return; }
    if (action === 'delete') { setDeleteTarget(consult); return; }
    handleAction(consult.id, action);
  };

  // ── Row-level delete confirmed ─────────────────────────────────────────────
  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await handleAction(deleteTarget.id, 'delete');
    setDeleting(false);
    setDeleteTarget(null);
  };

  // ── Email send ─────────────────────────────────────────────────────────────
  const handleSendEmail = async (emailData) => {
    if (!emailTarget) return;
    setSendingEmail(true);
    try {
      await api.consultations.confirmWithEmail(emailTarget.id, emailData);
      setConsultations(prev => prev.map(c => c.id === emailTarget.id ? { ...c, status: 'confirmed' } : c));
      setEmailTarget(null);
      showToast('Confirmed and email sent to client!');
      fetchConsultations();
    } catch (e) {
      showToast(e.response?.data?.error || 'Email sending failed.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Derived counts & visible list ─────────────────────────────────────────
  const counts = consultations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key: 'all',       label: 'All',       count: consultations.length  },
    { key: 'pending',   label: 'Pending',   count: counts.pending   || 0 },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed || 0 },
    { key: 'completed', label: 'Completed', count: counts.completed || 0 },
    { key: 'cancelled', label: 'Cancelled', count: counts.cancelled || 0 },
    { key: 'rejected',  label: 'Rejected',  count: counts.rejected  || 0 },
  ];

  const visible = consultations
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (c.name       || '').toLowerCase().includes(q) ||
        (c.user_name  || '').toLowerCase().includes(q) ||
        (c.email      || '').toLowerCase().includes(q) ||
        (c.user_email || '').toLowerCase().includes(q) ||
        String(c.id).includes(q)
      );
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-700 text-white'
            }`}
          >
            {toast.type === 'error' ? <FaTimesCircle /> : <FaCheckCircle />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Summary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: consultations.length,  accent: 'border-l-stone-300' },
          { label: 'Pending',   value: counts.pending   || 0, accent: 'border-l-amber-400' },
          { label: 'Confirmed', value: counts.confirmed || 0, accent: 'border-l-green-500' },
          { label: 'Completed', value: counts.completed || 0, accent: 'border-l-stone-400' },
        ].map((s, i) => (
          <div key={i} className={`bg-white p-4 border border-stone-100 border-l-4 ${s.accent} rounded-xl shadow-sm`}>
            <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">{s.label}</p>
            <p className="text-3xl font-serif text-[#1C2321]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main panel ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-100 rounded-xl shadow-sm overflow-hidden">
        {/* Panel header */}
        <div className="bg-[#1C2321] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaClipboardList className="text-[#D4AF37]" />
            <div>
              <h3 className="font-serif text-lg">Consultation Requests</h3>
              <p className="text-stone-400 text-[10px] uppercase tracking-widest">{visible.length} shown</p>
            </div>
          </div>
          <button
            onClick={fetchConsultations}
            className="text-stone-400 hover:text-white p-2 transition-colors"
            title="Refresh"
          >
            <FaSync className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="p-4 border-b border-stone-100 space-y-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or ID…"
              className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:border-stone-400 focus:outline-none bg-stone-50"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-full border transition-colors ${
                  filter === f.key
                    ? 'bg-[#1C2321] text-white border-[#1C2321]'
                    : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                }`}
              >
                {f.label}{f.count > 0 && <span className="opacity-60 ml-1">({f.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-4">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-stone-400 text-sm italic font-serif">Loading consultations…</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-red-500 mb-3 text-sm">{error}</p>
              <button
                onClick={fetchConsultations}
                className="text-xs uppercase tracking-widest border-b border-stone-400 text-stone-500 pb-0.5"
              >
                Retry
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <FaCalendarCheck className="text-4xl text-stone-200 mx-auto mb-3" />
              <p className="text-stone-400 italic font-serif text-sm">
                {search ? 'No results match your search.' : 'No consultations yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.map(c => (
                <ConsultRow
                  key={c.id}
                  consult={c}
                  onView={setSelected}
                  onQuickAction={handleQuickAction}
                  updating={updatingId === c.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Detail modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            consult={selected}
            onClose={() => setSelected(null)}
            onAction={async (id, action) => {
              await handleAction(id, action);
              if (action === 'delete') setSelected(null);
            }}
            updating={updatingId === selected.id}
            onOpenEmail={(c) => { setSelected(null); setEmailTarget(c); }}
          />
        )}
      </AnimatePresence>

      {/* ── Email compose modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {emailTarget && (
          <EmailModal
            consult={emailTarget}
            onSend={handleSendEmail}
            onClose={() => setEmailTarget(null)}
            sending={sendingEmail}
          />
        )}
      </AnimatePresence>

      {/* ── Row-level delete confirm modal ─────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmModal
            title="Delete this consultation?"
            message={`This will permanently remove consultation #${deleteTarget.id}. This cannot be undone.`}
            confirmLabel="Yes, Delete"
            confirmClass="bg-red-500 hover:bg-red-600"
            onConfirm={handleDeleteConfirmed}
            onClose={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}