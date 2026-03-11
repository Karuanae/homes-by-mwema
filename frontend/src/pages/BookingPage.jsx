import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { API_BASE_URL, IMAGE_BASE_URL } from "../services/api";
import { 
  MapPin, ChevronLeft, ChevronRight, X, Check, 
  Calendar, Users, AlertCircle, Clock, Shield, 
  ArrowLeft, CreditCard, Smartphone, ChevronDown 
} from "lucide-react";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // ========== STATE ==========
  // Data State
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  
  // Booking State
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  
  // Availability State
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false);
  
  // Booking Creation State
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  
  // Timer State (15-minute countdown)
  const [timeLeft, setTimeLeft] = useState(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  
  // Mobile view state
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Check if we're returning from login with saved form data
  useEffect(() => {
    const savedFormData = localStorage.getItem('bookingFormData');
    if (savedFormData && isAuthenticated) {
      try {
        const formData = JSON.parse(savedFormData);
        setCheckInDate(formData.checkInDate);
        setCheckOutDate(formData.checkOutDate);
        setGuests(formData.guests);
        // Clear the saved data
        localStorage.removeItem('bookingFormData');
        // Auto-trigger booking creation
        setTimeout(() => handleCreateBooking(true), 500);
      } catch (e) {
        console.error('Error restoring form data:', e);
      }
    }
  }, [isAuthenticated]);

  // ========== EFFECTS ==========
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await api.properties.getById(id);
        console.log('Property data:', response.data);
        const propertyData = response.data;
        
        // Process property data with defaults
        const processedProperty = {
          ...propertyData,
          title: propertyData.title || propertyData.name || 'Untitled Residence',
          location: propertyData.location || 'Nairobi, Kenya',
          description: propertyData.description || 'A luxurious residence curated for exceptional living.',
          price: propertyData.price || 5000,
          rating: propertyData.rating || 4.9,
          specs: {
            guests: propertyData.max_guests || propertyData.guests || 2,
            bedrooms: propertyData.bedrooms || 1,
            bathrooms: propertyData.bathrooms || 1,
            ...propertyData.specs
          },
          host: propertyData.host || {
            name: 'Mwema Concierge',
            avatar: '/Icon.jpg'
          },
          amenities: Array.isArray(propertyData.amenities)
            ? propertyData.amenities.map(a => typeof a === 'string' ? { name: a } : a)
            : [
                { name: 'High-speed WiFi' },
                { name: 'Premium Linens' },
                { name: 'Fully Equipped Kitchen' },
                { name: 'Smart TV' },
                { name: 'Air Conditioning' },
                { name: 'Private Balcony' }
              ],
          images: propertyData.images || [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
            'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800',
            'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800'
          ]
        };
        
        setProperty(processedProperty);

        // Only set default dates if no saved form data exists
        const savedFormData = localStorage.getItem('bookingFormData');
        if (!savedFormData) {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const checkOut = new Date(tomorrow);
          checkOut.setDate(checkOut.getDate() + 3);
          
          setCheckInDate(tomorrow.toISOString().split('T')[0]);
          setCheckOutDate(checkOut.toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Unable to load residence details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  // Timer effect for created booking
  useEffect(() => {
    if (!createdBooking?.expires_at) return;

    const expiresAt = new Date(createdBooking.expires_at);
    
    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt - now;
      
      if (diff <= 0) {
        // Booking expired
        setTimeLeft(null);
        setShowTimerWarning(true);
        // Refresh booking status
        checkBookingStatus();
        return;
      }
      
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, total: diff });
      
      // Show warning at 5 minutes
      if (diff <= 300000 && !showTimerWarning) {
        setShowTimerWarning(true);
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [createdBooking]);

  // ========== HELPER FUNCTIONS ==========
  const getImageSrc = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`;
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800';
  };

  // ========== AVAILABILITY CHECK ==========
  const checkAvailability = async () => {
    if (!checkInDate || !checkOutDate) return;
    
    setCheckingAvailability(true);
    setShowAvailabilityWarning(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: id,
          check_in: checkInDate,
          check_out: checkOutDate
        })
      });
      
      const data = await response.json();
      
      setIsAvailable(data.available);
      if (!data.available) {
        setAvailabilityMessage(data.message || 'These dates are not available');
        setShowAvailabilityWarning(true);
      } else {
        setAvailabilityMessage('');
      }
    } catch (error) {
      console.error('Availability check error:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Debounced availability check
  useEffect(() => {
    if (!checkInDate || !checkOutDate) return;
    
    const timer = setTimeout(() => {
      checkAvailability();
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timer);
  }, [checkInDate, checkOutDate]);

  // ========== CALCULATIONS ==========
  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !property) {
      return { nights: 0, basePrice: 0, cleaningFee: 0, serviceFee: 0, total: 0 };
    }
    
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    
    const basePrice = property.price * nights;
    const cleaningFee = 1500;
    const serviceFee = basePrice * 0.12;
    
    return { 
      nights, 
      basePrice, 
      cleaningFee, 
      serviceFee, 
      total: basePrice + cleaningFee + serviceFee 
    };
  };

  const totals = calculateTotal();

  // ========== CREATE BOOKING ==========
  const handleCreateBooking = async (isAutoRetry = false) => {
    if (!property) return;
    
    // Validate dates
    if (!checkInDate || !checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn >= checkOut) {
      alert('Check-out must be after check-in');
      return;
    }
    
    if (checkIn < today) {
      alert('Check-in cannot be in the past');
      return;
    }
    
    // Check availability one more time
    if (!isAvailable) {
      alert('These dates are no longer available. Please choose different dates.');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save the form data to localStorage
      const formData = {
        checkInDate,
        checkOutDate,
        guests,
        propertyId: id
      };
      localStorage.setItem('bookingFormData', JSON.stringify(formData));
      
      // Redirect to login with return URL
      navigate('/login', { 
        state: { 
          from: `/booking/${id}`,
          message: 'Please log in to complete your booking'
        }
      });
      return;
    }
    
    setCreatingBooking(true);
    
    try {
      // Generate idempotency key (prevents duplicate bookings)
      const idempotencyKey = `${id}_${checkInDate}_${checkOutDate}_${Date.now()}`;
      
      const bookingData = {
        property_id: id,
        check_in: checkInDate,
        check_out: checkOutDate,
        guests: {
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants
        },
        payment_type: 'full',
        message_to_host: ''
      };
      
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(bookingData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Save form data
          const formData = {
            checkInDate,
            checkOutDate,
            guests,
            propertyId: id
          };
          localStorage.setItem('bookingFormData', JSON.stringify(formData));
          
          navigate('/login', { 
            state: { 
              from: `/booking/${id}`,
              message: 'Your session expired. Please log in again.'
            }
          });
          return;
        }
        
        if (response.status === 409) {
          // Conflict - property no longer available
          setIsAvailable(false);
          setAvailabilityMessage(data.message || 'These dates were just booked by someone else');
          setShowAvailabilityWarning(true);
          throw new Error('Dates no longer available');
        }
        throw new Error(data.error || 'Failed to create booking');
      }
      
      // Success - booking created with 15-minute hold
      setCreatedBooking(data.booking);
      
      // Clear any saved form data
      localStorage.removeItem('bookingFormData');
      
      // Scroll to payment section on mobile
      if (window.innerWidth < 768) {
        document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
      }
      
    } catch (error) {
      console.error('Booking creation error:', error);
      if (!isAutoRetry) {
        alert(error.message || 'Failed to create booking. Please try again.');
      }
    } finally {
      setCreatingBooking(false);
    }
  };

  // ========== CHECK BOOKING STATUS ==========
  const checkBookingStatus = async () => {
    if (!createdBooking?.id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${createdBooking.id}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.is_expired) {
        setCreatedBooking(null);
        setTimeLeft(null);
        alert('Your booking session has expired. Please start over.');
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  // ========== PROCEED TO PAYMENT ==========
  const handleProceedToPayment = () => {
    if (!createdBooking) return;
    
    if (!isAuthenticated) {
      // Store booking and redirect to login
      localStorage.setItem('pendingBooking', JSON.stringify(createdBooking));
      navigate(`/login?redirect=/payment/${id}`);
    } else {
      // Go to payment page with booking data
      navigate(`/payment/${id}`, { 
        state: { 
          bookingDetails: createdBooking,
          expiresAt: createdBooking.expires_at
        } 
      });
    }
  };

  // ========== LOADING / ERROR STATES ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-xs uppercase tracking-widest text-stone-600">Loading Residence...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-4" />
          <p className="text-stone-600 font-light mb-6">{error || "Property not found"}</p>
          <button 
            onClick={() => navigate('/')}
            className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="bg-[#f5f2ee] font-sans text-stone-900 min-h-screen">
      
      {/* ========== MOBILE STICKY HEADER ========== */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-40 px-4 py-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-lg truncate max-w-[200px]">{property.title}</h1>
        <button 
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${showMobileSummary ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* ========== MOBILE SUMMARY DROPDOWN ========== */}
      <AnimatePresence>
        {showMobileSummary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden fixed top-[57px] left-0 right-0 bg-white border-b border-stone-200 z-40 overflow-hidden shadow-lg"
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Price per night</span>
                <span className="font-serif">Ksh {property.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Total for {totals.nights} nights</span>
                <span className="font-serif font-bold">Ksh {totals.total.toLocaleString()}</span>
              </div>
              {createdBooking && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold">COMPLETE PAYMENT IN:</span>
                  </div>
                  {timeLeft ? (
                    <div className="text-center">
                      <span className="text-2xl font-mono font-bold">
                        {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-center">Processing...</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 md:pb-24">
        
        {/* ========== HEADER ========== */}
        <div className="mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl lg:text-6xl text-stone-900 mb-2 md:mb-4 leading-tight font-serif">
            {property.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-stone-600">
            <div className="flex items-center gap-1 md:gap-2">
              <MapPin className="w-3 h-3 md:w-4 md:h-4" />
              <span className="font-medium text-stone-900">{property.location}</span>
            </div>
            <span className="w-px h-3 bg-stone-300 hidden sm:block"></span>
            <span className="text-xs md:text-sm">
              {property.specs.guests} Guests • {property.specs.bedrooms} Bedrooms • {property.specs.bathrooms} Baths
            </span>
            <span className="w-px h-3 bg-stone-300 hidden sm:block"></span>
            <div className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span className="font-medium text-stone-900">{property.rating}</span>
            </div>
          </div>
        </div>

        {/* ========== TWO-COLUMN LAYOUT ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          
          {/* ========== LEFT COLUMN - Property Details ========== */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">
            
            {/* Image Gallery - Mobile optimized */}
            <div className="relative h-[250px] sm:h-[350px] md:h-[450px] rounded-lg overflow-hidden">
              <img
                src={getImageSrc(property.images[selectedImage])}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <button
                onClick={() => setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 md:p-2 shadow-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setSelectedImage((prev) => (prev + 1) % property.images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 md:p-2 shadow-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {selectedImage + 1} / {property.images.length}
              </div>
            </div>
            
            {/* Thumbnail strip - scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${
                    selectedImage === index ? 'ring-2 ring-stone-900 opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getImageSrc(img)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="border-b border-stone-200 pb-6">
              <h3 className="text-xl md:text-2xl font-serif mb-4">About this residence</h3>
              <p className="text-stone-600 leading-relaxed text-sm md:text-base">
                {property.description}
              </p>
            </div>

            {/* Amenities - Grid responsive */}
            <div className="border-b border-stone-200 pb-6">
              <h3 className="text-xl md:text-2xl font-serif mb-4">Amenities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {property.amenities.slice(0, showAllAmenities ? undefined : 6).map((amenity, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-stone-900/5 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2 h-2 text-stone-900" />
                    </div>
                    <span className="text-xs md:text-sm">{amenity.name}</span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 6 && (
                <button
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-4 text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600"
                >
                  {showAllAmenities ? 'Show Less' : `View All (${property.amenities.length})`}
                </button>
              )}
            </div>
          </div>

          {/* ========== RIGHT COLUMN - Booking Card ========== */}
          <div id="payment-section" className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-20 md:top-24">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                
                {/* Price Header */}
                <div className="p-4 md:p-6 border-b border-stone-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xl md:text-2xl font-serif">Ksh {property.price.toLocaleString()}</span>
                      <span className="text-stone-400 text-xs"> / night</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-amber-500">★</span>
                      <span className="font-medium">{property.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="p-4 md:p-6 space-y-4">
                  
                  {/* Availability Warning */}
                  <AnimatePresence>
                    {showAvailabilityWarning && !isAvailable && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-red-700 text-xs">{availabilityMessage || 'These dates are not available'}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Timer Warning */}
                  <AnimatePresence>
                    {showTimerWarning && timeLeft && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <p className="text-amber-700 text-xs font-medium">
                            Complete payment in {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Date Inputs - Mobile friendly */}
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-in</label>
                      <input
                        type="date"
                        value={checkInDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        disabled={!!createdBooking}
                        className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 focus:border-stone-900 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-out</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        min={checkInDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        disabled={!!createdBooking}
                        className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 focus:border-stone-900 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Guests Selector */}
                  <div className="relative">
                    <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Guests</label>
                    <button
                      onClick={() => !createdBooking && setShowGuestSelector(!showGuestSelector)}
                      disabled={!!createdBooking}
                      className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 flex justify-between items-center"
                    >
                      <span>{guests.adults + guests.children} Guest{guests.adults + guests.children !== 1 ? 's' : ''}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showGuestSelector ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {showGuestSelector && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-lg shadow-xl z-20 mt-1 p-3 md:p-4"
                        >
                          {['adults', 'children', 'infants'].map((type) => (
                            <div key={type} className="flex justify-between items-center mb-3 last:mb-0">
                              <div>
                                <span className="text-xs md:text-sm capitalize">{type}</span>
                                {type === 'infants' && (
                                  <p className="text-[9px] md:text-[10px] text-stone-400">Under 2 years</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 md:gap-3">
                                <button
                                  onClick={() => setGuests(p => ({ ...p, [type]: Math.max(0, p[type] - 1) }))}
                                  className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-stone-200 flex items-center justify-center text-sm hover:border-stone-900 transition-colors"
                                >
                                  -
                                </button>
                                <span className="text-xs md:text-sm w-5 text-center">{guests[type]}</span>
                                <button
                                  onClick={() => setGuests(p => ({ ...p, [type]: p[type] + 1 }))}
                                  className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-stone-200 flex items-center justify-center text-sm hover:border-stone-900 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Price Breakdown */}
                  {totals.nights > 0 && (
                    <div className="space-y-2 pt-2 text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-600">Ksh {property.price} × {totals.nights} nights</span>
                        <span>Ksh {totals.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Cleaning fee</span>
                        <span>Ksh {totals.cleaningFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Service fee</span>
                        <span>Ksh {Math.round(totals.serviceFee).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-stone-200 font-bold">
                        <span>Total</span>
                        <span>Ksh {Math.round(totals.total).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!createdBooking ? (
                    <button
                      onClick={() => handleCreateBooking()}
                      disabled={creatingBooking || !isAvailable || !checkInDate || !checkOutDate}
                      className="w-full mt-4 py-3 md:py-4 bg-stone-900 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-stone-800 transition-all disabled:bg-stone-300 disabled:cursor-not-allowed"
                    >
                      {creatingBooking ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </span>
                      ) : (
                        'Book Now'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full mt-4 py-3 md:py-4 bg-green-600 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Proceed to Payment
                    </button>
                  )}

                  {/* Login Message for non-authenticated users */}
                  {!isAuthenticated && !createdBooking && (
                    <p className="text-[10px] text-amber-600 text-center mt-2">
                      You'll need to log in after selecting your dates
                    </p>
                  )}

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 pt-2">
                    <Shield className="w-3 h-3" />
                    <span>Secure transaction • 15-minute hold</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Hide scrollbar CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}