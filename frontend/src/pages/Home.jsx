import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

// --- SUB-COMPONENT: 3D LUXURY CAROUSEL ---
const LuxuryCarousel = ({ slides }) => {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef(null);
  
  // Auto-rotate logic
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev - 72); // 360 / 5 slides = 72 degrees
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[500px] perspective-1000 flex items-center justify-center overflow-visible">
       {/* 3D Scene Container */}
      <motion.div
        className="relative w-[280px] h-[400px] preserve-3d transition-transform duration-1000 ease-in-out"
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
                // push items out by 350px (radius)
                transform: `rotateY(${angle}deg) translateZ(350px)`,
                transformStyle: "preserve-3d",
              }}
            >
              {/* Card Content */}
              <div className="w-full h-full bg-stone-200 rounded-sm overflow-hidden shadow-2xl relative group">
                <img 
                  src={slide.bgImage} 
                  alt={slide.title}
                  className="w-full h-full object-cover filter brightness-90 group-hover:brightness-110 transition-all duration-500"
                />
                
                {/* Overlay Text - Only visible when facing roughly front? 
                    Actually, let's keep it visible but subtle 
                */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <p className="text-[10px] tracking-[0.3em] uppercase opacity-80 mb-1">{slide.subtitle}</p>
                  <h3 className="font-serif text-2xl leading-none">{slide.title}</h3>
                </div>

                {/* Number Badge */}
                <div className="absolute top-4 right-4 w-10 h-10 border border-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <span className="font-serif text-white text-sm">{slide.number}</span>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
      
      {/* Floor Shadow for realism */}
      <div className="absolute bottom-10 w-[200px] h-[20px] bg-black/20 blur-xl rounded-[100%]" />
    </div>
  );
};

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
    { id: 1, title: "Capital Rise", subtitle: "KILIMANI", number: "01", bgImage: "./Capital3main.jpg" },
    { id: 2, title: "Eva Studio", subtitle: "LUMUMBA DRIVE", number: "02", bgImage: "./EvaStudio.jpg" },
    { id: 3, title: "Uhuru Gardens", subtitle: "LANG'ATA", number: "03", bgImage: "./Langata2.jpg" },
    { id: 4, title: "Capital Rise", subtitle: "KILIMANI", number: "04", bgImage: "./Capital2.jpeg" },
    { id: 5, title: "Welcome", subtitle: "Nairobi", number: "05", bgImage: "./Logo.jpeg" },
  ];

  const premiumFeatures = [
    { id: 1, number: "I", title: "Verified Excellence", description: "Every residence is physically inspected for 150+ quality points." },
    { id: 2, number: "II", title: "Personal Concierge", description: "Dedicated support from booking to checkout for seamless travel." },
    { id: 3, number: "III", title: "Curated Design", description: "Interiors selected for their aesthetic value and comfort." }
  ];

  const testimonials = [
    { id: 1, name: "Sarah J.", location: "London", content: "The attention to detail was exceptional. A truly refined experience.", rating: "5.0" },
    { id: 2, name: "Michael C.", location: "Singapore", content: "Perfect for business. The Executive Studio exceeded expectations.", rating: "5.0" },
    { id: 3, name: "Emma W.", location: "New York", content: "Spacious, clean, and perfectly located. We will be returning.", rating: "4.9" }
  ];

  const faqData = [
    { id: 1, question: "Cancellation Policy", answer: "Cancel up to 24 hours before check-in for a full refund. Specific policies are detailed on each booking page." },
    { id: 2, question: "Check-in Process", answer: "You will receive secure access codes and detailed directions upon confirmation. We offer seamless self check-in." },
    { id: 3, question: "Amenities Included", answer: "All stays include high-speed WiFi, premium linens, toiletries, and fully equipped kitchens." }
  ];

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
        console.error('Error details:', error.response?.data || error.message);
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
      
      {/* GLOBAL STYLES FOR 3D */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        /* Old Money Texture */
        .bg-noise {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none;
          z-index: 50;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* NOISE OVERLAY */}
      <div className="bg-noise" />

      {/* ================= HERO SECTION ================= */}
      <div className="relative min-h-screen w-full flex flex-col pt-32 pb-12 px-6 lg:px-16 z-20">
        
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f7f5f2] to-[#ebe5de] -z-20" />

        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          
          {/* Left: Typography & Search */}
          <div className="flex flex-col justify-center order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="block text-xs font-bold tracking-[0.3em] text-stone-500 mb-4 uppercase pl-1">
                Est. 2024 • Luxury Rentals
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-stone-900 mb-8 leading-[0.9]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Homes By <br/>
                <span className="italic font-light text-stone-600">Mwema.</span>
              </h1>
            </motion.div>

            {/* FLOATING SEARCH BAR */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white rounded-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-stone-100 p-2 max-w-xl"
            >
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-stone-100">
                {/* Dates */}
                <div 
                  className="flex-1 p-4 hover:bg-stone-50 transition-colors cursor-pointer group relative"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 group-hover:text-stone-900">Check In - Out</label>
                  <div className="text-stone-900 font-medium text-sm truncate">{formatDateDisplay()}</div>
                  
                  {/* Calendar Dropdown */}
                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div 
                        ref={calendarRef}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-4 bg-white p-4 shadow-xl border border-stone-100 w-72 z-[9999]"
                      >
                         <div className="flex justify-between items-center mb-4">
                            <button onClick={(e) => {e.stopPropagation(); setCurrentMonth(m => Math.max(0, m - 1))}} className="text-stone-400 hover:text-black">←</button>
                            <span className="font-serif italic">{months[currentMonth]} {year}</span>
                            <button onClick={(e) => {e.stopPropagation(); setCurrentMonth(m => Math.min(11, m + 1))}} className="text-stone-400 hover:text-black">→</button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-stone-400 mb-2">
                            {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: getStartDay(currentMonth, year) }, (_, i) => <div key={`e-${i}`} />)}
                            {Array.from({ length: getDaysInMonth(currentMonth, year) }, (_, i) => {
                              const d = i + 1;
                              const dateStr = `${months[currentMonth]} ${d}`;
                              const isSel = dateStr === startDate || dateStr === endDate;
                              return (
                                <button key={i} onClick={(e) => {e.stopPropagation(); handleDateSelect(d);}}
                                  className={`h-8 w-8 text-xs flex items-center justify-center transition-all ${isSel ? 'bg-stone-900 text-white' : 'hover:bg-stone-100'}`}>
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Residence Type */}
                <div 
                  className="flex-1 p-4 hover:bg-stone-50 transition-colors cursor-pointer group relative"
                  onClick={() => setShowRooms(!showRooms)}
                >
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 group-hover:text-stone-900">Residence</label>
                  <div className="text-stone-900 font-medium text-sm truncate">{roomType}</div>
                  
                  {/* Residence Dropdown */}
                  <AnimatePresence>
                    {showRooms && (
                      <motion.div 
                        ref={roomsRef}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-4 bg-white shadow-xl border border-stone-100 w-48 z-[9999]"
                      >
                        {["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom"].map((type) => (
                          <button 
                            key={type}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoomType(type);
                              setShowRooms(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-stone-50 transition-colors ${roomType === type ? 'bg-stone-100 font-medium' : ''}`}
                          >
                            {type}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Guests */}
                <div 
                  className="flex-1 p-4 hover:bg-stone-50 transition-colors cursor-pointer group relative"
                  onClick={() => setShowGuests(!showGuests)}
                >
                  <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 group-hover:text-stone-900">Guests</label>
                  <div className="text-stone-900 font-medium text-sm">{guests.adults + guests.children > 1 ? `${guests.adults + guests.children} Travelers` : "Add guests"}</div>
                  
                  {/* Guests Dropdown */}
                  <AnimatePresence>
                    {showGuests && (
                      <motion.div 
                        ref={guestsRef}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-0 mt-4 bg-white p-4 shadow-xl border border-stone-100 w-60 z-[9999]"
                      >
                         {/* Simple guest controls */}
                         <div className="flex justify-between items-center py-2">
                           <span className="text-sm">Adults</span>
                           <div className="flex gap-3 items-center">
                             <button onClick={(e)=>{e.stopPropagation(); setGuests(g=>({...g, adults:Math.max(1,g.adults-1)}))}} className="w-6 h-6 border flex items-center justify-center text-stone-500 hover:border-black">-</button>
                             <span className="text-sm w-3 text-center">{guests.adults}</span>
                             <button onClick={(e)=>{e.stopPropagation(); setGuests(g=>({...g, adults:g.adults+1}))}} className="w-6 h-6 border flex items-center justify-center text-stone-500 hover:border-black">+</button>
                           </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Button */}
                <div className="p-2 flex items-center">
                  <button className="w-full h-full min-h-[44px] bg-stone-900 hover:bg-stone-800 text-white px-6 transition-colors flex items-center justify-center gap-2 group">
                    <span className="text-xs uppercase tracking-widest font-medium">Search</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: 3D Carousel */}
          <div className="relative order-1 lg:order-2 h-[500px] flex items-center justify-center">
             <LuxuryCarousel slides={carouselSlides} />
          </div>

        </div>
      </div>

      {/* ================= MARQUEE STRIP ================= */}
      <div className="w-full bg-stone-900 text-stone-400 overflow-hidden py-3 border-y border-stone-800">
        <div className="whitespace-nowrap animate-marquee flex gap-12 text-xs font-medium tracking-[0.2em] uppercase">
          {/* Repeated items for infinite scroll effect */}
          {Array(10).fill("Concierge • Privacy • Luxury • Comfort • Design • ").map((text, i) => (
             <span key={i}>{text}</span>
          ))}
        </div>
      </div>
      <style>{`
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* ================= PROPERTIES COLLECTION (MOVED BELOW MARQUEE) ================= */}
      <section className="py-24 px-6 relative z-10 bg-white">
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

          {/* Properties Grid */}
          {!loading && !error && properties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
            {properties.slice(0, visibleProperties).map((property, idx) => (
              <Link to={`/booking/${property.id}`} key={property.id || idx} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4 cursor-none">
                   {/* Property Image with Zoom Effect */}
                   <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      src={property.images?.[0]}
                      alt={property.name}
                      className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                   />
                   {property.tag && (
                     <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900">
                       {property.tag}
                     </div>
                   )}
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-stone-900 text-lg font-serif leading-tight group-hover:italic transition-all">
                      {property.name}
                    </h3>
                    <p className="text-stone-500 text-xs mt-1 uppercase tracking-wide">{property.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-stone-900 text-sm font-medium">
                      Ksh {property.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            </div>
          )}

          {!loading && !error && visibleProperties < properties.length && (
            <div className="mt-16 text-center">
              <button onClick={() => setVisibleProperties(p => p + 4)} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1">
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
                   className="w-full py-6 flex justify-between items-center text-left"
                 >
                   <span className="text-sm uppercase tracking-widest font-medium text-stone-700 group-hover:text-stone-900 transition-colors">{faq.question}</span>
                   <span className="font-serif italic text-stone-400 text-xl">{openFaq === faq.id ? '−' : '+'}</span>
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
      <section className="py-20 bg-stone-900 text-[#f5f2ee] text-center px-6">
        <h2 className="text-4xl md:text-6xl font-serif mb-6">Ready to Book?</h2>
        <p className="text-stone-400 max-w-lg mx-auto mb-10 font-light">Experience the finest homes Kenya has to offer. Book your sanctuary today.</p>
        <div className="flex justify-center gap-6">
           <button className="px-8 py-3 bg-[#f5f2ee] text-stone-900 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors">Book Now</button>
           <button className="px-8 py-3 border border-stone-700 text-[#f5f2ee] text-xs uppercase tracking-widest font-bold hover:border-[#f5f2ee] transition-colors">Contact</button>
        </div>
      </section>

      {/* ================= FLOATING ACTION ================= */}
      <motion.a 
        href="#"
        className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
        whileHover={{ rotate: 15 }}
      >
        <span className="text-2xl">✉</span>
      </motion.a>

    </div>
  );
}