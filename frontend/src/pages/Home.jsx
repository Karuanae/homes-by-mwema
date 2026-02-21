import { motion, AnimatePresence } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// --- SUB-COMPONENT: 3D LUXURY CAROUSEL ---
const LuxuryCarousel = ({ slides }) => {
  const [rotation, setRotation] = useState(0);

  // Auto-rotate logic
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev - 72); // 360 / 5 slides = 72 degrees
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[450px] perspective-1000 flex items-center justify-center overflow-visible z-10">
      {/* 3D Scene Container */}
      <motion.div
        className="relative w-[260px] h-[360px] preserve-3d transition-transform duration-1000 ease-in-out"
        style={{ 
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotation}deg)` 
        }}
      >
        {slides.map((slide, index) => {
          // Calculate the angle for this specific slide
          const angle = index * (360 / slides.length);
          
          return (
            <div
              key={slide.id}
              className="absolute inset-0 backface-hidden"
              style={{
                // push items out by 320px (radius)
                transform: `rotateY(${angle}deg) translateZ(320px)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card Content */}
              <div className="w-full h-full bg-stone-200 rounded-sm overflow-hidden shadow-2xl relative group border-[4px] border-white">
                <img 
                  src={slide.bgImage} 
                  alt={slide.title}
                  className="w-full h-full object-cover filter brightness-90 group-hover:brightness-110 transition-all duration-500"
                />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-80 mb-1">{slide.subtitle}</p>
                  <h3 className="font-serif text-2xl leading-none">{slide.title}</h3>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
      
      {/* Floor Shadow for realism */}
      <div className="absolute bottom-10 w-[200px] h-[20px] bg-black/30 blur-xl rounded-[100%]" />
    </div>
  );
};

// --- SUB-COMPONENT: ROTATING DECORATIVE BADGE ---
const RotatingBadge = () => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    className="absolute -top-12 -left-12 opacity-10 md:opacity-15 pointer-events-none z-0"
  >
    <svg width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <path id="circlePath" d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" />
      </defs>
      <text fill="#44403C" fontSize="12" fontWeight="bold" letterSpacing="4">
        <textPath xlinkHref="#circlePath" className="uppercase">
          • Luxury Living • Nairobi • Est. 2024 • Verified Stays
        </textPath>
      </text>
    </svg>
  </motion.div>
);

// --- SUB-COMPONENT: AVATAR SOCIAL PROOF ---
const SocialProof = () => (
  <div className="flex items-center gap-4 mt-8 mb-8 pl-1">
    <div className="flex -space-x-3">
      {[1,2,3].map(i => (
        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#f5f2ee] bg-stone-300 overflow-hidden relative">
           {/* Using placeholder avatars, replace with real ones if available */}
           <img src={`https://i.pravatar.cc/100?img=${i + 25}`} alt="Guest" className="w-full h-full object-cover grayscale" />
        </div>
      ))}
      <div className="w-10 h-10 rounded-full border-2 border-[#f5f2ee] bg-stone-900 text-white text-[10px] flex items-center justify-center font-bold">
        50+
      </div>
    </div>
    <div className="flex flex-col justify-center">
      <div className="flex text-amber-500 text-xs gap-0.5">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>
      <span className="text-xs text-stone-500 font-medium tracking-wide">Trusted by 500+ Guests</span>
    </div>
  </div>
);

