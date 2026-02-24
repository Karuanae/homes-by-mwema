// src/services/socketService.js - COMPLETE SOCKET SERVICE FOR YOUR UI
import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectionAttempts = 0;
    this.maxReconnectionAttempts = 5;
    this.listeners = new Map();
    this.user = null;
    
    // Auto-reconnect settings
    this.reconnectInterval = 2000; // 2 seconds
    this.heartbeatInterval = null;
  }

  // Initialize connection
connect() {
  if (this.socket?.connected) {
    console.log('🔌 Socket already connected');
    return;
  }

  // Hardcoded production URL
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://flask-app-production-c760.up.railway.app';

  console.log(`🔌 Connecting to production Socket.IO: ${SOCKET_URL}`);

  this.socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000,
    path: '/socket.io/',
    secure: true,
  });

  this.setupEventListeners();
}

  // Setup all event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ SocketIO connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectionAttempts = 0;
      this.emit('socket_connected', { socketId: this.socket.id });
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Re-authenticate if user was previously logged in
      if (this.user) {
        this.authenticate(this.user.id, this.user.role || 'user');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ SocketIO disconnected:', reason);
      this.isConnected = false;
      this.emit('socket_disconnected', { reason });
      this.stopHeartbeat();
      
      // Attempt reconnection
      if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
        setTimeout(() => {
          this.reconnectionAttempts++;
          console.log(`🔄 Reconnection attempt ${this.reconnectionAttempts}/${this.maxReconnectionAttempts}`);
          this.socket.connect();
        }, this.reconnectInterval);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ SocketIO connection error:', error.message);
      this.emit('socket_error', { error: error.message });
    });

    // Chat events
    this.socket.on('connected', (data) => {
      console.log('🔌 Socket connected event:', data);
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
      console.log('📨 New message received:', message);
      this.emit('new_message', message);
    });

    this.socket.on('user_typing', (data) => {
      console.log('✍️  User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('chat_notification', (notification) => {
      console.log('🔔 Chat notification:', notification);
      this.emit('chat_notification', notification);
    });

    this.socket.on('joined_chat', (data) => {
      console.log('✅ Joined chat:', data);
      this.emit('joined_chat', data);
    });

    this.socket.on('chat_created', (data) => {
      console.log('💬 Chat created:', data);
      this.emit('chat_created', data);
    });

    this.socket.on('chat_exists', (data) => {
      console.log('ℹ️  Chat exists:', data);
      this.emit('chat_exists', data);
    });

    this.socket.on('active_chats', (data) => {
      console.log('📋 Active chats:', data.count);
      this.emit('active_chats', data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('📖 Messages read:', data);
      this.emit('messages_read', data);
    });

    this.socket.on('heartbeat_ack', (data) => {
      // console.log('💓 Heartbeat acknowledged:', data);
      this.emit('heartbeat', data);
    });

    this.socket.on('error', (data) => {
      console.error('❌ Socket error:', data);
      this.emit('socket_error', data);
    });

    this.socket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
      this.emit('pong', data);
    });
  }

  // Authentication
  authenticate(userId, userType = 'user') {
    this.user = { id: userId, role: userType };
    
    if (!this.isConnected) {
      console.log('⚠️  Not connected, storing credentials for later authentication');
      return;
    }

    console.log(`👤 Authenticating as ${userType}: ${userId}`);
    this.socket.emit('authenticate', {
      user_id: userId,
      user_type: userType
    });
  }

  // Chat operations
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
      return;
    }

    console.log(`📤 Sending message to chat ${chatId}:`, content.substring(0, 50) + '...');
    this.socket.emit('send_message', {
      chat_id: chatId,
      content: content,
      sender_name: senderName
    });
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

  // Heartbeat for connection health
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('heartbeat');
      }
    }, 30000); // Every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Test ping
  ping() {
    if (!this.isConnected) {
      console.error('❌ Cannot ping: Not connected');
      return;
    }

    this.socket.emit('ping');
  }

  // Disconnect
  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.user = null;
    console.log('👋 Socket disconnected');
  }

  // Event subscription system
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

  // Utility methods
  getSocketId() {
    return this.socket?.id || null;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.getSocketId(),
      user: this.user
    };
  }
}

// Create singleton instance
const socketService = new SocketService();

// Auto-connect when imported (optional)
if (typeof window !== 'undefined') {
  // Connect on client-side only
  socketService.connect();
}

export default socketService;