import { useState, useEffect } from "react";
import { 
  FaHome, FaCalendarAlt, FaUsers, FaChartBar, FaEnvelope, 
  FaCog, FaPlus, FaEdit, FaTrash, FaEye, FaFilter,
  FaSearch, FaSort, FaFileExport, FaBell, FaUserCircle,
  FaCheckCircle, FaTimesCircle, FaClock, FaMoneyBillWave,
  FaWhatsapp, FaSync, FaImage, FaUpload, FaTag,
  FaBed, FaBath, FaRuler, FaLocationArrow, FaStar,
  FaMapMarkerAlt, FaDollarSign, FaPercentage,
  FaBars, FaTimes, FaSignOutAlt, FaList, FaBuilding
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from "../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeBookings: 0,
    revenue: 0,
    occupancyRate: 0,
    pendingPayments: 0
  });
  
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showEditProperty, setShowEditProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  const [newProperty, setNewProperty] = useState({
    name: "",
    type: "studio",
    price: "",
    location: "",
    description: "",
    rooms: 1,
    bathrooms: 1,
    area: "",
    maxGuests: 2,
    images: [],
    amenities: [],
    tags: []
  });

  // Load initial data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const [propertiesResponse, statsResponse] = await Promise.all([
          api.admin.getProperties(),
          api.admin.getStats()
        ]);

        setProperties(propertiesResponse.data);
        setStats(statsResponse.data);

      } catch (error) {
        console.error('Error fetching admin data:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        setProperties([]);
        setStats({
          totalProperties: 0,
          activeBookings: 0,
          revenue: 0,
          occupancyRate: 0,
          pendingPayments: 0
        });
      }
    };

    fetchData();
  }, []);

  // Fetch bookings when tab is clicked
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const response = await api.bookings.getAll();
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Fetch customers/users when tab is clicked
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.admin.getUsers();
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch messages/chats when tab is clicked
  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await api.chats.getAll();
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Trigger fetching when tab changes
  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings();
    } else if (activeTab === "customers") {
      fetchCustomers();
    } else if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab]);

  // Property Management Functions
  const handleAddProperty = async () => {
    try {
      const response = await api.admin.createProperty(newProperty);
      setProperties([...properties, response.data]);
      setShowAddProperty(false);
      resetPropertyForm();
      alert('Property added successfully!');
    } catch (error) {
      console.error('Error adding property:', error);
      alert('Failed to add property');
    }
  };

  const handleEditProperty = (property) => {
    setShowEditProperty(property);
    setNewProperty({
      name: property.name,
      type: property.type,
      price: property.price,
      location: property.location,
      description: property.description || "",
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      area: property.area || "",
      maxGuests: property.max_guests || 2,
      images: property.images || [],
      amenities: property.amenities || [],
      tags: property.tags || []
    });
  };

  const updateProperty = async () => {
    try {
      const response = await api.admin.updateProperty(showEditProperty.id, newProperty);
      setProperties(properties.map(p => 
        p.id === showEditProperty.id ? response.data : p
      ));
      setShowEditProperty(null);
      resetPropertyForm();
      alert('Property updated successfully!');
    } catch (error) {
      console.error('Error updating property:', error);
      alert('Failed to update property');
    }
  };

  const deleteProperty = async (propertyId) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    
    try {
      await api.admin.deleteProperty(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      alert('Property deleted successfully!');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const resetPropertyForm = () => {
    setNewProperty({
      name: "",
      type: "studio",
      price: "",
      location: "",
      description: "",
      rooms: 1,
      bathrooms: 1,
      area: "",
      maxGuests: 2,
      images: [],
      amenities: [],
      tags: []
    });
  };

  const handleImageUpload = (e) => {
    // Removed blob URL creation - now using direct URL input
    // This prevents blob URLs from being saved to the database
  };

  // Chart Data
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (Ksh)',
      data: [450000, 520000, 480000, 610000, 700000, 680000],
      borderColor: '#0d9488',
      backgroundColor: 'rgba(13, 148, 136, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  const occupancyData = {
    labels: properties.slice(0, 5).map(p => p.name),
    datasets: [{
      label: 'Occupancy Rate (%)',
      data: properties.slice(0, 5).map(p => Math.random() * 100),
      backgroundColor: '#0d9488'
    }]
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Ksh ${amount?.toLocaleString() || '0'}`;
  };

  // Filter properties based on search
  const filteredProperties = properties.filter(property => 
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: FaChartBar },
    { id: "properties", label: "Properties", icon: FaHome },
    { id: "bookings", label: "Bookings", icon: FaCalendarAlt },
    { id: "customers", label: "Customers", icon: FaUsers },
    { id: "reports", label: "Reports", icon: FaFileExport },
    { id: "messages", label: "Messages", icon: FaEnvelope },
    { id: "settings", label: "Settings", icon: FaCog }
  ];

  const quickActions = [
    { 
      id: "add-property", 
      label: "Add New Property", 
      icon: FaPlus,
      onClick: () => setShowAddProperty(true)
    },
    { 
      id: "view-bookings", 
      label: "View Bookings", 
      icon: FaCalendarAlt,
      onClick: () => setActiveTab("bookings")
    },
    { 
      id: "generate-report", 
      label: "Generate Report", 
      icon: FaFileExport,
      onClick: () => console.log("Generate Report")
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 25 }}
        className={`fixed lg:relative z-40 w-64 h-screen bg-teal-900 text-white flex flex-col shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-teal-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 rounded-lg">
              <FaBuilding className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold">Homes by Mwema</h1>
              <p className="text-teal-200 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-teal-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center">
              <FaUserCircle className="text-xl" />
            </div>
            <div>
              <p className="font-medium">Admin User</p>
              <p className="text-xs text-teal-300">Super Admin</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-teal-800">
          <h3 className="text-xs uppercase text-teal-300 tracking-wider mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={action.onClick}
                className="w-full flex items-center gap-3 p-3 text-sm rounded-lg hover:bg-teal-800 transition-colors"
              >
                <action.icon className="text-teal-300" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-xs uppercase text-teal-300 tracking-wider mb-3">Navigation</h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 p-3 text-sm rounded-lg transition-colors ${
                  activeTab === item.id
                    ? "bg-teal-800 text-white"
                    : "text-teal-200 hover:bg-teal-800/50"
                }`}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-teal-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-sm rounded-lg bg-teal-800 hover:bg-teal-700 transition-colors"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg"
              >
                {sidebarOpen ? <FaTimes /> : <FaBars />}
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-serif text-teal-950">
                  {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h1>
                <p className="text-stone-500 text-sm">
                  Welcome back! Here's what's happening today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-stone-100 rounded-lg relative">
                <FaBell className="text-xl text-stone-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="hidden lg:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-stone-500">admin@example.com</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <FaUserCircle className="text-xl text-teal-700" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Stats Overview */}
          {activeTab === "dashboard" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: "Properties", value: stats.totalProperties, icon: FaHome, color: "teal" },
                  { label: "Active Bookings", value: stats.activeBookings, icon: FaCalendarAlt, color: "blue" },
                  { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: FaMoneyBillWave, color: "emerald" },
                  { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, icon: FaPercentage, color: "purple" },
                  { label: "Pending Payments", value: formatCurrency(stats.pendingPayments), icon: FaClock, color: "red" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow border border-stone-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-stone-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-bold text-teal-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`p-2 ${
                        stat.color === 'teal' ? 'bg-teal-50' :
                        stat.color === 'blue' ? 'bg-blue-50' :
                        stat.color === 'emerald' ? 'bg-emerald-50' :
                        stat.color === 'purple' ? 'bg-purple-50' :
                        'bg-red-50'
                      } rounded-lg`}>
                        <stat.icon className={`${
                          stat.color === 'teal' ? 'text-teal-600' :
                          stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'emerald' ? 'text-emerald-600' :
                          stat.color === 'purple' ? 'text-purple-600' :
                          'text-red-600'
                        } text-lg`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl border border-stone-200">
                  <h3 className="font-medium text-stone-700 mb-4">Revenue Trend</h3>
                  <div className="h-64">
                    <Line
                      data={revenueData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } }
                      }}
                    />
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-stone-200">
                  <h3 className="font-medium text-stone-700 mb-4">Top Properties by Occupancy</h3>
                  <div className="h-64">
                    <Bar
                      data={occupancyData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'top' } }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Properties Tab */}
          {activeTab === "properties" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-teal-950">Property Management</h2>
                  <p className="text-stone-500">Add, edit, and manage your properties</p>
                </div>
                <div className="flex gap-3">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      className="pl-10 pr-4 py-2 border border-stone-300 rounded-lg w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-800 transition-colors"
                  >
                    <FaPlus /> Add Property
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-white border border-teal-700 text-teal-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-50"
                  >
                    <FaSync /> Refresh
                  </button>
                </div>
              </div>

              {/* Properties Grid */}
              {filteredProperties.length === 0 ? (
                <div className="text-center py-12 border border-stone-200 rounded-xl">
                  <FaHome className="text-4xl text-stone-300 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-teal-950 mb-2">No properties found</h3>
                  <p className="text-stone-500 mb-6">Add your first property to get started</p>
                  <button
                    onClick={() => setShowAddProperty(true)}
                    className="bg-teal-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto hover:bg-teal-800"
                  >
                    <FaPlus /> Add Property
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProperties.map((property) => (
                    <div key={property.id} className="border border-stone-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <img
                          src={property.images?.[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"}
                          alt={property.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-teal-700 text-white px-2 py-1 rounded text-sm">
                          {formatCurrency(property.price)}/night
                        </div>
                        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {property.status.toUpperCase()}
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-serif text-teal-950">{property.name}</h3>
                            <p className="text-stone-500 text-sm flex items-center gap-1">
                              <FaMapMarkerAlt className="text-xs" />
                              {property.location}
                            </p>
                          </div>
                          <div className="text-amber-500 flex items-center gap-1">
                            <FaStar className="text-sm" />
                            <span className="font-medium">{property.rating || 'New'}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm text-stone-600 mb-4">
                          <span className="flex items-center gap-1">
                            <FaBed /> {property.rooms} {property.rooms === 1 ? 'Room' : 'Rooms'}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBath /> {property.bathrooms} Bath
                          </span>
                          {property.area && <span>{property.area}</span>}
                        </div>

                        {property.description && (
                          <div className="mb-4">
                            <p className="text-sm text-stone-600 line-clamp-2">{property.description}</p>
                          </div>
                        )}

                        {property.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {property.amenities.slice(0, 3).map((amenity, idx) => (
                              <span key={idx} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">
                                {amenity}
                              </span>
                            ))}
                            {property.amenities.length > 3 && (
                              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded">
                                +{property.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-stone-500">
                            <p>Type: {property.type.replace('_', ' ')}</p>
                            <p>Max Guests: {property.max_guests || 2}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditProperty(property)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteProperty(property.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                            <a
                              href={`/property/${property.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View"
                            >
                              <FaEye />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-teal-950">Bookings Management</h2>
                  <p className="text-stone-500">View and manage all bookings</p>
                </div>
                <button 
                  onClick={fetchBookings}
                  className="bg-white border border-teal-700 text-teal-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-50"
                >
                  <FaSync /> Refresh
                </button>
              </div>

              {loadingBookings ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaSync className="text-4xl text-teal-600 mx-auto mb-4 animate-spin" />
                  <p className="text-stone-500">Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaCalendarAlt className="text-4xl text-stone-300 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-teal-950 mb-2">No bookings found</h3>
                  <p className="text-stone-500">There are currently no bookings</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Booking ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Guest</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Property</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Check-In</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Check-Out</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-stone-600">#{booking.id}</td>
                            <td className="px-6 py-4 text-sm">
                              <div>
                                <p className="font-medium text-stone-900">{booking.guest_name || booking.user_name || 'N/A'}</p>
                                <p className="text-xs text-stone-500">{booking.guest_email || booking.user_email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">{booking.property_name || booking.property?.name || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm text-stone-600">
                              {new Date(booking.check_in).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">
                              {new Date(booking.check_out).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-teal-900">
                              {formatCurrency(booking.total_amount)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.status?.toUpperCase() || 'PENDING'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button className="text-teal-600 hover:text-teal-800 font-medium">
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-teal-950">Customers Management</h2>
                  <p className="text-stone-500">View all registered customers</p>
                </div>
                <button 
                  onClick={fetchCustomers}
                  className="bg-white border border-teal-700 text-teal-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-50"
                >
                  <FaSync /> Refresh
                </button>
              </div>

              {loadingCustomers ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaSync className="text-4xl text-teal-600 mx-auto mb-4 animate-spin" />
                  <p className="text-stone-500">Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaUsers className="text-4xl text-stone-300 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-teal-950 mb-2">No customers found</h3>
                  <p className="text-stone-500">There are currently no registered customers</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Email</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Phone</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Role</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Joined</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customers.map((customer) => (
                          <tr key={customer.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">
                                  {customer.name?.charAt(0) || customer.email?.charAt(0)}
                                </div>
                                <span className="font-medium text-stone-900">{customer.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">{customer.email}</td>
                            <td className="px-6 py-4 text-sm text-stone-600">{customer.phone || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                customer.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                customer.role === 'host' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {customer.role?.toUpperCase() || 'USER'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">
                              {new Date(customer.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button className="text-teal-600 hover:text-teal-800 font-medium">
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages/Chats Tab */}
          {activeTab === "messages" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-teal-950">Messages & Chats</h2>
                  <p className="text-stone-500">View all customer messages and conversations</p>
                </div>
                <button 
                  onClick={fetchMessages}
                  className="bg-white border border-teal-700 text-teal-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-50"
                >
                  <FaSync /> Refresh
                </button>
              </div>

              {loadingMessages ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaSync className="text-4xl text-teal-600 mx-auto mb-4 animate-spin" />
                  <p className="text-stone-500">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
                  <FaEnvelope className="text-4xl text-stone-300 mx-auto mb-4" />
                  <h3 className="text-xl font-serif text-teal-950 mb-2">No messages found</h3>
                  <p className="text-stone-500">There are currently no messages</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-200 bg-stone-50">
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Chat ID</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">From</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">To</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Last Message</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-stone-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {messages.map((chat) => (
                          <tr key={chat.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-stone-600">#{chat.id}</td>
                            <td className="px-6 py-4 text-sm">
                              <p className="font-medium text-stone-900">{chat.user_name || chat.from_name || 'N/A'}</p>
                              <p className="text-xs text-stone-500">{chat.user_email || chat.from_email}</p>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <p className="font-medium text-stone-900">{chat.host_name || chat.to_name || 'Admin'}</p>
                              <p className="text-xs text-stone-500">{chat.host_email || chat.to_email || 'admin@example.com'}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate">
                              {chat.last_message || 'No messages'}
                            </td>
                            <td className="px-6 py-4 text-sm text-stone-600">
                              {chat.updated_at ? new Date(chat.updated_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                chat.unread_count > 0 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {chat.unread_count > 0 ? `${chat.unread_count} Unread` : 'Read'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <button className="text-teal-600 hover:text-teal-800 font-medium">
                                <FaEye />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {!["dashboard", "properties", "bookings", "customers", "messages"].includes(activeTab) && (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <div className="text-5xl text-stone-300 mb-4">
                {navItems.find(item => item.id === activeTab)?.icon && 
                  React.createElement(navItems.find(item => item.id === activeTab).icon)
                }
              </div>
              <h3 className="text-2xl font-serif text-teal-950 mb-2">
                {navItems.find(item => item.id === activeTab)?.label}
              </h3>
              <p className="text-stone-500">
                This section is under development. Coming soon!
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Property Modal */}
      <AnimatePresence>
        {(showAddProperty || showEditProperty) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddProperty(false);
              setShowEditProperty(null);
              resetPropertyForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-serif text-teal-950">
                    {showEditProperty ? "Edit Property" : "Add New Property"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                      resetPropertyForm();
                    }}
                    className="text-stone-400 hover:text-stone-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      value={newProperty.name}
                      onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter property name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Property Type *
                    </label>
                    <select
                      value={newProperty.type}
                      onChange={(e) => setNewProperty({...newProperty, type: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="studio">Studio</option>
                      <option value="1_bedroom">1 Bedroom</option>
                      <option value="2_bedroom">2 Bedroom</option>
                      <option value="3_bedroom">3 Bedroom</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="villa">Villa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Price per Night (Ksh) *
                    </label>
                    <input
                      type="number"
                      value={newProperty.price}
                      onChange={(e) => setNewProperty({...newProperty, price: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="5000"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={newProperty.location}
                      onChange={(e) => setNewProperty({...newProperty, location: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProperty.description}
                      onChange={(e) => setNewProperty({...newProperty, description: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Describe the property..."
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Number of Rooms
                    </label>
                    <input
                      type="number"
                      value={newProperty.rooms}
                      onChange={(e) => setNewProperty({...newProperty, rooms: parseInt(e.target.value) || 1})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Number of Bathrooms
                    </label>
                    <input
                      type="number"
                      value={newProperty.bathrooms}
                      onChange={(e) => setNewProperty({...newProperty, bathrooms: parseInt(e.target.value) || 1})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Maximum Guests
                    </label>
                    <input
                      type="number"
                      value={newProperty.maxGuests}
                      onChange={(e) => setNewProperty({...newProperty, maxGuests: parseInt(e.target.value) || 2})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Area (sq ft)
                    </label>
                    <input
                      type="text"
                      value={newProperty.area}
                      onChange={(e) => setNewProperty({...newProperty, area: e.target.value})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., 1200 sq ft"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Amenities (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newProperty.amenities.join(', ')}
                      onChange={(e) => setNewProperty({...newProperty, amenities: e.target.value.split(',').map(a => a.trim()).filter(a => a)})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="e.g., WiFi, Kitchen, TV, Air Conditioning"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      Image URLs (comma separated)
                    </label>
                    <textarea
                      value={newProperty.images.join(', ')}
                      onChange={(e) => setNewProperty({...newProperty, images: e.target.value.split(',').map(url => url.trim()).filter(url => url)})}
                      className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="https://images.unsplash.com/photo-xxx, https://images.unsplash.com/photo-yyy"
                      rows="3"
                    />
                    <p className="text-xs text-stone-500 mt-2">
                      <span className="font-semibold text-teal-700">📌 First URL = Home Page Thumbnail</span> | Enter image URLs separated by commas. The first URL will be shown on the home page, all URLs will appear in the booking page gallery.
                    </p>
                    {newProperty.images.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-medium text-stone-600 mb-2">Preview ({newProperty.images.length} images)</p>
                        <div className="flex flex-wrap gap-2">
                          {newProperty.images.map((url, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-stone-200">
                              <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                              {idx === 0 && (
                                <div className="absolute top-0 left-0 right-0 bg-teal-600 text-white text-[10px] font-bold py-1 text-center">
                                  HOME PAGE
                                </div>
                              )}
                              <button
                                onClick={() => setNewProperty({...newProperty, images: newProperty.images.filter((_, i) => i !== idx)})}
                                className="absolute bottom-0 right-0 bg-red-500 text-white p-1 rounded-tl text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                              <div className="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] px-2 py-1">
                                #{idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-stone-200">
                  <button
                    onClick={() => {
                      setShowAddProperty(false);
                      setShowEditProperty(null);
                      resetPropertyForm();
                    }}
                    className="px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showEditProperty ? updateProperty : handleAddProperty}
                    disabled={!newProperty.name || !newProperty.price || !newProperty.location}
                    className="px-6 py-3 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {showEditProperty ? "Update Property" : "Add Property"}
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