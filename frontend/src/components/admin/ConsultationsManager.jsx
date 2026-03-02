import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaEye,
  FaPaperPlane,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaVideo,
  FaStickyNote,
  FaChevronDown,
  FaChevronUp,
  FaSync,
  FaExclamationTriangle,
  FaClipboardCheck,
  FaCalendarCheck,
  FaUndo
} from 'react-icons/fa';

// Status badge component
const StatusBadge = ({ status }) => {
  const config = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending', icon: <FaHourglassHalf /> },
    confirmed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Confirmed', icon: <FaCheckCircle /> },
    completed: { bg: 'bg-stone-100', text: 'text-stone-600', label: 'Completed', icon: <FaCheckCircle /> },
    cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: 'Cancelled', icon: <FaTimesCircle /> },
    rejected: { bg: 'bg-red-100', text: 'text-red-600', label: 'Rejected', icon: <FaExclamationTriangle /> }
  };
  
  const { bg, text, label, icon } = config[status] || config.pending;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {icon} {label}
    </span>
  );
};

// Email Editor Modal
const EmailEditorModal = ({ consultation, onClose, onSend }) => {
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Generate default email content
    const date = new Date(consultation.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const time = `${String(consultation.hour).padStart(2, '0')}:${String(consultation.minute).padStart(2, '0')}`;
    
    setEmailSubject(`Consultation Confirmed - Homes by Mwema`);
    setEmailContent(`
Dear ${consultation.name || consultation.user?.name || 'Valued Client'},

We are pleased to confirm your consultation with Homes by Mwema.

📅 Date: ${formattedDate}
⏰ Time: ${time}
📝 Topic: ${consultation.topic || 'General Consultation'}

Meeting Link: [INSERT MEETING LINK HERE]

Please join the meeting at the scheduled time using the link above. If you need to reschedule or have any questions, please reply to this email.

We look forward to speaking with you!

Best regards,
The Homes by Mwema Team
    `.trim());
  }, [consultation]);

  const handleSend = () => {
    onSend({
      subject: emailSubject,
      content: emailContent,
      meeting_link: meetingLink,
      admin_notes: adminNotes
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-[#C1A173] w-full" />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-serif text-[#1C1917] mb-1">Confirm Consultation</h2>
              <p className="text-sm text-stone-500">Review and send confirmation email</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <FaTimesCircle size={20} />
            </button>
          </div>

          {/* Client Info Summary */}
          <div className="bg-stone-50 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Client</p>
              <p className="font-medium text-[#1C1917]">{consultation.name || consultation.user?.name}</p>
              <p className="text-xs text-stone-500">{consultation.email || consultation.user?.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Date</p>
              <p className="text-sm">{new Date(consultation.date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Time</p>
              <p className="text-sm">{String(consultation.hour).padStart(2, '0')}:{String(consultation.minute).padStart(2, '0')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1">Topic</p>
              <p className="text-sm">{consultation.topic || 'General'}</p>
            </div>
          </div>

          {/* Email Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Meeting Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Email Content
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Private Admin Notes (not sent to client)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes about this consultation..."
                className="w-full px-4 py-3 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-stone-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-stone-500 hover:text-stone-700 transition-colors uppercase tracking-widest text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!meetingLink || isSending}
              className="px-8 py-3 bg-[#C1A173] text-white hover:bg-[#a8895e] transition-colors uppercase tracking-widest text-xs font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <FaSync className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Send & Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Consultation Detail Modal
const ConsultationDetailModal = ({ consultation, onClose, onUpdate }) => {
  const [adminNotes, setAdminNotes] = useState(consultation.admin_notes || '');
  const [meetingLink, setMeetingLink] = useState(consultation.meeting_link || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await api.consultations.updateStatus(consultation.id, {
        status: consultation.status,
        admin_notes: adminNotes,
        meeting_link: meetingLink
      });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update consultation:', error);
      alert('Failed to update consultation');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1 bg-[#C1A173] w-full" />
        
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-serif text-[#1C1917] mb-1">Consultation Details</h2>
              <p className="text-sm text-stone-500">Request #{consultation.id}</p>
            </div>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
              <FaTimesCircle size={20} />
            </button>
          </div>

          {/* Status */}
          <div className="mb-6">
            <StatusBadge status={consultation.status} />
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-stone-50 p-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Client</p>
              <p className="font-medium">{consultation.name || consultation.user?.name}</p>
              <p className="text-sm text-stone-600 mt-1 flex items-center gap-2">
                <FaEnvelope size={12} /> {consultation.email || consultation.user?.email}
              </p>
              {(consultation.phone || consultation.user?.phone) && (
                <p className="text-sm text-stone-600 mt-1 flex items-center gap-2">
                  <FaPhone size={12} /> {consultation.phone || consultation.user?.phone}
                </p>
              )}
            </div>

            <div className="bg-stone-50 p-4">
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">Schedule</p>
              <p className="text-sm flex items-center gap-2 mb-1">
                <FaCalendarAlt size={12} /> {new Date(consultation.date).toLocaleDateString()}
              </p>
              <p className="text-sm flex items-center gap-2">
                <FaClock size={12} /> {String(consultation.hour).padStart(2, '0')}:{String(consultation.minute).padStart(2, '0')}
              </p>
            </div>
          </div>

          {/* Topic & Notes */}
          {consultation.topic && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Topic</p>
              <p className="text-stone-700 bg-stone-50 p-3">{consultation.topic}</p>
            </div>
          )}

          {consultation.notes && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">Client Notes</p>
              <p className="text-stone-600 italic bg-stone-50 p-3">{consultation.notes}</p>
            </div>
          )}

          {/* Admin editable fields */}
          <div className="mt-6 pt-6 border-t border-stone-200">
            <h3 className="font-serif text-lg mb-4">Admin Actions</h3>
            
            {consultation.status === 'confirmed' && (
              <div className="mb-4">
                <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                Private Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
                placeholder="Add private notes about this consultation..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-6 py-2 bg-[#1C1917] text-white hover:bg-[#2C3632] transition-colors text-xs uppercase tracking-widest disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Consultation'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-6 pt-6 border-t border-stone-200 text-xs text-stone-400">
            <p>Created: {new Date(consultation.created_at).toLocaleString()}</p>
            {consultation.confirmed_at && <p>Confirmed: {new Date(consultation.confirmed_at).toLocaleString()}</p>}
            {consultation.completed_at && <p>Completed: {new Date(consultation.completed_at).toLocaleString()}</p>}
            {consultation.cancelled_at && <p>Cancelled: {new Date(consultation.cancelled_at).toLocaleString()}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Consultations Manager Component
export default function ConsultationsManager() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [stats, setStats] = useState({
    total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, rejected: 0
  });

  useEffect(() => {
    fetchConsultations();
    fetchStats();
  }, []);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);
      
      const response = await api.consultations.adminList(params.toString());
      setConsultations(response.data || []);
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError('Failed to load consultations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.consultations.getStats();
      setStats(response.data.stats || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusChange = async (id, newStatus, emailData = null) => {
    setUpdatingId(id);
    try {
      if (newStatus === 'confirmed' && emailData) {
        await api.consultations.confirmWithEmail(id, {
          status: newStatus,
          meeting_link: emailData.meeting_link,
          admin_notes: emailData.admin_notes,
          email_sent: true,
          email_content: emailData.content
        });
      } else {
        await api.consultations.updateStatus(id, { status: newStatus });
      }
      
      await fetchConsultations();
      await fetchStats();
      setShowEmailModal(false);
      setSelectedConsultation(null);
    } catch (err) {
      console.error('Error updating consultation:', err);
      alert('Failed to update consultation status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this consultation?')) return;
    
    try {
      await api.consultations.delete(id);
      await fetchConsultations();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting consultation:', err);
      alert('Failed to delete consultation');
    }
  };

  const handleBulkDelete = async (status) => {
    if (!window.confirm(`Are you sure you want to delete all ${status} consultations?`)) return;
    
    try {
      await api.consultations.bulkDelete({ status });
      await fetchConsultations();
      await fetchStats();
    } catch (err) {
      console.error('Error bulk deleting consultations:', err);
      alert('Failed to delete consultations');
    }
  };

  const filters = [
    { key: 'all', label: 'All', count: stats.total, icon: <FaClipboardCheck /> },
    { key: 'pending', label: 'Pending', count: stats.pending, icon: <FaHourglassHalf />, color: 'amber' },
    { key: 'confirmed', label: 'Confirmed', count: stats.confirmed, icon: <FaCheckCircle />, color: 'green' },
    { key: 'completed', label: 'Completed', count: stats.completed, icon: <FaCheckCircle />, color: 'stone' },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, icon: <FaTimesCircle />, color: 'red' },
    { key: 'rejected', label: 'Rejected', count: stats.rejected, icon: <FaExclamationTriangle />, color: 'red' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {filters.map((f) => (
          <div
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`bg-white p-4 border-l-4 cursor-pointer transition-all hover:shadow-md ${
              filter === f.key ? `border-${f.color || 'stone'}-500` : 'border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-${f.color || 'stone'}-500`}>{f.icon}</span>
              <span className="text-xs text-stone-400">{f.key !== 'all' && f.count}</span>
            </div>
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">{f.label}</p>
            <p className="text-2xl font-serif text-[#1C1917]">{f.count}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border border-stone-200">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-stone-200">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="w-full pl-10 pr-4 py-2 border border-stone-200 focus:border-[#C1A173] focus:outline-none"
              />
            </div>
            <button
              onClick={fetchConsultations}
              className="p-2 text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-400 transition-colors"
              title="Refresh"
            >
              <FaSync className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <select
              onChange={(e) => e.target.value && handleBulkDelete(e.target.value)}
              className="px-3 py-2 border border-stone-200 text-sm focus:outline-none focus:border-[#C1A173]"
              defaultValue=""
            >
              <option value="" disabled>Bulk Delete</option>
              <option value="completed">Delete Completed</option>
              <option value="cancelled">Delete Cancelled</option>
              <option value="rejected">Delete Rejected</option>
            </select>
          </div>
        </div>

        {/* Mobile Filter Tabs */}
        <div className="md:hidden p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-min">
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

        {/* Consultations Table */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-stone-500">Loading consultations...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : consultations.length === 0 ? (
          <div className="p-12 text-center">
            <FaCalendarCheck className="text-4xl text-stone-300 mx-auto mb-4" />
            <p className="font-serif text-stone-500">No consultations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">ID</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">Client</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">Date & Time</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">Topic</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">Status</th>
                  <th className="py-4 px-4 text-xs uppercase tracking-widest text-stone-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-4 text-sm text-stone-500">#{c.id}</td>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-[#1C1917]">{c.name || c.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-stone-500">{c.email || c.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm">{new Date(c.date).toLocaleDateString()}</p>
                      <p className="text-xs text-stone-500">
                        {String(c.hour).padStart(2, '0')}:{String(c.minute).padStart(2, '0')}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm truncate max-w-[150px]">{c.topic || 'General'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedConsultation(c)}
                          className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                          title="View Details"
                        >
                          <FaEye size={14} />
                        </button>
                        
                        {c.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedConsultation(c);
                              setShowEmailModal(true);
                            }}
                            disabled={updatingId === c.id}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors"
                            title="Confirm with Email"
                          >
                            <FaPaperPlane size={14} />
                          </button>
                        )}
                        
                        {c.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'completed')}
                            disabled={updatingId === c.id}
                            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
                            title="Mark Completed"
                          >
                            <FaCheckCircle size={14} />
                          </button>
                        )}
                        
                        {!['cancelled', 'completed', 'rejected'].includes(c.status) && (
                          <button
                            onClick={() => handleStatusChange(c.id, 'cancelled')}
                            disabled={updatingId === c.id}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Cancel"
                          >
                            <FaTimesCircle size={14} />
                          </button>
                        )}
                        
                        {['completed', 'cancelled', 'rejected'].includes(c.status) && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={updatingId === c.id}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <FaTrash size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedConsultation && !showEmailModal && (
          <ConsultationDetailModal
            consultation={selectedConsultation}
            onClose={() => setSelectedConsultation(null)}
            onUpdate={fetchConsultations}
          />
        )}

        {showEmailModal && selectedConsultation && (
          <EmailEditorModal
            consultation={selectedConsultation}
            onClose={() => {
              setShowEmailModal(false);
              setSelectedConsultation(null);
            }}
            onSend={(emailData) => handleStatusChange(selectedConsultation.id, 'confirmed', emailData)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}