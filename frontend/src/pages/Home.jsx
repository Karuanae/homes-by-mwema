import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import api, { IMAGE_BASE_URL } from "../services/api";

// ─── helpers ────────────────────────────────────────────────────────────────
const year  = new Date().getFullYear();
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
const getStartDay    = (m, y) => new Date(y, m, 1).getDay();

function formatDate(monthIdx, day) {
  return `${MONTHS[monthIdx]} ${day}`;
}
function isBetween(date, start, end) {
  if (!start || !end) return false;
  const parse = d => { const [mon, day] = d.split(" "); return new Date(`${mon} ${day}, ${year}`); };
  const d = parse(date), s = parse(start), e = parse(end);
  return (d > s && d < e) || (d > e && d < s);
}

// Room type → how it maps to property.rooms / property.type
const ROOM_OPTIONS = [
  { label: "Any",    minBeds: 0,  maxBeds: 99 },
  { label: "Studio", minBeds: 0,  maxBeds: 0  },
  { label: "1 Bed",  minBeds: 1,  maxBeds: 1  },
  { label: "2 Bed",  minBeds: 2,  maxBeds: 2  },
  { label: "3 Bed",  minBeds: 3,  maxBeds: 3  },
  { label: "4+ Beds",minBeds: 4,  maxBeds: 99 },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Home() {
  // Search state
  const [showRooms,    setShowRooms]    = useState(false);
  const [showGuests,   setShowGuests]   = useState(false);
  const [showLocations, setShowLocations] = useState(false);

  // Filter state
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [guests,       setGuests]       = useState({ adults: 1, children: 0, infants: 0 });
  const [hasSearched,  setHasSearched]  = useState(false);

  // Data state
  const [properties,       setProperties]       = useState([]);
  const [filteredProps,    setFilteredProps]    = useState([]);
  const [locations,        setLocations]        = useState([]);
  const [visibleCount,     setVisibleCount]     = useState(8);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(null);
  const [openFaq,          setOpenFaq]          = useState(null);

  // Refs
  const roomsRef       = useRef(null);
  const guestsRef      = useRef(null);
  const locationsRef   = useRef(null);
  const propertiesRef  = useRef(null);

  // ── Static Data ──
  const premiumFeatures = [
    { id: 1, number: "I",   title: "Verified Excellence", description: "Every residence is physically inspected for 150+ quality points." },
    { id: 2, number: "II",  title: "Personal Concierge",  description: "Dedicated support from booking to checkout for seamless travel." },
    { id: 3, number: "III", title: "Curated Design",      description: "Interiors selected for their aesthetic value and comfort." },
  ];
  const testimonials = [
    { id: 1, name: "Amina K.",   location: "Mombasa", content: "Capital Rise 2-Bedroom offered the perfect blend of modern luxury and authentic Kenyan hospitality. Truly exceptional." },
    { id: 2, name: "James M.",   location: "Nairobi",  content: "The 2-bedroom in Kilimani was ideal for business hosting. Central, luxurious, and impressed all our international guests." },
    { id: 3, name: "Lilian W.",  location: "Kisumu",   content: "Our stay at the house in Langata was magical. Spacious, serene, and perfect for our family retreat to Nairobi." },
  ];
  const faqData = [
    { id: 1, question: "Cancellation Policy", answer: "Cancel up to 24 hours before check-in for a full refund. Specific policies are detailed on each booking page." },
    { id: 2, question: "Check-in Process",    answer: "You will receive secure access codes and detailed directions upon confirmation. We offer seamless self check-in." },
    { id: 3, question: "Amenities Included",  answer: "All stays include high-speed WiFi, premium linens, toiletries, and fully equipped kitchens." },
  ];

  // ── Image helper ──
  const getImageSrc = (url) => url && !url.startsWith("http") ? `${IMAGE_BASE_URL}${url}` : url;

  // ── Fetch properties and extract unique locations ──
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.properties.getAll();
        const data = res.data || [];
        setProperties(data);
        setFilteredProps(data);
        
        // Extract unique locations from properties
        const uniqueLocations = ["All Locations", ...new Set(data.map(p => p.location).filter(Boolean))];
        setLocations(uniqueLocations);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Unable to load residences. Please check if the server is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (roomsRef.current && !roomsRef.current.contains(e.target)) setShowRooms(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
      if (locationsRef.current && !locationsRef.current.contains(e.target)) setShowLocations(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Search / Filter ──
  const handleSearch = () => {
    const totalGuests = guests.adults + guests.children + guests.infants;

    const results = properties.filter((p) => {
      // Location filter
      const locationMatch = selectedLocation === "All Locations" || p.location === selectedLocation;

      // Room type filter
      const beds = p.rooms ?? p.bedrooms ?? 0;
      const isStudio = beds === 0 || p.type === "studio";
      let roomMatch = true;
      if (selectedRoom.label !== "Any") {
        if (selectedRoom.label === "Studio") {
          roomMatch = isStudio;
        } else {
          roomMatch = beds >= selectedRoom.minBeds && beds <= selectedRoom.maxBeds;
        }
      }

      // Guests filter — property must accommodate at least the requested guests
      const maxGuests = p.max_guests ?? p.maxGuests ?? 99;
      const guestMatch = totalGuests <= maxGuests;

      return locationMatch && roomMatch && guestMatch;
    });

    setFilteredProps(results);
    setVisibleCount(8);
    setHasSearched(true);

    // Smooth scroll to properties grid
    setTimeout(() => {
      propertiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const clearSearch = () => {
    setFilteredProps(properties);
    setSelectedRoom(ROOM_OPTIONS[0]);
    setSelectedLocation("All Locations");
    setGuests({ adults: 1, children: 0, infants: 0 });
    setHasSearched(false);
    setVisibleCount(8);
  };

  const displayedProperties = filteredProps.slice(0, visibleCount);
  const totalGuests = guests.adults + guests.children + guests.infants;

  return (
    <div className="bg-[#f5f2ee] font-sans text-stone-900 overflow-x-hidden selection:bg-stone-200">

      {/* Global styles */}
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        
        /* Custom scrollbar for dropdowns */
        .dropdown-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: rgba(237, 155, 64, 0.5);
          border-radius: 4px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(237, 155, 64, 0.8);
        }
      `}</style>
      <div className="bg-noise" />

      {/* ═══════════════════════════════════════════════════════
          HERO — static Capital3.jpeg background
      ═══════════════════════════════════════════════════════ */}
      <div
        className="h-screen bg-cover bg-center relative"
        style={{ backgroundImage: "url('/Capital3.jpeg')" }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/60" />

        <section className="relative z-10 h-full flex flex-col items-center justify-center px-4 md:px-6">
          <motion.div
            className="w-full max-w-4xl text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Eyebrow */}
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#ED9B40]/80 mb-4">
              Nairobi · Premium Residences
            </p>

            {/* Headline */}
            <h1
              className="text-4xl md:text-6xl font-light tracking-tight mb-8"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="text-white block leading-[1.1]">Refined</span>
              <span className="text-white/90 italic font-light block leading-[1.1]">Living Awaits</span>
            </h1>

            {/* ── SEARCH BAR ── */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-visible relative">

              {/* Desktop row / Mobile stack */}
              <div className="flex flex-col md:flex-row md:items-center md:divide-x divide-white/20">

                {/* LOCATION */}
                <div className="relative flex-1" ref={locationsRef}>
                  <button
                    onClick={() => { setShowLocations(s => !s); setShowRooms(false); setShowGuests(false); }}
                    className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/70 font-medium mb-0.5 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-[10px]" /> Location
                    </p>
                    <p className="text-sm text-white font-light truncate">
                      {selectedLocation}
                    </p>
                  </button>

                  <AnimatePresence>
                    {showLocations && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute top-full left-0 mt-2 bg-[#1C1917] rounded-xl shadow-2xl z-[100] w-64 border border-white/10 overflow-hidden"
                        style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999 }}
                      >
                        <div className="max-h-60 overflow-y-auto dropdown-scroll">
                          {locations.map((location) => (
                            <button
                              key={location}
                              onClick={() => { setSelectedLocation(location); setShowLocations(false); }}
                              className={`block w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0
                                ${selectedLocation === location ? "text-[#ED9B40] bg-white/5" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ROOM TYPE */}
                <div className="relative flex-1" ref={roomsRef}>
                  <button
                    onClick={() => { setShowRooms(s => !s); setShowLocations(false); setShowGuests(false); }}
                    className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/70 font-medium mb-0.5">Room Type</p>
                    <p className="text-sm text-white font-light">{selectedRoom.label}</p>
                  </button>

                  <AnimatePresence>
                    {showRooms && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute top-full left-0 mt-2 bg-[#1C1917] rounded-xl shadow-2xl z-[100] w-44 border border-white/10 overflow-hidden"
                        style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999 }}
                      >
                        <div className="max-h-60 overflow-y-auto dropdown-scroll">
                          {ROOM_OPTIONS.map((opt) => (
                            <button
                              key={opt.label}
                              onClick={() => { setSelectedRoom(opt); setShowRooms(false); }}
                              className={`block w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-0
                                ${selectedRoom.label === opt.label ? "text-[#ED9B40] bg-white/5" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* GUESTS */}
                <div className="relative flex-1" ref={guestsRef}>
                  <button
                    onClick={() => { setShowGuests(s => !s); setShowLocations(false); setShowRooms(false); }}
                    className="w-full text-left px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <p className="text-[10px] uppercase tracking-widest text-[#ED9B40]/70 font-medium mb-0.5">Guests</p>
                    <p className="text-sm text-white font-light">
                      {totalGuests > 0 ? `${totalGuests} guest${totalGuests > 1 ? "s" : ""}` : "Add guests"}
                    </p>
                  </button>

                  <AnimatePresence>
                    {showGuests && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute top-full right-0 mt-2 bg-[#1C1917] rounded-xl shadow-2xl z-[100] w-52 p-4 border border-white/10"
                        style={{ position: 'absolute', top: '100%', right: 0, zIndex: 9999 }}
                      >
                        <div className="max-h-60 overflow-y-auto dropdown-scroll px-1">
                          {["adults","children","infants"].map((type) => (
                            <div key={type} className="flex justify-between items-center mb-4 last:mb-0">
                              <span className="capitalize text-white/80 text-sm">{type}</span>
                              <div className="flex gap-2 items-center">
                                <button
                                  onClick={() => setGuests(g => ({ ...g, [type]: Math.max(0, g[type] - 1) }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#ED9B40]/30 text-white transition-all flex items-center justify-center text-sm"
                                >−</button>
                                <span className="text-white text-sm w-5 text-center">{guests[type]}</span>
                                <button
                                  onClick={() => setGuests(g => ({ ...g, [type]: g[type] + 1 }))}
                                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-[#ED9B40]/30 text-white transition-all flex items-center justify-center text-sm"
                                >+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SEARCH BUTTON */}
                <div className="px-4 py-3 flex items-center justify-center">
                  <motion.button
                    onClick={handleSearch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full md:w-auto h-11 px-8 bg-[#ED9B40] hover:bg-[#d4882d] rounded-xl flex items-center justify-center gap-2 text-white shadow-lg transition-colors duration-300"
                  >
                    <FaSearch className="text-sm" />
                    <span className="text-sm font-medium">Search</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Simple trust indicator */}
            <p className="text-white/60 text-xs mt-6 tracking-wide">
              ✦ 500+ happy guests ✦ 4.9/5 rating ✦
            </p>
          </motion.div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MARQUEE STRIP
      ═══════════════════════════════════════════════════════ */}
      <div className="w-full bg-[#ED9B40] text-stone-900 overflow-hidden py-3 z-20 relative">
        <div className="whitespace-nowrap animate-marquee flex gap-12 text-xs font-medium tracking-[0.2em] uppercase">
          {Array(10).fill("Concierge • Privacy • Luxury • Comfort • Design • ").map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          PROPERTIES COLLECTION
      ═══════════════════════════════════════════════════════ */}
      <section ref={propertiesRef} className="py-16 px-6 relative z-10 bg-white scroll-mt-20">
        <div className="max-w-[1400px] mx-auto">

          {/* Section header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl text-stone-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                {hasSearched ? "Search " : "Featured "}
                <span className="italic font-light text-stone-500">
                  {hasSearched ? "Results" : "Properties"}
                </span>
              </h2>
              {hasSearched && (
                <p className="text-stone-500 text-sm mt-1">
                  {filteredProps.length} {filteredProps.length === 1 ? "residence" : "residences"} match your criteria
                  {selectedLocation !== "All Locations" && ` · ${selectedLocation}`}
                  {selectedRoom.label !== "Any" && ` · ${selectedRoom.label}`}
                  {totalGuests > 1 && ` · ${totalGuests} guests`}
                </p>
              )}
            </div>
            {hasSearched && (
              <button
                onClick={clearSearch}
                className="mt-4 md:mt-0 text-xs uppercase tracking-widest text-stone-400 hover:text-stone-700 border-b border-stone-300 hover:border-stone-700 pb-0.5 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-stone-500 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600">
                Try Again
              </button>
            </div>
          )}

          {/* No results after search */}
          {!loading && !error && hasSearched && filteredProps.length === 0 && (
            <div className="text-center py-20">
              <p className="text-stone-500 font-light text-lg mb-2">No residences match your search.</p>
              <p className="text-stone-400 text-sm mb-6">Try adjusting your location, room type or guest count.</p>
              <button onClick={clearSearch} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600">
                Show all properties
              </button>
            </div>
          )}

          {/* Empty initial state */}
          {!loading && !error && properties.length === 0 && (
            <div className="text-center py-20">
              <p className="text-stone-500 font-light">No residences available at the moment.</p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && displayedProperties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
              {displayedProperties.map((property, idx) => (
                <Link
                  to={`/booking/${property.id}`}
                  key={property.id || idx}
                  className="block group relative overflow-hidden rounded-sm transition-all duration-300"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      src={getImageSrc(property.cover_image || property.images?.[0])}
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-widest">
                        View Details
                      </span>
                    </div>
                    {property.tag && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-bold text-stone-900">
                        {property.tag}
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-stone-900 text-lg font-serif leading-tight group-hover:text-stone-700 transition-colors">
                          {property.name}
                        </h3>
                        <p className="text-stone-500 text-xs mt-1 uppercase tracking-wide flex items-center gap-1">
                          <FaMapMarkerAlt className="text-[10px]" /> {property.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-stone-900 text-sm font-medium">Ksh {property.price?.toLocaleString()}</p>
                        <p className="text-stone-400 text-[10px] mt-1 uppercase">per night</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center text-xs text-stone-400 gap-4">
                      <span>⭐ {property.rating || "New"}</span>
                      <span>🛏 {property.rooms || property.bedrooms || "1"} Bed</span>
                      {property.max_guests && <span>👤 Up to {property.max_guests}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && !error && visibleCount < filteredProps.length && (
            <div className="mt-16 text-center">
              <button
                onClick={() => setVisibleCount(c => c + 4)}
                className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          EDITORIAL FEATURES
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#EBE5DE] relative z-10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl text-stone-900 mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Standard of <br /><i>Exceptional</i> Living.
            </h2>
            <p className="text-stone-600 mb-8 max-w-md font-light leading-relaxed">
              We don't just offer beds; we curate environments. Each home is selected for its architectural merit, location, and ability to provide a serene escape from the mundane.
            </p>
            <div className="space-y-8">
              {premiumFeatures.map((f) => (
                <div key={f.id} className="flex gap-6 items-start group">
                  <span className="text-stone-400 font-serif text-2xl group-hover:text-stone-900 transition-colors">{f.number}</span>
                  <div>
                    <h4 className="text-stone-900 font-medium uppercase text-xs tracking-widest mb-2">{f.title}</h4>
                    <p className="text-stone-600 text-sm font-light leading-relaxed max-w-sm">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      {/* ═══════════════════════════════════════════════════════
          REVIEWS
      ═══════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#f7f5f2] border-t border-stone-200">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl text-center mb-12 font-serif text-stone-900">Information</h2>
          <div className="divide-y divide-stone-200">
            {faqData.map((faq) => (
              <div key={faq.id} className="group">
                <button
                  onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  className="w-full py-6 flex justify-between items-center text-left hover:text-stone-900 transition-colors"
                >
                  <span className="text-sm uppercase tracking-widest font-medium text-stone-700 group-hover:text-stone-900 transition-colors">{faq.question}</span>
                  <span className="font-serif italic text-stone-400 text-xl">{openFaq === faq.id ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {openFaq === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
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

      {/* ═══════════════════════════════════════════════════════
          CTA FOOTER
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-stone-900 text-[#f5f2ee] text-center px-6 relative z-10">
        <h2 className="text-4xl md:text-6xl font-serif mb-6">Ready to Book?</h2>
        <p className="text-stone-400 max-w-lg mx-auto mb-10 font-light">Experience the finest homes Kenya has to offer. Book your sanctuary today.</p>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => propertiesRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-8 py-3 bg-[#f5f2ee] text-stone-900 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors"
          >
            Browse Properties
          </button>
          <Link to="/management" className="px-8 py-3 border border-stone-700 text-[#f5f2ee] text-xs uppercase tracking-widest font-bold hover:border-[#f5f2ee] transition-colors">
            Our Services
          </Link>
        </div>
      </section>

      {/* Floating action */}
      <motion.a
        href="mailto:hello@homesbymwema.com"
        className="fixed bottom-8 right-8 z-50 bg-stone-900 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        title="Contact us"
      >
        <span className="text-2xl">✉</span>
      </motion.a>
    </div>
  );
}