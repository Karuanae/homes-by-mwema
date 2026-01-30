import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoSend, IoHomeOutline, IoChatbubblesOutline, IoChevronBack } from "react-icons/io5";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Chat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) fetchChats();
  }, [user]);

  useEffect(() => {
    if (activeChat) fetchMessages(activeChat.id);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">Opening Concierge</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ee] pt-6 pb-12 px-4 md:px-8">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-40 overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-200 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-stone-200 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="bg-white/70 backdrop-blur-xl rounded-sm shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white h-[85vh] flex overflow-hidden">
          
          {/* SIDEBAR */}
          <motion.div 
            animate={{ width: isSidebarOpen ? "350px" : "80px" }}
            className="border-r border-stone-100 flex flex-col bg-white/50 relative"
          >
            <div className="p-6 border-b border-stone-100 flex items-center justify-between">
              {isSidebarOpen && (
                <h2 className="font-serif text-2xl text-stone-900">Messages</h2>
              )}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <IoChatbubblesOutline className="text-stone-400" size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {chats.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">No Conversations</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full p-6 text-left transition-all border-b border-stone-50 flex items-center gap-4 ${
                      activeChat?.id === chat.id ? "bg-white shadow-sm" : "hover:bg-white/40"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      activeChat?.id === chat.id ? "bg-stone-900 border-stone-900" : "bg-white border-stone-200"
                    }`}>
                      <IoHomeOutline className={activeChat?.id === chat.id ? "text-white" : "text-stone-400"} size={20} />
                    </div>
                    {isSidebarOpen && (
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className="font-medium text-stone-900 text-sm truncate uppercase tracking-tight">
                            Residence {chat.property_id || "Direct"}
                          </h4>
                          <span className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">
                            {formatTime(chat.last_message_time)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate font-light italic">
                          {chat.last_message || "Awaiting your inquiry..."}
                        </p>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>

          {/* MAIN CHAT */}
          <div className="flex-1 flex flex-col bg-white/30">
            {activeChat ? (
              <>
                {/* Header */}
                <div className="px-8 py-5 border-b border-stone-100 bg-white/80 backdrop-blur-md flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-stone-400 mb-0.5">Concierge Service</h3>
                      <p className="font-serif text-xl text-stone-900 italic">Residence Inquiry #{activeChat.property_id}</p>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-stone-50/30">
                  {messages.map((msg, idx) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? "text-right" : "text-left"}`}>
                          {!isOwn && (
                            <p className="text-[9px] uppercase tracking-widest font-bold text-stone-400 mb-2 ml-1">
                              {msg.is_host ? "Host Concierge" : msg.sender_name}
                            </p>
                          )}
                          <div className={`px-6 py-4 rounded-sm text-sm leading-relaxed shadow-sm ${
                            isOwn 
                              ? "bg-stone-900 text-[#f5f2ee]" 
                              : "bg-white text-stone-800 border border-stone-100"
                          }`}>
                            {msg.content}
                          </div>
                          <p className="text-[9px] mt-2 text-stone-400 font-medium tracking-tighter uppercase">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-stone-100">
                  <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask us anything..."
                      className="w-full bg-stone-50 border-none px-6 py-4 rounded-sm text-sm focus:ring-1 focus:ring-stone-200 transition-all placeholder:text-stone-400 placeholder:italic font-light"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="absolute right-3 p-3 bg-stone-900 text-white rounded-sm hover:bg-stone-800 transition-all disabled:opacity-20 flex items-center gap-2"
                    >
                      <IoSend size={16} />
                    </button>
                  </form>
                  <p className="text-center text-[9px] text-stone-400 uppercase tracking-widest mt-4 font-bold">
                    Typically replies in under 15 minutes
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-12">
                <div>
                  <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <IoChatbubblesOutline className="text-stone-300" size={40} />
                  </div>
                  <h3 className="font-serif text-2xl text-stone-900 mb-2">Select a Residence</h3>
                  <p className="text-stone-500 font-light text-sm max-w-xs mx-auto">
                    Choose a conversation on the left to speak with our concierge team.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}