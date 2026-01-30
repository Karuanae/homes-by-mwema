import React, { useState, useEffect } from "react";
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
  FaCheck,
  FaTimes
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
    totalProperties: 0,
    activeBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
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

  // Form State
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "studio",
    price: "",
    location: "",
    description: "",
    coverImage: "",
    galleryImages: [],
    amenities: [],
    rooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    area: "",
  });

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

  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats();
      if (response.data) {
        setStats({
          totalProperties: response.data.total_properties || 0,
          activeBookings: response.data.active_bookings || 0,
          totalCustomers: response.data.total_users || 0,
          totalRevenue: response.data.total_revenue || 0,
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
      if (stats.totalProperties === 0 && response.data) {
        setStats(prev => ({ ...prev, totalProperties: response.data.length }));
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await api.admin.getBookings();
      setBookings(response.data || []);
      const activeCount = (response.data || []).filter(b => b.status === 'confirmed' || b.status === 'pending').length;
      const revenue = (response.data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);
      setStats(prev => ({ 
        ...prev, 
        activeBookings: activeCount,
        totalRevenue: revenue 
      }));
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
      setStats(prev => ({ ...prev, totalCustomers: customerList.length }));
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await api.chats.getChats();
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

  const handleAddProperty = async () => {
    try {
      // Combine cover image with gallery images (cover first)
      const allImages = newProperty.coverImage 
        ? [newProperty.coverImage, ...newProperty.galleryImages]
        : newProperty.galleryImages;
      
      const propertyData = {
        name: newProperty.name,
        title: newProperty.name,
        type: newProperty.type,
        price: parseFloat(newProperty.price),
        location: newProperty.location,
        description: newProperty.description,
        images: allImages,
        amenities: newProperty.amenities.map(a => typeof a === 'string' ? { name: a } : a),
        bedrooms: newProperty.rooms,
        bathrooms: newProperty.bathrooms,
        max_guests: newProperty.maxGuests,
        area: newProperty.area,
        specs: {
          bedrooms: newProperty.rooms,
          bathrooms: newProperty.bathrooms,
          guests: newProperty.maxGuests
        }
      };

      await api.admin.createProperty(propertyData);
      
      setShowAddProperty(false);
      resetPropertyForm();
      fetchProperties();
      fetchStats();
    } catch (error) {
      alert("Error adding property: " + (error.response?.data?.error || error.message));
    }
  };

  const handleEditClick = (property) => {
    const images = property.images || [];
    setNewProperty({
      name: property.name,
      type: property.type,
      price: property.price,
      location: property.location,
      description: property.description || "",
      coverImage: images[0] || "",
      galleryImages: images.slice(1) || [],
      amenities: property.amenities || [],
      rooms: property.rooms || property.bedrooms || 1,
      bathrooms: property.bathrooms || 1,
      maxGuests: property.max_guests || property.specs?.guests || 2,
      area: property.area || ""
    });
    setShowEditProperty(property.id);
  };

  const updateProperty = async () => {
    try {
      // Combine cover image with gallery images (cover first)
      const allImages = newProperty.coverImage 
        ? [newProperty.coverImage, ...newProperty.galleryImages]
        : newProperty.galleryImages;
      
      const propertyData = {
        name: newProperty.name,
        title: newProperty.name,
        type: newProperty.type,
        price: parseFloat(newProperty.price),
        location: newProperty.location,
        description: newProperty.description,
        images: allImages,
        amenities: newProperty.amenities.map(a => typeof a === 'string' ? { name: a } : a),
        bedrooms: newProperty.rooms,
        bathrooms: newProperty.bathrooms,
        max_guests: newProperty.maxGuests,
        area: newProperty.area,
        specs: {
          bedrooms: newProperty.rooms,
          bathrooms: newProperty.bathrooms,
          guests: newProperty.maxGuests
        }
      };

      await api.admin.updateProperty(showEditProperty, propertyData);

      setShowEditProperty(null);
      resetPropertyForm();
      fetchProperties();
    } catch (error) {
      alert("Error updating property: " + (error.response?.data?.error || error.message));
    }
  };

  const resetPropertyForm = () => {
    setNewProperty({
      name: "",
      type: "studio",
      price: "",
      location: "",
      description: "",
      coverImage: "",
      galleryImages: [],
      amenities: [],
      rooms: 1,
      bathrooms: 1,
      maxGuests: 2,
      area: "",
    });
  };

  const navItems = [
    { id: "dashboard", label: "Overview", icon: FaHome },
    { id: "properties", label: "Properties", icon: FaBuilding },
    { id: "bookings", label: "Reservations", icon: FaCalendarAlt }, // Changed "Bookings" to "Reservations" for prestige
    { id: "customers", label: "Clientele", icon: FaUsers }, // Changed "Customers" to "Clientele"
    { id: "messages", label: "Concierge", icon: FaEnvelope }, // Changed "Messages" to "Concierge"
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
      {/* Sidebar - "Old Money" Aesthetics: Dark Charcoal/Green background, Serif fonts */}
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
                  ? "bg-white/5 text-white border-r-2 border-[#D4AF37]" // Gold accent border
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
        {/* Background Texture/Grain can be added here via CSS if desired */}
        
        {/* Header Section */}
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
             {/* Search Bar - Minimalist Underline */}
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
            {/* Stats Grid - Card style: White bg, subtle shadow, serif numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: "Total Properties", value: stats.totalProperties, icon: FaBuilding },
                { label: "Active Reservations", value: stats.activeBookings, icon: FaCalendarAlt },
                { label: "Total Clientele", value: stats.totalCustomers, icon: FaUsers },
                { label: "Revenue (YTD)", value: `Ksh ${stats.totalRevenue.toLocaleString()}`, icon: null },
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

            {/* Recent Activity Section Placeholder */}
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
                      src={property.images?.[0] || "https://via.placeholder.com/400x300"}
                      alt={property.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85] group-hover:saturate-100"
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

        {/* Bookings/Reservations Tab - Editorial Table Style */}
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
                                    <p className="font-serif text-[#1C2321] text-lg">{booking.properties?.name}</p>
                                    <p className="text-xs uppercase tracking-widest text-stone-400">ID: {booking.id.slice(0,6)}</p>
                                </td>
                                <td className="py-6 px-4">
                                    <p className="font-medium">{booking.profiles?.full_name || 'Guest'}</p>
                                    <p className="text-sm font-light text-stone-400">{booking.profiles?.email}</p>
                                </td>
                                <td className="py-6 px-4 font-light text-sm">
                                    {new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}
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
                                    Ksh {booking.total_price?.toLocaleString()}
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

      {/* Add/Edit Property Modal - Glassmorphism & Clean Lines */}
      <AnimatePresence>
        {(showAddProperty || showEditProperty) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1C2321]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddProperty(false);
              setShowEditProperty(null);
              resetPropertyForm();
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
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                      resetPropertyForm();
                    }}
                    className="text-stone-400 hover:text-[#1C2321] text-2xl font-light"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {/* Custom Input Component for consistency */}
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
                            <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">{k.replace(/([A-Z])/g, ' $1')}</label>
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

                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">Amenities (Comma Separated)</label>
                    <input
                        type="text"
                        value={newProperty.amenities.join(', ')}
                        onChange={(e) => setNewProperty({...newProperty, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a)})}
                        className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-sans text-stone-600"
                        placeholder="Concierge, Valet, Spa, Private Pool..."
                    />
                  </div>

                  {/* Cover Image - For Home Page */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                      Cover Image <span className="text-stone-400 normal-case">(displayed on Home Page)</span>
                    </label>
                    <input
                      type="text"
                      value={newProperty.coverImage}
                      onChange={(e) => setNewProperty({...newProperty, coverImage: e.target.value.trim()})}
                      className="w-full py-3 bg-transparent border-b border-stone-300 focus:border-[#1C2321] outline-none font-sans text-xs text-stone-600"
                      placeholder="https://example.com/cover-image.jpg"
                    />
                    
                    {/* Cover Image Preview */}
                    {newProperty.coverImage && (
                      <div className="mt-4">
                        <div className="relative w-full max-w-md aspect-[16/10] border border-stone-200 overflow-hidden">
                          <img 
                            src={newProperty.coverImage} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x250?text=Invalid+URL'}
                          />
                          <span className="absolute bottom-0 left-0 right-0 bg-[#1C2321] text-white text-[10px] uppercase text-center py-2 tracking-widest">
                            Home Page Cover
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gallery Images - For Booking Page */}
                  <div className="md:col-span-2">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                      Gallery Images <span className="text-stone-400 normal-case">(displayed on Booking Page - rooms, amenities, views)</span>
                    </label>
                    {/* Live Booking Page Image Grid Preview */}
                    <div className="my-6">
                      <span className="block text-[10px] uppercase tracking-widest text-stone-400 mb-2">Booking Page Preview</span>
                      {(() => {
                        const imgs = [newProperty.coverImage, ...newProperty.galleryImages].filter(Boolean);
                        if (imgs.length === 0) return (
                          <div className="h-40 w-full rounded-xl bg-stone-100 flex items-center justify-center text-stone-300 text-xs italic">No images added</div>
                        );
                        if (imgs.length === 1) {
                          return (
                            <div className="h-40 md:h-60 w-full rounded-xl overflow-hidden bg-stone-100">
                              <img src={imgs[0]} alt="Main" className="w-full h-full object-cover" onError={e => e.target.src = 'https://via.placeholder.com/400x250?text=Invalid+URL'} />
                            </div>
                          );
                        }
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-40 md:h-60 rounded-xl overflow-hidden">
                            {/* Main Large Image */}
                            <div className="md:col-span-2 md:row-span-2 relative h-full bg-stone-100">
                              <img src={imgs[0]} alt="Main" className="w-full h-full object-cover" onError={e => e.target.src = 'https://via.placeholder.com/400x250?text=Invalid+URL'} />
                            </div>
                            {/* Side Images */}
                            <div className="hidden md:grid md:col-span-2 md:row-span-2 grid-cols-2 gap-2 h-full">
                              {imgs.slice(1, 5).map((img, i) => (
                                <div key={i} className="relative h-full bg-stone-100">
                                  <img src={img} alt={`View ${i}`} className="w-full h-full object-cover" onError={e => e.target.src = 'https://via.placeholder.com/100?text=Error'} />
                                  {/* Overlay if more than 5 images */}
                                  {i === 3 && imgs.length > 5 && (
                                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold uppercase tracking-widest border-b border-white pb-1">View All Photos</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Gallery Grid with Add Button */}
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-4">
                        {/* Existing Gallery Images */}
                        {newProperty.galleryImages.map((url, idx) => (
                          <div key={idx} className="relative w-28 h-28 flex-shrink-0 border border-stone-200 group">
                            {url ? (
                              <>
                                <img 
                                  src={url} 
                                  alt={`Gallery ${idx + 1}`} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Error'}
                                />
                                <span className="absolute bottom-0 left-0 right-0 bg-stone-800/80 text-white text-[8px] uppercase text-center py-1 tracking-widest">
                                  {idx === 0 ? 'Bedroom' : idx === 1 ? 'Bathroom' : idx === 2 ? 'Living' : `Image ${idx + 1}`}
                                </span>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                                <span className="text-stone-400 text-xs">Empty</span>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = newProperty.galleryImages.filter((_, i) => i !== idx);
                                setNewProperty({...newProperty, galleryImages: updated});
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {/* Add Image Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt('Enter image URL:');
                            if (url && url.trim()) {
                              setNewProperty({
                                ...newProperty, 
                                galleryImages: [...newProperty.galleryImages, url.trim()]
                              });
                            }
                          }}
                          className="w-28 h-28 border-2 border-dashed border-stone-300 hover:border-[#1C2321] bg-white hover:bg-stone-50 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                        >
                          <FaPlus className="text-stone-400 group-hover:text-[#1C2321] text-lg transition-colors" />
                          <span className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-[#1C2321] transition-colors">Add Image</span>
                        </button>
                      </div>
                      {newProperty.galleryImages.length > 0 && (
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-4">
                          {newProperty.galleryImages.length} image{newProperty.galleryImages.length !== 1 ? 's' : ''} added
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-6 mt-12 pt-6 border-t border-stone-200">
                  <button
                    onClick={() => {
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                      resetPropertyForm();
                    }}
                    className="px-8 py-3 text-stone-500 hover:text-[#1C2321] transition-colors uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showEditProperty ? updateProperty : handleAddProperty}
                    disabled={!newProperty.name || !newProperty.price || !newProperty.location}
                    className="px-10 py-3 bg-[#1C2321] text-white hover:bg-[#2C3632] transition-colors disabled:opacity-50 uppercase tracking-widest text-xs font-medium"
                  >
                    {showEditProperty ? "Update Residence" : "Confirm Addition"}
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