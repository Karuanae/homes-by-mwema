// src/components/Chat/ChatList.jsx - FOR ADMIN DASHBOARD
import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { 
  FaComments, FaUser, FaBuilding, FaClock, 
  FaBell, FaCheck, FaCheckDouble, FaSync 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatList({ currentUser, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChats, setActiveChats] = useState([]);
  const [error, setError] = useState(null);

  // ── Initialization ────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    loadChats();
    setupSocket();

    return () => {
      socketService.off('chat_notification', handleChatNotification);
      socketService.off('active_chats', handleActiveChats);
      socketService.off('new_message', handleNewMessage);
    };
  }, [currentUser]);

  // ── Socket Setup ──────────────────────────────────────────
  const setupSocket = () => {
    if (!socketService.isConnected) {
      socketService.connect();
    }
    
    socketService.authenticate(currentUser.id, 'admin');
    
    // Listen for real-time updates
    socketService.on('chat_notification', handleChatNotification);
    socketService.on('active_chats', handleActiveChats);
    socketService.on('new_message', handleNewMessage);

    // Request active chats
    socketService.getActiveChats();
  };

  // ── Data Fetching ─────────────────────────────────────────
  const loadChats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.chats.getAll();
      const chatData = response.data || [];
      setChats(chatData);
      
      // Calculate total unread
      const totalUnread = chatData.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading chats:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    socketService.getActiveChats();
    setRefreshing(false);
  };

  // ── Socket Handlers ───────────────────────────────────────
  const handleChatNotification = (notification) => {
    console.log('🔔 New chat notification:', notification);
    
    // Refresh chats list
    loadChats();
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('New Message', {
        body: `${notification.user_name}: ${notification.message_preview}`,
        icon: '/favicon.ico'
      });
    }
  };

  const handleActiveChats = (data) => {
    setActiveChats(data.chats || []);
  };

  const handleNewMessage = (message) => {
    // Update last message for the affected chat
    setChats(prev => prev.map(chat => 
      chat.id === message.chat_id 
        ? { 
            ...chat, 
            last_message: message.content,
            last_message_time: message.timestamp,
            unread_count: (chat.unread_count || 0) + 1
          }
        : chat
    ));
  };

  // ── UI Helpers ────────────────────────────────────────────
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getStatusColor = (chat) => {
    if (chat.unread_count > 0) return 'bg-[#D4AF37]';
    return 'bg-stone-300';
  };

  // ── Request Notification Permission ───────────────────────
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
        {/* Header Skeleton */}
        <div className="bg-[#1C2321] p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-stone-700 animate-pulse rounded-lg"></div>
            <div>
              <div className="h-5 bg-stone-700 animate-pulse rounded w-32 mb-2"></div>
              <div className="h-3 bg-stone-700 animate-pulse rounded w-24"></div>
            </div>
          </div>
        </div>

        {/* List Skeletons */}
        <div className="divide-y divide-stone-100">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-stone-200 animate-pulse rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-stone-200 animate-pulse rounded w-32 mb-2"></div>
                  <div className="h-3 bg-stone-200 animate-pulse rounded w-48"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white border border-stone-100 rounded-lg p-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="font-serif text-lg text-stone-900 mb-2">Failed to load chats</h3>
        <p className="text-stone-500 text-sm mb-6">{error}</p>
        <button
          onClick={loadChats}
          className="px-6 py-2 bg-[#1C2321] text-white rounded-lg text-sm hover:bg-stone-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────
  return (
    <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#1C2321] text-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FaComments className="text-[#D4AF37] text-xl" />
            <div>
              <h3 className="font-serif text-xl">Concierge Desk</h3>
              <p className="text-stone-400 text-xs uppercase tracking-widest">
                Live Client Support
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Unread Badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative"
                >
                  <FaBell className="text-[#D4AF37] text-lg" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-stone-400 hover:text-white transition-colors touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <FaSync className={`text-lg ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      {chats.length === 0 ? (
        <div className="p-16 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-sm mx-auto"
          >
            <div className="text-5xl text-stone-200 mb-4">💬</div>
            <h4 className="font-serif text-stone-400 text-lg mb-2">No Active Conversations</h4>
            <p className="text-stone-400 text-sm">
              Client inquiries will appear here in real-time. Be ready to assist.
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="divide-y divide-stone-100">
          <AnimatePresence>
            {chats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectChat(chat)}
                className="p-6 hover:bg-[#F9F8F6] cursor-pointer transition-all group touch-manipulation"
                style={{ minHeight: '88px' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar with Status */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center text-lg">
                        {getInitials(chat.user_name)}
                      </div>
                      <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(chat)}`} />
                      
                      {/* Unread Badge on Avatar */}
                      <AnimatePresence>
                        {chat.unread_count > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -bottom-1 -right-1 bg-[#D4AF37] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"
                          >
                            {chat.unread_count}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-serif text-lg text-[#1C2321] truncate">
                          {chat.user_name || `Client ${chat.user_id}`}
                        </h4>
                        <span className="text-xs text-stone-400 whitespace-nowrap ml-2">
                          {formatTime(chat.last_message_time)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-stone-500 truncate max-w-md mb-1">
                        {chat.last_message || 'No messages yet'}
                      </p>
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs">
                        {chat.property_id && (
                          <span className="flex items-center gap-1 text-stone-400">
                            <FaBuilding className="text-xs" />
                            <span>Property #{chat.property_id}</span>
                          </span>
                        )}
                        
                        {/* Read Status for Last Message */}
                        {chat.last_message && (
                          <span className="flex items-center gap-1 text-stone-400">
                            {chat.unread_count > 0 ? (
                              <>
                                <FaCheck className="text-xs" />
                                <span>Sent</span>
                              </>
                            ) : (
                              <>
                                <FaCheckDouble className="text-xs text-blue-400" />
                                <span>Read</span>
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow Indicator (Desktop) */}
                  <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    <span className="text-xs font-serif italic text-stone-400">
                      Open →
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Footer Stats */}
      <div className="bg-stone-50 p-4 border-t border-stone-100">
        <div className="flex justify-between items-center text-sm">
          <span className="font-serif text-stone-600">
            {chats.length} conversation{chats.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-stone-500">
              <FaCheck className="text-xs" /> Sent
            </span>
            <span className="flex items-center gap-2 text-blue-500">
              <FaCheckDouble className="text-xs" /> Read
            </span>
            <span className={unreadCount > 0 ? 'text-[#D4AF37] font-medium' : 'text-stone-400'}>
              {unreadCount} unread
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}