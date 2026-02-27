// src/components/Chat/ChatWindow.jsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useRef } from 'react';
import socketService from '../../services/socketService';
import api from '../../services/api';
import { FaPaperPlane, FaTimes, FaUser, FaCrown, FaCheckDouble, FaSpinner } from 'react-icons/fa';

export default function ChatWindow({ chatId, currentUser, onClose, propertyName = '' }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Debug logging
  useEffect(() => {
    console.log('💬 ChatWindow Mounted:', {
      chatId,
      currentUserId: currentUser?.id,
      messagesCount: messages.length,
      socketConnected: socketService.isConnected
    });
  }, []);

  useEffect(() => {
    if (!chatId || !currentUser) {
      console.error('❌ Missing chatId or currentUser');
      return;
    }

    console.log('🔌 Initializing chat:', chatId);

    // Load existing messages from REST API
    loadMessages();
    
    // Connect to socket if not already connected
    if (!socketService.isConnected) {
      console.log('🔄 Connecting socket...');
      socketService.connect();
    }
    
    // Authenticate with socket
    socketService.authenticate(currentUser.id, currentUser.role || 'user');
    
    // Join chat room
    console.log('🎯 Joining chat room:', chatId);
    socketService.joinChat(chatId);

    // Subscribe to socket events
    socketService.on('new_message', handleNewMessage);
    socketService.on('user_typing', handleUserTyping);
    socketService.on('joined_chat', handleJoinedChat);
    socketService.on('messages_read', handleMessagesRead);
    socketService.on('chat_notification', handleChatNotification);

    // Set up typing indicator debounce
    return () => {
      console.log('🧹 Cleaning up chat:', chatId);
      
      // Clean up socket listeners
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('joined_chat', handleJoinedChat);
      socketService.off('messages_read', handleMessagesRead);
      socketService.off('chat_notification', handleChatNotification);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Leave chat room
      socketService.leaveChat(chatId);
    };
  }, [chatId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug effect to log message changes
  useEffect(() => {
    console.log('📊 Messages updated:', messages.length, 'messages');
    if (messages.length > 0) {
      console.log('Latest message:', messages[messages.length - 1]);
    }
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      console.log('📥 Loading messages for chat:', chatId);
      
      // Load chat history from REST API
      const response = await api.chats.getMessages(chatId);
      const messagesData = response.data || [];
      
      console.log('📨 API messages response:', messagesData);
      
      // Ensure all messages have required fields
      const formattedMessages = messagesData.map(msg => ({
        id: msg.id || `msg_${Date.now()}_${Math.random()}`,
        content: msg.content || msg.message || '',
        sender_id: msg.sender_id || msg.user_id,
        sender_name: msg.sender_name || msg.user_name || 'User',
        is_host: msg.is_host || (msg.sender_type === 'admin') || false,
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString(),
        is_read: msg.is_read || false,
        chat_id: msg.chat_id || chatId
      }));
      
      console.log('✅ Formatted messages:', formattedMessages);
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
      
      // Mark messages as read
      try {
        await api.chats.markRead(chatId);
        console.log('✅ Messages marked as read');
      } catch (readError) {
        console.warn('Could not mark messages as read:', readError);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // Fallback to empty messages
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (socketMessage) => {
    console.log('📩 RAW socket new_message:', socketMessage);
    
    // Transform socket message to match your message format
    const newMessageObj = {
      id: socketMessage.message_id || socketMessage.id || `socket_${Date.now()}_${Math.random()}`,
      content: socketMessage.content || socketMessage.message || socketMessage.message_preview || '',
      sender_id: socketMessage.sender_id || socketMessage.user_id,
      sender_name: socketMessage.sender_name || socketMessage.user_name || 'User',
      is_host: socketMessage.is_host || (socketMessage.sender_type === 'admin') || false,
      timestamp: socketMessage.timestamp || socketMessage.created_at || new Date().toISOString(),
      is_read: socketMessage.is_read || false,
      chat_id: socketMessage.chat_id || chatId
    };
    
    console.log('📨 Transformed new message:', newMessageObj);
    
    // Check if this message belongs to current chat
    const isSameChat = newMessageObj.chat_id === chatId || 
                      newMessageObj.chat_id?.toString() === chatId?.toString();
    
    if (isSameChat) {
      setMessages(prev => {
        // Prevent duplicates by checking ID and timestamp
        const isDuplicate = prev.some(msg => 
          msg.id === newMessageObj.id || 
          (msg.content === newMessageObj.content && 
           msg.timestamp === newMessageObj.timestamp &&
           msg.sender_id === newMessageObj.sender_id)
        );
        
        if (!isDuplicate) {
          console.log('✅ Adding new message to state');
          return [...prev, newMessageObj];
        } else {
          console.log('⚠️  Duplicate message detected, skipping');
          return prev;
        }
      });
      
      setOtherUserTyping(false);
      
      // If it's not our own message, mark as read
      if (newMessageObj.sender_id !== currentUser.id) {
        setTimeout(() => {
          markMessageAsRead(newMessageObj.id);
        }, 500);
      }
      
      // Notify parent components if needed
      socketService.emit('message_received', { chatId, messageId: newMessageObj.id });
    } else {
      console.log('⚠️  Message for different chat, ignoring');
    }
  };

  const handleUserTyping = (data) => {
    console.log('✍️  User typing event:', data);
    
    // Only show typing indicator for other users
    if (data.user_id !== currentUser.id && data.chat_id === chatId) {
      setOtherUserTyping(data.is_typing);
      
      // Auto-hide typing indicator after 2 seconds
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setOtherUserTyping(false);
      }, 2000);
    }
  };

  const handleJoinedChat = (data) => {
    console.log('✅ Successfully joined chat:', data);
  };

  const handleMessagesRead = (data) => {
    console.log('📖 Messages read event:', data);
    
    if (data.chat_id === chatId) {
      // Update read status for messages sent by the other user
      setMessages(prev => prev.map(msg => ({
        ...msg,
        is_read: msg.sender_id !== currentUser.id ? true : msg.is_read
      })));
    }
  };

  const handleChatNotification = (notification) => {
    console.log('🔔 Chat notification:', notification);
    // This might be for other chats, but we can check
    if (notification.chat_id === chatId) {
      console.log('📬 Notification for current chat');
    }
  };

  const sendMessage = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent || sending) return;
    
    setSending(true);
    
    try {
      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        id: `temp_${Date.now()}_${Math.random()}`,
        content: messageContent,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        is_host: currentUser.role === 'admin',
        timestamp: new Date().toISOString(),
        is_read: false,
        chat_id: chatId,
        is_temp: true
      };
      
      console.log('📤 Sending message:', optimisticMessage);
      
      // Add to UI immediately
      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');
      scrollToBottom();
      
      // Stop typing indicator
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.typing(chatId, false);
      
      // ONLY send via REST API - it will broadcast via socket to other clients
      // This prevents duplicate messages (before we were sending both ways)
      const response = await api.chats.sendMessage(chatId, {
        message: messageContent,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        is_host: currentUser.role === 'admin'
      });
      
      console.log('✅ Message sent successfully:', response.data);
      
      // Update the temporary message with the real ID and mark as confirmed
      if (response.data?.id) {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? { ...msg, id: response.data.id, is_temp: false } : msg
        ));
      } else {
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? { ...msg, is_temp: false } : msg
        ));
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      
      // Show error to user
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      socketService.typing(chatId, typing);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto-stop typing after 2 seconds
      if (typing) {
        typingTimeoutRef.current = setTimeout(() => {
          handleTyping(false);
        }, 2000);
      }
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
      
      // Notify server via socket
      socketService.markMessagesRead(chatId);
    } catch (error) {
      console.warn('Could not mark message as read:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
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
        return date.toLocaleDateString();
      }
    } catch (e) {
      return '';
    }
  };

  const isAdmin = currentUser.role === 'admin';

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full bg-[#F9F8F6] border border-stone-200 font-sans shadow-xl">
      {/* Header - Matches your admin dashboard style */}
      <div className="bg-[#1C2321] text-[#E5E5E0] p-6 flex items-center justify-between border-b border-stone-700">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center">
            {isAdmin ? (
              <FaCrown className="text-[#D4AF37] text-lg" />
            ) : (
              <FaUser className="text-stone-400 text-lg" />
            )}
          </div>
          <div>
            <h3 className="font-serif text-lg text-white">
              {isAdmin ? (chatInfo?.user_name || 'Client') : 'Concierge Support'}
            </h3>
            {propertyName && (
              <p className="text-xs text-stone-400 font-serif italic">{propertyName}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${socketService.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-[10px] text-stone-500 uppercase tracking-widest">
                {otherUserTyping ? 'Typing...' : (socketService.isConnected ? 'Online' : 'Offline')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={loadMessages}
            className="text-xs text-stone-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white text-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="font-serif text-stone-400 italic text-sm">Loading conversation...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-5xl text-stone-200 mb-4">💬</div>
              <h3 className="font-serif text-stone-600 text-lg mb-2">Start the Conversation</h3>
              <p className="text-stone-400 font-light">
                {isAdmin 
                  ? 'Welcome the client and ask how you can assist them today.'
                  : 'Ask our concierge about availability, amenities, or any special requests.'}
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-6">
                <div className="text-xs text-stone-400 bg-white px-4 py-1 rounded-full border border-stone-200">
                  {date}
                </div>
              </div>
              
              {/* Messages for this date */}
              {dateMessages.map((msg, index) => {
                const isOwnMessage = msg.sender_id === currentUser.id;
                const isAdminMessage = msg.is_host;
                const showSender = index === 0 || dateMessages[index - 1]?.sender_id !== msg.sender_id;
                
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 animate-fade-in`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 shadow-sm transition-all duration-300 ${
                        msg.is_temp ? 'opacity-70' : 'opacity-100'
                      } ${
                        isOwnMessage
                          ? 'bg-[#1C2321] text-white rounded-br-none'
                          : isAdminMessage
                          ? 'bg-[#F0F0EC] text-stone-800 border-l-4 border-[#D4AF37] rounded-bl-none'
                          : 'bg-stone-100 text-stone-800 rounded-bl-none'
                      }`}
                    >
                      {showSender && !isOwnMessage && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-stone-600">
                            {msg.sender_name}
                          </span>
                          {isAdminMessage && (
                            <span className="text-[10px] bg-[#D4AF37] text-white px-2 py-0.5 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm leading-relaxed font-light">{msg.content}</div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-400">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.is_temp && (
                            <FaSpinner className="text-xs text-stone-400 animate-spin" />
                          )}
                        </div>
                        {isOwnMessage && (
                          <FaCheckDouble className={`text-xs ${msg.is_read ? 'text-blue-400' : 'text-stone-400'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-stone-100 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-200"></div>
                </div>
                <span className="text-xs text-stone-500 ml-2">Typing...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-stone-200 bg-white">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              onBlur={() => handleTyping(false)}
              placeholder={isAdmin ? "Type your response..." : "Type your message..."}
              className="w-full border border-stone-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-stone-600 font-serif placeholder-stone-400 bg-stone-50"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
                newMessage.trim() && !sending
                  ? 'bg-[#1C2321] text-white hover:bg-stone-900'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {sending ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-stone-400 mt-2 text-center uppercase tracking-widest">
          Press Enter to send • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}