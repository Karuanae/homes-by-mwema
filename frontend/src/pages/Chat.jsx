import { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { 
  IoSend, IoHomeOutline, IoChatbubblesOutline, 
  IoChevronBack, IoCheckmark, IoCheckmarkDone,
  IoRefreshOutline
} from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('list'); // 'list' or 'chat'
  const [touchStart, setTouchStart] = useState(null);
  
  const messagesEndRef = useRef(null);
  const listRef = useRef(null);

  // ── Data Fetching ──────────────────────────────────────────
  useEffect(() => {
    if (user?.id) fetchChats();
  }, [user]);

  useEffect(() => {
    const target = searchParams.get('chat_id');
    if (target && chats.length > 0) {
      const found = chats.find(c => String(c.id) === target);
      if (found) {
        setActiveChat(found);
        setView('chat');
      }
    }
  }, [searchParams, chats]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
      setView('chat');
    }
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ── API Calls ──────────────────────────────────────────────
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.chats.getUserChats(user.id);
      setChats(response.data);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await api.chats.getMessages(chatId);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const tempId = Date.now();
    const optimisticMessage = {
      id: tempId,
      content: newMessage,
      sender_id: user.id,
      sender_name: user.name || user.email,
      is_host: false,
      timestamp: new Date().toISOString(),
      is_read: false,
      is_temp: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage("");
    scrollToBottom();

    try {
      const response = await api.chats.sendMessage(activeChat.id, {
        content: newMessage,
        sender_id: user.id,
        sender_name: user.name || user.email,
        is_host: false,
      });

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...response.data, is_temp: false } : msg
      ));
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats();
    if (activeChat) await fetchMessages(activeChat.id);
    setRefreshing(false);
  };

  // ── Touch/Swipe Handlers ───────────────────────────────────
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || view !== 'chat') return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart;
    
    if (diff > 50) { // Swipe right to go back
      setView('list');
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // ── UI Helpers ─────────────────────────────────────────────
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
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
      return "";
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

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] pt-6 px-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Header Skeleton */}
          <div className="h-10 w-40 bg-stone-200 animate-pulse rounded mb-6"></div>
          
          {/* Chat List Skeletons */}
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg flex items-center gap-3">
                <div className="w-12 h-12 bg-stone-200 animate-pulse rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-stone-200 animate-pulse rounded w-32 mb-2"></div>
                  <div className="h-3 bg-stone-200 animate-pulse rounded w-48"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Chat List View ─────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#f5f2ee] pt-6 pb-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Header with Refresh */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-serif text-stone-900">Messages</h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-stone-200 rounded-full transition-colors touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <IoRefreshOutline className={`text-xl text-stone-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Chat List */}
          <div className="space-y-2" ref={listRef}>
            {chats.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IoChatbubblesOutline className="text-3xl text-stone-400" />
                </div>
                <h3 className="font-serif text-lg text-stone-700 mb-2">No conversations yet</h3>
                <p className="text-stone-500 text-sm">Start by inquiring about a property</p>
              </div>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat);
                    setView('chat');
                  }}
                  className="w-full bg-white p-4 rounded-lg flex items-center gap-4 hover:bg-stone-50 transition-colors touch-manipulation"
                  style={{ minHeight: '72px' }}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-stone-800 text-white flex items-center justify-center flex-shrink-0">
                    <IoHomeOutline className="text-lg" />
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-medium text-stone-900 truncate">
                        Residence {chat.property_id || "Support"}
                      </h4>
                      <span className="text-[10px] text-stone-400 whitespace-nowrap ml-2">
                        {formatTime(chat.last_message_time)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 truncate text-left">
                      {chat.last_message || "No messages yet"}
                    </p>
                  </div>

                  {/* Unread Badge */}
                  {chat.unread_count > 0 && (
                    <div className="w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-white font-bold">{chat.unread_count}</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Chat Detail View ───────────────────────────────────────
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div 
      className="min-h-screen bg-[#f5f2ee] flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => setView('list')}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors touch-manipulation"
          style={{ minHeight: '44px', minWidth: '44px' }}
          aria-label="Back to chats"
        >
          <IoChevronBack className="text-xl" />
        </button>
        <div className="flex-1">
          <h2 className="font-serif text-lg text-stone-900">
            Residence {activeChat?.property_id || "Support"}
          </h2>
          <p className="text-xs text-stone-500">Typically replies in minutes</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
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
                const isOwn = msg.sender_id === user.id;
                const showAvatar = shouldShowAvatar(dateMessages, idx);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                  >
                    {/* Avatar for others */}
                    {!isOwn && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0 mb-1">
                        {msg.is_host && (
                          <div className="w-full h-full rounded-full bg-stone-700 flex items-center justify-center text-white text-xs">
                            H
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
                        }`}
                      >
                        <p className="text-sm leading-relaxed pr-16">{msg.content}</p>
                        
                        {/* Timestamp & Status Inside Bubble */}
                        <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] ${
                          isOwn ? 'text-stone-300' : 'text-stone-400'
                        }`}>
                          <span>{formatTime(msg.timestamp)}</span>
                          {isOwn && (
                            <span className="flex items-center">
                              {msg.is_temp ? (
                                <span className="text-xs">⏳</span>
                              ) : msg.is_read ? (
                                <IoCheckmarkDone className="text-sm text-blue-400" />
                              ) : (
                                <IoCheckmark className="text-sm" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Spacer for own messages to align right */}
                    {isOwn && <div className="w-8 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 px-4 py-3 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-stone-50 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-[#1C2321] text-white p-3 rounded-full hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <IoSend className="text-lg" />
          </button>
        </form>
      </div>
    </div>
  );
}