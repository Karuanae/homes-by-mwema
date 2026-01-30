import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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
        setProperty(response.data);

        // Default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 2);
        setCheckInDate(today.toISOString().split('T')[0]);
        setCheckOutDate(tomorrow.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Unable to load residence details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id]);

  // Image Fallback
  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1600596542815-60c37c6525fa?w=800';
  };

  // Calculation Logic
  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate) return { total: 0 };
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights < 1) return { total: 0, nights: 0 };
    
    const basePrice = property.price * nights;
    const cleaningFee = 1500;
    const serviceFee = basePrice * 0.12;
    return { nights, basePrice, cleaningFee, serviceFee, total: basePrice + cleaningFee + serviceFee };
  };

  const totals = calculateTotal();

  const handleBooking = () => {
    const bookingDetails = {
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
  const nextImage = () => setSelectedImage((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);

  // Loading / Error States
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xs uppercase tracking-widest text-stone-400 animate-pulse">Loading Residence...</div>
    </div>
  );

  if (error || !property) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-stone-500 font-light">{error || "Property not found"}</div>
    </div>
  );

  // --- RENDER HELPERS ---
  
  // Clean Image Grid (No Icons)
  const renderImageGrid = () => {
    const imgs = property.images || [];
    if (imgs.length === 0) return null;

    // 1 Image
    if (imgs.length === 1) {
      return (
        <div className="h-[60vh] w-full rounded-2xl overflow-hidden bg-stone-100">
          <img src={imgs[0]} alt="Main" className="w-full h-full object-cover" onError={handleImageError} />
        </div>
      );
    }

    // Grid Layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[50vh] md:h-[60vh] rounded-2xl overflow-hidden">
        {/* Main Large Image */}
        <div className="md:col-span-2 md:row-span-2 relative h-full bg-stone-100 cursor-pointer" onClick={() => setIsFullscreen(true)}>
          <img src={imgs[0]} alt="Main" className="w-full h-full object-cover hover:opacity-95 transition-opacity" onError={handleImageError} />
        </div>
        
        {/* Side Images */}
        <div className="hidden md:grid md:col-span-2 md:row-span-2 grid-cols-2 gap-2 h-full">
          {imgs.slice(1, 5).map((img, i) => (
            <div key={i} className="relative h-full bg-stone-100 cursor-pointer" onClick={() => { setSelectedImage(i + 1); setIsFullscreen(true); }}>
              <img src={img} alt={`View ${i}`} className="w-full h-full object-cover hover:opacity-95 transition-opacity" onError={handleImageError} />
              {/* "View All" Text Overlay on last image if there are more */}
              {i === 3 && imgs.length > 5 && (
                <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest border-b border-white pb-1">
                    View All Photos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-black pb-24 pt-14">
      
      {/* ================= FULLSCREEN MODAL ================= */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[100] flex flex-col"
          >
            {/* Toolbar */}
            <div className="flex justify-between items-center p-6 border-b border-stone-100">
              <button onClick={() => setIsFullscreen(false)} className="text-sm uppercase tracking-widest text-stone-500 hover:text-black transition-colors">
                Close
              </button>
              <div className="text-sm font-medium">
                {selectedImage + 1} / {property.images.length}
              </div>
            </div>

            {/* Main Image Container */}
            <div className="flex-1 flex items-center justify-center relative p-4 bg-stone-50">
              <motion.img
                key={selectedImage}
                src={property.images[selectedImage]}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="max-h-full max-w-full object-contain shadow-2xl"
              />
              
              {/* Text Navigation Buttons */}
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-8 text-stone-400 hover:text-black text-lg font-serif italic"
              >
                Prev
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-8 text-stone-400 hover:text-black text-lg font-serif italic"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl text-stone-900 mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {property.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-stone-500 font-light">
            <span className="text-stone-900 font-medium">
              {property.location}
            </span>
            <span className="w-px h-3 bg-stone-300"></span>
            <span>
              {property.specs.guests} Guests • {property.specs.bedrooms} Bedrooms • {property.specs.bathrooms} Baths
            </span>
            <span className="w-px h-3 bg-stone-300"></span>
            <span className="font-medium text-stone-900">
              {property.rating} Rating
            </span>
          </div>
        </div>

        {/* ================= GALLERY ================= */}
        <div className="mb-16">
          {renderImageGrid()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 relative">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Host Info - Clean, No Avatar Borders */}
            <div className="flex justify-between items-start border-b border-stone-100 pb-12">
              <div>
                <h3 className="text-xl font-medium mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Hosted by {property.host?.name || "Concierge"}
                </h3>
                <p className="text-stone-400 text-sm font-light">
                  Superhost • Response rate: 100%
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-stone-100 overflow-hidden">
                <img 
                  src={property.host?.avatar || 'https://ui-avatars.com/api/?name=Host&background=f5f5f4&color=1c1917'} 
                  alt="Host" 
                  className="w-full h-full object-cover opacity-90"
                />
              </div>
            </div>

            {/* Description */}
            <div className="border-b border-stone-100 pb-12">
              <p className="text-stone-600 leading-relaxed text-lg font-light">
                {property.description}
              </p>
            </div>

            {/* Amenities - Text List Only */}
            <div className="border-b border-stone-100 pb-12">
              <h3 className="text-2xl mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {property.amenities.slice(0, showAllAmenities ? undefined : 6).map((amenity, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    {/* Minimalist dot instead of icon */}
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 group-hover:bg-stone-900 transition-colors"></div>
                    <span className="text-stone-600 font-light group-hover:text-stone-900 transition-colors">
                      {amenity.name}
                    </span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 6 && (
                <button 
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-8 text-sm font-bold uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
                >
                  {showAllAmenities ? "Show Less" : "View All Amenities"}
                </button>
              )}
            </div>

            {/* Map Placeholder - Clean Gray Box */}
            <div>
              <h3 className="text-2xl mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                Location
              </h3>
              <div className="h-80 bg-stone-100 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                   <p className="text-stone-400 font-serif italic text-xl mb-2">Map View</p>
                   <p className="text-stone-500 text-xs uppercase tracking-widest font-bold">{property.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN (STICKY) ================= */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-stone-100 overflow-hidden p-8">
                
                {/* Header */}
                <div className="flex justify-between items-baseline mb-8">
                  <div>
                    <span className="text-2xl font-serif text-stone-900">Ksh {property.price.toLocaleString()}</span>
                    <span className="text-stone-400 font-light text-sm"> / night</span>
                  </div>
                  <div className="text-xs font-bold text-stone-900 underline decoration-stone-200 underline-offset-4">
                    Best Value
                  </div>
                </div>

                {/* Input Fields - Clean Lines */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden mb-6">
                  <div className="grid grid-cols-2 border-b border-stone-200">
                    <div className="p-4 border-r border-stone-200 hover:bg-stone-50 transition-colors">
                      <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Check-in</label>
                      <input 
                        type="date" 
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full bg-transparent text-sm text-stone-900 outline-none font-medium cursor-pointer placeholder-stone-300"
                      />
                    </div>
                    <div className="p-4 hover:bg-stone-50 transition-colors">
                      <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Check-out</label>
                      <input 
                        type="date" 
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-transparent text-sm text-stone-900 outline-none font-medium cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Guests */}
                  <div className="p-4 relative hover:bg-stone-50 transition-colors cursor-pointer">
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Guests</label>
                    <button 
                      onClick={() => setShowGuestSelector(!showGuestSelector)}
                      className="w-full text-left text-sm font-medium text-stone-900 flex justify-between"
                    >
                      <span>{guests.adults + guests.children} Guest(s)</span>
                      <span className="text-stone-400 text-xs">{showGuestSelector ? '−' : '+'}</span>
                    </button>

                    <AnimatePresence>
                      {showGuestSelector && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="absolute top-full left-0 right-0 bg-white border border-stone-100 shadow-xl rounded-xl p-6 z-20 mt-2"
                        >
                          {['Adults', 'Children'].map((type) => (
                            <div key={type} className="flex justify-between items-center mb-4 last:mb-0">
                              <span className="text-sm text-stone-600">{type}</span>
                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={(e) => {e.stopPropagation(); setGuests(p => ({...p, [type.toLowerCase()]: Math.max(0, p[type.toLowerCase()] - 1)}))}}
                                  className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 text-sm"
                                >-</button>
                                <span className="text-sm w-3 text-center">{guests[type.toLowerCase()]}</span>
                                <button 
                                  onClick={(e) => {e.stopPropagation(); setGuests(p => ({...p, [type.toLowerCase()]: p[type.toLowerCase()] + 1}))}}
                                  className="w-6 h-6 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-900 hover:text-stone-900 text-sm"
                                >+</button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Main Button */}
                <button 
                  onClick={handleBooking}
                  className="w-full py-4 bg-stone-900 text-white text-sm font-medium tracking-widest uppercase rounded-full shadow-lg hover:bg-stone-800 hover:shadow-xl transition-all mb-6"
                >
                  Reserve Residence
                </button>

                {/* Breakdown */}
                {totals.nights > 0 && (
                  <div className="space-y-3 text-sm text-stone-600 font-light">
                    <div className="flex justify-between">
                      <span className="underline decoration-stone-200">Ksh {property.price.toLocaleString()} x {totals.nights} nights</span>
                      <span>Ksh {totals.basePrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline decoration-stone-200">Cleaning fee</span>
                      <span>Ksh {totals.cleaningFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="underline decoration-stone-200">Service fee</span>
                      <span>Ksh {Math.round(totals.serviceFee).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-stone-200 pt-4 mt-4 flex justify-between font-medium text-base text-stone-900">
                      <span>Total</span>
                      <span>Ksh {Math.round(totals.total).toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 text-center">
                  <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                    Secure Transaction
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}