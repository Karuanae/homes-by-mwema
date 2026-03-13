// api.js - COMPLETE UPDATED VERSION WITH NEW BOOKING/PAYMENT METHODS
import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app/api';
export const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_URL || (import.meta.env.VITE_API_URL || 'https://flask-app-production-c760.up.railway.app').replace('/api', '');
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://flask-app-production-c760.up.railway.app';

console.log('🚀 PRODUCTION MODE - API URL:', API_BASE_URL);
console.log('🖼️  IMAGE URL:', IMAGE_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // For FormData, let axios set the proper multipart/form-data header automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION API ====================
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  googleAuth: async (credential) => {
    const response = await api.post('/auth/google', { credential });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  guestCheckout: async (guestData) => {
    const response = await api.post('/auth/guest', guestData);
    localStorage.setItem('guest_token', response.data.guest_token);
    localStorage.setItem('guest', JSON.stringify(response.data.guest));
    return response;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest_token');
    localStorage.removeItem('guest');
    localStorage.removeItem('pendingBooking');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  // NEW: Forgot password methods
  forgotPassword: (email) => 
    api.post('/auth/forgot-password', { email }),
    
  verifyResetToken: (token) => 
    api.get(`/auth/verify-reset-token/${token}`),
    
  resetPassword: (token, password) => 
    api.post('/auth/reset-password', { token, password }),
};

// ==================== PROPERTIES API ====================
export const propertiesAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response;
  },

  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response;
  },

  search: async (searchParams) => {
    const response = await api.post('/properties/search', searchParams);
    return response;
  },

  getFeatured: async () => {
    const response = await api.get('/properties/featured');
    return response;
  },

  checkAvailability: async (propertyId, checkIn, checkOut) => {
    const response = await api.post('/bookings/check-availability', {
      property_id: propertyId,
      check_in: checkIn,
      check_out: checkOut
    });
    return response;
  },

  // Admin methods
  create: async (propertyData) => {
    const response = await api.post('/admin/properties', propertyData);
    return response;
  },

  update: async (id, propertyData) => {
    const response = await api.put(`/admin/properties/${id}`, propertyData);
    return response;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/properties/${id}`);
    return response;
  },
};

// ==================== BOOKINGS API - ENHANCED ====================
export const bookingsAPI = {
  // Create a new booking with 15-minute hold
  create: async (bookingData, idempotencyKey = null) => {
    const config = idempotencyKey ? {
      headers: { 'Idempotency-Key': idempotencyKey }
    } : {};
    const response = await api.post('/bookings', bookingData, config);
    return response;
  },

  // Get all bookings for current user
  getUserBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response;
  },

  // Get single booking by ID
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  // Check booking status (for timer)
  getStatus: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}/status`);
    return response;
  },

  // Cancel a booking
  cancel: async (id) => {
    const response = await api.post(`/bookings/${id}/cancel`);
    return response;
  },

  // Admin: Get all bookings
  getAll: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response;
  },

  // Admin: Update booking status
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status });
    return response;
  },

  // Get booking statistics
  getStats: async () => {
    const response = await api.get('/admin/bookings/stats');
    return response;
  }
};

