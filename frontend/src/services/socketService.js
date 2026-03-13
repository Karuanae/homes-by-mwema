// src/services/socketService.js - COMPLETE UPDATED VERSION
import io from 'socket.io-client';
import { SOCKET_URL } from './api';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.listeners = new Map();
    this.user = null;
    this.connectionPromise = null;
    this.heartbeatInterval = null;
    this.pendingMessages = new Map(); // Store callbacks for message confirmations
  }

  // ── Connection Management ─────────────────────────────────
  connect() {
    // If already connected, return
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected');
      return Promise.resolve();
    }

    // If connection is in progress, return that promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    console.log(`🔌 Connecting to Socket.IO: ${SOCKET_URL}`);

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: this.maxReconnectDelay,
        timeout: 20000,
        path: '/socket.io/',
        secure: true,
        autoConnect: true,
        forceNew: false
      });

      this.setupEventListeners(resolve, reject);
    });

    return this.connectionPromise;
  }

  setupEventListeners(resolve, reject) {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('✅ SocketIO connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.connectionPromise = null;
      
      this.emit('socket_connected', { socketId: this.socket.id });
      this.startHeartbeat();
      
      // Re-authenticate if user was previously logged in
      if (this.user) {
        this.authenticate(this.user.id, this.user.role || 'user');
      }
      
      resolve();
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ SocketIO connection error:', error.message);
      this.isConnected = false;
      this.emit('socket_error', { error: error.message });
      
      // Exponential backoff for reconnection attempts
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        reject(new Error('Max reconnection attempts reached'));
        this.connectionPromise = null;
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('❌ SocketIO disconnected:', reason);
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('socket_disconnected', { reason });
      
      // Clear any pending message promises
      this.pendingMessages.forEach((_, msgId) => {
        this.rejectPendingMessage(msgId, 'Connection lost');
      });
    });

    // Reconnection attempts
    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`);
      this.emit('reconnecting', { attempt, max: this.maxReconnectAttempts });
    });

    this.socket.on('reconnect', () => {
      console.log('✅ Socket reconnected');
      this.isConnected = true;
      this.emit('reconnected');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      this.emit('reconnect_error', { error: error.message });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.emit('reconnect_failed');
    });

    // Chat events
    this.socket.on('connected', (data) => {
      this.emit('connected', data);
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('auth_error', (data) => {
      console.error('❌ Authentication error:', data);
      this.emit('auth_error', data);
    });

    this.socket.on('new_message', (message) => {
      this.emit('new_message', message);
      
      // Resolve any pending message promise
      if (message.temp_id) {
        this.resolvePendingMessage(message.temp_id, message);
      }
    });

    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('chat_notification', (notification) => {
      this.emit('chat_notification', notification);
    });

    this.socket.on('joined_chat', (data) => {
      this.emit('joined_chat', data);
    });

    this.socket.on('chat_created', (data) => {
      this.emit('chat_created', data);
    });

    this.socket.on('chat_exists', (data) => {
      this.emit('chat_exists', data);
    });

    this.socket.on('active_chats', (data) => {
      this.emit('active_chats', data);
    });

    this.socket.on('messages_read', (data) => {
      this.emit('messages_read', data);
    });

    this.socket.on('heartbeat_ack', (data) => {
      this.emit('heartbeat', data);
    });

    this.socket.on('error', (data) => {
      console.error('❌ Socket error:', data);
      this.emit('socket_error', data);
    });

    this.socket.on('pong', (data) => {
      this.emit('pong', data);
    });
  }

  // ── Heartbeat (optimized) ────────────────────────────────
  startHeartbeat() {
    this.stopHeartbeat();
    // Less frequent heartbeat to save battery (60 seconds instead of 30)
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('heartbeat');
      }
    }, 60000); // Every 60 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Authentication ────────────────────────────────────────
  authenticate(userId, userType = 'user') {
    this.user = { id: userId, role: userType };
    
    if (!this.isConnected) {
      console.log('⚠️ Not connected, will authenticate on reconnect');
      return;
    }

    console.log(`👤 Authenticating as ${userType}: ${userId}`);
    this.socket.emit('authenticate', {
      user_id: userId,
      user_type: userType
    });
  }

  // ── Message Queue for Reliable Delivery ───────────────────
  sendMessageWithAck(chatId, content, senderName = 'User', tempId = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const messageId = tempId || `msg_${Date.now()}_${Math.random()}`;
      
      // Store the promise callbacks
      this.pendingMessages.set(messageId, { resolve, reject });

      // Set timeout for acknowledgment
      const timeout = setTimeout(() => {
        this.rejectPendingMessage(messageId, 'Message delivery timeout');
      }, 10000);

      // Store timeout with the pending message
      this.pendingMessages.get(messageId).timeout = timeout;

      this.socket.emit('send_message', {
        chat_id: chatId,
        content: content,
        sender_name: senderName,
        temp_id: messageId
      });
    });
  }

  resolvePendingMessage(messageId, data) {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(data);
      this.pendingMessages.delete(messageId);
    }
  }

  rejectPendingMessage(messageId, error) {
    const pending = this.pendingMessages.get(messageId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(error));
      this.pendingMessages.delete(messageId);
    }
  }

  // ── Chat Operations ───────────────────────────────────────
  createChat(userId, propertyId = null, initialMessage = 'Hello, I need assistance.') {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Chat creation timeout'));
      }, 10000);

      const handleChatCreated = (data) => {
        clearTimeout(timeout);
        this.socket.off('chat_created', handleChatCreated);
        this.socket.off('chat_exists', handleChatExists);
        resolve(data);
      };

      const handleChatExists = (data) => {
        clearTimeout(timeout);
        this.socket.off('chat_created', handleChatCreated);
        this.socket.off('chat_exists', handleChatExists);
        resolve(data);
      };

      this.socket.on('chat_created', handleChatCreated);
      this.socket.on('chat_exists', handleChatExists);

      this.socket.emit('create_chat', {
        user_id: userId,
        property_id: propertyId,
        initial_message: initialMessage
      });
    });
  }

  joinChat(chatId) {
    if (!this.isConnected) {
      console.error('❌ Cannot join chat: Not connected');
      return;
    }

    console.log(`💬 Joining chat: ${chatId}`);
    this.socket.emit('join_chat', { chat_id: chatId });
  }

  sendMessage(chatId, content, senderName = 'User') {
    if (!this.isConnected) {
      console.error('❌ Cannot send message: Not connected');
      return Promise.reject(new Error('Not connected'));
    }

    console.log(`📤 Sending message to chat ${chatId}`);
    
    // Use the reliable version with acknowledgment
    return this.sendMessageWithAck(chatId, content, senderName);
  }

  typing(chatId, isTyping) {
    if (!this.isConnected) return;
    
    this.socket.emit('typing', {
      chat_id: chatId,
      is_typing: isTyping
    });
  }

  markMessagesRead(chatId) {
    if (!this.isConnected) return;
    
    this.socket.emit('mark_read', {
      chat_id: chatId
    });
  }

  getActiveChats() {
    if (!this.isConnected) {
      console.error('❌ Cannot get active chats: Not connected');
      return;
    }

    console.log('📋 Requesting active chats...');
    this.socket.emit('get_active_chats', {});
  }

  leaveChat(chatId) {
    if (!this.isConnected) return;
    
    this.socket.emit('leave_chat', {
      chat_id: chatId
    });
  }

  // ── Connection Health ────────────────────────────────────
  ping() {
    if (!this.isConnected) {
      console.error('❌ Cannot ping: Not connected');
      return;
    }

    this.socket.emit('ping');
  }

  // ── Disconnect & Cleanup ─────────────────────────────────
  disconnect() {
    this.stopHeartbeat();
    
    // Reject all pending messages
    this.pendingMessages.forEach((_, msgId) => {
      this.rejectPendingMessage(msgId, 'Socket disconnected');
    });
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.user = null;
    this.connectionPromise = null;
    this.listeners.clear();
    
    console.log('👋 Socket disconnected and cleaned up');
  }

  // ── Event Subscription System ────────────────────────────
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // ── Utility Methods ───────────────────────────────────────
  getSocketId() {
    return this.socket?.id || null;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.getSocketId(),
      user: this.user,
      reconnectAttempts: this.reconnectAttempts,
      pendingMessages: this.pendingMessages.size
    };
  }

  // Check if we're online
  isOnline() {
    return navigator.onLine && this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Auto-connect when imported (only on client-side)
if (typeof window !== 'undefined') {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 Browser online, reconnecting socket...');
    socketService.connect();
  });

  window.addEventListener('offline', () => {
    console.log('🌐 Browser offline');
    // Don't disconnect, let socket handle reconnection
  });

  // Initial connection with slight delay to ensure auth is ready
  setTimeout(() => {
    socketService.connect();
  }, 1000);
}

export default socketService;