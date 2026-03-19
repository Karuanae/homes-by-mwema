// Properties.jsx - with skeleton loaders and lazy image loading via PropertyCard
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaMapMarkerAlt, FaBed,
  FaChevronDown, FaTimes, FaFilter
} from 'react-icons/fa';
import api from '../services/api';
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard';

const ROOM_OPTIONS = [
  { label: "Any",     value: "any",    minBeds: 0, maxBeds: 99 },
  { label: "Studio",  value: "studio", minBeds: 0, maxBeds: 0  },
  { label: "1 Bed",   value: "1",      minBeds: 1, maxBeds: 1  },
  { label: "2 Bed",   value: "2",      minBeds: 2, maxBeds: 2  },
  { label: "3 Bed",   value: "3",      minBeds: 3, maxBeds: 3  },
  { label: "4+ Beds", value: "4+",     minBeds: 4, maxBeds: 99 },
];

const PRICE_RANGES = [
  { label: "Any",                 min: 0,     max: Infinity },
  { label: "Under Ksh 10,000",   min: 0,     max: 10000    },
  { label: "Ksh 10,000 - 20,000",min: 10000, max: 20000    },
  { label: "Ksh 20,000 - 30,000",min: 20000, max: 30000    },
  { label: "Ksh 30,000 - 50,000",min: 30000, max: 50000    },
  { label: "Ksh 50,000+",        min: 50000, max: Infinity },
];

const SKELETON_COUNT = 8;