// ==================== PAYMENTS API - ENHANCED ====================
export const paymentsAPI = {
  // M-PESA: Initiate STK Push
  initiateMpesa: async (bookingId, phoneNumber, amount) => {
    const response = await api.post('/payments/mpesa/initiate', {
      booking_id: bookingId,
      phone_number: phoneNumber,
      amount: amount
    });
    return response.data;
  },

  // M-PESA: Check payment status
  checkMpesaStatus: async (checkoutRequestId) => {
    const response = await api.get(`/payments/mpesa/status/${checkoutRequestId}`);
    return response.data;
  },

  // Get all payments for a booking
  getBookingPayments: async (bookingId) => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Process payment (legacy)
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/process', paymentData);
    return response.data;
  },

  // PayPal: Create order
  createPayPalOrder: async (bookingId, amount, currency = 'KES', returnUrl = null, cancelUrl = null) => {
    const response = await api.post('/payments/paypal/create-order', {
      booking_id: bookingId,
      amount: amount,
      currency: currency,
      return_url: returnUrl,
      cancel_url: cancelUrl
    });
    return response.data;
  },

  // PayPal: Capture order
  capturePayPalOrder: async (orderId) => {
    const response = await api.post('/payments/paypal/capture-order', {
      order_id: orderId
    });
    return response.data;
  },

  // Admin: Get all payments
  getAll: async (params = {}) => {
    const response = await api.get('/admin/payments', { params });
    return response;
  },

  // Admin: Update payment status
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/payments/${id}/status`, { status });
    return response;
  },

  // Admin: Export payments
  export: async (format = 'csv') => {
    const response = await api.get(`/admin/payments/export?format=${format}`, {
      responseType: 'blob',
    });
    return response;
  },
};

// ==================== UPLOAD API ====================
export const uploadAPI = {
  createPropertyWithImages: async (formData) => {
    const response = await api.post('/admin/properties/with-images', formData);
    return response;
  },

  addPropertyImages: async (propertyId, formData) => {
    const response = await api.post(`/admin/properties/${propertyId}/images`, formData);
    return response;
  },

  uploadPropertyImageToDB: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/admin/upload/property-image', formData);
    return response;
  },

  uploadPropertyImagesToDB: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    const response = await api.post('/admin/upload/property-images', formData);
    return response;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData);
    return response;
  },

  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`files`, file);
    });
    const response = await api.post('/upload/multiple', formData);
    return response;
  },
};

// ==================== CHATS/MESSAGES API ====================
export const chatsAPI = {
  getUserChats: async (userId) => {
    const response = await api.get(`/chats/user/${userId}`);
    return response;
  },

  getMyChats: async () => {
    const response = await api.get('/chats/my-chats');
    return response;
  },

  getMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response;
  },

  sendMessage: async (chatId, payload) => {
    const response = await api.post(`/chats/${chatId}/messages`, payload);
    return response;
  },

  startChat: async (userId, hostId = null, propertyId = null) => {
    const response = await api.post('/chats', {
      user_id: userId,
      property_id: propertyId,
    });
    return response;
  },

  markRead: async (chatId) => {
    const response = await api.put(`/chats/${chatId}/read`);
    return response;
  },

  getUnreadCount: async (userId) => {
    const response = await api.get(`/chats/unread/${userId}`);
    return response;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/chats', { params });
    return response;
  },
};

// ==================== LEADS API ====================
export const leadsAPI = {
  create: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response;
  },

  getUserLeads: async (userId) => {
    const response = await api.get(`/users/${userId}/leads`);
    return response;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/admin/leads', { params });
    return response;
  },

  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/leads/${id}/status`, { status });
    return response;
  },

  assign: async (id, assignee) => {
    const response = await api.put(`/admin/leads/${id}/assign`, { assignee });
    return response;
  },

  scheduleFollowUp: async (id, date) => {
    const response = await api.put(`/admin/leads/${id}/follow-up`, { date });
    return response;
  },
};

