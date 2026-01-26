import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  /* ================= DATE & LOGIC STATE ================= */
  const year = new Date().getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m, y) => new Date(y, m, 1).getDay();
  
  const [currentMonth, setCurrentMonth] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselRotation, setCarouselRotation] = useState(0);
  
  // Selections
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [roomType, setRoomType] = useState("Any");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [visibleProperties, setVisibleProperties] = useState(8);
  const [openFaq, setOpenFaq] = useState(null);

  // Data state
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Airbnb-style houses for carousel
  const carouselSlides = [
    {
      id: 1,
      title: "Modern Villa",
      subtitle: "NAIROBI HILLS",
      description: "Contemporary design meets ultimate comfort in this stunning hillside retreat",
      number: "01",
      bgImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80"
    },
    {
      id: 2,
      title: "Beachfront House",
      subtitle: "DIANI BEACH",
      description: "Direct beach access with panoramic ocean views and private pool",
      number: "02",
      bgImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    },
    {
      id: 3,
      title: "Luxury Apartment",
      subtitle: "WESTLANDS",
      description: "Skyline views from a sophisticated penthouse in the city center",
      number: "03",
      bgImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
    },
    {
      id: 4,
      title: "Country Cottage",
      subtitle: "NAIVASHA",
      description: "Peaceful countryside escape with fireplace and lake views",
      number: "04",
      bgImage: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=2065&q=80"
    },
    {
      id: 5,
      title: "Safari Lodge",
      subtitle: "MAASAI MARA",
      description: "Authentic wildlife experience with luxury tent accommodations",
      number: "05",
      bgImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80"
    }
  ];

  // Data Logic
  const premiumFeatures = [
    {
      id: 1,
      number: "01",
      title: "Certified Excellence",
      description: "Every home is verified for exceptional quality and comfort standards."
    },
    {
      id: 2,
      number: "02",
      title: "Guest Favorite",
      description: "The most loved homes on our platform with consistently high ratings."
    },
    {
      id: 3,
      number: "03",
      title: "Elite Curated",
      description: "A hand-picked collection of homes designed for the sophisticated traveler."
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      location: "London, UK",
      content: "The Ocean Breeze villa exceeded all expectations. The attention to detail was exceptional.",
      rating: "5.0"
    },
    {
      id: 2,
      name: "Michael Chen",
      location: "Singapore",
      content: "Perfect stay for my business trip. The Executive Studio had everything I needed.",
      rating: "5.0"
    },
    {
      id: 3,
      name: "Emma Wilson",
      location: "New York, USA",
      content: "Our family loved the Townhouse. Spacious, clean, and perfectly located.",
      rating: "4.9"
    }
  ];

  const faqData = [
    {
      id: 1,
      question: "Cancellation Policy",
      answer: "Cancel up to 24 hours before check-in for a full refund. Specific policies are detailed on each booking page."
    },
    {
      id: 2,
      question: "Check-in Process",
      answer: "You will receive secure access codes and detailed directions upon confirmation. We offer seamless self check-in."
    },
    {
      id: 3,
      question: "Amenities Included",
      answer: "All stays include high-speed WiFi, premium linens, toiletries, and fully equipped kitchens."
    }
  ];

  // Refs & Click Outside
  const calendarRef = useRef(null);
  const roomsRef = useRef(null);
  const guestsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (roomsRef.current && !roomsRef.current.contains(e.target)) setShowRooms(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
      setCarouselRotation((prev) => prev - 360 / carouselSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const propertiesResponse = await api.properties.getAll();
        setProperties(propertiesResponse.data);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Unable to load residences');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // Helpers
  const handleDateSelect = (day) => {
    const dateStr = `${months[currentMonth]} ${day}`;
    if (!startDate) {
      setStartDate(dateStr);
      setEndDate(null);
    } else if (!endDate) {
      if (new Date(dateStr) < new Date(startDate)) {
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
    } else {
      setStartDate(dateStr);
      setEndDate(null);
    }
  };

  const formatDateDisplay = () => {
    if (!startDate) return "Add dates";
    if (!endDate) return `${startDate} – Checkout`;
    return `${startDate} – ${endDate}`;
  };

  const showMoreProperties = () => {
    setVisibleProperties(prev => Math.min(prev + 8, properties.length));
  };

  const handleCarouselNavigation = (index) => {
    const diff = (index - currentSlide + carouselSlides.length) % carouselSlides.length;
    const rotationChange = -(diff * (360 / carouselSlides.length));
    setCurrentSlide(index);
    setCarouselRotation(prev => prev + rotationChange);
  };

  // Calculate position for each carousel item in circle
  const getCarouselItemPosition = (index) => {
    const radius = 120; // Distance from center
    const total = carouselSlides.length;
    const angle = (360 / total) * index + carouselRotation;
    const rad = (angle * Math.PI) / 180;
    
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    
    return { x, y };
  };

  return (
    <div className="bg-white font-sans text-stone-900">
      
      {/* ================= HERO SECTION WITH IMAGE BACKGROUND ================= */}
      <div className="relative min-h-screen w-full">
        
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {/* Main gradient overlay - darker on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20 z-10"></div>
          {/* Additional gradient on the right side to fade out more */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30 z-10"></div>
          <img 
            src="/Capital3main.jpg" 
            alt="Luxury Interior" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Additional gradient overlay specifically for the right side where carousel is */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 lg:w-2/5 bg-gradient-to-l from-black/50 via-black/30 to-transparent z-10"></div>

        {/* Main Content - Aligned at bottom */}
        <div className="relative z-30 flex flex-col lg:flex-row items-end justify-center min-h-screen px-4 md:px-4 pb-16 md:pb-24">
          
          {/* Left Content - Text and Search */}
          <div className="lg:w-1/2 text-white mb-12 lg:mb-0 lg:pr-12 flex flex-col justify-end relative z-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-10"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-4 md:mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Art of<br />Living
              </h1>
            </motion.div>

            {/* ================= COMPACT SEARCH BAR ================= */}
            <div className="relative z-[9999]">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 max-w-xl shadow-2xl relative"
              >
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Dates */}
                  <div 
                    className="flex-1 border border-stone-200 hover:border-stone-400 rounded-lg p-3 cursor-pointer transition-colors bg-white relative min-w-0"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">Dates</div>
                    <div className="text-stone-900 text-sm truncate">{formatDateDisplay()}</div>
                  </div>

                  {/* Residence Type */}
                  <div 
                    className="flex-1 border border-stone-200 hover:border-stone-400 rounded-lg p-3 cursor-pointer transition-colors bg-white relative min-w-0"
                    onClick={() => setShowRooms(!showRooms)}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">Residence</div>
                    <div className="text-stone-900 text-sm truncate">{roomType}</div>
                  </div>

                  {/* Guests */}
                  <div 
                    className="flex-1 border border-stone-200 hover:border-stone-400 rounded-lg p-3 cursor-pointer transition-colors bg-white relative min-w-0"
                    onClick={() => setShowGuests(!showGuests)}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">Guests</div>
                    <div className="text-stone-900 text-sm truncate">
                      {guests.adults + guests.children} Guests
                    </div>
                  </div>

                  {/* Search Button */}
                  <button className="bg-stone-900 hover:bg-stone-800 text-white rounded-lg p-3 font-medium text-sm tracking-wide transition-colors flex items-center justify-center min-w-[100px]">
                    <span className="hidden md:inline">Search</span>
                    <span className="md:hidden">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </span>
                  </button>
                </div>

                {/* Calendar Dropdown - Minimalistic */}
                <AnimatePresence>
                  {showCalendar && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      ref={calendarRef}
                      className="fixed left-4 right-4 md:left-auto md:right-auto md:w-64 bg-white p-4 rounded-2xl shadow-2xl border border-stone-100 z-[10000]"
                      style={{ top: 'auto', marginTop: '8px' }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <button 
                          onClick={(e) => {e.stopPropagation(); setCurrentMonth(m => Math.max(0, m - 1))}} 
                          className="text-stone-400 hover:text-black px-2 text-sm"
                        >
                          ←
                        </button>
                        <span className="font-serif text-sm md:text-base">{months[currentMonth]} {year}</span>
                        <button 
                          onClick={(e) => {e.stopPropagation(); setCurrentMonth(m => Math.min(11, m + 1))}} 
                          className="text-stone-400 hover:text-black px-2 text-sm"
                        >
                          →
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-stone-400 mb-2">
                        {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: getStartDay(currentMonth, year) }, (_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: getDaysInMonth(currentMonth, year) }, (_, i) => {
                          const day = i + 1;
                          const dateStr = `${months[currentMonth]} ${day}`;
                          const isSelected = dateStr === startDate || dateStr === endDate;
                          const isInRange = startDate && endDate && 
                            new Date(dateStr) > new Date(startDate) && 
                            new Date(dateStr) < new Date(endDate);
                          
                          return (
                            <button 
                              key={i} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateSelect(day);
                              }}
                              className={`h-7 w-7 md:h-8 md:w-8 rounded-full text-xs flex items-center justify-center transition-all
                                ${isSelected ? 'bg-stone-900 text-white' : 
                                  isInRange ? 'bg-stone-100' : 
                                  'hover:bg-stone-100 text-stone-600'}
                              `}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Rooms Dropdown - Minimalistic */}
                <AnimatePresence>
                  {showRooms && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      ref={roomsRef}
                      className="fixed left-4 right-4 md:left-auto md:right-auto md:w-48 bg-white py-3 rounded-2xl shadow-2xl border border-stone-100 z-[10000]"
                      style={{ top: 'auto', marginTop: '8px' }}
                    >
                      {["Any", "Studio", "1 Bed", "Penthouse", "Villa"].map((r) => (
                        <button 
                          key={r} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoomType(r);
                            setShowRooms(false);
                          }}
                          className="text-left px-4 md:px-5 py-2.5 hover:bg-stone-50 text-sm text-stone-600 hover:text-stone-900 transition-colors w-full text-left"
                        >
                          {r}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Guests Dropdown - Minimalistic */}
                <AnimatePresence>
                  {showGuests && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: 10 }}
                      ref={guestsRef}
                      className="fixed left-4 right-4 md:left-auto md:right-auto md:w-56 bg-white p-4 rounded-2xl shadow-2xl border border-stone-100 z-[10000]"
                      style={{ top: 'auto', marginTop: '8px' }}
                    >
                      <div className="space-y-4">
                        {/* Adults */}
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-stone-900 font-medium">Adults</div>
                            <div className="text-[11px] text-stone-500">13+</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, adults: Math.max(1, g.adults - 1)}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm text-stone-900">{guests.adults}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, adults: g.adults + 1}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-stone-900 font-medium">Children</div>
                            <div className="text-[11px] text-stone-500">2-12</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, children: Math.max(0, g.children - 1)}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm text-stone-900">{guests.children}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, children: g.children + 1}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-sm text-stone-900 font-medium">Infants</div>
                            <div className="text-[11px] text-stone-500">Under 2</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, infants: Math.max(0, g.infants - 1)}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              -
                            </button>
                            <span className="w-4 text-center text-sm text-stone-900">{guests.infants}</span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setGuests(g => ({...g, infants: g.infants + 1}));
                              }}
                              className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-colors text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Right Content - Rotating Carousel */}
          <div className="lg:w-1/2 relative h-[350px] md:h-[400px] lg:h-[450px] flex items-end justify-center">
            
            {/* Center Circle with Main Image */}
            <div className="relative z-20 w-[280px] md:w-[350px] h-[280px] md:h-[350px] mb-0">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${carouselSlides[currentSlide].bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
                  {/* Top Left - Subtitle */}
                  <div className="text-white">
                    <div className="text-[10px] md:text-xs tracking-[0.3em] font-light mb-1 opacity-90">
                      {carouselSlides[currentSlide].subtitle}
                    </div>
                    <h3 className="text-lg md:text-2xl font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {carouselSlides[currentSlide].title}
                    </h3>
                  </div>

                  {/* Bottom Right - Number */}
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl text-white font-light tracking-widest">
                      {carouselSlides[currentSlide].number}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Rotating Circle of Images Around */}
            <div className="absolute inset-0 z-10">
              {carouselSlides.map((slide, index) => {
                if (index === currentSlide) return null; // Skip current active slide
                
                const position = getCarouselItemPosition(index);
                return (
                  <motion.div
                    key={slide.id}
                    initial={false}
                    animate={{
                      x: position.x,
                      y: position.y,
                      scale: 0.8,
                      opacity: 0.7
                    }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="absolute w-[120px] md:w-[150px] h-[120px] md:h-[150px] rounded-xl overflow-hidden cursor-pointer hover:scale-110 hover:opacity-100 transition-all duration-300"
                    onClick={() => handleCarouselNavigation(index)}
                    style={{
                      left: '50%',
                      top: '50%',
                      marginLeft: '-60px',
                      marginTop: '-60px',
                      backgroundImage: `url(${slide.bgImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30 hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-2 right-2 text-white text-xs font-light">
                      {slide.number}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Carousel Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-30">
              {carouselSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleCarouselNavigation(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= PROPERTIES GRID ================= */}
      <section className="py-12 md:py-24 px-4 md:px-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-16">
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Curated Stays
            </h2>
            <p className="text-stone-500 text-sm font-light">Explore our most exclusive homes</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-stone-400 text-sm tracking-widest uppercase animate-pulse">
              Loading Residences...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-stone-500 px-4">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {properties.slice(0, visibleProperties).map((property, idx) => (
                <Link to={`/booking/${property.id}`} key={property.id || idx} className="group cursor-pointer">
                  {/* Image Card */}
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl md:rounded-2xl bg-stone-100 mb-3">
                    <img
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-60c37c6525fa'}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {property.tag && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900 rounded-sm">
                        {property.tag}
                      </div>
                    )}
                  </div>
                  
                  {/* Text Details */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-stone-900 font-medium text-sm md:text-base leading-tight mb-1 group-hover:underline decoration-stone-300 underline-offset-4">
                        {property.name}
                      </h3>
                      <p className="text-stone-500 text-xs md:text-sm mb-1 line-clamp-1">{property.location}</p>
                      <p className="text-stone-900 text-sm">
                        <span className="font-semibold">Ksh {property.price?.toLocaleString()}</span> 
                        <span className="font-light text-stone-500"> night</span>
                      </p>
                    </div>
                    <div className="text-xs font-medium bg-stone-100 px-2 py-1 rounded text-stone-900 ml-2">
                      {property.rating || "5.0"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {visibleProperties < properties.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={showMoreProperties} 
                className="border-b border-stone-900 pb-1 text-stone-900 text-sm uppercase tracking-widest hover:text-stone-600 hover:border-stone-600 transition-colors"
              >
                View More
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= PREMIUM FEATURES SECTION ================= */}
      <section className="py-12 md:py-24 px-4 md:px-6 bg-white border-t border-stone-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Premium Standards
            </h2>
            <p className="text-stone-500 text-sm font-light">Our commitment to exceptional experiences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {premiumFeatures.map((feature) => (
              <motion.div 
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-4xl md:text-5xl text-stone-900 font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {feature.number}
                </div>
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="py-12 md:py-24 px-4 md:px-6 bg-stone-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Guest Stories
            </h2>
            <p className="text-stone-500 text-sm font-light">What our guests say about their stays</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100"
              >
                <div className="text-xs font-bold tracking-widest mb-4 text-stone-400">
                  {item.rating} / 5.0 RATING
                </div>
                
                <p className="text-stone-800 text-base font-serif italic leading-relaxed mb-6">
                  "{item.content}"
                </p>

                <div className="text-sm">
                  <div className="font-bold text-stone-900">{item.name}</div>
                  <div className="text-stone-500 text-xs mt-1">{item.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="py-12 md:py-24 px-4 md:px-6 bg-white relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 md:mb-16 text-center">
            <h2 className="text-2xl md:text-3xl text-stone-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Common Questions
            </h2>
            <p className="text-stone-500 text-sm font-light">Everything you need to know about booking with us</p>
          </div>
          
          <div className="border-t border-stone-200">
            {faqData.map((faq) => (
              <div key={faq.id} className="border-b border-stone-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full py-6 flex justify-between items-center text-left hover:bg-stone-50 transition-colors px-4"
                >
                  <span className="text-stone-900 font-medium text-base md:text-lg pr-4">{faq.question}</span>
                  <span className="text-stone-400 text-xl md:text-2xl font-light flex-shrink-0">
                    {openFaq === faq.id ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-8 pt-2 text-stone-500 text-sm md:text-base leading-relaxed px-4">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <p className="text-stone-500 text-sm mb-6">
              Still have questions? Our team is here to help
            </p>
            <div className="flex gap-4 justify-center">
              <button className="border border-stone-900 text-stone-900 px-6 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors">
                Contact Support
              </button>
              <button className="bg-stone-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors">
                Browse All Properties
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-12 px-4 md:px-6 bg-stone-50 border-t border-stone-200 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-semibold text-stone-900 mb-4">LuxStay</div>
              <p className="text-stone-600 text-sm">
                Curated luxury stays for the discerning traveler.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-stone-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li><a href="#" className="hover:text-stone-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Safety Information</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Cancellation Options</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-stone-900 mb-4">Hosting</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li><a href="#" className="hover:text-stone-900 transition-colors">Try Hosting</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Host Resources</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-stone-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li><a href="#" className="hover:text-stone-900 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-stone-900 transition-colors">Press</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-stone-300 pt-8 text-sm text-stone-600">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                © {new Date().getFullYear()} LuxStay, Inc. • Privacy • Terms • Sitemap
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-stone-900 transition-colors">English (US)</a>
                <a href="#" className="hover:text-stone-900 transition-colors">KES Ksh</a>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-stone-900 transition-colors">Facebook</a>
                  <a href="#" className="hover:text-stone-900 transition-colors">Instagram</a>
                  <a href="#" className="hover:text-stone-900 transition-colors">Twitter</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= FLOATING ACTION ================= */}
      <motion.a 
        href="https://wa.me/254700000000"
        target="_blank"
        rel="noreferrer"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 2, type: "spring" }}
        className="fixed bottom-4 md:bottom-6 right-4 md:right-6 z-[2000] bg-stone-900 text-white px-4 md:px-6 py-3 rounded-full shadow-2xl hover:bg-black transition-colors text-xs md:text-sm font-medium tracking-wide flex items-center gap-2"
      >
        <span className="hidden md:inline">Concierge Chat</span>
        <span className="md:hidden">Chat</span>
        <span className="animate-pulse">💬</span>
      </motion.a>

    </div>
  );
}