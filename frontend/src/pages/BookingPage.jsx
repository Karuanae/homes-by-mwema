import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { MapPin, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Data State
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [viewAllImages, setViewAllImages] = useState(false);
  
  // Booking State
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Logic
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await api.properties.getById(id);
        console.log('Property data:', response.data);
        const propertyData = response.data;
        
        // Ensure required fields exist
        const processedProperty = {
          ...propertyData,
          title: propertyData.title || propertyData.name || 'Untitled Residence',
          location: propertyData.location || 'Nairobi, Kenya',
          description: propertyData.description || 'A luxurious residence curated for exceptional living.',
          price: propertyData.price || 5000,
          rating: propertyData.rating || 4.9,
          specs: {
            guests: propertyData.guests || 2,
            bedrooms: propertyData.bedrooms || 1,
            bathrooms: propertyData.bathrooms || 1,
            ...propertyData.specs
          },
          host: propertyData.host || {
            name: 'Mwema Concierge',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'
          },
          amenities: propertyData.amenities || [
            { name: 'High-speed WiFi' },
            { name: 'Premium Linens' },
            { name: 'Fully Equipped Kitchen' },
            { name: 'Smart TV' },
            { name: 'Air Conditioning' },
            { name: 'Private Balcony' },
            { name: 'Coffee Maker' },
            { name: 'Hair Dryer' }
          ],
          images: propertyData.images || [
            'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200',
            'https://images.unsplash.com/photo-1615529182904-14819c35db37?w-800',
            'https://images.unsplash.com/photo-1615529328331-f8917597711f?w=800',
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'
          ]
        };
        
        setProperty(processedProperty);

        // Default dates (check-in tomorrow, check-out in 3 days)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const checkOut = new Date(tomorrow);
        checkOut.setDate(checkOut.getDate() + 3);
        
        setCheckInDate(tomorrow.toISOString().split('T')[0]);
        setCheckOutDate(checkOut.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Unable to load residence details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  // Image Fallback with better handling
  const handleImageError = (e, index) => {
    console.warn(`Image ${index} failed to load`);
    e.target.src = `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&fit=crop&crop=center&auto=format&q=60&ixlib=rb-4.0.3`;
  };

  // Calculation Logic
  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !property) return { total: 0 };
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

  const handleBooking = () => {
    if (!property) return;
    
    const bookingDetails = {
      propertyId: id,
      propertyTitle: property.title,
      propertyImage: property.images?.[0],
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests,
      nights: totals.nights,
      baseAmount: totals.basePrice,
      cleaningFee: totals.cleaningFee,
      serviceFee: totals.serviceFee,
      total: totals.total
    };

    if (!isAuthenticated) {
      localStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
      navigate(`/login?redirect=/payment/${id}`);
      return;
    }
    navigate(`/payment/${id}`, { state: { bookingDetails } });
  };

  // Gallery Navigation
  const nextImage = () => {
    if (!property?.images) return;
    setSelectedImage((prev) => (prev + 1) % property.images.length);
  };
  
  const prevImage = () => {
    if (!property?.images) return;
    setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  // Loading / Error States
  if (loading) return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
        <div className="text-xs uppercase tracking-widest text-stone-600">Loading Residence...</div>
      </div>
    </div>
  );

  if (error || !property) return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center">
      <div className="text-center">
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

  // Determine which images to show
  const imagesToShow = viewAllImages ? property.images : property.images.slice(0, 5);
  const hasMoreImages = property.images.length > 5;

  return (
    <div className="bg-[#f5f2ee] font-sans text-stone-900 selection:bg-stone-200 selection:text-black">
      
      {/* ================= FULLSCREEN GALLERY MODAL ================= */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-stone-800">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="text-white hover:text-stone-300 transition-colors flex items-center gap-2 group"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-widest">Close</span>
                </button>
              </div>
              <div className="text-white text-sm font-medium">
                {selectedImage + 1} / {property.images.length}
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 flex items-center justify-center relative bg-black">
              <motion.img
                key={selectedImage}
                src={property.images[selectedImage]}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
                onError={(e) => handleImageError(e, selectedImage)}
              />
              
              {/* Navigation Buttons */}
              <button 
                onClick={prevImage}
                className="absolute left-6 text-white hover:text-stone-300 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:border-white/40 transition-all">
                  <ChevronLeft className="w-6 h-6" />
                </div>
              </button>
              
              <button 
                onClick={nextImage}
                className="absolute right-6 text-white hover:text-stone-300 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:border-white/40 transition-all">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </button>
            </div>

            {/* Thumbnail Strip */}
            <div className="p-4 border-t border-stone-800 bg-black/90">
              <div className="flex gap-2 justify-center overflow-x-auto">
                {property.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                  >
                    <img 
                      src={img} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, index)}
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl text-stone-900 mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {property.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-stone-600 font-light">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-stone-900 font-medium">
                {property.location}
              </span>
            </div>
            <span className="w-px h-3 bg-stone-300"></span>
            <span>
              {property.specs.guests} Guests • {property.specs.bedrooms} Bedrooms • {property.specs.bathrooms} Baths
            </span>
            <span className="w-px h-3 bg-stone-300"></span>
            <div className="flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span className="font-medium text-stone-900">
                {property.rating} Rating
              </span>
            </div>
          </div>
        </div>

        {/* ================= GALLERY SECTION ================= */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[60vh] md:h-[70vh] rounded-2xl overflow-hidden">
            {/* Main Large Image */}
            <div 
              className="md:col-span-2 md:row-span-2 relative h-full bg-stone-100 cursor-pointer group"
              onClick={() => setIsFullscreen(true)}
            >
              <motion.img
                src={property.images[0]}
                alt="Main view"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => handleImageError(e, 0)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Grid of smaller images */}
            {imagesToShow.slice(1, 5).map((img, index) => (
              <div 
                key={index}
                className="relative h-full bg-stone-100 cursor-pointer group"
                onClick={() => {
                  setSelectedImage(index + 1);
                  setIsFullscreen(true);
                }}
              >
                <img 
                  src={img} 
                  alt={`View ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => handleImageError(e, index + 1)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                
                {/* "View All" overlay on last image */}
                {index === 3 && hasMoreImages && !viewAllImages && (
                  <div className="absolute inset-0 bg-stone-900/70 flex items-center justify-center group-hover:bg-stone-900/80 transition-all duration-300">
                    <div className="text-center">
                      <p className="text-white text-sm uppercase tracking-widest mb-1">
                        +{property.images.length - 5} more
                      </p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewAllImages(true);
                        }}
                        className="text-white text-xs font-bold uppercase tracking-widest border-b border-white pb-1 hover:border-stone-300 hover:text-stone-300 transition-colors"
                      >
                        View All Photos
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* "Show Less" button when viewing all */}
          {viewAllImages && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setViewAllImages(false)}
                className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
              >
                Show Less Photos
              </button>
            </div>
          )}

          {/* View All Images Grid */}
          {viewAllImages && property.images.length > 5 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {property.images.slice(5).map((img, index) => (
                <div 
                  key={index + 5}
                  className="aspect-square bg-stone-100 rounded-lg overflow-hidden cursor-pointer group"
                  onClick={() => {
                    setSelectedImage(index + 5);
                    setIsFullscreen(true);
                  }}
                >
                  <img 
                    src={img} 
                    alt={`Additional ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => handleImageError(e, index + 5)}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Host Info */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-12">
              <div>
                <h3 className="text-2xl font-serif text-stone-900 mb-2">
                  Hosted by {property.host.name}
                </h3>
                <p className="text-stone-600 text-sm font-light flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Superhost • Response rate: 100% • 3+ years hosting
                </p>
              </div>
              <div className="relative group">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                  <img 
                    src={property.host.avatar} 
                    alt={property.host.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-stone-200 pb-12">
              <h3 className="text-2xl font-serif text-stone-900 mb-6">
                About this residence
              </h3>
              <p className="text-stone-600 leading-relaxed text-lg font-light">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="border-b border-stone-200 pb-12">
              <h3 className="text-2xl font-serif text-stone-900 mb-8">
                Amenities & Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                {property.amenities.slice(0, showAllAmenities ? undefined : 8).map((amenity, i) => (
                  <div key={i} className="flex items-center gap-3 group">
                    <div className="w-5 h-5 rounded-full bg-stone-900/5 flex items-center justify-center group-hover:bg-stone-900 transition-colors">
                      <Check className="w-3 h-3 text-stone-900 opacity-60 group-hover:text-white group-hover:opacity-100" />
                    </div>
                    <span className="text-stone-700 font-light group-hover:text-stone-900 transition-colors">
                      {amenity.name}
                    </span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 8 && (
                <button 
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-8 text-sm font-bold uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors inline-flex items-center gap-2"
                >
                  {showAllAmenities ? "Show Less" : "View All Amenities"}
                  <ChevronRight className={`w-4 h-4 transition-transform ${showAllAmenities ? 'rotate-90' : ''}`} />
                </button>
              )}
            </div>

            {/* Map Section */}
            <div>
              <h3 className="text-2xl font-serif text-stone-900 mb-8">
                Location
              </h3>
              <div className="h-96 bg-white rounded-2xl overflow-hidden border border-stone-200 shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
                {/* Map Container */}
                <div className="w-full h-full relative">
                  {/* Static Map Image (Replace with actual map integration) */}
                  <img 
                    src={`https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s+1c1917(${property.location.includes('Kilimani') ? '36.8065,-1.2921' : '36.8219,-1.2921'})/${property.location.includes('Kilimani') ? '36.8065,-1.2921' : '36.8219,-1.2921'},14,0,0/600x400?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA`}
                    alt="Map location"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Map Overlay Info */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-serif text-xl text-stone-900 mb-1">Prime Location</h4>
                        <p className="text-stone-600 text-sm font-light">{property.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Distance to center</p>
                        <p className="text-stone-900 font-medium">2.5 km</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Airport</p>
                        <p className="text-stone-900 font-medium">15 min</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">CBD</p>
                        <p className="text-stone-900 font-medium">10 min</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">Mall</p>
                        <p className="text-stone-900 font-medium">5 min</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (STICKY BOOKING) ================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-stone-100 overflow-hidden p-8">
                
                {/* Header */}
                <div className="flex justify-between items-baseline mb-8">
                  <div>
                    <span className="text-3xl font-serif text-stone-900">Ksh {property.price.toLocaleString()}</span>
                    <span className="text-stone-400 font-light text-sm"> / night</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 px-3 py-1 bg-stone-100 rounded-full">
                    Best Value
                  </div>
                </div>

                {/* Date & Guest Selector */}
                <div className="space-y-4 mb-8">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-500 block">Check-in</label>
                      <div className="relative group">
                        <input 
                          type="date" 
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full p-3 bg-stone-50 rounded-xl text-sm text-stone-900 outline-none font-medium cursor-pointer border border-stone-200 hover:border-stone-900 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-500 block">Check-out</label>
                      <div className="relative group">
                        <input 
                          type="date" 
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full p-3 bg-stone-50 rounded-xl text-sm text-stone-900 outline-none font-medium cursor-pointer border border-stone-200 hover:border-stone-900 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Guests Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-stone-500 block">Guests</label>
                    <div className="relative">
                      <button 
                        onClick={() => setShowGuestSelector(!showGuestSelector)}
                        className="w-full p-3 bg-stone-50 rounded-xl text-sm font-medium text-stone-900 flex justify-between items-center border border-stone-200 hover:border-stone-900 transition-colors group"
                      >
                        <span>{guests.adults + guests.children} Guest{guests.adults + guests.children !== 1 ? 's' : ''}</span>
                        <ChevronRight className={`w-4 h-4 text-stone-400 transition-transform ${showGuestSelector ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showGuestSelector && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 bg-white border border-stone-100 shadow-2xl rounded-2xl p-6 z-20 mt-2"
                          >
                            {['Adults', 'Children', 'Infants'].map((type) => (
                              <div key={type} className="flex justify-between items-center mb-6 last:mb-0">
                                <div>
                                  <span className="text-sm text-stone-900 font-medium">{type}</span>
                                  {type === 'Infants' && (
                                    <p className="text-[10px] text-stone-400 mt-1">Under 2 years</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); setGuests(p => ({...p, [type.toLowerCase()]: Math.max(0, p[type.toLowerCase()] - 1)}))}}
                                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition-all"
                                  >-</button>
                                  <span className="text-sm w-6 text-center font-medium">{guests[type.toLowerCase()]}</span>
                                  <button 
                                    onClick={(e) => {e.stopPropagation(); setGuests(p => ({...p, [type.toLowerCase()]: p[type.toLowerCase()] + 1}))}}
                                    className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition-all"
                                  >+</button>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Reserve Button */}
                <button 
                  onClick={handleBooking}
                  className="w-full py-4 bg-stone-900 text-white text-sm font-bold tracking-widest uppercase rounded-full shadow-lg hover:bg-stone-800 hover:shadow-xl hover:-translate-y-0.5 transition-all mb-8 group"
                >
                  <span className="flex items-center justify-center gap-2">
                    Reserve Residence
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Price Breakdown */}
                {totals.nights > 0 && (
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                      <span className="text-stone-600">
                        Ksh {property.price.toLocaleString()} × {totals.nights} night{totals.nights > 1 ? 's' : ''}
                      </span>
                      <span className="text-stone-900 font-medium">Ksh {totals.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                      <span className="text-stone-600">Cleaning fee</span>
                      <span className="text-stone-900 font-medium">Ksh {totals.cleaningFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                      <span className="text-stone-600">Service fee</span>
                      <span className="text-stone-900 font-medium">Ksh {Math.round(totals.serviceFee).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 font-medium text-lg text-stone-900">
                      <span>Total</span>
                      <span>Ksh {Math.round(totals.total).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {/* Security Badge */}
                <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Secure Transaction • 24/7 Support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}