// ==================== HOMEPAGE API ====================
export const homepageAPI = {
  get: async () => {
    const response = await api.get('/homepage');
    return response;
  },

  updateHero: async (images) => {
    const response = await api.put('/admin/homepage/hero', { images });
    return response;
  },

  updateFeatured: async (propertyIds) => {
    const response = await api.put('/admin/homepage/featured', { propertyIds });
    return response;
  },

  updateTestimonials: async (testimonials) => {
    const response = await api.put('/admin/homepage/testimonials', { testimonials });
    return response;
  },

  uploadImages: async (images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    const response = await api.post('/admin/homepage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },
};

// ==================== REPORTS API ====================
export const reportsAPI = {
  getStats: async (period = 'monthly') => {
    const response = await api.get(`/admin/reports/stats?period=${period}`);
    return response;
  },

  getRevenue: async (startDate, endDate) => {
    const response = await api.get('/admin/reports/revenue', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  },

  getOccupancy: async () => {
    const response = await api.get('/admin/reports/occupancy');
    return response;
  },

  getPaymentMethods: async () => {
    const response = await api.get('/admin/reports/payment-methods');
    return response;
  },
};

// ==================== ADMIN API - ENHANCED ====================
export const adminAPI = {
  // Property management
  createPropertyWithImages: async (formData) => {
    const response = await api.post('/admin/properties/with-images', formData);
    return response;
  },

  addPropertyImages: async (propertyId, formData) => {
    const response = await api.post(`/admin/properties/${propertyId}/images`, formData);
    return response;
  },

  // User management
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}/details`);
    return response;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response;
  },

  // Dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response;
  },

  // Properties
  getProperties: async () => {
    const response = await api.get('/admin/properties');
    return response;
  },

  createProperty: async (propertyData) => {
    const response = await api.post('/admin/properties', propertyData);
    return response;
  },

  updateProperty: async (id, propertyData) => {
    const response = await api.put(`/admin/properties/${id}`, propertyData);
    return response;
  },

  deleteProperty: async (id) => {
    const response = await api.delete(`/admin/properties/${id}`);
    return response;
  },

  // Bookings (admin)
  getBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response;
  },

  getBookingDetails: async (id) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response;
  },

  updateBookingStatus: async (id, status) => {
    const response = await api.put(`/admin/bookings/${id}/status`, { status });
    return response;
  },

  // Users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response;
  },

  // Payments (admin)
  getPayments: async () => {
    const response = await api.get('/admin/payments');
    return response;
  },

  getPaymentDetails: async (id) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response;
  },

  // Leads
  getLeads: async () => {
    const response = await api.get('/admin/leads');
    return response;
  },

  // Homepage
  getHomepage: async () => {
    const response = await api.get('/admin/homepage');
    return response;
  },

  // Booking statistics
  getBookingStats: async () => {
    const response = await api.get('/admin/bookings/stats');
    return response;
  },

  // Revenue statistics
  getRevenueStats: async (period = 'month') => {
    const response = await api.get(`/admin/revenue/stats?period=${period}`);
    return response;
  }
};

// ==================== USER PROFILE API ====================
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    // Update localStorage if needed
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/user/change-password', passwordData);
    return response;
  },

  deleteAccount: async (data) => {
    const response = await api.delete('/user/delete-account', { data });
    return response;
  },

  getStats: async () => {
    const response = await api.get('/user/stats');
    return response;
  },

  // Existing methods...
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response;
  },

  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/users/${userId}`, profileData);
    return response;
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await api.put(`/users/${userId}/password`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response;
  },

  getFavorites: async (userId) => {
    const response = await api.get(`/users/${userId}/favorites`);
    return response;
  },

  addFavorite: async (userId, propertyId) => {
    const response = await api.post(`/users/${userId}/favorites`, { property_id: propertyId });
    return response;
  },

  removeFavorite: async (userId, propertyId) => {
    const response = await api.delete(`/users/${userId}/favorites/${propertyId}`);
    return response;
  },
};

// ==================== COMMUNICATIONS API ====================
export const communicationsAPI = {
  sendEmail: async (emailData) => {
    const response = await api.post('/communications/email', emailData);
    return response;
  },

  sendSMS: async (smsData) => {
    const response = await api.post('/communications/sms', smsData);
    return response;
  },

  sendWhatsApp: async (whatsappData) => {
    const response = await api.post('/communications/whatsapp', whatsappData);
    return response;
  },
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  get: async () => {
    const response = await api.get('/admin/settings');
    return response;
  },

  update: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response;
  },

  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response;
  },

  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/admin/notifications/${notificationId}/read`);
    return response;
  },
};

// ==================== CONSULTATIONS API ====================
export const consultationsAPI = {
  // Client endpoints
  create: async (data) => {
    const response = await api.post('/consultations', data);
    return response;
  },
  
  getMyConsultations: async () => {
    const response = await api.get('/consultations/my-consultations');
    return response;
  },
  
  getById: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response;
  },
  
  cancel: async (id) => {
    const response = await api.put(`/consultations/${id}/cancel`);
    return response;
  },
 
  // ── NEW: User deletes their own cancelled/completed consultation ──
  deleteOwn: async (id) => {
    const response = await api.delete(`/consultations/${id}`);
    return response;
  },
  
  // Admin endpoints
  adminList: async (params = '') => {
    const response = await api.get(`/consultations/admin/list?${params}`);
    return response;
  },
  
  adminGet: async (id) => {
    const response = await api.get(`/consultations/admin/${id}`);
    return response;
  },
  
  updateStatus: async (id, data) => {
    const response = await api.put(`/consultations/admin/${id}/status`, data);
    return response;
  },
  
  confirmWithEmail: async (id, data) => {
    const response = await api.post(`/consultations/admin/${id}/confirm-with-email`, data);
    return response;
  },
 
  // ── NEW: Admin reject with optional notification ──
  reject: async (id, data = {}) => {
    const response = await api.post(`/consultations/admin/${id}/reject`, data);
    return response;
  },
  
  getStats: async () => {
    const response = await api.get('/consultations/admin/stats');
    return response;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/consultations/admin/${id}`);
    return response;
  },
  
  bulkDelete: async (data) => {
    const response = await api.post('/consultations/admin/bulk-delete', data);
    return response;
  },
  
  // Legacy
  list: async () => {
    const response = await api.get('/consultations');
    return response;
  },
};

