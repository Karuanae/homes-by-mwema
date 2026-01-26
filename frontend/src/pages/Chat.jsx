import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaPaperPlane, FaUser, FaHome } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Fetch user's chats on mount
  useEffect(() => {
    if (user?.id) {
      fetchChats();
    }
  }, [user]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.chats.getUserChats(user.id);
      setChats(response.data);
      if (response.data.length > 0 && !activeChat) {
        setActiveChat(response.data[0]);
      }
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

    try {
      const response = await api.chats.sendMessage(activeChat.id, {
        content: newMessage,
        sender_id: user.id,
        sender_name: user.name || user.email,
        is_host: false,
      });

      setMessages([...messages, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center pt-20">
        <div className="text-teal-600 text-xl">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ height: "calc(100vh - 160px)" }}>
          <div className="grid grid-cols-12 h-full">
            
            {/* Sidebar - Chat List */}
            <div className="col-span-12 md:col-span-4 border-r border-gray-200 flex flex-col">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-600 to-teal-700">
                <h2 className="text-2xl font-serif text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Messages
                </h2>
                <p className="text-teal-100 text-sm mt-1">Your conversations</p>
              </div>

              <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FaHome className="text-4xl mx-auto mb-4 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start by booking a property</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      whileHover={{ backgroundColor: "#f0fdfa" }}
                      onClick={() => setActiveChat(chat)}
                      className={`p-4 cursor-pointer border-b border-gray-100 transition-colors ${
                        activeChat?.id === chat.id ? "bg-teal-50 border-l-4 border-l-teal-600" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                          <FaHome className="text-white text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            Property #{chat.property_id || "General"}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">
                            {chat.last_message || "No messages yet"}
                          </p>
                          {chat.last_message_time && (
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(chat.last_message_time)}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="col-span-12 md:col-span-8 flex flex-col">
              {activeChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                        <FaHome className="text-white text-lg" />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-gray-900">
                          Property #{activeChat.property_id || "General"}
                        </h3>
                        <p className="text-sm text-gray-500">Active conversation</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwnMessage = message.sender_id === user.id;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                                  isOwnMessage
                                    ? "bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-br-none"
                                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                                }`}
                              >
                                {!isOwnMessage && (
                                  <p className="text-xs font-semibold mb-1 text-teal-600">
                                    {message.is_host ? "Host" : message.sender_name}
                                  </p>
                                )}
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <p
                                  className={`text-xs mt-2 ${
                                    isOwnMessage ? "text-teal-100" : "text-gray-400"
                                  }`}
                                >
                                  {formatTime(message.timestamp)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-full hover:from-teal-700 hover:to-teal-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FaPaperPlane />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FaUser className="text-6xl mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}