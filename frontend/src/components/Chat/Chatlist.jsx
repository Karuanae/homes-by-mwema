// src/components/Chat/ChatList.jsx - FOR ADMIN DASHBOARD
import React, { useState, useEffect } from 'react';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { FaComments, FaUser, FaBuilding, FaClock, FaBell } from 'react-icons/fa';

export default function ChatList({ currentUser, onSelectChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChats, setActiveChats] = useState([]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') return;

    loadChats();
    
    // Connect socket for admin
    if (!socketService.isConnected) {
      socketService.connect();
    }
    
    socketService.authenticate(currentUser.id, 'admin');
    
    // Listen for real-time updates
    socketService.on('chat_notification', handleChatNotification);
    socketService.on('active_chats', handleActiveChats);
    socketService.on('new_message', handleNewMessage);

    // Request active chats via socket
    socketService.getActiveChats();

    return () => {
      socketService.off('chat_notification', handleChatNotification);
      socketService.off('active_chats', handleActiveChats);
      socketService.off('new_message', handleNewMessage);
    };
  }, [currentUser]);

  const loadChats = async () => {
    setLoading(true);
    try {
      // Load from REST API
      const response = await api.chats.getAll();
      setChats(response.data || []);
      
      // Calculate unread count
      const totalUnread = (response.data || []).reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatNotification = (notification) => {
    console.log('🔔 Chat notification:', notification);
    
    // Update chats list
    loadChats();
    
    // Update unread count
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification (if permitted)
    if (Notification.permission === 'granted') {
      new Notification('New Chat Message', {
        body: `${notification.user_name}: ${notification.message_preview}`,
        icon: '/favicon.ico'
      });
    }
  };

  const handleActiveChats = (data) => {
    setActiveChats(data.chats);
  };

  const handleNewMessage = (message) => {
    // Update last message for the chat
    setChats(prev => prev.map(chat => 
      chat.id === message.chat_id 
        ? { ...chat, last_message: message.content, last_message_time: message.timestamp }
        : chat
    ));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const refreshChats = () => {
    loadChats();
    socketService.getActiveChats();
  };

  return (
    <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#1C2321] text-white p-6 border-b border-stone-700">
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
            {unreadCount > 0 && (
              <div className="relative">
                <FaBell className="text-[#D4AF37] text-lg" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              </div>
            )}
            <button
              onClick={refreshChats}
              className="text-stone-400 hover:text-white text-sm uppercase tracking-widest"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-stone-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="font-serif text-stone-400 italic">Loading conversations...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-5xl text-stone-200 mb-4">💬</div>
            <h4 className="font-serif text-stone-400 text-lg mb-2">No Active Conversations</h4>
            <p className="text-stone-400 text-sm max-w-sm mx-auto">
              Client inquiries will appear here in real-time. Be ready to assist.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="p-6 hover:bg-[#F9F8F6] cursor-pointer transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center">
                      <FaUser className="text-lg" />
                    </div>
                    {chat.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">{chat.unread_count}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif text-lg text-[#1C2321] group-hover:text-stone-800">
                      {chat.user_name || `Client ${chat.user_id}`}
                    </h4>
                    <p className="text-sm text-stone-500 truncate max-w-md">
                      {chat.last_message || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {chat.property_id && (
                        <span className="flex items-center gap-1 text-[10px] text-stone-400 uppercase tracking-widest">
                          <FaBuilding className="text-xs" /> Property Inquiry
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <FaClock className="text-xs" /> {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-serif italic text-stone-400">
                    Open &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-stone-50 p-4 border-t border-stone-100">
        <div className="flex justify-between text-sm text-stone-600">
          <span className="font-serif">
            {chats.length} conversation{chats.length !== 1 ? 's' : ''}
          </span>
          <span className={unreadCount > 0 ? 'text-[#D4AF37] font-medium' : 'text-stone-400'}>
            {unreadCount} unread
          </span>
        </div>
      </div>
    </div>
  );
}