// src/components/Chat/ChatWindow.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useRef } from 'react';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { 
  FaPaperPlane, FaTimes, FaUser, FaCrown, 
  FaCheck, FaCheckDouble, FaSpinner, FaArrowLeft 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ chatId, currentUser, onClose, propertyName = '' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // ── Initialization ────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !currentUser) {
      setError('Missing chat information');
      return;
    }

    initializeChat();

    return () => {
      // Cleanup
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.leaveChat(chatId);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('joined_chat', handleJoinedChat);
      socketService.off('messages_read', handleMessagesRead);
    };
  }, [chatId, currentUser, retryCount]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── Socket Setup ──────────────────────────────────────────
  const initializeChat = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load messages from REST API
      await loadMessages();
      
      // Setup socket connection
      if (!socketService.isConnected) {
        socketService.connect();
      }
      
      socketService.authenticate(currentUser.id, currentUser.role || 'user');
      socketService.joinChat(chatId);

      // Subscribe to events
      socketService.on('new_message', handleNewMessage);
      socketService.on('user_typing', handleUserTyping);
      socketService.on('joined_chat', handleJoinedChat);
      socketService.on('messages_read', handleMessagesRead);

      // Mark messages as read
      try {
        await api.chats.markRead(chatId);
      } catch (readError) {
        console.warn('Could not mark messages as read:', readError);
      }

    } catch (err) {
      console.error('Failed to initialize chat:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await api.chats.getMessages(chatId);
      const messagesData = response.data || [];
      
      // Format messages consistently
      const formattedMessages = messagesData.map(msg => ({
        id: msg.id,
        content: msg.content || msg.message || '',
        sender_id: msg.sender_id || msg.user_id,
        sender_name: msg.sender_name || msg.user_name || 'User',
        is_host: msg.is_host || false,
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
        is_read: msg.is_read || false,
        chat_id: msg.chat_id || chatId
      }));
      
      setMessages(formattedMessages);
      
      // Load chat info
      try {
        const chatsResponse = await api.chats.getUserChats(currentUser.id);
        const chat = Array.isArray(chatsResponse.data) 
          ? chatsResponse.data.find(c => c.id === chatId)
          : null;
        if (chat) {
          setChatInfo(chat);
        }
      } catch (chatInfoError) {
        console.warn('Could not load chat info:', chatInfoError);
      }
      
    } catch (err) {
      console.error('Error loading messages:', err);
      throw err;
    }
  };

  // ── Socket Event Handlers ─────────────────────────────────
  const handleNewMessage = (socketMessage) => {
    const newMessageObj = {
      id: socketMessage.id || `msg_${Date.now()}`,
      content: socketMessage.content || socketMessage.message || '',
      sender_id: socketMessage.sender_id || socketMessage.user_id,
      sender_name: socketMessage.sender_name || socketMessage.user_name || 'User',
      is_host: socketMessage.is_host || false,
      timestamp: socketMessage.timestamp || new Date().toISOString(),
      is_read: socketMessage.is_read || false,
      chat_id: socketMessage.chat_id || chatId
    };

    // Only add if it belongs to this chat
    if (newMessageObj.chat_id === chatId || newMessageObj.chat_id?.toString() === chatId?.toString()) {
      setMessages(prev => {
        // Prevent duplicates
        const isDuplicate = prev.some(msg => 
          msg.id === newMessageObj.id || 
          (msg.content === newMessageObj.content && 
           msg.timestamp === newMessageObj.timestamp &&
           msg.sender_id === newMessageObj.sender_id)
        );
        
        if (!isDuplicate) {
          return [...prev, newMessageObj];
        }
        return prev;
      });
      
      setOtherUserTyping(false);
      
      // If it's not our message, mark as read
      if (newMessageObj.sender_id !== currentUser.id) {
        setTimeout(() => {
          markMessagesAsRead();
        }, 500);
      }
    }
  };

  const handleUserTyping = (data) => {
    if (data.user_id !== currentUser.id && data.chat_id === chatId) {
      setOtherUserTyping(data.is_typing);
      
      // Auto-hide after 2 seconds
      clearTimeout(typingTimeoutRef.current);
      if (data.is_typing) {
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 2000);
      }
    }
  };

  const handleJoinedChat = (data) => {
    console.log('✅ Joined chat:', data);
  };

  const handleMessagesRead = (data) => {
    if (data.chat_id === chatId) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        is_read: msg.sender_id !== currentUser.id ? true : msg.is_read
      })));
    }
  };

  // ── Message Actions ───────────────────────────────────────
  const sendMessage = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent || sending) return;
    
    setSending(true);
    
    // Optimistic message
    const optimisticMessage = {
      id: `temp_${Date.now()}`,
      content: messageContent,
      sender_id: currentUser.id,
      sender_name: currentUser.name || currentUser.email,
      is_host: currentUser.role === 'admin',
      timestamp: new Date().toISOString(),
      is_read: false,
      is_temp: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    scrollToBottom();
    
    // Stop typing indicator
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketService.typing(chatId, false);

    try {
      const response = await api.chats.sendMessage(chatId, {
        message: messageContent,
        sender_id: currentUser.id,
        sender_name: currentUser.name || currentUser.email,
        is_host: currentUser.role === 'admin'
      });
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...response.data, is_temp: false }
          : msg
      ));
      
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.chats.markRead(chatId);
      socketService.markMessagesRead(chatId);
    } catch (err) {
      console.warn('Failed to mark messages as read:', err);
    }
  };

  // ── Typing Handler ────────────────────────────────────────
  const handleTyping = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      socketService.typing(chatId, typing);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop after 2 seconds
      if (typing) {
        typingTimeoutRef.current = setTimeout(() => {
          handleTyping(false);
        }, 2000);
      }
    }
  };

  // ── UI Helpers ────────────────────────────────────────────
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(msg => {
      const date = formatDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const shouldShowAvatar = (messages, index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    const currMsg = messages[index];
    return prevMsg.sender_id !== currMsg.sender_id;
  };

  // ── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header Skeleton */}
        <div className="bg-[#1C2321] p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-700 animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-stone-700 animate-pulse rounded w-32 mb-2"></div>
            <div className="h-3 bg-stone-700 animate-pulse rounded w-24"></div>
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`w-2/3 h-16 ${i % 2 === 0 ? 'bg-stone-800' : 'bg-stone-200'} animate-pulse rounded-2xl`}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ───────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="font-serif text-lg text-stone-900 mb-2">Something went wrong</h3>
          <p className="text-stone-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => setRetryCount(prev => prev + 1)}
            className="px-6 py-2 bg-[#1C2321] text-white rounded-lg text-sm hover:bg-stone-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main Render ───────────────────────────────────────────
  const groupedMessages = groupMessagesByDate(messages);
  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-[#1C2321] text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onClose}
          className="md:hidden p-2 hover:bg-stone-700 rounded-full transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <FaArrowLeft className="text-lg" />
        </button>
        
        <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center flex-shrink-0">
          {isAdmin ? (
            <FaCrown className="text-[#D4AF37] text-lg" />
          ) : (
            <FaUser className="text-stone-400 text-lg" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg truncate">
            {isAdmin ? (chatInfo?.user_name || 'Client') : 'Concierge Support'}
          </h3>
          {propertyName && (
            <p className="text-xs text-stone-400 truncate">{propertyName}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${socketService.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-[10px] text-stone-400">
              {otherUserTyping ? 'Typing...' : (socketService.isConnected ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-stone-50">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex justify-center mb-4">
              <span className="text-xs bg-white px-3 py-1 rounded-full text-stone-500 shadow-sm">
                {date}
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {dateMessages.map((msg, idx) => {
                const isOwn = msg.sender_id === currentUser.id;
                const showAvatar = shouldShowAvatar(dateMessages, idx);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {/* Avatar for others */}
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 mb-1 overflow-hidden">
                        {msg.is_host ? (
                          <div className="w-full h-full bg-stone-700 flex items-center justify-center text-white text-xs">
                            H
                          </div>
                        ) : (
                          <div className="w-full h-full bg-stone-400 flex items-center justify-center text-white text-xs">
                            {msg.sender_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                    )}
                    {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[75%] group ${
                        isOwn ? 'order-2' : 'order-1'
                      }`}
                    >
                      {/* Sender Name (only first message in group) */}
                      {!isOwn && showAvatar && (
                        <p className="text-xs text-stone-500 mb-1 ml-2">
                          {msg.is_host ? 'Host' : msg.sender_name}
                        </p>
                      )}

                      <div
                        className={`relative px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-[#1C2321] text-white rounded-br-none'
                            : 'bg-white text-stone-900 rounded-bl-none shadow-sm'
                        } ${msg.is_temp ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm leading-relaxed pr-16">{msg.content}</p>
                        
                        {/* Timestamp & Status Inside Bubble */}
                        <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${
                          isOwn ? 'text-stone-400' : 'text-stone-400'
                        }`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isOwn && (
                            <span className="flex items-center">
                              {msg.is_temp ? (
                                <FaSpinner className="text-xs animate-spin" />
                              ) : msg.is_read ? (
                                <FaCheckDouble className="text-sm text-blue-400" />
                              ) : (
                                <FaCheck className="text-sm" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spacer for own messages */}
                    {isOwn && <div className="w-8 flex-shrink-0" />}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        <AnimatePresence>
          {otherUserTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start items-end gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 mb-1"></div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (e.target.value && !isTyping) {
                handleTyping(true);
              }
              if (!e.target.value && isTyping) {
                handleTyping(false);
              }
            }}
            onBlur={() => handleTyping(false)}
            placeholder={isAdmin ? "Type your response..." : "Type a message..."}
            className="flex-1 bg-stone-50 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
            style={{ minHeight: '44px' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="bg-[#1C2321] text-white p-3 rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            {sending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
          </button>
        </div>
        <p className="text-center text-[9px] text-stone-400 uppercase tracking-widest mt-3">
          End-to-end encrypted • Typically replies in minutes
        </p>
      </div>
    </div>
  );
}