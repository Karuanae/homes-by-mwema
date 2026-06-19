import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaPlane,
  FaTrain,
  FaCar,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaSuitcase,
  FaShieldAlt,
  FaWifi,
  FaSnowflake,
  FaChargingStation,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaAward,
  FaRegClock,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaCreditCard,
  FaMobile,
  FaMapPin,
  FaRoute,
  FaGasPump,
  FaUserTie,
  FaCoffee,
  FaWater,
  FaBatteryFull,
  FaChild,
  FaWheelchair,
  FaDog,
  FaBriefcase,
  FaSubway,
  FaBus,
  FaTaxi,
  FaHotel,
  FaHeadset,
  FaLock,
  FaCreditCard as FaCc,
  FaClipboardList,
  FaPen
} from 'react-icons/fa';
import { BiSolidCar, BiSolidTaxi } from 'react-icons/bi';
import { RiCustomerService2Fill, RiFlightTakeoffLine, RiFlightLandLine } from 'react-icons/ri';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const AirportSGRTransfers = () => {
  const [activeTab, setActiveTab] = useState('airport');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // WhatsApp configuration
  const whatsappNumber = "254759170780";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "10,000+ Transfers Completed",
      description: "Trusted by thousands of travelers for reliable, punctual airport and SGR station transfers since 2018."
    },
    {
      icon: FaRegClock,
      title: "24/7 Operations",
      description: "Round-the-clock service—we never sleep, so you never miss a flight, no matter how early or late."
    },
    {
      icon: FaShieldAlt,
      title: "Fully Insured & Licensed",
      description: "All vehicles are commercially licensed, comprehensively insured, and regularly maintained for your safety."
    }
  ];

  const whyChooseUs = [
    {
      title: "Flight Tracking Included",
      description: "We monitor your flight in real-time. If your flight is delayed, we adjust—no extra charges, no stress, no waiting."
    },
    {
      title: "Meet & Greet Service",
      description: "Your driver will meet you at arrivals with a name board, help with luggage, and escort you to a waiting, air-conditioned vehicle."
    },
    {
      title: "Fixed Transparent Pricing",
      description: "No surge pricing. No hidden fees. What you see is what you pay—even if traffic or delays add time."
    },
    {
      title: "Child Seats Available",
      description: "Traveling with little ones? Request baby seats, booster seats, or child seats free of charge."
    }
  ];

  const airportRoutes = [
    { id: 1, from: "Jomo Kenyatta International Airport (JKIA)", to: "Nairobi CBD", distance: "18 km", duration: "30-45 mins", popular: true },
    { id: 2, from: "Jomo Kenyatta International Airport (JKIA)", to: "Westlands", distance: "20 km", duration: "35-50 mins", popular: true },
    { id: 3, from: "Jomo Kenyatta International Airport (JKIA)", to: "Kilimani", distance: "19 km", duration: "30-45 mins", popular: false },
    { id: 4, from: "Jomo Kenyatta International Airport (JKIA)", to: "Karen", distance: "25 km", duration: "45-60 mins", popular: false },
    { id: 5, from: "Jomo Kenyatta International Airport (JKIA)", to: "Lavington", distance: "22 km", duration: "40-55 mins", popular: false },
    { id: 6, from: "Jomo Kenyatta International Airport (JKIA)", to: "Runda/Gigiri", distance: "24 km", duration: "45-60 mins", popular: true },
    { id: 7, from: "Wilson Airport", to: "Nairobi CBD", distance: "6 km", duration: "15-20 mins", popular: true },
    { id: 8, from: "Wilson Airport", to: "Karen", distance: "12 km", duration: "25-35 mins", popular: false }
  ];

  const sgrRoutes = [
    { id: 1, from: "Nairobi Terminus (Syokimau)", to: "Nairobi CBD", distance: "15 km", duration: "25-35 mins", popular: true },
    { id: 2, from: "Nairobi Terminus (Syokimau)", to: "Westlands", distance: "18 km", duration: "30-40 mins", popular: true },
    { id: 3, from: "Nairobi Terminus (Syokimau)", to: "JKIA Airport", distance: "8 km", duration: "15-20 mins", popular: true },
    { id: 4, from: "Mombasa Terminus (Miritini)", to: "Mombasa CBD", distance: "20 km", duration: "30-40 mins", popular: true },
    { id: 5, from: "Mombasa Terminus (Miritini)", to: "Diani Beach", distance: "45 km", duration: "60-75 mins (including ferry)", popular: true },
    { id: 6, from: "Mombasa Terminus (Miritini)", to: "Nyali", distance: "25 km", duration: "35-45 mins", popular: false },
    { id: 7, from: "Nairobi Terminus (Syokimau)", to: "Kilimani", distance: "16 km", duration: "25-35 mins", popular: false },
    { id: 8, from: "Mombasa Terminus (Miritini)", to: "Ukunda", distance: "40 km", duration: "50-65 mins (including ferry)", popular: false }
  ];

  const additionalServices = [
    { icon: FaChild, title: "Child Seats", description: "Infant, toddler, and booster seats available free of charge—just let us know in advance." },
    { icon: FaWheelchair, title: "Accessible Vehicles", description: "We can arrange wheelchair-accessible vehicles with trained drivers for passengers with mobility needs." },
    { icon: FaDog, title: "Pet-Friendly Transfers", description: "Traveling with a furry friend? We offer pet-friendly vehicles with crate options." },
    { icon: FaUserTie, title: "Executive Chauffeur", description: "Professional, uniformed drivers trained in hospitality and local knowledge." }
  ];

  const stats = [
    { icon: FaPlane, value: "8,000+", label: "Airport Transfers" },
    { icon: FaTrain, value: "2,500+", label: "SGR Transfers" },
    { icon: FaStar, value: "4.9", label: "Customer Rating" },
    { icon: FaClock, value: "98%", label: "On-Time Performance" }
  ];

  const testimonials = [
    {
      name: "Dr. Elizabeth Mwangi",
      location: "Nairobi",
      tripType: "Airport Transfer",
      quote: "My flight arrived 3 hours late at 2 AM. I panicked, but when I walked out, there was my driver, holding a sign with my name, smiling. He'd been tracking my flight the whole time. This is service I'll never forget.",
      rating: 5
    },
    {
      name: "James Omondi",
      location: "Mombasa",
      tripType: "SGR Transfer to Diani",
      quote: "After a 5-hour train ride from Nairobi, the last thing I wanted was to negotiate with touts at the Mombasa terminus. Our driver was waiting exactly where he said he'd be, helped with bags, and got us to Diani safely. Worth every shilling.",
      rating: 5
    },
    {
      name: "Sarah & Tom Peterson",
      location: "United Kingdom",
      tripType: "JKIA to Karen",
      quote: "First time in Kenya, landing at midnight with two tired kids. Our driver met us with a smile, had booster seats already installed, and even had cold water waiting. The perfect introduction to Kenyan hospitality.",
      rating: 5
    }
  ];

  const faqs = [
    {
      q: "How do I find my driver at the airport?",
      a: "Your driver will be waiting at the arrivals hall holding a clearly visible sign with your name. For JKIA, they'll be just outside the customs exit. You'll receive a confirmation with your driver's name, phone number, and photo 2 hours before your scheduled pickup."
    },
    {
      q: "What happens if my flight is delayed?",
      a: "We track all flights in real-time. If your flight is delayed, we automatically adjust your pickup time at no extra cost. No need to call us—we'll be watching and waiting."
    },
    {
      q: "How do I find my driver at the SGR terminus?",
      a: "At Nairobi Terminus (Syokimau), your driver will be waiting at the designated pickup area near the main entrance. At Mombasa Terminus, they'll be at the arrivals bay. You'll receive detailed instructions and a map with your booking confirmation."
    },
    {
      q: "What vehicles do you use?",
      a: "We maintain a modern fleet of late-model vehicles including Toyota Corollas and Camrys (sedans), Toyota Prados and Harriers (SUVs), and Toyota Hiace (vans). All vehicles are air-conditioned, clean, and regularly serviced."
    },
    {
      q: "Can I book a return transfer?",
      a: "Absolutely! We recommend booking round-trip transfers to ensure availability. For return airport transfers, we'll pick you up from your accommodation and get you to the airport with plenty of time for check-in."
    },
    {
      q: "Do you operate 24 hours?",
      a: "Yes! We never sleep. Whether your flight lands at 3 AM or you need a 4 AM pickup for an early departure, we're here. Simply select your preferred time when booking."
    }
  ];

  const serviceArea = [
    "Jomo Kenyatta International Airport (JKIA)",
    "Wilson Airport",
    "Nairobi SGR Terminus (Syokimau)",
    "Mombasa SGR Terminus (Miritini)",
    "Nairobi CBD",
    "Westlands",
    "Kilimani",
    "Karen",
    "Lavington",
    "Runda/Gigiri",
    "Mombasa CBD",
    "Diani Beach",
    "Nyali",
    "Bamburi",
    "Ukunda"
  ];

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden selection:bg-stone-200">
      
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .cognito-form-container {
          min-height: 600px;
        }
        .cognito-form-container iframe {
          width: 100%;
          border: none;
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1542296332-2e4473faf563?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Airport transfer luxury vehicle"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#093A3E] via-[#093A3E]/90 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="text-[#ED9B40] text-sm uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <RiFlightTakeoffLine /> Airport & SGR Transfers
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Seamless Travel, <br /><span className="italic text-[#ED9B40]">Every Time</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              From JKIA to your hotel, from SGR terminus to the beach—experience the most reliable, comfortable, and stress-free transfers in Kenya.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  setShowForm(true);
                  setTimeout(() => {
                    document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaClipboardList /> Request Transfer
              </button>
              <a
                href={getWhatsAppLink("Hello do you do airport or SGR transfers, if so please share your rates")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Quick WhatsApp Booking
              </a>
            </div>

            <div className="flex gap-6 mt-12">
              <div className="flex items-center gap-2">
                <FaPlane className="text-[#ED9B40]" />
                <span className="text-sm">Flight Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUserTie className="text-[#ED9B40]" />
                <span className="text-sm">Meet & Greet</span>
              </div>
              <div className="flex items-center gap-2">
                <FaShieldAlt className="text-[#ED9B40]" />
                <span className="text-sm">Fully Insured</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Form Section - NEW */}
      <section id="booking-form" className="py-20 px-6 bg-white">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#ED9B40]/10 text-[#ED9B40] px-4 py-2 rounded-full text-sm font-medium mb-4">
              <FaPen /> Online Booking
            </div>
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Request Your <span className="italic">Transfer</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Fill out the form below with your transfer details and we'll get back to you with a confirmation.
            </p>
          </div>

          {/* Option Tabs */}
          <div className="flex justify-center gap-4 mb-10">
            <div className="bg-[#f5f2ee] p-1 rounded-full flex">
              <button
                onClick={() => setShowForm(true)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  showForm ? 'bg-[#0F4C55] text-white shadow-lg' : 'text-stone-500 hover:text-[#0F4C55]'
                }`}
              >
                <FaClipboardList className="inline mr-2" />
                Fill Online Form
              </button>
              <a
                href={getWhatsAppLink("Hello do you do airport or SGR transfers, if so please share your rates")}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  !showForm ? 'bg-[#0F4C55] text-white shadow-lg' : 'text-stone-500 hover:text-[#0F4C55]'
                }`}
              >
                <FaWhatsapp className="inline mr-2" />
                Book via WhatsApp
              </a>
            </div>
          </div>

          {/* Cognito Form */}
          {showForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-sm border border-stone-200 shadow-lg overflow-hidden"
            >
              <div className="cognito-form-container">
                <iframe 
                  src="https://www.cognitoforms.com/HOMESBYMWEMA1/HomesByMwemaTransfer"
                  style={{ width: '100%', height: '800px', border: 'none' }}
                  title="Homes by Mwema Transfer Request Form"
                />
              </div>
              <div className="p-4 bg-[#f5f2ee] border-t border-stone-200">
                <p className="text-xs text-stone-500 text-center">
                  Having trouble with the form? <a href={getWhatsAppLink("Hello! I'm having trouble with the online form. Can I book my transfer via WhatsApp instead?")} target="_blank" rel="noopener noreferrer" className="text-[#ED9B40] underline">Book via WhatsApp instead</a>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#f5f2ee] p-12 rounded-sm border border-stone-200 text-center"
            >
              <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#0F4C55] mb-3 font-serif">Quick WhatsApp Booking</h3>
              <p className="text-stone-600 mb-6 max-w-md mx-auto">
                Prefer a faster option? Send us a message on WhatsApp with your transfer details and we'll confirm within minutes.
              </p>
              <a
                href={getWhatsAppLink("Hello do you do airport or SGR transfers, if so please share your rates")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#20bd5a] transition-colors"
              >
                <FaWhatsapp /> Book on WhatsApp Now
              </a>
            </motion.div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-y border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="text-3xl text-[#ED9B40] mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-[#0F4C55]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Travel with <span className="italic">Homes by Mwema?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We've moved thousands of travelers safely and comfortably. Here's why they choose us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {experienceHighlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <item.icon className="text-4xl text-[#ED9B40] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#0F4C55] mb-2">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200"
              >
                <h3 className="text-lg font-bold text-[#0F4C55] mb-3">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Tabs */}
      <section id="routes" className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Choose Your <span className="italic">Transfer Type</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Airport transfers or SGR station pickups—we've got you covered across Nairobi and Mombasa.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('airport')}
              className={`px-8 py-4 text-sm uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'airport' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-white text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              <FaPlane /> Airport Transfers
            </button>
            <button
              onClick={() => setActiveTab('sgr')}
              className={`px-8 py-4 text-sm uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'sgr' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-white text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              <FaTrain /> SGR Station Transfers
            </button>
          </div>

          <div className="bg-white rounded-sm border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0F4C55] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest">From</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest">To</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest">Distance</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest">Duration</th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'airport' ? airportRoutes : sgrRoutes).map((route, index) => (
                    <tr key={route.id} className={`border-b border-stone-100 hover:bg-[#f5f2ee] transition-colors ${route.popular ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[#ED9B40]" />
                          <span className="text-sm font-medium">{route.from}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FaMapPin className="text-[#ED9B40]" />
                          <span className="text-sm">{route.to}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">{route.distance}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">{route.duration}</span>
                      </td>
                      <td className="px-6 py-4">
                        {route.popular && (
                          <span className="bg-[#ED9B40] text-[#0F4C55] text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                            Popular Route
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setTimeout(() => {
                  document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-[#F5B56B] transition-colors"
            >
              <FaClipboardList /> Request Your Transfer
            </button>
          </div>
          <p className="text-center text-stone-500 text-sm mt-4">
            *All transfers include flight tracking, meet & greet, and luggage assistance
          </p>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Extra Services <span className="italic">& Amenities</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We go the extra mile to make your journey comfortable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-sm border border-stone-200 flex gap-4 items-start"
              >
                <service.icon className="text-2xl text-[#ED9B40] flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-[#0F4C55] mb-1">{service.title}</h3>
                  <p className="text-sm text-stone-600">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              How It <span className="italic">Works</span>
            </h2>
            <p className="text-stone-600">Your journey from booking to arrival—seamless and stress-free.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Request Transfer", desc: "Fill the online form or message us on WhatsApp with your details." },
              { step: "2", title: "We Track Your Flight", desc: "We monitor your arrival in real-time and adjust accordingly." },
              { step: "3", title: "Meet & Greet", desc: "Your driver meets you at arrivals with a name board." },
              { step: "4", title: "Enjoy the Ride", desc: "Relax in comfort as we take you to your destination." }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-[#0F4C55] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">{item.step}</div>
                <h3 className="font-bold text-[#0F4C55] mb-2">{item.title}</h3>
                <p className="text-sm text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-24 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Areas We <span className="text-[#ED9B40] italic">Serve</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              From airports to SGR stations to your doorstep—we cover Nairobi and Mombasa.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {serviceArea.map((area, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <FaMapPin className="text-[#ED9B40] flex-shrink-0" />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What Our <span className="italic">Travelers Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200 relative"
              >
                <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < testimonial.rating ? "text-[#ED9B40]" : "text-stone-300"} />
                  ))}
                </div>
                <p className="text-stone-700 mb-6 italic text-sm">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-[#0F4C55]">{testimonial.name}</p>
                  <p className="text-xs text-stone-500">{testimonial.location} · {testimonial.tripType}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center text-[#0F4C55] mb-12 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked <span className="italic">Questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-stone-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 bg-white flex justify-between items-center hover:bg-[#f5f2ee] transition-colors"
                >
                  <span className="font-bold text-[#0F4C55]">{faq.q}</span>
                  <span className="text-[#ED9B40] text-xl">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-[#f5f2ee] border-t border-stone-200">
                    <p className="text-stone-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready for a <span className="text-[#ED9B40]">Stress-Free</span> Transfer?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Book your airport or SGR transfer now and experience the most reliable service in Kenya.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => {
                setShowForm(true);
                setTimeout(() => {
                  document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaClipboardList /> Request Transfer
            </button>
            <a
              href={getWhatsAppLink("Hello do you do airport or SGR transfers, if so please share your rates")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaWhatsapp /> WhatsApp Booking
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-[#ED9B40]" /> Fully Insured</span>
            <span className="flex items-center gap-2"><FaClock className="text-[#ED9B40]" /> 24/7 Support</span>
            <span className="flex items-center gap-2"><FaPlane className="text-[#ED9B40]" /> Flight Tracking</span>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <a href="https://wa.me/254759170780" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:transfers@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaEnvelope size={20} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
              <FaInstagram size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AirportSGRTransfers;