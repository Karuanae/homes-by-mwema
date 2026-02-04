// admindashboard.jsx - COMPLETE SIMPLIFIED VERSION
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaBuilding,
  FaCalendarAlt,
  FaUsers,
  FaEnvelope,
  FaSignOutAlt,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSync,
  FaEye,
  FaSearch,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMapMarkerAlt,
  FaUpload,
  FaImage,
  FaCamera
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_properties: 0,
    active_bookings: 0,
    total_users: 0,
    total_revenue: 0,
  });

  // Data States
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Modal States
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(null);

  // Upload States
  const [uploading, setUploading] = useState(false);

  // Form State - Simplified approach
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "studio",
    price: "",
    location: "",
    description: "",
    coverImage: null,        // File object
    coverPreview: "",        // Preview URL (blob)
    galleryImages: [],       // Array of File objects
    galleryPreviews: [],     // Array of preview URLs
    amenities: [],
    rooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: "",
  });

  // Predefined amenities with icons
  const predefinedAmenities = [
    { label: 'WiFi', value: 'wifi', icon: '📶' },
    { label: 'Pool', value: 'pool', icon: '🏊' },
    { label: 'Parking', value: 'parking', icon: '🅿️' },
    { label: 'AC', value: 'ac', icon: '❄️' },
    { label: 'Kitchen', value: 'kitchen', icon: '👨‍🍳' },
    { label: 'TV', value: 'tv', icon: '📺' },
    { label: 'Gym', value: 'gym', icon: '💪' },
    { label: 'Spa', value: 'spa', icon: '🧖' },
    { label: 'Concierge', value: 'concierge', icon: '🎩' },
    { label: 'Security', value: 'security', icon: '👮' },
    { label: 'Laundry', value: 'laundry', icon: '👕' },
    { label: 'Breakfast', value: 'breakfast', icon: '🍳' },
    { label: 'Elevator', value: 'elevator', icon: '⬆️' },
    { label: 'Fireplace', value: 'fireplace', icon: '🔥' },
    { label: 'BBQ Grill', value: 'bbq', icon: '🍖' },
    { label: 'Balcony', value: 'balcony', icon: '🌇' },
  ];

  // Clean up blob URLs when component unmounts or modal closes
  const cleanupBlobUrls = useCallback(() => {
    if (newProperty.coverPreview && newProperty.coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(newProperty.coverPreview);
    }
    newProperty.galleryPreviews.forEach(url => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }, [newProperty.coverPreview, newProperty.galleryPreviews]);

  useEffect(() => {
    fetchStats();
    fetchProperties();
    fetchBookings();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      cleanupBlobUrls();
    };
  }, [cleanupBlobUrls]);

  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats();
      if (response.data) {
        setStats({
          total_properties: response.data.total_properties || 0,
          active_bookings: response.data.active_bookings || 0,
          total_users: response.data.total_users || 0,
          total_revenue: response.data.total_revenue || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.properties.getAll();
      setProperties(response.data || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.admin.getBookings();
      setBookings(response.data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.admin.getUsers();
      const users = response.data || [];
      const customerList = users.filter(u => u.role !== 'admin');
      setCustomers(customerList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await api.chats.getUserChats();
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteProperty = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await api.admin.deleteProperty(id);
        fetchProperties();
        fetchStats();
      } catch (error) {
        alert("Error deleting property: " + (error.response?.data?.error || error.message));
      }
    }
  };

  // SIMPLIFIED: Single API call with FormData
  const handleAddProperty = async () => {
    try {
      setUploading(true);
      
      // Prepare FormData with everything
      const formData = new FormData();
      
      // Add property data
      formData.append('name', newProperty.name);
      formData.append('type', newProperty.type);
      formData.append('price', newProperty.price);
      formData.append('location', newProperty.location);
      formData.append('description', newProperty.description);
      formData.append('rooms', newProperty.rooms);
      formData.append('bathrooms', newProperty.bathrooms);
      formData.append('maxGuests', newProperty.maxGuests);
      formData.append('area', newProperty.area);
      formData.append('amenities', JSON.stringify(newProperty.amenities));
      formData.append('specs', JSON.stringify({
        guests: newProperty.maxGuests,
        bedrooms: newProperty.rooms,
        beds: newProperty.rooms,
        bathrooms: newProperty.bathrooms
      }));
      formData.append('tags', JSON.stringify([]));
      
      // Add cover image if exists
      if (newProperty.coverImage) {
        formData.append('coverImage', newProperty.coverImage);
      }
      
      // Add gallery images
      newProperty.galleryImages.forEach((image, index) => {
        if (image) {
          formData.append('galleryImages', image);
        }
      });
      
      // Single API call to create property with images
      const response = await api.admin.createPropertyWithImages(formData);
      
      // Clean up blob URLs
      cleanupBlobUrls();
      
      setShowAddProperty(false);
      resetPropertyForm();
      fetchProperties();
      fetchStats();
      
    } catch (error) {
      alert("Error adding property: " + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (property) => {
    // For editing, we'll use a different approach
    setNewProperty({
      name: property.name,
      type: property.type,
      price: property.price,
      location: property.location,
      description: property.description || "",
      coverImage: null,
      coverPreview: property.cover_image || "",
      galleryImages: [],
      galleryPreviews: property.images?.slice(1) || [],
      amenities: property.amenities || [],
      rooms: property.rooms || 1,
      bathrooms: property.bathrooms || 1,
      maxGuests: property.max_guests || 2,
      area: property.area || ""
    });
    setShowEditProperty(property.id);
  };

  const updateProperty = async () => {
    try {
      // For updates, we can send updated property data
      const propertyData = {
        name: newProperty.name,
        title: newProperty.name,
        type: newProperty.type,
        price: parseFloat(newProperty.price),
        location: newProperty.location,
        description: newProperty.description,
        amenities: newProperty.amenities,
        bedrooms: newProperty.rooms,
        bathrooms: newProperty.bathrooms,
        max_guests: newProperty.maxGuests,
        area: newProperty.area,
        specs: {
          guests: newProperty.maxGuests,
          bedrooms: newProperty.rooms,
          beds: newProperty.rooms,
          bathrooms: newProperty.bathrooms
        }
      };

      await api.admin.updateProperty(showEditProperty, propertyData);

      // If there are new images, upload them separately
      if (newProperty.coverImage || newProperty.galleryImages.length > 0) {
        const imageFormData = new FormData();
        if (newProperty.coverImage) {
          imageFormData.append('coverImage', newProperty.coverImage);
        }
        newProperty.galleryImages.forEach(image => {
          if (image) {
            imageFormData.append('galleryImages', image);
          }
        });
        
        await api.admin.addPropertyImages(showEditProperty, imageFormData);
      }

      // Clean up blob URLs
      cleanupBlobUrls();

      setShowEditProperty(null);
      resetPropertyForm();
      fetchProperties();
      
    } catch (error) {
      alert("Error updating property: " + (error.response?.data?.error || error.message));
    }
  };

  const resetPropertyForm = () => {
    // Clean up any existing blob URLs
    cleanupBlobUrls();
    
    setNewProperty({
      name: "",
      type: "studio",
      price: "",
      location: "",
      description: "",
      coverImage: null,
      coverPreview: "",
      galleryImages: [],
      galleryPreviews: [],
      amenities: [],
      rooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      area: "",
    });
  };

  // Simple image handlers - just store Files and create previews
  const handleCoverImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Clean up previous preview if exists
    if (newProperty.coverPreview && newProperty.coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(newProperty.coverPreview);
    }
    
    // Create preview URL for UI only
    const previewUrl = URL.createObjectURL(file);
    setNewProperty({...newProperty, 
      coverImage: file,
      coverPreview: previewUrl
    });
  };

  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Create previews for UI
    const previewUrls = files.map(file => URL.createObjectURL(file));
    
    setNewProperty({
      ...newProperty,
      galleryImages: [...newProperty.galleryImages, ...files],
      galleryPreviews: [...newProperty.galleryPreviews, ...previewUrls]
    });
  };

  const removeGalleryImage = (index) => {
    // Clean up the blob URL
    const removedUrl = newProperty.galleryPreviews[index];
    if (removedUrl && removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
    }
    
    // Update arrays
    const updatedImages = [...newProperty.galleryImages];
    const updatedPreviews = [...newProperty.galleryPreviews];
    
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    setNewProperty({
      ...newProperty,
      galleryImages: updatedImages,
      galleryPreviews: updatedPreviews
    });
  };

  const removeCoverImage = () => {
    // Clean up blob URL
    if (newProperty.coverPreview && newProperty.coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(newProperty.coverPreview);
    }
    
    setNewProperty({
      ...newProperty,
      coverImage: null,
      coverPreview: ""
    });
  };

  const toggleAmenity = (amenityValue) => {
    const currentAmenities = newProperty.amenities;
    const updatedAmenities = currentAmenities.includes(amenityValue)
      ? currentAmenities.filter(a => a !== amenityValue)
      : [...currentAmenities, amenityValue];
    
    setNewProperty({...newProperty, amenities: updatedAmenities});
  };

  const addCustomAmenity = () => {
    const input = document.getElementById('custom-amenity-input');
    if (input && input.value.trim()) {
      const value = input.value.trim();
      if (!newProperty.amenities.includes(value)) {
        setNewProperty({
          ...newProperty,
          amenities: [...newProperty.amenities, value]
        });
      }
      input.value = '';
    }
  };

  const removeAmenity = (index) => {
    const updated = [...newProperty.amenities];
    updated.splice(index, 1);
    setNewProperty({...newProperty, amenities: updated});
  };

  // Helper function to get image URL for display
  const getImageUrl = (property) => {
    if (property.cover_image) {
      return property.cover_image;
    }
    if (property.images && property.images.length > 0) {
      return property.images[0];
    }
    // Data URL placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNjY2MiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: FaHome },
    { id: "properties", label: "Properties", icon: FaBuilding },
    { id: "bookings", label: "Reservations", icon: FaCalendarAlt },
    { id: "customers", label: "Clientele", icon: FaUsers },
    { id: "messages", label: "Concierge", icon: FaEnvelope },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-serif text-stone-600 tracking-widest uppercase text-sm">Loading Estate Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F9F8F6] font-sans text-stone-800 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#1C2321] text-[#E5E5E0] flex flex-col shadow-2xl z-20">
        <div className="p-10 border-b border-stone-700/50">
          <h1 className="text-2xl font-serif tracking-wider text-white">
            MWEMA<span className="text-stone-400">.</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-2">Estate Administration</p>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-600 scrollbar-track-transparent hover:scrollbar-thumb-stone-500">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-500 ease-out group ${
                activeTab === item.id
                  ? "bg-white/5 text-white border-r-2 border-[#D4AF37]"
                  : "text-stone-400 hover:text-stone-100 hover:bg-white/[0.02]"
              }`}
            >
              <item.icon className={`text-lg transition-transform duration-500 ${activeTab === item.id ? "scale-110 text-[#D4AF37]" : "group-hover:text-stone-300"}`} />
              <span className={`font-serif tracking-wide ${activeTab === item.id ? "font-medium" : "font-light"}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-stone-700/50 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-sm">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <span className="text-sm text-stone-300">{user?.name || 'Admin'}</span>
          </div>
          
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 text-stone-400 hover:text-white transition-colors uppercase tracking-widest text-xs py-2"
          >
            <FaHome /> Back to Home
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-stone-400 hover:text-red-300 transition-colors uppercase tracking-widest text-xs py-2"
          >
            <FaSignOutAlt /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 relative">
        <header className="flex justify-between items-end mb-12 border-b border-stone-200 pb-6">
          <div>
            <h2 className="text-4xl font-serif text-[#1C2321] mb-2">
              {navItems.find((item) => item.id === activeTab)?.label}
            </h2>
            <p className="text-stone-500 font-serif italic">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="relative group">
                <FaSearch className="absolute left-0 top-3 text-stone-400" />
                <input 
                    type="text" 
                    placeholder="Search records..." 
                    className="pl-8 pr-4 py-2 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none w-64 transition-all placeholder-stone-400 text-stone-800"
                />
             </div>
             <div className="w-10 h-10 rounded-full bg-[#1C2321] text-[#D4AF37] flex items-center justify-center font-serif text-lg">
                A
             </div>
          </div>
        </header>

        {/* Dashboard Overview */}
        {activeTab === "dashboard" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Total Properties", value: stats.total_properties, icon: FaBuilding },
                { label: "Active Reservations", value: stats.active_bookings, icon: FaCalendarAlt },
                { label: "Total Clientele", value: stats.total_users, icon: FaUsers },
                { label: "Revenue (YTD)", value: `Ksh ${stats.total_revenue.toLocaleString()}`, icon: null },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-8 border border-stone-100 shadow-sm hover:shadow-md transition-shadow duration-500">
                  <div className="flex justify-between items-start mb-4">
                     <p className="text-xs uppercase tracking-widest text-stone-500 font-medium">{stat.label}</p>
                     {stat.icon && <stat.icon className="text-stone-300 text-xl" />}
                  </div>
                  <h3 className="text-3xl font-serif text-[#1C2321]">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 bg-white p-8 border border-stone-100 shadow-sm">
                    <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Performance Overview</h3>
                    <div className="h-64 flex items-center justify-center bg-[#F9F8F6] text-stone-400 italic font-serif">
                        Chart integration requires visualization library
                    </div>
                </div>
                <div className="bg-white p-8 border border-stone-100 shadow-sm">
                    <h3 className="font-serif text-xl text-[#1C2321] mb-6 border-b border-stone-100 pb-4">Recent Inquiries</h3>
                    <div className="space-y-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3 pb-3 border-b border-stone-50 last:border-0">
                                <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
                                <div>
                                    <p className="text-sm font-medium text-stone-800">New Booking Request</p>
                                    <p className="text-xs text-stone-500">Villa Serenity • 2 mins ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </motion.div>
        )}

        {/* Properties Tab */}
        {activeTab === "properties" && (
          <div className="space-y-8">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddProperty(true)}
                className="bg-[#1C2321] text-white px-8 py-3 hover:bg-[#2C3632] transition-colors duration-300 flex items-center gap-2 uppercase tracking-widest text-xs font-medium"
              >
                <FaPlus /> Add Residence
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white group cursor-pointer border border-stone-100 hover:border-stone-300 transition-all duration-500"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getImageUrl(property)}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85] group-hover:saturate-100"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300";
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1">
                      <span className="text-xs font-serif font-bold tracking-wide text-[#1C2321]">
                        Ksh {property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-serif text-xl text-[#1C2321] mb-2">{property.name}</h3>
                    <div className="flex items-center gap-1 text-stone-500 text-xs tracking-wide uppercase mb-4">
                        <FaMapMarkerAlt /> {property.location}
                    </div>
                    
                    <div className="flex items-center justify-between py-4 border-t border-b border-stone-100 text-stone-600 text-sm">
                        <span className="flex items-center gap-2"><FaBed className="text-stone-400"/> {property.rooms}</span>
                        <span className="flex items-center gap-2"><FaBath className="text-stone-400"/> {property.bathrooms}</span>
                        <span className="flex items-center gap-2"><FaRulerCombined className="text-stone-400"/> {property.area || 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-2">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                        property.status === 'booked' 
                            ? 'border-stone-300 text-stone-400' 
                            : 'border-[#1C2321] text-[#1C2321]'
                      }`}>
                        {property.status || 'Available'}
                      </span>
                      
                      <div className="flex gap-4">
                        <button 
                            onClick={() => handleEditClick(property)}
                            className="text-stone-400 hover:text-[#1C2321] transition-colors"
                        >
                            <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteProperty(property.id)}
                          className="text-stone-400 hover:text-red-800 transition-colors"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings/Reservations Tab */}
        {activeTab === "bookings" && (
            <div className="bg-white border border-stone-100 p-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-[#1C2321]">
                            {["Property", "Guest", "Dates", "Status", "Amount", "Actions"].map(head => (
                                <th key={head} className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">{head}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-stone-600">
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors">
                                <td className="py-6 px-4">
                                    <p className="font-serif text-[#1C2321] text-lg">{booking.property_name}</p>
                                    <p className="text-xs uppercase tracking-widest text-stone-400">ID: {booking.id}</p>
                                </td>
                                <td className="py-6 px-4">
                                    <p className="font-medium">{booking.guest_name}</p>
                                    <p className="text-sm font-light text-stone-400">{booking.email}</p>
                                </td>
                                <td className="py-6 px-4 font-light text-sm">
                                    {booking.check_in} — {booking.check_out}
                                </td>
                                <td className="py-6 px-4">
                                    <span className={`text-xs uppercase tracking-widest font-medium ${
                                        booking.status === 'confirmed' ? 'text-[#1C2321]' : 
                                        booking.status === 'pending' ? 'text-[#D4AF37]' : 'text-stone-400'
                                    }`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="py-6 px-4 font-serif text-lg">
                                    Ksh {booking.total_amount?.toLocaleString()}
                                </td>
                                <td className="py-6 px-4">
                                    <button className="text-stone-400 hover:text-[#1C2321] uppercase text-xs tracking-widest">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && (
                    <div className="text-center py-20">
                        <FaCalendarAlt className="text-4xl text-stone-200 mx-auto mb-4" />
                        <p className="font-serif text-stone-400 italic">No reservations found in the registry.</p>
                    </div>
                )}
            </div>
        )}

        {/* Clientele Tab */}
        {activeTab === "customers" && (
           <div className="bg-white border border-stone-100 p-8">
              {customers.length === 0 ? (
                <div className="text-center py-20">
                    <FaUsers className="text-4xl text-stone-200 mx-auto mb-4" />
                    <p className="font-serif text-stone-400 italic">Registry is currently empty.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-[#1C2321]">
                            <th className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">Identity</th>
                            <th className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">Contact</th>
                            <th className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">Role</th>
                            <th className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">Member Since</th>
                            <th className="py-4 px-4 font-serif text-[#1C2321] text-lg font-normal">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id} className="border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors">
                                <td className="py-6 px-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#1C2321] text-white flex items-center justify-center font-serif text-sm">
                                            {customer.name?.charAt(0) || customer.email?.charAt(0)}
                                        </div>
                                        <span className="font-serif text-[#1C2321]">{customer.name}</span>
                                    </div>
                                </td>
                                <td className="py-6 px-4 text-stone-600 font-light">{customer.email}</td>
                                <td className="py-6 px-4">
                                    <span className="text-xs uppercase tracking-widest border border-stone-200 px-2 py-1 text-stone-500">
                                        {customer.role || 'Guest'}
                                    </span>
                                </td>
                                <td className="py-6 px-4 text-stone-500 font-light text-sm">
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </td>
                                <td className="py-6 px-4">
                                    <button className="text-stone-400 hover:text-[#1C2321]">
                                        <FaEye />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              )}
           </div>
        )}

        {/* Concierge/Messages Tab */}
        {activeTab === "messages" && (
            <div>
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-2xl font-serif text-[#1C2321]">Concierge Desk</h2>
                 <button onClick={fetchMessages} className="text-stone-500 hover:text-[#1C2321] flex items-center gap-2 text-sm uppercase tracking-widest">
                    <FaSync /> Refresh
                 </button>
              </div>

              {loadingMessages ? (
                 <div className="text-center py-20 font-serif italic text-stone-400">Retrieving correspondence...</div>
              ) : messages.length === 0 ? (
                 <div className="bg-white border border-stone-100 p-20 text-center">
                    <FaEnvelope className="text-4xl text-stone-200 mx-auto mb-4" />
                    <p className="font-serif text-stone-400 italic">No pending correspondence.</p>
                 </div>
              ) : (
                <div className="bg-white border border-stone-100">
                    {messages.map((chat) => (
                        <div key={chat.id} className="p-6 border-b border-stone-100 hover:bg-[#F9F8F6] transition-colors flex justify-between items-center cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className={`w-2 h-2 rounded-full ${chat.unread_count > 0 ? 'bg-[#D4AF37]' : 'bg-transparent'}`}></div>
                                <div>
                                    <p className="font-serif text-lg text-[#1C2321]">{chat.user_name || 'Guest'}</p>
                                    <p className="text-sm text-stone-500 font-light truncate max-w-md">{chat.last_message}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-widest text-stone-400 mb-1">
                                    {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : ''}
                                </p>
                                <span className="opacity-0 group-hover:opacity-100 text-xs font-serif italic text-[#1C2321] transition-opacity">
                                    Open thread &rarr;
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
              )}
            </div>
        )}

      </main>

      {/* Add/Edit Property Modal - SIMPLIFIED */}
      <AnimatePresence>
        {(showAddProperty || showEditProperty) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1C2321]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              resetPropertyForm();
              setShowAddProperty(false);
              setShowEditProperty(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F9F8F6] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10 border-b border-stone-200 pb-4">
                  <h3 className="text-3xl font-serif text-[#1C2321]">
                    {showEditProperty ? "Edit Residence" : "New Residence"}
                  </h3>
                  <button
                    onClick={() => {
                      resetPropertyForm();
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                    }}
                    className="text-stone-400 hover:text-[#1C2321] text-2xl font-light"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Basic Information */}
                  {[
                    { label: "Property Name", key: "name", type: "text", placeholder: "e.g. The Kensington Suite" },
                    { label: "Price per Night (Ksh)", key: "price", type: "number", placeholder: "0.00" },
                    { label: "Location", key: "location", type: "text", placeholder: "District, City" },
                    { label: "Floor Area (sq ft)", key: "area", type: "text", placeholder: "e.g. 2,400" },
                  ].map((field) => (
                    <div key={field.key}>
                        <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">{field.label}</label>
                        <input
                            type={field.type}
                            value={newProperty[field.key]}
                            onChange={(e) => setNewProperty({...newProperty, [field.key]: e.target.value})}
                            className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321] placeholder-stone-300 transition-colors"
                            placeholder={field.placeholder}
                        />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Residence Type</label>
                    <select 
                      value={newProperty.type}
                      onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                      className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321]"
                    >
                      <option value="studio">Studio Apartment</option>
                      <option value="1_bedroom">One Bedroom Suite</option>
                      <option value="2_bedroom">Two Bedroom Suite</option>
                      <option value="3_bedroom">Three Bedroom Suite</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="villa">Private Villa</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-3 gap-8">
                    {["rooms", "bathrooms", "maxGuests"].map(k => (
                      <div key={k}>
                          <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                            {k === 'rooms' ? 'Bedrooms' : 
                             k === 'bathrooms' ? 'Bathrooms' : 
                             'Max Guests'}
                          </label>
                          <input
                              type="number"
                              value={newProperty[k]}
                              onChange={(e) => setNewProperty({...newProperty, [k]: parseInt(e.target.value) || 1})}
                              className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-serif text-lg text-[#1C2321]"
                              min="1"
                          />
                      </div>
                    ))}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Description</label>
                    <textarea
                      value={newProperty.description}
                      onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                      className="w-full p-4 bg-white border border-stone-200 focus:border-[#1C2321] outline-none font-sans font-light text-stone-600 leading-relaxed mt-2"
                      placeholder="Detail the property's features and atmosphere..."
                      rows="4"
                    />
                  </div>

                  {/* Amenities Section */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">
                      Amenities
                    </label>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {predefinedAmenities.map((amenity) => (
                        <div key={amenity.value} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`amenity-${amenity.value}`}
                            checked={newProperty.amenities.includes(amenity.value)}
                            onChange={() => toggleAmenity(amenity.value)}
                            className="hidden"
                          />
                          <label
                            htmlFor={`amenity-${amenity.value}`}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full border cursor-pointer transition-all flex-1 justify-center ${
                              newProperty.amenities.includes(amenity.value)
                                ? 'bg-[#1C2321] text-white border-[#1C2321]'
                                : 'bg-white text-stone-600 border-stone-300 hover:border-[#1C2321]'
                            }`}
                          >
                            <span className="text-sm">{amenity.icon}</span>
                            <span className="text-xs font-medium">{amenity.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Custom Amenities Input */}
                    <div className="mt-4">
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Custom Amenities (Add one at a time)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="custom-amenity-input"
                          placeholder="e.g., Fireplace, Wine Cellar"
                          className="flex-1 py-2 px-3 border border-stone-300 rounded focus:border-[#1C2321] outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              e.preventDefault();
                              addCustomAmenity();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addCustomAmenity}
                          className="px-4 py-2 bg-stone-800 text-white rounded hover:bg-[#1C2321] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    {/* Selected Amenities Display */}
                    {newProperty.amenities.length > 0 && (
                      <div className="mt-6">
                        <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">
                          Selected Amenities ({newProperty.amenities.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {newProperty.amenities.map((amenity, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 px-3 py-1 bg-stone-100 rounded-full text-sm text-stone-700"
                            >
                              <span>{amenity}</span>
                              <button
                                type="button"
                                onClick={() => removeAmenity(index)}
                                className="ml-1 text-stone-500 hover:text-red-500 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cover Image Upload - SIMPLIFIED */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">
                      Cover Image <span className="text-stone-400 normal-case">(displayed on Home Page)</span>
                    </label>
                    
                    <div className="flex flex-col gap-4">
                      {/* Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          id="cover-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCoverImageUpload}
                        />
                        <label
                          htmlFor="cover-upload"
                          className="flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#1C2321] transition-colors group"
                        >
                          <FaCamera className="text-stone-400 group-hover:text-[#1C2321]" />
                          <span className="text-stone-600 font-medium">
                            {newProperty.coverPreview ? "Change Cover Image" : "Upload Cover Image"}
                          </span>
                        </label>
                      </div>
                      
                      {/* Preview */}
                      {newProperty.coverPreview && (
                        <div className="relative w-full max-w-md aspect-[16/10] border border-stone-200 rounded-lg overflow-hidden">
                          <img 
                            src={newProperty.coverPreview} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-white text-sm font-medium">Cover Image Preview</span>
                              <button
                                type="button"
                                onClick={removeCoverImage}
                                className="text-white bg-black/50 hover:bg-black/70 w-6 h-6 rounded-full flex items-center justify-center"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Gallery Images Upload - SIMPLIFIED */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-4">
                      Gallery Images <span className="text-stone-400 normal-case">(displayed on Booking Page)</span>
                    </label>
                    
                    {/* Upload Multiple Button */}
                    <div className="mb-6">
                      <input
                        type="file"
                        id="gallery-upload"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryUpload}
                      />
                      <label
                        htmlFor="gallery-upload"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1C2321] text-white rounded-lg cursor-pointer hover:bg-[#2C3632] transition-colors"
                      >
                        <FaUpload />
                        <span>Upload Multiple Images</span>
                      </label>
                      <p className="text-xs text-stone-500 mt-2">
                        {newProperty.galleryPreviews.length} image(s) selected
                      </p>
                    </div>
                    
                    {/* Gallery Grid */}
                    <div className="mb-6">
                      <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">
                        Image Gallery ({newProperty.galleryPreviews.length} images)
                      </p>
                      
                      {newProperty.galleryPreviews.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-lg">
                          <FaImage className="text-4xl text-stone-300 mx-auto mb-3" />
                          <p className="text-stone-400">No gallery images added yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {newProperty.galleryPreviews.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                              <img
                                src={url}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => removeGalleryImage(idx)}
                                  className="text-white bg-red-500 hover:bg-red-600 w-8 h-8 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all"
                                >
                                  <FaTrash className="text-xs" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-6 mt-12 pt-6 border-t border-stone-200">
                  <button
                    onClick={() => {
                      resetPropertyForm();
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                    }}
                    className="px-8 py-3 text-stone-500 hover:text-[#1C2321] transition-colors uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showEditProperty ? updateProperty : handleAddProperty}
                    disabled={!newProperty.name || !newProperty.price || !newProperty.location || uploading}
                    className="px-10 py-3 bg-[#1C2321] text-white hover:bg-[#2C3632] transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs font-medium"
                  >
                    {uploading ? 'Saving...' : showEditProperty ? "Update Residence" : "Save Property"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}