import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaSearch, FaMapMarkerAlt, FaBed, FaBath, FaUserFriends,
  FaChevronDown, FaTimes, FaFilter, FaThLarge, FaMap,
  FaSlidersH, FaStar, FaWifi, FaParking, FaUtensils, FaTv
} from 'react-icons/fa';
import api from '../services/api';
import PropertyCard, { PropertyCardSkeleton } from '../components/PropertyCard';
import GoogleMap from '../components/GoogleMap';

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

const AMENITIES_LIST = [
  { id: "wifi", label: "WiFi", icon: <FaWifi /> },
  { id: "parking", label: "Free Parking", icon: <FaParking /> },
  { id: "kitchen", label: "Kitchen", icon: <FaUtensils /> },
  { id: "tv", label: "Smart TV", icon: <FaTv /> },
];

const SKELETON_COUNT = 8;

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "map"
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showFiltersSidebar, setShowFiltersSidebar] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: -1.286389, lng: 36.817223 });

  // Filter state
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0]);
  const [selectedPrice, setSelectedPrice] = useState(PRICE_RANGES[0]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [minGuests, setMinGuests] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Dropdown states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  
  // Refs
  const locationRef = useRef(null);
  const roomRef = useRef(null);
  const priceRef = useRef(null);
  const guestRef = useRef(null);
  
  const [visibleCount, setVisibleCount] = useState(12);
  const itemsPerPage = 12;

  // ── fetch properties ──
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.properties.getAll();
        const data = res.data || [];
        setProperties(data);
        setFilteredProperties(data);
        
        const uniqueLocations = [
          "All Locations",
          ...new Set(data.map(p => p.location).filter(Boolean)),
        ];
        setLocations(uniqueLocations);
        
        // Calculate map center based on properties with coordinates
        const propertiesWithCoords = data.filter(p => p.latitude && p.longitude);
        if (propertiesWithCoords.length > 0) {
          const avgLat = propertiesWithCoords.reduce((sum, p) => sum + p.latitude, 0) / propertiesWithCoords.length;
          const avgLng = propertiesWithCoords.reduce((sum, p) => sum + p.longitude, 0) / propertiesWithCoords.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        setError("Unable to load properties. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  // ── close dropdowns on outside click ──
  useEffect(() => {
    const handler = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocationDropdown(false);
      if (roomRef.current && !roomRef.current.contains(e.target)) setShowRoomDropdown(false);
      if (priceRef.current && !priceRef.current.contains(e.target)) setShowPriceDropdown(false);
      if (guestRef.current && !guestRef.current.contains(e.target)) setShowGuestDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── filter properties ──
  useEffect(() => {
    let results = [...properties];

    if (selectedLocation !== "All Locations") {
      results = results.filter(p => p.location === selectedLocation);
    }
    
    if (selectedRoom.value !== "any") {
      results = results.filter(p => {
        const beds = p.rooms ?? p.bedrooms ?? 0;
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
    
    if (minGuests > 1) {
      results = results.filter(p => (p.max_guests ?? 99) >= minGuests);
    }
    
    if (selectedAmenities.length > 0) {
      results = results.filter(p => {
        const amenities = p.amenities || [];
        return selectedAmenities.every(a => amenities.includes(a));
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
  }, [selectedLocation, selectedRoom, selectedPrice, selectedAmenities, minGuests, searchQuery, properties]);

  const clearFilters = () => {
    setSelectedLocation("All Locations");
    setSelectedRoom(ROOM_OPTIONS[0]);
    setSelectedPrice(PRICE_RANGES[0]);
    setSelectedAmenities([]);
    setMinGuests(1);
    setSearchQuery("");
  };

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(a => a !== amenityId)
        : [...prev, amenityId]
    );
  };

  const activeFilterCount = [
    selectedLocation !== "All Locations",
    selectedRoom.value !== "any",
    selectedPrice.label !== "Any",
    minGuests > 1,
    selectedAmenities.length > 0,
    searchQuery !== "",
  ].filter(Boolean).length;

  const displayedProperties = filteredProperties.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProperties.length;

  // Prepare map markers
  const mapMarkers = filteredProperties
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      title: p.name,
      price: p.price,
      image: p.cover_image,
    }));

  return (
    <div className="min-h-screen bg-[#F5F2EE] pt-28 pb-20">
      <style>{`
        .dropdown-scroll::-webkit-scrollbar { width: 4px; }
        .dropdown-scroll::-webkit-scrollbar-track { background: #f1f1f1; }
        .dropdown-scroll::-webkit-scrollbar-thumb { background: #ED9B40; border-radius: 4px; }
        .filter-sidebar {
          transition: transform 0.3s ease;
        }
        @media (max-width: 1024px) {
          .filter-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            background: white;
            transform: translateX(-100%);
          }
          .filter-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-2">
            Discover <span className="italic font-light text-stone-500">our homes</span>
          </h1>
          <p className="text-stone-500">
            {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'} available
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search by name, location, or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#ED9B40] transition-colors"
              />
            </div>

            {/* Filter Toggles - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Location Filter */}
              <div className="relative" ref={locationRef}>
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="flex items-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl hover:border-[#ED9B40] transition-colors"
                >
                  <FaMapMarkerAlt className="text-[#ED9B40]" />
                  <span className="text-sm">{selectedLocation === "All Locations" ? "Location" : selectedLocation}</span>
                  <FaChevronDown className={`text-stone-400 text-xs transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showLocationDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-100 z-50 max-h-64 overflow-y-auto"
                    >
                      {locations.map(loc => (
                        <button
                          key={loc}
                          onClick={() => { setSelectedLocation(loc); setShowLocationDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedLocation === loc ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}
                        >
                          {loc}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Room Filter */}
              <div className="relative" ref={roomRef}>
                <button
                  onClick={() => setShowRoomDropdown(!showRoomDropdown)}
                  className="flex items-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl hover:border-[#ED9B40] transition-colors"
                >
                  <FaBed className="text-[#ED9B40]" />
                  <span className="text-sm">{selectedRoom.label}</span>
                  <FaChevronDown className={`text-stone-400 text-xs transition-transform ${showRoomDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showRoomDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-stone-100 z-50"
                    >
                      {ROOM_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { setSelectedRoom(opt); setShowRoomDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedRoom.value === opt.value ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Filter */}
              <div className="relative" ref={priceRef}>
                <button
                  onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                  className="flex items-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl hover:border-[#ED9B40] transition-colors"
                >
                  <span className="text-[#ED9B40] font-medium">Ksh</span>
                  <span className="text-sm">{selectedPrice.label}</span>
                  <FaChevronDown className={`text-stone-400 text-xs transition-transform ${showPriceDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showPriceDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-100 z-50"
                    >
                      {PRICE_RANGES.map(range => (
                        <button
                          key={range.label}
                          onClick={() => { setSelectedPrice(range); setShowPriceDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${selectedPrice.label === range.label ? 'text-[#ED9B40] bg-stone-50' : 'text-stone-700'}`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Guests Filter */}
              <div className="relative" ref={guestRef}>
                <button
                  onClick={() => setShowGuestDropdown(!showGuestDropdown)}
                  className="flex items-center gap-2 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl hover:border-[#ED9B40] transition-colors"
                >
                  <FaUserFriends className="text-[#ED9B40]" />
                  <span className="text-sm">{minGuests === 1 ? "Any guests" : `${minGuests}+ guests`}</span>
                  <FaChevronDown className={`text-stone-400 text-xs transition-transform ${showGuestDropdown ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showGuestDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-100 z-50 p-3"
                    >
                      <p className="text-xs text-stone-500 mb-2">Minimum guests</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setMinGuests(Math.max(1, minGuests - 1))}
                          className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center"
                        >-</button>
                        <span className="text-lg font-medium w-8 text-center">{minGuests}</span>
                        <button
                          onClick={() => setMinGuests(minGuests + 1)}
                          className="w-8 h-8 rounded-full border border-stone-300 flex items-center justify-center"
                        >+</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile: Filter and View Toggle */}
            <div className="flex lg:hidden gap-3">
              <button
                onClick={() => setShowFiltersSidebar(true)}
                className="flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-xl"
              >
                <FaFilter />
                <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "map" : "grid")}
                className="flex items-center gap-2 px-5 py-3 border border-stone-200 bg-white rounded-xl"
              >
                {viewMode === "grid" ? <FaMap /> : <FaThLarge />}
                <span>{viewMode === "grid" ? "Map View" : "Grid View"}</span>
              </button>
            </div>

            {/* Desktop: View Toggle */}
            <div className="hidden lg:flex items-center gap-2 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-xl transition-colors ${viewMode === "grid" ? 'bg-[#ED9B40] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <FaThLarge />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-3 rounded-xl transition-colors ${viewMode === "map" ? 'bg-[#ED9B40] text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <FaMap />
              </button>
              
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-stone-500 hover:text-stone-900 underline ml-2"
                >
                  Clear all ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area - Grid or Map View */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-stone-200 p-5 sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-800">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-[#ED9B40] hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              {/* Amenities Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-stone-700 mb-3">Amenities</h4>
                <div className="space-y-2">
                  {AMENITIES_LIST.map(amenity => (
                    <label key={amenity.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="w-4 h-4 rounded border-stone-300 text-[#ED9B40] focus:ring-[#ED9B40]"
                      />
                      <span className="flex items-center gap-2 text-sm text-stone-600">
                        {amenity.icon}
                        {amenity.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Guests Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-stone-700 mb-3">Minimum guests</h4>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setMinGuests(Math.max(1, minGuests - 1))}
                    className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#ED9B40]"
                  >-</button>
                  <span className="text-xl font-medium w-12 text-center">{minGuests}</span>
                  <button
                    onClick={() => setMinGuests(minGuests + 1)}
                    className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#ED9B40]"
                  >+</button>
                </div>
              </div>

              {/* Price Range Info */}
              <div className="pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400">
                  {filteredProperties.length} properties match your criteria
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {/* Results Count */}
            {!loading && (
              <div className="mb-4 text-sm text-stone-500">
                Showing {Math.min(visibleCount, filteredProperties.length)} of {filteredProperties.length} properties
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" && (
              <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-sm">
                <div className="h-[600px] relative">
                  <GoogleMap
                    location="Nairobi, Kenya"
                    propertyTitle="Properties Map"
                    coordinates={mapCenter}
                  />
                  {/* Marker Popup would need custom implementation */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg text-sm">
                    <FaMapMarkerAlt className="inline text-[#ED9B40] mr-1" />
                    {filteredProperties.length} properties on map
                  </div>
                </div>
                <div className="p-4 border-t border-stone-100">
                  <p className="text-sm text-stone-600 text-center">
                    Click on any property marker to see details and availability
                  </p>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <>
                {error && !loading && (
                  <div className="text-center py-20 bg-white rounded-xl">
                    <p className="text-stone-500 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="text-sm underline">
                      Try Again
                    </button>
                  </div>
                )}

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

                {/* Property Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-5 gap-y-10">
                  {loading
                    ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <PropertyCardSkeleton key={i} />)
                    : displayedProperties.map((property, idx) => (
                        <PropertyCard key={property.id || idx} property={property} idx={idx} />
                      ))
                  }
                </div>

                {/* Load More */}
                {!loading && hasMore && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setVisibleCount(c => c + itemsPerPage)}
                      className="px-8 py-3 bg-white border border-stone-300 rounded-full hover:border-[#ED9B40] hover:text-[#ED9B40] transition-colors text-sm font-medium"
                    >
                      Load more properties
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sidebar */}
      <AnimatePresence>
        {showFiltersSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[1000] lg:hidden"
            onClick={() => setShowFiltersSidebar(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween' }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="font-medium text-stone-800">Filters</h3>
                <button onClick={() => setShowFiltersSidebar(false)} className="p-2">
                  <FaTimes />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full p-3 border border-stone-200 rounded-xl"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Room Type */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">Room Type</label>
                  <select
                    value={selectedRoom.value}
                    onChange={(e) => {
                      const opt = ROOM_OPTIONS.find(o => o.value === e.target.value);
                      if (opt) setSelectedRoom(opt);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-xl"
                  >
                    {ROOM_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">Price Range</label>
                  <select
                    value={selectedPrice.label}
                    onChange={(e) => {
                      const range = PRICE_RANGES.find(r => r.label === e.target.value);
                      if (range) setSelectedPrice(range);
                    }}
                    className="w-full p-3 border border-stone-200 rounded-xl"
                  >
                    {PRICE_RANGES.map(range => (
                      <option key={range.label} value={range.label}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">Amenities</label>
                  <div className="space-y-2">
                    {AMENITIES_LIST.map(amenity => (
                      <label key={amenity.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(amenity.id)}
                          onChange={() => toggleAmenity(amenity.id)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="flex items-center gap-2 text-sm">{amenity.icon}{amenity.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <label className="text-sm font-medium text-stone-700 block mb-2">Minimum Guests</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setMinGuests(Math.max(1, minGuests - 1))}
                      className="w-10 h-10 rounded-full border border-stone-300"
                    >-</button>
                    <span className="text-xl font-medium w-12 text-center">{minGuests}</span>
                    <button
                      onClick={() => setMinGuests(minGuests + 1)}
                      className="w-10 h-10 rounded-full border border-stone-300"
                    >+</button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { clearFilters(); setShowFiltersSidebar(false); }}
                    className="flex-1 py-3 border border-stone-200 rounded-xl text-sm"
                  >
                    Reset all
                  </button>
                  <button
                    onClick={() => setShowFiltersSidebar(false)}
                    className="flex-1 py-3 bg-[#ED9B40] text-white rounded-xl text-sm font-medium"
                  >
                    Apply ({activeFilterCount})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Properties;