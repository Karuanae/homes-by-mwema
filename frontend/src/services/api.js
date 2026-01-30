// api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust based on your Flask server

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For handling cookies if needed
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION API ====================
export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  // Guest checkout
  guestCheckout: async (guestData) => {
    const response = await api.post('/auth/guest', guestData);
    localStorage.setItem('guest_token', response.data.guest_token);
    localStorage.setItem('guest', JSON.stringify(response.data.guest));
    return response;
  },

  // Logout
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest_token');
    localStorage.removeItem('guest');
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response;
  },
};

// ==================== PROPERTIES API ====================
export const propertiesAPI = {
  // Get all properties with filters
  getAll: async (params = {}) => {
    const response = await api.get('/properties', { params });
    return response;
  },

  // Get single property
  getById: async (id) => {
    const response = await api.get(`/properties/${id}`);
    return response;
  },

  // Search properties
  search: async (searchParams) => {
    const response = await api.post('/properties/search', searchParams);
    return response;
  },

  // Get featured properties
  getFeatured: async () => {
    const response = await api.get('/properties/featured');
    return response;
  },

  // Admin: Create property
  create: async (propertyData) => {
    const response = await api.post('/admin/properties', propertyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Admin: Update property
  update: async (id, propertyData) => {
    const response = await api.put(`/admin/properties/${id}`, propertyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Admin: Delete property
  delete: async (id) => {
    const response = await api.delete(`/admin/properties/${id}`);
    return response;
  },

  // Upload property images
  uploadImages: async (propertyId, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    const response = await api.post(`/properties/${propertyId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
};

// ==================== BOOKINGS API ====================
export const bookingsAPI = {
  // Create booking
  create: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response;
  },

  // Get user bookings
  getUserBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response;
  },

  // Get single booking
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response;
  },

  // Cancel booking
  cancel: async (id) => {
    const response = await api.put(`/bookings/${id}/cancel`);
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

  // Check availability
  checkAvailability: async (propertyId, checkIn, checkOut) => {
    const response = await api.get(`/properties/${propertyId}/availability`, {
      params: { check_in: checkIn, check_out: checkOut }
    });
    return response;
  },
};

// ==================== PAYMENTS API ====================
export const paymentsAPI = {
  // Initialize payment
  initialize: async (paymentData) => {
    const response = await api.post('/payments/initialize', paymentData);
    return response;
  },

  // M-Pesa STK Push payment (NEW)
  initiateMpesa: async (bookingId, phoneNumber, amount) => {
    const response = await api.post('/payments/mpesa/initiate', {
      booking_id: bookingId,
      phone_number: phoneNumber,
      amount: amount
    });
    return response.data;
  },

  // Check M-Pesa payment status (NEW)
  checkMpesaStatus: async (checkoutRequestId) => {
    const response = await api.get(`/payments/mpesa/query/${checkoutRequestId}`);
    return response.data;
  },

  // Get payments for a booking (NEW)
  getBookingPayments: async (bookingId) => {
    const response = await api.get(`/payments/booking/${bookingId}`);
    return response.data;
  },

  // Legacy M-Pesa payment (kept for backward compatibility)
  mpesaPayment: async (data) => {
    const response = await api.post('/payments/mpesa', data);
    return response;
  },

  // Process payment (non-M-PESA methods)
  processPayment: async (paymentData) => {
    const response = await api.post('/payments/process', paymentData);
    return response.data;
  },

  // Card payment
  cardPayment: async (data) => {
    const response = await api.post('/payments/card', data);
    return response;
  },

  // Verify payment
  verify: async (transactionId) => {
    const response = await api.get(`/payments/verify/${transactionId}`);
    return response;
  },

  // Get user payments
  getUserPayments: async (userId) => {
    const response = await api.get(`/users/${userId}/payments`);
    return response;
  },

  // Get payment by ID
  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response;
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

  // ==================== PAYPAL PAYMENTS ====================
  
  // Create PayPal order
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

  // Capture PayPal order (complete payment after approval)
  capturePayPalOrder: async (orderId) => {
    const response = await api.post('/payments/paypal/capture-order', {
      order_id: orderId
    });
    return response.data;
  },

  // Get PayPal order details
  getPayPalOrder: async (orderId) => {
    const response = await api.get(`/payments/paypal/order/${orderId}`);
    return response.data;
  },

  // Refund PayPal payment (admin only)
  refundPayPal: async (paymentId, amount = null, note = null) => {
    const response = await api.post('/payments/paypal/refund', {
      payment_id: paymentId,
      amount: amount,
      note: note
    });
    return response.data;
  },
};

// ==================== CHATS/MESSAGES API ====================
export const chatsAPI = {
  // Get user chats
  getUserChats: async (userId) => {
    const response = await api.get(`/chats/user/${userId}`);
    return response;
  },

  // Get chat messages
  getMessages: async (chatId) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return response;
  },

  // Send message
  sendMessage: async (chatId, payload) => {
    const response = await api.post(`/chats/${chatId}/messages`, payload);
    return response;
  },

  // Start new chat
  startChat: async (userId, hostId, propertyId = null) => {
    const response = await api.post('/chats', {
      user_id: userId,
      host_id: hostId,
      property_id: propertyId,
    });
    return response;
  },

  // Mark messages as read
  markAsRead: async (chatId) => {
    const response = await api.put(`/chats/${chatId}/read`);
    return response;
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const response = await api.get(`/chats/unread/${userId}`);
    return response;
  },

  // Admin: Get all chats
  getAll: async (params = {}) => {
    const response = await api.get('/admin/chats', { params });
    return response;
  },
};

// ==================== LEADS API ====================
export const leadsAPI = {
  // Create lead (inquiry)
  create: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response;
  },

  // Get user leads
  getUserLeads: async (userId) => {
    const response = await api.get(`/users/${userId}/leads`);
    return response;
  },

  // Admin: Get all leads
  getAll: async (params = {}) => {
    const response = await api.get('/admin/leads', { params });
    return response;
  },

  // Admin: Update lead status
  updateStatus: async (id, status) => {
    const response = await api.put(`/admin/leads/${id}/status`, { status });
    return response;
  },

  // Admin: Assign lead
  assign: async (id, assignee) => {
    const response = await api.put(`/admin/leads/${id}/assign`, { assignee });
    return response;
  },

  // Admin: Schedule follow-up
  scheduleFollowUp: async (id, date) => {
    const response = await api.put(`/admin/leads/${id}/follow-up`, { date });
    return response;
  },
};

// ==================== HOMEPAGE API ====================
export const homepageAPI = {
  // Get homepage content
  get: async () => {
    const response = await api.get('/homepage');
    return response;
  },

  // Admin: Update hero images
  updateHero: async (images) => {
    const response = await api.put('/admin/homepage/hero', { images });
    return response;
  },

  // Admin: Update featured properties
  updateFeatured: async (propertyIds) => {
    const response = await api.put('/admin/homepage/featured', { propertyIds });
    return response;
  },

  // Admin: Update testimonials
  updateTestimonials: async (testimonials) => {
    const response = await api.put('/admin/homepage/testimonials', { testimonials });
    return response;
  },

  // Upload homepage images
  uploadImages: async (images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });
    
    const response = await api.post('/admin/homepage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },
};

// ==================== REPORTS API ====================
export const reportsAPI = {
  // Get dashboard stats
  getStats: async (period = 'monthly') => {
    const response = await api.get(`/admin/reports/stats?period=${period}`);
    return response;
  },

  // Get revenue data
  getRevenue: async (startDate, endDate) => {
    const response = await api.get('/admin/reports/revenue', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response;
  },

  // Get occupancy rates
  getOccupancy: async () => {
    const response = await api.get('/admin/reports/occupancy');
    return response;
  },

  // Get payment methods distribution
  getPaymentMethods: async () => {
    const response = await api.get('/admin/reports/payment-methods');
    return response;
  },
};

// ==================== ADMIN API ====================
export const adminAPI = {
  // Get all properties (including inactive)
  getProperties: async () => {
    const response = await api.get('/admin/properties');
    return response;
  },

  // Create property
  createProperty: async (propertyData) => {
    const response = await api.post('/admin/properties', propertyData);
    return response;
  },

  // Update property
  updateProperty: async (id, propertyData) => {
    const response = await api.put(`/admin/properties/${id}`, propertyData);
    return response;
  },

  // Delete property
  deleteProperty: async (id) => {
    const response = await api.delete(`/admin/properties/${id}`);
    return response;
  },

  // Get dashboard stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response;
  },

  // Get all users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response;
  },

  // Get all bookings
  getBookings: async () => {
    const response = await api.get('/admin/bookings');
    return response;
  },

  // Get all payments
  getPayments: async () => {
    const response = await api.get('/admin/payments');
    return response;
  },
};

// ==================== USER PROFILE API ====================
export const userAPI = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response;
  },

  // Update profile
  updateProfile: async (userId, profileData) => {
    const response = await api.put(`/users/${userId}`, profileData);
    return response;
  },

  // Change password
  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await api.put(`/users/${userId}/password`, {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response;
  },

  // Get user favorites
  getFavorites: async (userId) => {
    const response = await api.get(`/users/${userId}/favorites`);
    return response;
  },

  // Add to favorites
  addFavorite: async (userId, propertyId) => {
    const response = await api.post(`/users/${userId}/favorites`, { property_id: propertyId });
    return response;
  },

  // Remove from favorites
  removeFavorite: async (userId, propertyId) => {
    const response = await api.delete(`/users/${userId}/favorites/${propertyId}`);
    return response;
  },
};

// ==================== COMMUNICATIONS API ====================
export const communicationsAPI = {
  // Send email
  sendEmail: async (emailData) => {
    const response = await api.post('/communications/email', emailData);
    return response;
  },

  // Send SMS
  sendSMS: async (smsData) => {
    const response = await api.post('/communications/sms', smsData);
    return response;
  },

  // Send WhatsApp
  sendWhatsApp: async (whatsappData) => {
    const response = await api.post('/communications/whatsapp', whatsappData);
    return response;
  },
};

// ==================== SETTINGS API ====================
export const settingsAPI = {
  // Get settings
  get: async () => {
    const response = await api.get('/admin/settings');
    return response;
  },

  // Update settings
  update: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response;
  },

  // Get notifications
  getNotifications: async () => {
    const response = await api.get('/admin/notifications');
    return response;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/admin/notifications/${notificationId}/read`);
    return response;
  },
};

// ==================== MISC API ====================
export const miscAPI = {
  // Upload file
  uploadFile: async (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  // Contact form
  contact: async (contactData) => {
    const response = await api.post('/contact', contactData);
    return response;
  },

  // Get FAQs
  getFAQs: async () => {
    const response = await api.get('/faqs');
    return response;
  },
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token') || !!localStorage.getItem('guest_token');
};

// Helper function to get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  const guest = localStorage.getItem('guest');
  return user ? JSON.parse(user) : (guest ? JSON.parse(guest) : null);
};

// Helper function to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('guest_token');
};

// ==================== M-PESA HELPER FUNCTIONS ====================
// Convenient wrapper functions for M-PESA operations

/**
 * Initiate M-PESA payment
 * @param {number} bookingId - The booking ID
 * @param {string} phoneNumber - M-PESA phone number
 * @param {number} amount - Amount to pay
 * @returns {Promise} Payment initiation result
 */
export const initiateMpesaPayment = async (bookingId, phoneNumber, amount) => {
  return await paymentsAPI.initiateMpesa(bookingId, phoneNumber, amount);
};

/**
 * Check M-PESA payment status
 * @param {string} checkoutRequestId - The checkout request ID from payment initiation
 * @returns {Promise} Payment status
 */
export const checkPaymentStatus = async (checkoutRequestId) => {
  return await paymentsAPI.checkMpesaStatus(checkoutRequestId);
};

/**
 * Get all payments for a booking
 * @param {number} bookingId - The booking ID
 * @returns {Promise} List of payments
 */
export const getBookingPayments = async (bookingId) => {
  return await paymentsAPI.getBookingPayments(bookingId);
};

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
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
  // M-PESA helpers
  initiateMpesaPayment,
  checkPaymentStatus,
  getBookingPayments,
};