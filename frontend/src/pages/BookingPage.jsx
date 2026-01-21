import { motion, AnimatePresence } from "framer-motion";
import { 
  FaStar, FaHeart, FaShareAlt, FaChevronLeft, FaChevronRight, FaCheck, 
  FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaBed, FaBath, FaWifi, 
  FaTv, FaUtensils, FaCar, FaHotTub, FaSnowflake, FaShieldAlt, FaWhatsapp, 
  FaClock, FaKey, FaSmokingBan, FaPaw, FaMusic, FaSwimmingPool, FaDumbbell, 
  FaConciergeBell, FaUsers, FaChevronDown, FaChevronUp, FaSun, FaMountain, 
  FaUmbrellaBeach, FaCity, FaLeaf, FaWater, FaHome, FaBuilding, FaCouch, FaCoffee 
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);



  // Fetch property data from API
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const response = await api.properties.getById(id);
        setProperty(response.data);

        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 2);
        setCheckInDate(today.toISOString().split('T')[0]);
        setCheckOutDate(tomorrow.toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error fetching property:', error);
        setError('Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-900"></div></div>;

  if (error) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-red-600">{error}</div></div>;

  if (!property) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="text-stone-600">Property not found</div></div>;

  // --- LOGIC ---
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
      total: totals.total
    };
    navigate(`/payment/${id}`, { state: { bookingDetails } });
  };

  const nextImage = () => setSelectedImage((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length);

  // Enhanced image grid layout
  const renderImageGrid = () => {
    if (property.images.length === 0) return null;
    
    if (property.images.length === 1) {
      return (
        <div className="h-[60vh] md:h-[80vh] relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src={property.images[0]} 
            alt="Property" 
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    // For 2-4 images: Split layout
    if (property.images.length <= 4) {
      return (
        <div className="grid grid-cols-2 gap-4 h-[60vh] md:h-[80vh]">
          {property.images.map((img, idx) => (
            <div 
              key={idx}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                idx === 0 ? 'col-span-2 row-span-2' : ''
              }`}
              onClick={() => setSelectedImage(idx)}
            >
              <img 
                src={img} 
                alt={`Property ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {idx === 0 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  Main Photo
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // For 5+ images: Pinterest-style masonry layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main large image */}
        <div className="md:col-span-2 md:row-span-2 relative rounded-2xl overflow-hidden shadow-xl">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={property.images[selectedImage]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setIsFullscreen(true)}
              alt="Main view"
            />
          </AnimatePresence>
          
          {/* Navigation buttons */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <FaChevronLeft className="text-stone-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
          >
            <FaChevronRight className="text-stone-700" />
          </button>
          
          {/* Image counter */}
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {selectedImage + 1} / {property.images.length}
          </div>
        </div>

        {/* Thumbnail grid - 4 images arranged in 2x2 */}
        {property.images.slice(0, 4).map((img, idx) => (
          idx > 0 && (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden cursor-pointer group ${
                idx === 1 ? 'md:col-span-1' : 'md:col-span-1'
              }`}
              onClick={() => setSelectedImage(idx)}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx}`}
                className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <FaCheck className="text-white text-xl" />
                </div>
              </div>
              {/* Selected indicator */}
              {selectedImage === idx && (
                <div className="absolute top-2 right-2 bg-teal-600 text-white p-1 rounded-full">
                  <FaCheck className="text-xs" />
                </div>
              )}
            </div>
          )
        ))}

        {/* View all photos button if more than 5 */}
        {property.images.length > 5 && (
          <div 
            className="relative rounded-xl overflow-hidden cursor-pointer group md:col-span-1"
            onClick={() => setSelectedImage(4)}
          >
            <img
              src={property.images[4]}
              alt="More photos"
              className="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-2xl font-bold">+{property.images.length - 5}</div>
                <div className="text-sm">View All Photos</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Fullscreen modal
  const FullscreenModal = () => (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-white text-2xl z-10 bg-black/50 p-3 rounded-full hover:bg-black/80 transition-colors"
          >
            ✕
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={property.images[selectedImage]}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain"
            />
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FaChevronLeft className="text-white text-xl" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FaChevronRight className="text-white text-xl" />
            </button>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm">
              {selectedImage + 1} / {property.images.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="bg-stone-50 font-sans text-slate-800 selection:bg-teal-900 selection:text-white pb-20">
      {/* Fullscreen Modal */}
      <FullscreenModal />
      
      {/* 1. TRANSPARENT HEADER NAV */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group text-stone-600 hover:text-teal-900 transition-colors">
            <div className="p-2 rounded-full group-hover:bg-stone-100 transition-colors">
              <FaChevronLeft className="text-sm" />
            </div>
            <span className="font-serif font-bold text-lg">LuxuryStays</span>
          </Link>
          <div className="flex gap-3">
            <button onClick={() => setIsFavorite(!isFavorite)} className="p-3 rounded-full hover:bg-stone-100 transition-colors">
              <FaHeart className={isFavorite ? "text-red-500" : "text-stone-400"} />
            </button>
            <button className="p-3 rounded-full hover:bg-stone-100 transition-colors">
              <FaShareAlt className="text-stone-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-28">
        
        {/* 2. TITLE SECTION */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-5xl font-serif text-teal-950 mb-3 leading-tight">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
            <span className="flex items-center gap-1 text-teal-900 font-bold bg-teal-50 px-2 py-1 rounded-sm">
              <FaStar className="text-amber-400" /> {property.rating}
            </span>
            <span className="underline decoration-stone-300">{property.location}</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span className="uppercase tracking-widest text-xs font-bold text-amber-600">{property.category}</span>
          </div>
        </div>

        {/* 3. ENHANCED IMAGE GALLERY */}
        <div className="mb-12">
          {renderImageGrid()}
          
          {/* Mobile thumbnails */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-4 md:hidden">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === idx
                    ? "border-teal-500"
                    : "border-transparent"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 4. CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          
          {/* LEFT COLUMN: DETAILS */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Specs Bar */}
            <div className="flex justify-between items-center py-6 border-y border-stone-200">
              <div className="flex gap-8 overflow-x-auto pb-2">
                {[
                  { label: "Guests", val: property.specs.guests, icon: FaUserFriends },
                  { label: "Bedrooms", val: property.specs.bedrooms, icon: FaBed },
                  { label: "Beds", val: property.specs.beds, icon: FaBed },
                  { label: "Baths", val: property.specs.bathrooms, icon: FaBath },
                ].map((spec, i) => (
                  <div key={i} className="flex items-center gap-3 min-w-max">
                    <spec.icon className="text-xl text-teal-600" />
                    <div>
                      <p className="font-bold text-teal-950">{spec.val}</p>
                      <p className="text-xs text-stone-500 uppercase tracking-wider">{spec.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Profile */}
            <div className="flex items-center gap-4 bg-white p-6 rounded-xl border border-stone-100 shadow-sm">
              <div className="relative">
                <img src={property.host.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" alt="Host" />
                {property.host.isSuperhost && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1 rounded-full border-2 border-white" title="Superhost">
                    <FaStar className="text-xs" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-serif text-lg text-teal-950">Hosted by {property.host.name}</h3>
                <p className="text-stone-500 text-sm">Response time: {property.host.responseTime} • Response rate: {property.host.responseRate}%</p>
              </div>
              <button className="ml-auto border border-stone-300 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-stone-50 transition-colors rounded-sm">
                Contact Host
              </button>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl text-teal-950 mb-4">About this space</h2>
              <p className="text-stone-600 leading-relaxed text-lg font-light">
                {property.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div>
              <h2 className="font-serif text-2xl text-teal-950 mb-6">What this place offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.amenities.slice(0, showAllAmenities ? undefined : 6).map((amenity, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-stone-100 rounded-lg hover:border-teal-200 hover:bg-teal-50/30 transition-colors">
                    <div className="text-teal-600 text-xl">{amenity.icon}</div>
                    <span className="text-stone-700">{amenity.name}</span>
                  </div>
                ))}
              </div>
              {property.amenities.length > 6 && (
                <button 
                  onClick={() => setShowAllAmenities(!showAllAmenities)}
                  className="mt-6 border border-teal-950 text-teal-950 px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-teal-950 hover:text-white transition-colors rounded-sm"
                >
                  {showAllAmenities ? "Show Less" : `Show All ${property.amenities.length} Amenities`}
                </button>
              )}
            </div>

            {/* Location Map Placeholder */}
            <div className="h-80 bg-teal-50 rounded-2xl relative overflow-hidden flex items-center justify-center border border-teal-100">
               <FaMapMarkerAlt className="text-4xl text-teal-300 animate-bounce" />
               <span className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold shadow-sm text-teal-900">
                 {property.location}
               </span>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY BOOKING WIDGET */}
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden"
              >
                {/* Header Gradient */}
                <div className="bg-gradient-to-r from-teal-800 to-teal-900 p-6 text-white flex justify-between items-end">
                  <div>
                    <span className="text-2xl font-serif">Ksh {property.price.toLocaleString()}</span>
                    <span className="text-teal-200 text-sm"> / night</span>
                  </div>
                  <div className="text-xs uppercase tracking-widest font-bold text-amber-400">Best Price</div>
                </div>

                <div className="p-6">
                  {/* Date Picker */}
                  <div className="border border-stone-300 rounded-xl overflow-hidden mb-4">
                    <div className="grid grid-cols-2 border-b border-stone-300">
                      <div className="p-3 border-r border-stone-300">
                        <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-in</label>
                        <input 
                          type="date" 
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          className="w-full bg-transparent text-sm text-stone-800 outline-none font-medium"
                        />
                      </div>
                      <div className="p-3">
                        <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-out</label>
                        <input 
                          type="date" 
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full bg-transparent text-sm text-stone-800 outline-none font-medium"
                        />
                      </div>
                    </div>
                    {/* Guest Dropdown */}
                    <div className="p-3 relative">
                      <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Guests</label>
                      <button 
                        onClick={() => setShowGuestSelector(!showGuestSelector)}
                        className="w-full flex justify-between items-center text-sm font-medium text-stone-800"
                      >
                        {guests.adults + guests.children} Guests
                        <FaChevronDown className={`transition-transform ${showGuestSelector ? 'rotate-180' : ''} text-xs`} />
                      </button>
                      
                      {/* Guest Popup */}
                      <AnimatePresence>
                        {showGuestSelector && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 shadow-xl rounded-xl p-4 z-20"
                          >
                            {['Adults', 'Children', 'Infants'].map((type) => (
                              <div key={type} className="flex justify-between items-center mb-3 last:mb-0">
                                <span className="text-sm font-medium text-stone-700">{type}</span>
                                <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => setGuests(prev => ({...prev, [type.toLowerCase()]: Math.max(0, prev[type.toLowerCase()] - 1)}))}
                                    className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-teal-600 hover:text-teal-600"
                                  >-</button>
                                  <span className="text-sm w-4 text-center">{guests[type.toLowerCase()]}</span>
                                  <button 
                                    onClick={() => setGuests(prev => ({...prev, [type.toLowerCase()]: prev[type.toLowerCase()] + 1}))}
                                    className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-teal-600 hover:text-teal-600"
                                  >+</button>
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <button 
                    onClick={handleBooking}
                    className="w-full py-4 bg-gradient-to-r from-teal-700 to-teal-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 mb-4"
                  >
                    Reserve
                  </button>

                  <p className="text-center text-xs text-stone-500 mb-6">You won't be charged yet</p>

                  {/* Price Breakdown */}
                  {totals.nights > 0 && (
                    <div className="space-y-3 text-sm text-stone-600">
                      <div className="flex justify-between underline decoration-stone-300">
                        <span>Ksh {property.price.toLocaleString()} x {totals.nights} nights</span>
                        <span>Ksh {totals.basePrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between underline decoration-stone-300">
                        <span>Cleaning fee</span>
                        <span>Ksh {totals.cleaningFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between underline decoration-stone-300">
                        <span>Service fee</span>
                        <span>Ksh {Math.round(totals.serviceFee).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-stone-200 pt-4 mt-4 flex justify-between font-bold text-lg text-teal-900">
                        <span>Total</span>
                        <span>Ksh {Math.round(totals.total).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Trust Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-stone-400 text-xs font-medium uppercase tracking-widest">
                <FaShieldAlt /> Secure Booking
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}