export default function Home() {
      // Helper to check if a date string is between two other date strings (format: 'Mon DD')
      function isBetween(date, start, end) {
        if (!start || !end) return false;
        const parse = d => {
          const [mon, day] = d.split(' ');
          return new Date(`${mon} ${day}, ${year}`);
        };
        const d = parse(date);
        const s = parse(start);
        const e = parse(end);
        return (d > s && d < e) || (d > e && d < s);
      }
    // Helper to format date as 'Mon DD'
    function formatDate(monthIdx, day) {
      return `${months[monthIdx]} ${day}`;
    }
  /* ================= DATE & LOGIC STATE ================= */
  const year = new Date().getFullYear();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m, y) => new Date(y, m, 1).getDay();
  
  const [currentMonth, setCurrentMonth] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  
  // Selections
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [roomType, setRoomType] = useState("Rooms");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [visibleProperties, setVisibleProperties] = useState(8);
  const [openFaq, setOpenFaq] = useState(null);

  // Data state
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const calendarRef = useRef(null);
  const roomsRef = useRef(null);
  const guestsRef = useRef(null);

  // Data Definitions
  const carouselSlides = [
    { id: 1, title: "Capital Rise", subtitle: "KILIMANI", bgImage: "./Capital3main.jpg" },
    { id: 2, title: "Eva Studio", subtitle: "LUMUMBA DRIVE", bgImage: "./EvaStudio.jpg" },
    { id: 3, title: "Uhuru Gardens", subtitle: "LANG'ATA", bgImage: "./Langata2.jpg" },
    { id: 4, title: "Capital Rise", subtitle: "KILIMANI", bgImage: "./Capital2.jpeg" },
    { id: 5, title: "Welcome", subtitle: "Nairobi", bgImage: "./Logo.jpeg" },
  ];

  const premiumFeatures = [
    { id: 1, number: "I", title: "Verified Excellence", description: "Every residence is physically inspected for 150+ quality points." },
    { id: 2, number: "II", title: "Personal Concierge", description: "Dedicated support from booking to checkout for seamless travel." },
    { id: 3, number: "III", title: "Curated Design", description: "Interiors selected for their aesthetic value and comfort." }
  ];

  const testimonials = [
    { 
      id: 1, 
      name: "Amina K.", 
      location: "Mombasa", 
      content: "Capital Rise 2-Bedroom offered the perfect blend of modern luxury and authentic Kenyan hospitality. Truly exceptional.", 
      rating: "5.0" 
    },
    { 
      id: 2, 
      name: "James M.", 
      location: "Nairobi", 
      content: "The 2-bedroom in Kilimani was ideal for business hosting. Central, luxurious, and impressed all our international guests.", 
      rating: "5.0" 
    },
    { 
      id: 3, 
      name: "Lilian W.", 
      location: "Kisumu", 
      content: "Our stay at the house in Langata was magical. Spacious, serene, and perfect for our family retreat to Nairobi.", 
      rating: "4.9" 
    }
  ];

  const faqData = [
    { id: 1, question: "Cancellation Policy", answer: "Cancel up to 24 hours before check-in for a full refund. Specific policies are detailed on each booking page." },
    { id: 2, question: "Check-in Process", answer: "You will receive secure access codes and detailed directions upon confirmation. We offer seamless self check-in." },
    { id: 3, question: "Amenities Included", answer: "All stays include high-speed WiFi, premium linens, toiletries, and fully equipped kitchens." }
  ];

    // Helper: prepend backend URL to image paths
    const API_BASE_URL = 'http://localhost:5000'; // Ensure this matches your backend
    const getImageSrc = (url) => url && !url.startsWith('http') ? `${API_BASE_URL}${url}` : url;

  // Lifecycle & Handlers
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (roomsRef.current && !roomsRef.current.contains(e.target)) setShowRooms(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching properties from API...');
        const res = await api.properties.getAll();
        console.log('Properties response:', res.data);
        setProperties(res.data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        setError('Unable to load residences. Please check if the server is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const handleDateSelect = (day) => {
    const dateStr = `${months[currentMonth]} ${day}`;
    if (!startDate) { setStartDate(dateStr); setEndDate(null); }
    else if (!endDate) {
      if (new Date(dateStr) < new Date(startDate)) { setEndDate(startDate); setStartDate(dateStr); }
      else { setEndDate(dateStr); }
    } else { setStartDate(dateStr); setEndDate(null); }
  };

  const formatDateDisplay = () => {
    if (!startDate) return "Add dates";
    if (!endDate) return `${startDate} – ...`;
    return `${startDate} – ${endDate}`;
  };

  return (
    <div className="bg-[#f5f2ee] font-sans text-stone-900 overflow-x-hidden selection:bg-stone-200">
      
      {/* GLOBAL STYLES & NOISE */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
      <div className="bg-noise" />

      {/* ================= HERO SECTION WITH BACKGROUND IMAGE ================= */}
        <div className="h-screen bg-fixed bg-cover bg-center relative" style={{ backgroundImage: "url('/Capital2.jpeg')" }}>
          {/* Logo at top left */}
        
        {/* JUNGLE GREEN OVERLAY */}
        <div className="h-full bg-teal-900/40 bg-gradient-to-b from-teal-950/80 via-teal-900/50 to-transparent relative overflow-hidden">
          
          <section className="h-full flex items-center justify-center px-4 md:px-6 relative z-10">
            {/* Centered content */}
            <div className="max-w-6xl w-full flex flex-col items-center justify-center">
              <motion.div 
                className="text-center relative"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15,
                      delayChildren: 0.3,
                    }
                  }
                }}
              >

                {/* HEADER */}
                <div className="relative mb-6">
                  <motion.h1 
                    // Removed variants={glowVariants} to fix ReferenceError
                    className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7 }}
                      className="text-white block leading-[1.1]"
                    >
                      Refined
                    </motion.span>
                    
                    <motion.span
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="relative mt-2 md:mt-3 block"
                    >
                      <span className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-[#ED9B40]  animate-gradient-x">
                        Living Awaits
                      </span>
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/90">
                        Living Awaits
                      </span>
                    </motion.span>
                  </motion.h1>

                  {/* REDUCED GLOW EFFECT */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute -top-8 -left-8 -right-8 -bottom-8 bg-gradient-to-r from-teal-500/6 via-transparent to-cyan-400/6 blur-xl pointer-events-none"
                  />
                </div>

                {/* SEARCH BAR POSITIONED NEAR BOTTOM */}
                <motion.div 
                  // Removed variants={searchBarVariants} to fix ReferenceError
                  className="relative max-w-2xl mx-auto mt-8"
                >
                  <div className="flex items-center bg-white/15 backdrop-blur-lg rounded-2xl border border-teal-400/25 shadow-xl px-8 py-2 gap-8 hover:border-teal-300/40 transition-all duration-300">

                    {/* WHEN */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCalendar(true)}
                      className="flex-1 px-6 py-2.5 cursor-pointer hover:bg-teal-500/8 rounded-xl relative group min-w-0"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/60 font-medium mb-0.5">Dates</p>
                      <p className="text-sm text-white font-light truncate">
                        {startDate && endDate ? `${startDate} → ${endDate}` : "Select dates"}
                      </p>

                      {showCalendar && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          ref={calendarRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-16 left-0 bg-gradient-to-br from-[#ED9B40]/95 to-[#ED9B40]/90 backdrop-blur-xl rounded-xl shadow-xl z-50 p-4 w-[300px] border border-[#ED9B40]/20"
                        >
                          {/* HEADER */}
                          <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setCurrentMonth(m => Math.max(0, m - 1))} 
                                    className="text-teal-300 hover:text-white transition-colors p-1.5 hover:bg-teal-500/20 rounded">
                              ←
                            </button>
                            <h4 className="font-light text-white text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                              {months[currentMonth]} {year}
                            </h4>
                            <button onClick={() => setCurrentMonth(m => Math.min(11, m + 1))} 
                                    className="text-teal-300 hover:text-white transition-colors p-1.5 hover:bg-teal-500/20 rounded">
                              →
                            </button>
                          </div>

                          {/* WEEKDAYS */}
                          <div className="grid grid-cols-7 text-[10px] text-teal-300/60 text-center mb-2">
                            {["S","M","T","W","T","F","S"].map(d => (
                              <div key={d} className="font-medium">{d}</div>
                            ))}
                          </div>

                          {/* DAYS */}
                          <div className="grid grid-cols-7 gap-0.5 text-center">
                            {Array(getStartDay(currentMonth, year)).fill(null).map((_, i) => <div key={i} />)}

                            {Array.from({ length: getDaysInMonth(currentMonth, year) }, (_, day) => {
                              const date = formatDate(currentMonth, day + 1);
                              const isStart = date === startDate;
                              const isEnd = date === endDate;
                              const inRange = isBetween(date, startDate, endDate);

                              return (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.9 }}
                                  key={day}
                                  onClick={() => {
                                    if (!startDate || endDate) {
                                      setStartDate(date);
                                      setEndDate(null);
                                    } else {
                                      setEndDate(date);
                                    }
                                  }}
                                  className={`h-4 w-4 rounded-full text-[10px] transition-all duration-200 flex items-center justify-center
                                    ${isStart || isEnd 
                                      ? "bg-gradient-to-br from-[#ED9B40] to-[#ED9B40] font-bold shadow-md ring-2 ring-black ring-offset-1"
                                      : inRange 
                                        ? "bg-[#ED9B40]/15 text-white"
                                        : "text-white/70 hover:bg-[#ED9B40]/8 hover:text-white"}`}
                                >
                                  {day + 1}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* DIVIDER */}
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#ED9B40] to-transparent mx-4" />

                    {/* ROOMS */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRooms(!showRooms)}
                      className="flex-1 px-6 py-2.5 cursor-pointer hover:bg-[#ED9B40]/8 rounded-xl relative group min-w-0"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/60 font-medium mb-0.5">Rooms</p>
                      <p className="text-sm text-white font-light truncate">{roomType}</p>

                      {showRooms && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          ref={roomsRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-16 left-0 bg-gradient-to-br from-[#ED9B40]/95 to-[#ED9B40]/90 backdrop-blur-xl rounded-xl shadow-xl w-5560 z-50 border border-[#ED9B40]/20"
                        >
                          {["Studio", "1 Bed", "2 Bed", "3 Bed", "4+ Beds"].map(r => (
                            <button 
                              key={r} 
                              onClick={() => { setRoomType(r); setShowRooms(false); }}
                              className="block w-full text-left px-4 py-2.5 text-white/90  transition-all duration-200 border-b border-[#ED9B40]/10 last:border-b-0 text-sm"
                            >
                              {r}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* DIVIDER */}
                    <div className="h-6 w-px bg-gradient-to-b from-transparent via-[#ED9B40] to-transparent mx-4" />

                    {/* GUESTS */}
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowGuests(!showGuests)}
                      className="flex-1 px-6 py-2.5 cursor-pointer hover:bg-[#ED9B40]/8 rounded-xl relative group min-w-0"
                    >
                      <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/60 font-medium mb-0.5">Guests</p>
                      <p className="text-sm text-white font-light">
                        {guests.adults + guests.children + guests.infants || "Add"}
                      </p>

                      {showGuests && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          ref={guestsRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-16 right-0 bg-gradient-to-br from-[#ED9B40]/95 to-[#ED9B40]/90 backdrop-blur-xl rounded-xl shadow-xl w-48 z-50 p-4 border border-[#ED9B40]/20"
                        >
                          {["adults","children","infants"].map(type => (
                            <div key={type} className="flex justify-between items-center mb-4 last:mb-0">
                              <span className="capitalize text-white/80 text-sm">{type}</span>
                              <div className="flex gap-2 items-center">
                                <button 
                                  onClick={() => setGuests(g => ({ ...g, [type]: Math.max(0, g[type] - 1) }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#ED9B40]/25 text-white hover:text-[#ED9B40] transition-all duration-200 flex items-center justify-center text-sm"
                                >
                                  −
                                </button>
                                <span className="text-white text-sm w-6 text-center">{guests[type]}</span>
                                <button 
                                  onClick={() => setGuests(g => ({ ...g, [type]: g[type] + 1 }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#ED9B40]/25 text-white hover:text-[#ED9B40] transition-all duration-200 flex items-center justify-center text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* SEARCH BUTTON */}
                    <motion.button 
                      whileHover={{ scale: 1.05, backgroundColor: "#ED9B40" }}
                      whileTap={{ scale: 0.9 }}
                      className="ml-4 h-10 w-10 bg-gradient-to-br from-[#ED9B40] to-[#ED9B40]/90 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-[#ED9B40]/25 transition-all duration-300"
                    >
                      <FaSearch className="text-base" />
                    </motion.button>

                  </div>
                </motion.div>

              </motion.div>
            </div>
          </section>
        </div>
      </div>

      {/* ================= MARQUEE STRIP ================= */}
      <div className="w-full bg-[#ED9B40] text-stone-900 overflow-hidden py-3 z-20 relative">
        <div className="whitespace-nowrap animate-marquee flex gap-12 text-xs font-medium tracking-[0.2em] uppercase">
          {Array(10).fill("Concierge • Privacy • Luxury • Comfort • Design • ").map((text, i) => (
             <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      {/* ================= PROPERTIES COLLECTION ================= */}
        <section className="py-16 px-6 relative z-10 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col justify-center items-center mb-16 pb-0">
            <h2 className="text-3xl md:text-4xl text-stone-900 text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Featured <span className="italic font-light text-stone-600">Properties</span></h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-stone-500 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && properties.length === 0 && (
            <div className="text-center py-20">
              <p className="text-stone-500 font-light">No residences available at the moment.</p>
            </div>
          )}

          {/* Properties Grid - FIXED VERSION */}
          {!loading && !error && properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              {properties.slice(0, visibleProperties).map((property, idx) => (
                <Link 
                  to={`/booking/${property.id}`} 
                  key={property.id || idx} 
                  className="block relative overflow-hidden rounded-sm transition-all duration-300"
                >
                  {/* Property Image with improved hover effects */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      src={getImageSrc(property.cover_image || property.images?.[0])}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full"
                      >
                        <span className="text-xs font-bold uppercase tracking-widest">View Details</span>
                      </motion.div>
                    </div>
                    
                    {property.tag && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900">
                        {property.tag}
                      </div>
                    )}
                  </div>
                  
                  {/* Property Info with hover effects */}
                  <div className="p-3 group-hover:bg-stone-50 transition-colors duration-300">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-stone-900 text-lg font-serif leading-tight group-hover:text-stone-700 transition-colors">
                          {property.name}
                        </h3>
                        <p className="text-stone-500 text-xs mt-1 uppercase tracking-wide group-hover:text-stone-600 transition-colors">
                          {property.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-900 text-sm font-medium group-hover:text-stone-700 transition-colors">
                          Ksh {property.price?.toLocaleString()}
                        </p>
                        <p className="text-stone-400 text-[10px] mt-1 uppercase">per night</p>
                      </div>
                    </div>
                    
                    {/* Hidden details that appear on hover */}
                    <div className="mt-3 pt-3 border-t border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center text-xs text-stone-500">
                        <span className="mr-4">⭐ {property.rating || "New"}</span>
                        <span>🛏️ {property.bedrooms || "1"} Bed</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && !error && visibleProperties < properties.length && (
            <div className="mt-16 text-center">
              <button onClick={() => setVisibleProperties(p => p + 4)} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                Load More
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= EDITORIAL FEATURES ================= */}
      <section className="py-24 px-6 bg-[#EBE5DE] relative z-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-4xl md:text-5xl text-stone-900 mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Standard of <br/><i>Exceptional</i> Living.
              </h2>
              <p className="text-stone-600 mb-8 max-w-md font-light leading-relaxed">
                We don't just offer beds; we curate environments. Each home is selected for its architectural merit, location, and ability to provide a serene escape from the mundane.
              </p>
              
              <div className="space-y-8">
                {premiumFeatures.map((feature) => (
                  <div key={feature.id} className="flex gap-6 items-start group">
                     <span className="text-stone-400 font-serif text-2xl group-hover:text-stone-900 transition-colors">{feature.number}</span>
                     <div>
                       <h4 className="text-stone-900 font-medium uppercase text-xs tracking-widest mb-2">{feature.title}</h4>
                       <p className="text-stone-600 text-sm font-light leading-relaxed max-w-sm">{feature.description}</p>
                     </div>
                  </div>
                ))}
              </div>
           </div>
           
           {/* Abstract Visual */}
           <div className="relative h-[600px] hidden lg:block">
              <div className="absolute top-0 right-0 w-3/4 h-full bg-stone-300 overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" className="w-full h-full object-cover opacity-80" alt="Interior" />
              </div>
              <div className="absolute bottom-12 left-0 w-1/2 h-2/3 bg-stone-100 border-8 border-[#EBE5DE] shadow-2xl overflow-hidden">
                 <img src="https://images.unsplash.com/photo-1615529182904-14819c35db37?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" className="w-full h-full object-cover" alt="Detail" />
              </div>
           </div>
        </div>
      </section>

      {/* ================= REVIEWS (Editorial Style) ================= */}
      <section className="py-24 px-6 bg-white relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-stone-400 text-2xl mb-8 block">❝</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x divide-stone-100">
             {testimonials.map((t) => (
               <div key={t.id} className="px-4 flex flex-col items-center">
                  <p className="font-serif text-lg italic text-stone-800 mb-6 leading-relaxed">"{t.content}"</p>
                  <div className="mt-auto">
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-900">{t.name}</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">{t.location}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* ================= MINIMAL FAQ ================= */}
      <section className="py-24 px-6 bg-[#f7f5f2] border-t border-stone-200">
        <div className="max-w-2xl mx-auto">
           <h2 className="text-3xl text-center mb-12 font-serif text-stone-900">Information</h2>
           <div className="divide-y divide-stone-200">
             {faqData.map((faq) => (
               <div key={faq.id} className="group">
                 <button 
                   onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                   className="w-full py-6 flex justify-between items-center text-left hover:text-stone-900 transition-colors cursor-pointer"
                 >
                   <span className="text-sm uppercase tracking-widest font-medium text-stone-700 group-hover:text-stone-900 transition-colors">{faq.question}</span>
                   <span className="font-serif italic text-stone-400 text-xl group-hover:text-stone-600 transition-colors">{openFaq === faq.id ? '−' : '+'}</span>
                 </button>
                 <AnimatePresence>
                   {openFaq === faq.id && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                       className="overflow-hidden"
                     >
                       <p className="pb-6 text-stone-500 font-light leading-relaxed">{faq.answer}</p>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* ================= CTA FOOTER ================= */}
      <section className="py-20 bg-stone-900 text-[#f5f2ee] text-center px-6 relative z-10">
        <h2 className="text-4xl md:text-6xl font-serif mb-6">Ready to Book?</h2>
        <p className="text-stone-400 max-w-lg mx-auto mb-10 font-light">Experience the finest homes Kenya has to offer. Book your sanctuary today.</p>
        <div className="flex justify-center gap-6">
           <button className="px-8 py-3 bg-[#f5f2ee] text-stone-900 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors cursor-pointer">Book Now</button>
           <button className="px-8 py-3 border border-stone-700 text-[#f5f2ee] text-xs uppercase tracking-widest font-bold hover:border-[#f5f2ee] transition-colors cursor-pointer">Contact</button>
        </div>
      </section>

      {/* ================= FLOATING ACTION ================= */}
      <motion.a 
        href="#"
        className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-2xl">✉</span>
      </motion.a>

    </div>
  );
}