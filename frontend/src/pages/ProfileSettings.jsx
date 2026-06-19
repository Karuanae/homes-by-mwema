import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  FaUser, FaEnvelope, FaPhone, FaLock, FaSave,
  FaArrowLeft, FaCheckCircle, FaExclamationTriangle,
  FaEye, FaEyeSlash, FaSpinner, FaTrash
} from 'react-icons/fa';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { user, logout, refreshUserFromStorage } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Messages
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });

  // Load profile data
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.user.getProfile();
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setProfileMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const response = await api.user.updateProfile(profile);
      await refreshUserFromStorage(); // Update auth context
      setProfileMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      setProfileMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    setChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      await api.user.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordMessage({ 
        type: 'success', 
        text: 'Password changed successfully!' 
      });
      
      // Clear form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setPasswordMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to change password' 
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const password = formData.get('delete_password');
    
    if (!password) {
      setDeleteMessage({ type: 'error', text: 'Password is required' });
      return;
    }
    
    setDeleting(true);
    setDeleteMessage({ type: '', text: '' });

    try {
      await api.user.deleteAccount({ password });
      
      setDeleteMessage({ type: 'success', text: 'Account deleted. Redirecting...' });
      
      // Logout and redirect after 2 seconds
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
      
    } catch (error) {
      setDeleteMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to delete account' 
      });
      setDeleting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-stone-200 border-t-[#093A3E] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-widest text-stone-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] py-8 px-4 md:py-12 md:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-stone-200 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-stone-600" />
          </button>
          <h1 className="text-2xl md:text-3xl font-serif text-stone-900">Profile Settings</h1>
        </div>

        <div className="space-y-6">
          
          {/* Profile Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="bg-[#093A3E] px-6 py-4">
              <h2 className="text-white font-serif text-lg flex items-center gap-2">
                <FaUser className="text-[#ED9B40]" />
                Personal Information.
              </h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type="email"
                    id="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type="tel"
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    placeholder="+254759170780"
                  />
                </div>
              </div>

              {/* Profile message */}
              <AnimatePresence>
                {profileMessage.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      profileMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {profileMessage.type === 'success' ? (
                      <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    ) : (
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                    )}
                    {profileMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-8 py-3 bg-[#093A3E] text-white rounded-lg hover:bg-[#0a4a52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Change Password Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="bg-[#093A3E] px-6 py-4">
              <h2 className="text-white font-serif text-lg flex items-center gap-2">
                <FaLock className="text-[#ED9B40]" />
                Change Password
              </h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
              
              {/* Current Password */}
              <div>
                <label htmlFor="current_password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="current_password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new_password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="new_password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm_password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 border border-stone-200 rounded-lg bg-stone-50 focus:outline-none focus:border-stone-400 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Password message */}
              <AnimatePresence>
                {passwordMessage.text && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      passwordMessage.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {passwordMessage.type === 'success' ? (
                      <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    ) : (
                      <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                    )}
                    {passwordMessage.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Change password button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full md:w-auto px-8 py-3 bg-[#093A3E] text-white rounded-lg hover:bg-[#0a4a52] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Delete Account Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-red-200 rounded-xl shadow-sm overflow-hidden"
          >
            <div className="bg-red-600 px-6 py-4">
              <h2 className="text-white font-serif text-lg flex items-center gap-2">
                <FaTrash />
                Delete Account
              </h2>
            </div>
            
            <div className="p-6">
              {!showDeleteConfirm ? (
                <div className="space-y-4">
                  <p className="text-stone-600 text-sm">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    Delete Account
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  <p className="text-stone-700 font-medium">Are you absolutely sure?</p>
                  <p className="text-stone-500 text-sm">
                    This will permanently delete your account and all your bookings, messages, and personal data.
                  </p>
                  
                  {/* Password confirmation */}
                  <div>
                    <label htmlFor="delete_password" className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                      Confirm your password
                    </label>
                    <input
                      type="password"
                      name="delete_password"
                      id="delete_password"
                      className="w-full px-4 py-3 border border-red-200 rounded-lg bg-red-50 focus:outline-none focus:border-red-400 text-sm"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  {/* Delete message */}
                  <AnimatePresence>
                    {deleteMessage.text && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                          deleteMessage.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {deleteMessage.type === 'success' ? (
                          <FaCheckCircle className="text-green-600 flex-shrink-0" />
                        ) : (
                          <FaExclamationTriangle className="text-red-600 flex-shrink-0" />
                        )}
                        {deleteMessage.text}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleting}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {deleting ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete My Account'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}