const Properties = () => {
  const [properties,         setProperties]         = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [locations,          setLocations]          = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);

  const [selectedLocation,      setSelectedLocation]      = useState("All Locations");
  const [selectedRoom,          setSelectedRoom]          = useState(ROOM_OPTIONS[0]);
  const [selectedPrice,         setSelectedPrice]         = useState(PRICE_RANGES[0]);
  const [searchQuery,           setSearchQuery]           = useState("");
  const [showFilters,           setShowFilters]           = useState(false);
  const [showLocationDropdown,  setShowLocationDropdown]  = useState(false);
  const [showRoomDropdown,      setShowRoomDropdown]      = useState(false);
  const [showPriceDropdown,     setShowPriceDropdown]     = useState(false);

  const locationRef = useRef(null);
  const roomRef     = useRef(null);
  const priceRef    = useRef(null);

  const [visibleCount, setVisibleCount] = useState(8);
  const itemsPerPage = 8;

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res  = await api.properties.getAll();
        const data = res.data || [];
        setProperties(data);
        setFilteredProperties(data);
        const uniqueLocations = [
          "All Locations",
          ...new Set(data.map(p => p.location).filter(Boolean)),
        ];
        setLocations(uniqueLocations);
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Unable to load properties. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // ── close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocationDropdown(false);
      if (roomRef.current     && !roomRef.current.contains(e.target))     setShowRoomDropdown(false);
      if (priceRef.current    && !priceRef.current.contains(e.target))    setShowPriceDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── filter ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let results = [...properties];

    if (selectedLocation !== "All Locations") {
      results = results.filter(p => p.location === selectedLocation);
    }
    if (selectedRoom.value !== "any") {
      results = results.filter(p => {
        const beds     = p.rooms ?? p.bedrooms ?? 0;
        const isStudio = beds === 0 || p.type === "studio";
        if (selectedRoom.value === "studio") return isStudio;
        return beds >= selectedRoom.minBeds && beds <= selectedRoom.maxBeds;
      });
    }
    if (selectedPrice.min > 0 || selectedPrice.max !== Infinity) {
      results = results.filter(p => {
        const price = p.price ?? 0;
        return price >= selectedPrice.min && price <= selectedPrice.max;
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    setFilteredProperties(results);
    setVisibleCount(itemsPerPage);
  }, [selectedLocation, selectedRoom, selectedPrice, searchQuery, properties]);

  const clearFilters = () => {
    setSelectedLocation("All Locations");
    setSelectedRoom(ROOM_OPTIONS[0]);
    setSelectedPrice(PRICE_RANGES[0]);
    setSearchQuery("");
  };

  const displayedProperties = filteredProperties.slice(0, visibleCount);
  const hasMore              = visibleCount < filteredProperties.length;
  const activeFilterCount    = [
    selectedLocation !== "All Locations",
    selectedRoom.value !== "any",
    selectedPrice.label !== "Any",
    searchQuery !== "",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#F5F2EE] pt-32 pb-20">
      <style>{`
        .dropdown-scroll::-webkit-scrollbar { width: 4px; }
        .dropdown-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .dropdown-scroll::-webkit-scrollbar-thumb { background: rgba(237,155,64,0.5); border-radius: 4px; }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover { background: rgba(237,155,64,0.8); }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4">
            Our <span className="italic font-light text-stone-500">Properties</span>
          </h1>
        </div>

        {/* Search + filter bar */}
        <div className="bg-white rounded-xl shadow-lg border border-stone-100 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by name or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#ED9B40] transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-lg"
            >
              <FaFilter />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} md:block mt-4`}>
            <div className="flex flex-wrap items-center gap-4">

              {/* Location */}
              <div className="relative flex-1 min-w-[200px]" ref={locationRef}>
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg hover:border-[#ED9B40] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-[#ED9B40] text-sm" />
                    <span className="text-sm text-stone-700">
                      {selectedLocation === "All Locations" ? "Location" : selectedLocation}
                    </span>
                  </div>
                  <FaChevronDown className={`text-stone-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showLocationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-stone-100 z-50 max-h-60 overflow-y-auto dropdown-scroll"
                    >
                      {locations.map(loc => (
                        <button key={loc} onClick={() => { setSelectedLocation(loc); setShowLocationDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedLocation === loc ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}>
                          {loc}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Room */}
              <div className="relative flex-1 min-w-[150px]" ref={roomRef}>
                <button
                  onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg hover:border-[#ED9B40] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FaBed className="text-[#ED9B40] text-sm" />
                    <span className="text-sm text-stone-700">{selectedRoom.label}</span>
                  </div>
                  <FaChevronDown className={`text-stone-400 transition-transform ${showRoomDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showRoomDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-stone-100 z-50 dropdown-scroll"
                    >
                      {ROOM_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSelectedRoom(opt); setShowRoomDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedRoom.value === opt.value ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price */}
              <div className="relative flex-1 min-w-[180px]" ref={priceRef}>
                <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg hover:border-[#ED9B40] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#ED9B40] text-sm font-medium">Ksh</span>
                    <span className="text-sm text-stone-700">{selectedPrice.label}</span>
                  </div>
                  <FaChevronDown className={`text-stone-400 transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPriceDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-xl border border-stone-100 z-50 dropdown-scroll"
                    >
                      {PRICE_RANGES.map(range => (
                        <button key={range.label} onClick={() => { setSelectedPrice(range); setShowPriceDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedPrice.label === range.label ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}>
                          {range.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2.5 text-sm text-stone-500 hover:text-stone-700 transition-colors">
                  <FaTimes /> <span>Clear all</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="flex justify-between items-center mb-6">
            <p className="text-stone-600">
              <span className="font-medium text-stone-900">{filteredProperties.length}</span> properties found
            </p>
            {filteredProperties.length > 0 && (
              <p className="text-sm text-stone-500">
                Showing {Math.min(visibleCount, filteredProperties.length)} of {filteredProperties.length}
              </p>
            )}
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

        {/* No results */}
        {!loading && !error && filteredProperties.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-stone-100">
            <div className="max-w-md mx-auto">
              <FaSearch className="text-4xl text-stone-300 mx-auto mb-4" />
              <h3 className="text-xl font-serif text-stone-900 mb-2">No properties found</h3>
              <p className="text-stone-500 mb-6">Try adjusting your filters or search criteria</p>
              <button onClick={clearFilters} className="px-6 py-2 bg-[#ED9B40] text-white rounded-lg hover:bg-[#d4882d] transition-colors">
                Clear all filters
              </button>
            </div>
          </div>
        )}

        {/* Grid — skeletons while loading, real cards when ready */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <PropertyCardSkeleton key={i} />)
            : displayedProperties.map((property, idx) => (
                <PropertyCard key={property.id || idx} property={property} idx={idx} />
              ))
          }
        </div>

        {/* Load more */}
        {!loading && hasMore && (
          <div className="mt-16 text-center">
            <button
              onClick={() => setVisibleCount(c => c + itemsPerPage)}
              className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;