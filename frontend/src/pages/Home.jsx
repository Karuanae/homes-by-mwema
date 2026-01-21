import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp, FaBed, FaStar, FaTrophy, FaAward, FaCrown, FaSearch, FaChevronDown, FaQuoteLeft, FaCheck } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Home() {
  /* ================= DATE & LOGIC STATE ================= */
  const year = new Date().getFullYear();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getStartDay = (m, y) => new Date(y, m, 1).getDay();
  
  const [currentMonth, setCurrentMonth] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  
  // Selections
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [roomType, setRoomType] = useState("Select Preference");
  const [guests, setGuests] = useState({ adults: 0, children: 0, infants: 0 });
  const [visibleProperties, setVisibleProperties] = useState(8);
  const [openFaq, setOpenFaq] = useState(null);

  // Data state
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [premiumBadges, setPremiumBadges] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqData, setFaqData] = useState([]);

  // Refs
  const calendarRef = useRef(null);
  const roomsRef = useRef(null);
  const guestsRef = useRef(null);

  // Click Outside Logic
  useEffect(() => {
    function handleClickOutside(e) {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (roomsRef.current && !roomsRef.current.contains(e.target)) setShowRooms(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch properties and homepage content from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch properties
        const propertiesResponse = await api.properties.getAll();
        setProperties(propertiesResponse.data);
        
        // Try to fetch homepage content (may not exist yet)
        try {
          const homepageResponse = await api.homepage.get();
          setPremiumBadges(homepageResponse.data.badges || []);
          setTestimonials(homepageResponse.data.testimonials || []);
          setFaqData(homepageResponse.data.faqs || []);
        } catch (homepageError) {
          // Homepage content not available, use empty arrays
          console.log('Homepage content not available, using defaults');
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= ANIMATION VARIANTS ================= */
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="bg-stone-50 font-sans selection:bg-teal-900 selection:text-white">
      
      {/* ================= HERO SECTION ================= */}
      <div className="relative min-h-[100dvh] w-full bg-fixed bg-cover bg-center flex flex-col z-20" style={{ backgroundImage: "url('/Capital3main.jpg')" }}>
        
        {/* GRADIENT OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-teal-950"></div>

        {/* HERO CONTENT */}
        <section className="relative z-30 flex-grow flex flex-col justify-center items-center px-4 pt-20 pb-40 md:pb-0 pointer-events-none">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
            className="text-center w-full max-w-5xl pointer-events-auto"
          >
            {/* HERO TEXT */}
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight text-white mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              <span className="block mb-2">Refined</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200">
                Living Awaits
              </span>
            </motion.h1>

            {/* FLOATING GLASS SEARCH BAR */}
            <motion.div variants={fadeInUp} className="relative max-w-4xl mx-auto mt-8 md:mt-12 pointer-events-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] md:rounded-full p-2 flex flex-col md:flex-row shadow-2xl relative z-30">
                
                {/* 1. DATES */}
                <div 
                  className="flex-1 px-8 py-4 relative group cursor-pointer hover:bg-white/5 rounded-full transition-colors border-b border-white/10 md:border-b-0"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <label className="text-[10px] uppercase tracking-[0.2em] text-teal-200 block mb-1 font-bold">Dates</label>
                  <div className="text-white font-serif truncate flex items-center justify-between">
                    {startDate && endDate ? `${startDate} - ${endDate}` : "Select Dates"}
                  </div>
                  
                  {/* Calendar Dropdown */}
                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        ref={calendarRef}
                        className="absolute top-24 left-0 bg-white p-6 rounded-3xl shadow-2xl w-80 z-50 text-slate-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                         <div className="flex justify-between items-center mb-4">
                            <button onClick={() => setCurrentMonth(m => Math.max(0, m - 1))}>←</button>
                            <span className="font-serif font-bold">{months[currentMonth]} {year}</span>
                            <button onClick={() => setCurrentMonth(m => Math.min(11, m + 1))}>→</button>
                         </div>
                         <div className="grid grid-cols-7 gap-1 text-center text-xs">
                            {Array.from({ length: getDaysInMonth(currentMonth, year) }, (_, i) => (
                              <button 
                                key={i} 
                                onClick={() => !startDate ? setStartDate(`${months[currentMonth]} ${i+1}`) : setEndDate(`${months[currentMonth]} ${i+1}`)}
                                className="p-2 hover:bg-teal-900 hover:text-white rounded-full transition-colors"
                              >
                                {i + 1}
                              </button>
                            ))}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-px bg-white/10 my-3 hidden md:block"></div>

                {/* 2. ROOMS */}
                <div 
                  className="flex-1 px-8 py-4 relative group cursor-pointer hover:bg-white/5 rounded-full transition-colors border-b border-white/10 md:border-b-0"
                  onClick={() => setShowRooms(!showRooms)}
                >
                   <label className="text-[10px] uppercase tracking-[0.2em] text-teal-200 block mb-1 font-bold">Residence Type</label>
                   <div className="text-white font-serif truncate">{roomType}</div>
                   
                   {showRooms && (
                     <div ref={roomsRef} className="absolute top-24 left-0 w-full bg-white text-slate-800 rounded-3xl shadow-2xl overflow-hidden py-2 z-50">
                        {["Studio", "1 Bedroom", "Penthouse", "Villa"].map(r => (
                          <div key={r} onClick={() => setRoomType(r)} className="px-6 py-3 hover:bg-stone-50 cursor-pointer text-sm">{r}</div>
                        ))}
                     </div>
                   )}
                </div>

                <div className="w-px bg-white/10 my-3 hidden md:block"></div>

                {/* 3. GUESTS */}
                <div 
                  className="flex-1 px-8 py-4 relative group cursor-pointer hover:bg-white/5 rounded-full transition-colors"
                  onClick={() => setShowGuests(!showGuests)}
                >
                   <label className="text-[10px] uppercase tracking-[0.2em] text-teal-200 block mb-1 font-bold">Guests</label>
                   <div className="text-white font-serif truncate">
                     {guests.adults + guests.children} Guests
                   </div>
                </div>

                {/* SEARCH BTN */}
                <button className="bg-gradient-to-br from-teal-400 to-teal-600 hover:from-teal-300 hover:to-teal-500 text-white w-full md:w-auto px-8 py-4 rounded-[2rem] md:rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 m-1 mt-2 md:mt-1">
                  <FaSearch className="mx-auto" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* ================= THE BRIDGE (SEAMLESS TRANSITION) ================= */}
        <div className="absolute bottom-0 w-full z-20 border-t border-white/5 bg-gradient-to-b from-transparent to-teal-950/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto py-6 md:py-8">
            <div className="flex justify-center md:justify-between items-center text-stone-200/60 text-xs tracking-[0.3em] font-light uppercase px-6">
              
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="hidden md:flex items-center gap-4">
                <span className="h-px w-12 bg-stone-400/40"></span>
                <span>Exquisite Living</span>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="mx-auto flex flex-col items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 hover:text-stone-300 transition-colors"
              >
                <span className="text-[10px] tracking-widest">Explore Collection</span>
                <FaChevronDown className="text-xs" />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="hidden md:flex items-center gap-4">
                <span>Curated Spaces</span>
                <span className="h-px w-12 bg-stone-400/40"></span>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      {/* ================= FEATURED PROPERTIES (DEEP TEAL) ================= */}
      <section className="pt-20 pb-32 bg-teal-950 px-6 relative overflow-hidden z-10">
        
        {/* Watermark for Depth */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10rem] md:text-[15rem] font-serif text-teal-900/30 opacity-20 select-none whitespace-nowrap pointer-events-none" style={{ fontFamily: "'Playfair Display', serif" }}>
          Sanctuary
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
             <h2 className="text-3xl md:text-5xl font-serif text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
               Curated <span className="text-teal-400 italic">Residences</span>
             </h2>
             <p className="text-teal-200/60 text-sm tracking-widest uppercase">Exclusively For You</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {properties.slice(0, visibleProperties).map((property, idx) => (
              <Link to={`/booking/${property.id}`} key={property.id}>
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-sm mb-5 bg-teal-900">
                    <motion.img 
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.7 }}
                      src={property.image} 
                      alt={property.name} 
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    {/* Floating Tag */}
                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 text-[10px] tracking-widest font-bold text-white uppercase">
                      {property.tag}
                    </div>
                    {/* Hover Overlay - MODIFIED BUTTON TEXT */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                       <button className="border border-white text-white px-6 py-3 text-xs uppercase tracking-widest hover:bg-white hover:text-teal-950 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500">
                         Book Now
                       </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <h3 className="text-white text-lg font-serif tracking-wide group-hover:text-stone-200 transition-colors">{property.name}</h3>
                      <div className="flex items-center gap-1 text-stone-300 text-xs">
                        <FaStar /> {property.rating}
                      </div>
                    </div>
                    <p className="text-teal-400 text-xs uppercase tracking-wider">{property.location}</p>
                    <p className="text-white/80 font-light text-sm mt-2">Ksh {property.price} <span className="text-teal-500 text-xs">/ night</span></p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {visibleProperties < properties.length && (
            <div className="mt-20 text-center">
              <button onClick={() => setVisibleProperties(p => p + 4)} className="border border-teal-700 text-teal-300 px-10 py-4 uppercase text-xs tracking-[0.25em] hover:bg-teal-900 hover:text-white hover:border-teal-500 transition-all duration-300">
                View More
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================= VALUE PROPOSITION (STONE LIGHT) ================= */}
      <section className="py-32 bg-stone-50 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-5xl md:text-6xl font-serif text-teal-950 mb-8 leading-tight">
              Redefining <br/> <span className="text-teal-600 italic">Luxury Living.</span>
            </h2>
            <p className="text-slate-600 mb-10 text-lg font-light leading-relaxed max-w-md">
              We don't just offer beds; we curate experiences. Each property in our portfolio is rigorously vetted to ensure it meets the highest standards of design, comfort, and location.
            </p>
            
            <div className="space-y-8">
              {premiumBadges.map((badge) => (
                <div key={badge.id} className="flex gap-6 items-start group">
                  <div className="bg-white p-4 shadow-xl shadow-stone-200/50 rounded-full text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-300">
                    <badge.icon className="text-xl" />
                  </div>
                  <div>
                    <h4 className="text-teal-950 font-serif text-xl mb-1">{badge.title}</h4>
                    <p className="text-slate-500 text-sm font-light">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
             <motion.div className="grid grid-cols-2 gap-4">
                <motion.img initial={{ y: 50 }} whileInView={{ y: 0 }} transition={{ duration: 1 }} src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2053&auto=format&fit=crop" className="w-full h-[400px] object-cover mt-12 shadow-2xl" />
                <motion.img initial={{ y: -50 }} whileInView={{ y: 0 }} transition={{ duration: 1 }} src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1974&auto=format&fit=crop" className="w-full h-[400px] object-cover mb-12 shadow-2xl" />
             </motion.div>
             {/* Center Badge */}
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-950 text-white p-8 rounded-full text-center shadow-2xl border-4 border-white">
                <span className="block text-4xl font-serif font-bold">500+</span>
                <span className="text-[10px] uppercase tracking-widest text-teal-200">Stays</span>
             </div>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS & FAQ ================= */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif text-teal-950 mb-4">Guest Experiences</h2>
            <div className="h-1 w-20 bg-stone-400 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {testimonials.map((t) => (
              <div key={t.id} className="bg-stone-50 p-8 border border-stone-100 relative group hover:shadow-lg transition-shadow">
                <FaQuoteLeft className="text-4xl text-teal-100 absolute top-6 right-6" />
                <div className="flex text-stone-400 gap-1 text-xs mb-6">
                  {[...Array(t.rating)].map((_, i) => <FaStar key={i}/>)}
                </div>
                <p className="text-teal-900 italic font-serif text-lg leading-relaxed mb-6 relative z-10">"{t.content}"</p>
                <div>
                  <h5 className="font-bold text-teal-950 text-xs uppercase tracking-widest">{t.name}</h5>
                  <p className="text-xs text-teal-600 mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-serif text-center mb-8">Common Questions</h3>
            <div className="space-y-4">
              {faqData.map((faq) => (
                <div key={faq.id} className="border-b border-gray-200 pb-4">
                  <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex justify-between items-center text-left py-2 hover:text-teal-600 transition-colors">
                    <span className="font-medium text-teal-950">{faq.question}</span>
                    <FaChevronDown className={`transition-transform duration-300 ${openFaq === faq.id ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {openFaq === faq.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-gray-500 text-sm py-2 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CTA FOOTER ================= */}
      <section className="py-24 relative isolate overflow-hidden bg-teal-950">
        <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20 mix-blend-overlay" />
        <div className="text-center max-w-2xl mx-auto px-6">
          <FaCrown className="text-4xl text-stone-300 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">Book <span className="text-stone-300 italic">Today</span></h2>
          <p className="text-teal-100/80 mb-10 font-light">Chat with us to book wth us and enjoy your stay</p>
          <div className="flex justify-center gap-4">
            <button className="bg-white text-teal-950 px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-stone-200 transition-colors">Reach Out</button>
          </div>
        </div>
      </section>

      {/* WHATSAPP FLOAT */}
      <motion.a href="https://wa.me/254700000000" whileHover={{ scale: 1.1 }} className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-2xl z-50">
        <FaWhatsapp className="text-2xl" />
      </motion.a>

    </div>
  );
}