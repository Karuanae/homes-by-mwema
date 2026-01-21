import { useState, useEffect, useRef } from "react";
import { 
  FaHome, FaCalendarAlt, FaUsers, FaChartBar, FaEnvelope, 
  FaCog, FaPlus, FaEdit, FaTrash, FaEye, FaFilter,
  FaSearch, FaSort, FaFileExport, FaBell, FaUserCircle,
  FaCheckCircle, FaTimesCircle, FaClock, FaMoneyBillWave,
  FaWhatsapp, FaSync, FaImage, FaUpload, FaTag,
  FaBed, FaBath, FaRuler, FaLocationArrow, FaStar,
  FaMapMarkerAlt, FaDollarSign, FaPercentage
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Line, Bar, Doughnut } from "react-chartjs-2";
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
  const [activeTab, setActiveTab] = useState("properties");
  const [properties, setProperties] = useState([]);
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

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Fetch admin data
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
        // Set fallback data
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
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setNewProperty(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
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

  // Tabs Configuration (Simplified - Only Properties and Dashboard)
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: FaChartBar },
    { id: "properties", label: "Properties", icon: FaHome }
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Top Navigation */}
      <nav className="bg-teal-900 text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 rounded-lg">
              <FaHome className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold">Homes by Mwema Admin</h1>
              <p className="text-teal-200 text-sm">Property Management Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <FaUserCircle className="text-2xl" />
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-teal-200 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {activeTab === "dashboard" && (
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
        )}

        {/* Main Dashboard Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="border-b border-stone-200">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? "text-teal-700 border-b-2 border-teal-700 bg-teal-50"
                      : "text-stone-500 hover:text-teal-600 hover:bg-stone-50"
                  }`}
                >
                  <tab.icon />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div>
                <h2 className="text-2xl font-serif text-teal-950 mb-6">Dashboard Overview</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-stone-200">
                    <h3 className="font-medium text-stone-700 mb-4">Revenue Trend</h3>
                    <div className="h-64">
                      <Line
                        data={revenueData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'top' }
                          }
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
                          plugins: {
                            legend: { position: 'top' }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-xl">
                  <h3 className="font-serif text-xl text-teal-950 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                      onClick={() => setActiveTab("properties")}
                      className="bg-white p-4 rounded-lg border border-stone-200 hover:border-teal-300 hover:bg-teal-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <FaPlus className="text-teal-600" />
                        </div>
                        <h4 className="font-medium text-teal-900">Add New Property</h4>
                      </div>
                      <p className="text-sm text-stone-600">Create a new property listing</p>
                    </button>
                    
                    <button className="bg-white p-4 rounded-lg border border-stone-200 hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FaCalendarAlt className="text-blue-600" />
                        </div>
                        <h4 className="font-medium text-teal-900">View Bookings</h4>
                      </div>
                      <p className="text-sm text-stone-600">Manage guest bookings and reservations</p>
                    </button>
                    
                    <button className="bg-white p-4 rounded-lg border border-stone-200 hover:border-teal-300 hover:bg-teal-50 transition-colors text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <FaMoneyBillWave className="text-emerald-600" />
                        </div>
                        <h4 className="font-medium text-teal-900">Payment Reports</h4>
                      </div>
                      <p className="text-sm text-stone-600">View financial reports and transactions</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PROPERTIES TAB */}
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
          </div>
        </div>
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
                      Upload Images
                    </label>
                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                      <FaUpload className="text-3xl text-stone-400 mx-auto mb-3" />
                      <p className="text-stone-500 mb-2">Click to browse images</p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block bg-teal-50 text-teal-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors"
                      >
                        <FaImage className="inline mr-2" />
                        Select Images
                      </label>
                      {newProperty.images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-stone-600 mb-2">
                            {newProperty.images.length} image(s) selected
                          </p>
                        </div>
                      )}
                    </div>
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