// ==================== MISC API ====================
export const miscAPI = {
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  contact: async (contactData) => {
    const response = await api.post('/contact', contactData);
    return response;
  },

  getFAQs: async () => {
    const response = await api.get('/faqs');
    return response;
  },
};

// ==================== SOCKET API ====================
export const socketAPI = {
  connect: () => socketService?.connect(),
  disconnect: () => socketService?.disconnect(),
  authenticate: (userId, userType) => socketService?.authenticate(userId, userType),
  createChat: (userId, propertyId, initialMessage) =>
    socketService?.createChat(userId, propertyId, initialMessage),
  joinChat: (chatId) => socketService?.joinChat(chatId),
  sendMessage: (chatId, content, senderName) =>
    socketService?.sendMessage(chatId, content, senderName),
  typing: (chatId, isTyping) => socketService?.typing(chatId, isTyping),
  markMessagesRead: (chatId) => socketService?.markMessagesRead(chatId),
  getActiveChats: () => socketService?.getActiveChats(),
  leaveChat: (chatId) => socketService?.leaveChat(chatId),
  ping: () => socketService?.ping(),
  on: (event, callback) => socketService?.on(event, callback),
  off: (event, callback) => socketService?.off(event, callback),
  getStatus: () => socketService?.getConnectionStatus(),
  isConnected: () => socketService?.isConnected,
};

// ==================== HELPER FUNCTIONS ====================
export const isAuthenticated = () => {
  return !!localStorage.getItem('token') || !!localStorage.getItem('guest_token');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  const guest = localStorage.getItem('guest');
  return user ? JSON.parse(user) : (guest ? JSON.parse(guest) : null);
};

export const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('guest_token');
};

export const getPropertyImageUrl = (imageId) => {
  return `${API_BASE_URL}/admin/property-image/${imageId}`;
};

// ==================== M-PESA HELPER FUNCTIONS ====================
export const initiateMpesaPayment = async (bookingId, phoneNumber, amount) => {
  return await paymentsAPI.initiateMpesa(bookingId, phoneNumber, amount);
};

export const checkPaymentStatus = async (checkoutRequestId) => {
  return await paymentsAPI.checkMpesaStatus(checkoutRequestId);
};

export const getBookingPayments = async (bookingId) => {
  return await paymentsAPI.getBookingPayments(bookingId);
};

// ==================== BOOKING HELPER FUNCTIONS ====================
export const generateIdempotencyKey = () => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

export const formatDateForAPI = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// ==================== EXPORT ALL ====================
export default {
  auth: authAPI,
  properties: propertiesAPI,
  bookings: bookingsAPI,
  payments: paymentsAPI,
  chats: chatsAPI,
  leads: leadsAPI,
  homepage: homepageAPI,
  reports: reportsAPI,
  admin: adminAPI,
  user: userAPI,
  communications: communicationsAPI,
  settings: settingsAPI,
  misc: miscAPI,
  upload: uploadAPI,
  socket: socketAPI,
  consultations: consultationsAPI,

  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  getPropertyImageUrl,

  initiateMpesaPayment,
  checkPaymentStatus,
  getBookingPayments,
  generateIdempotencyKey,
  calculateNights,
  formatDateForAPI,
};