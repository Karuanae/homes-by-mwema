import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaCamera, 
  FaVideo, 
  FaEdit,
  FaLightbulb,
  FaCompass,
  FaClock,
  FaChartLine,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaAward,
  FaUsers,
  FaRegClock,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaCalendarAlt,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { MdOutline360 } from 'react-icons/md';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const PhotographyVideography = () => {
  const [activeTab, setActiveTab] = useState('photos');

  // WhatsApp configuration
  const whatsappNumber = "254759170780";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message templates for different purposes
  const whatsappMessages = {
    general: "Hello! I'm interested in your property photography and videography services in Nairobi. I'd like to know more about how you can help showcase my property.",
    photos: "Hello! I'm interested in your photography services for my property. Can you share more details about your photography services and availability?",
    videos: "Hello! I'm interested in your videography services for my property. I'd like to know more about your video tour services.",
    consultation: "Hello! I'd like to schedule a consultation to discuss photography and videography for my property. Please let me know your availability."
  };

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "5+ Years Experience",
      description: "Over half a decade of specialized property photography and videography in the Nairobi real estate market."
    },
    {
      icon: FaUsers,
      title: "500+ Properties Shot",
      description: "From luxury apartments in Kilimani to family homes in Karen, we've captured it all."
    },
    {
      icon: FaRegClock,
      title: "48hr Turnaround",
      description: "Fast delivery of professionally edited photos and videos so you can list immediately."
    }
  ];

  const whyChooseUs = [
    {
      title: "Professional Equipment",
      description: "We use industry-leading cameras, lenses, and lighting equipment to capture every detail in stunning clarity."
    },
    {
      title: "Expert Staging Advice",
      description: "Our team provides guidance on how to prepare your space for the perfect shot, maximizing appeal."
    },
    {
      title: "Drone Certified",
      description: "Fully licensed drone operators for breathtaking aerial shots that showcase your property's location."
    },
    {
      title: "Proven Results",
      description: "Properties we photograph see an average of 40% more bookings and command higher nightly rates."
    }
  ];

  const services = [
    {
      icon: FaCamera,
      title: "Professional Photography",
      description: "High-resolution, professionally edited photos that make your listing stand out instantly."
    },
    {
      icon: FaVideo,
      title: "Cinematic Videography",
      description: "Smooth, engaging video tours that tell your property's story and captivate potential guests."
    },
    {
      icon: MdOutline360,
      title: "360° Virtual Tours",
      description: "Immersive virtual experiences that let guests explore every room from anywhere in the world."
    },
    {
      icon: FaEdit,
      title: "Expert Editing",
      description: "Professional color grading, retouching, and enhancement for magazine-quality results."
    }
  ];

  const portfolioImages = [
    {
      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Living Room - Kilimani",
      technique: "Luxury apartment photography"
    },
    {
      url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Kitchen - Westlands",
      technique: "Modern kitchen showcase"
    },
    {
      url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Bedroom - Lavington",
      technique: "Master suite photography"
    },
    {
      url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Bathroom - Karen",
      technique: "Luxury bathroom details"
    },
    {
      url: "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Outdoor Space - Runda",
      technique: "Aerial drone photography"
    },
    {
      url: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Dining Area - Gigiri",
      technique: "Lifestyle photography"
    }
  ];

  const stats = [
    { icon: FaCamera, value: "500+", label: "Properties Shot" },
    { icon: FaStar, value: "4.9", label: "Client Rating" },
    { icon: FaChartLine, value: "40%", label: "Avg. Booking Increase" },
    { icon: FaClock, value: "48hr", label: "Turnaround Time" }
  ];

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden selection:bg-stone-200">
      
      {/* Global Styles */}
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .parallax {
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Professional photography setup"
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
              <FaCamera /> Professional Property Photography
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Make Your Property <br /><span className="italic text-[#ED9B40]">Stand Out</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              With over 5 years of experience photographing Nairobi's finest properties, we deliver stunning visuals that attract more guests and maximize your rental income.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Inquire on WhatsApp
              </a>
              <button 
                onClick={() => document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                View Our Portfolio
              </button>
            </div>
          </motion.div>
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

      {/* WhatsApp CTA - Prominent */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready to Make Your Property Shine?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp to discuss your photography needs, view sample galleries, and book your shoot.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.photos)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
            >
              <FaCamera /> Inquire About Photography
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.videos)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaVideo /> Inquire About Videography
            </a>
          </div>
        </div>
      </section>

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Trust <span className="italic">Homes by Mwema?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              With years of experience in the Nairobi property market, we understand what it takes to make your listing irresistible.
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

      {/* Services We Offer */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our <span className="italic">Services</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Comprehensive visual solutions tailored to showcase your property at its absolute best.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-sm border border-stone-200 hover:shadow-xl transition-all text-center"
              >
                <service.icon className="text-4xl text-[#ED9B40] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{service.title}</h3>
                <p className="text-stone-600 text-sm">{service.description}</p>
                
                {/* WhatsApp inquiry for each service */}
                <a
                  href={getWhatsAppLink(`Hello! I'm interested in your ${service.title} services. Can you tell me more?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaWhatsapp /> Inquire about {service.title}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section id="portfolio" className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our <span className="italic">Portfolio</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              See the difference professional photography makes. Browse through some of the properties we've captured.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('photos')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeTab === 'photos' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-transparent text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              Photography
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeTab === 'videos' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-transparent text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              Videography
            </button>
          </div>

          {activeTab === 'photos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-sm cursor-pointer"
                >
                  <img 
                    src={image.url} 
                    alt={image.title}
                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h4 className="text-lg font-bold mb-1">{image.title}</h4>
                      <p className="text-sm text-white/80">{image.technique}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Property Video 1 */}
              <div className="aspect-video bg-stone-900 rounded-sm overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#ED9B40] rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold">Kilimani Luxury Apartment</h4>
                  <p className="text-xs opacity-80">2 min cinematic tour</p>
                </div>
              </div>

              {/* Property Video 2 */}
              <div className="aspect-video bg-stone-900 rounded-sm overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#ED9B40] rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold">Karen Family Home</h4>
                  <p className="text-xs opacity-80">3 min walkthrough</p>
                </div>
              </div>

              {/* Property Video 3 */}
              <div className="aspect-video bg-stone-900 rounded-sm overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#ED9B40] rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold">Westlands Modern Studio</h4>
                  <p className="text-xs opacity-80">1.5 min highlight</p>
                </div>
              </div>

              {/* Property Video 4 */}
              <div className="aspect-video bg-stone-900 rounded-sm overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-16 h-16 bg-[#ED9B40] rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-white ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h4 className="font-bold">Runda Executive House</h4>
                  <p className="text-xs opacity-80">2.5 min drone + walkthrough</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Quality Visuals Matter */}
      <section className="py-24 px-6 bg-[#0F4C55] text-white parallax" style={{
        backgroundImage: "linear-gradient(rgba(15, 76, 85, 0.9), rgba(15, 76, 85, 0.95)), url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')",
        backgroundAttachment: 'fixed'
      }}>
        <div className="max-w-[1000px] mx-auto text-center">
          <FaLightbulb className="text-5xl text-[#ED9B40] mx-auto mb-8" />
          <h2 className="text-4xl md:text-5xl font-serif mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
            Why <span className="text-[#ED9B40]">Professional</span> Visuals Matter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="text-3xl font-bold text-[#ED9B40] mb-2">40%</div>
              <p className="text-sm uppercase tracking-widest mb-2">More Bookings</p>
              <p className="text-white/70 text-sm">Properties with professional photos book 40% more nights</p>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-[#ED9B40] mb-2">2.5x</div>
              <p className="text-sm uppercase tracking-widest mb-2">Higher Rates</p>
              <p className="text-white/70 text-sm">Premium visuals command premium nightly rates</p>
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-[#ED9B40] mb-2">83%</div>
              <p className="text-sm uppercase tracking-widest mb-2">First Impressions</p>
              <p className="text-white/70 text-sm">83% of guests book based on photo quality</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaQuoteLeft className="text-4xl text-[#ED9B40] mx-auto mb-8 opacity-50" />
          <p className="text-2xl md:text-3xl font-serif italic text-[#0F4C55] mb-8">
            "The photos transformed our listing completely. Bookings increased by 60% within the first month!"
          </p>
          <div>
            <p className="font-bold text-[#0F4C55]">— Sarah M., Karen</p>
            <p className="text-sm text-stone-500">Happy Client</p>
          </div>

          <div className="flex justify-center gap-8 mt-12">
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
              <FaInstagram size={24} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.tiktok }}>
              <FaTiktok size={24} />
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.youtube }}>
              <FaYoutube size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Make Your Property <span className="text-[#ED9B40]">Stand Out?</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join 500+ property owners who've transformed their listings with our professional photography and videography services.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.consultation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> Book a Consultation
            </a>
            <a
              href="tel:+254759170780"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call to Discuss
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaCamera className="text-[#ED9B40]" /> Professional Equipment</span>
            <span className="flex items-center gap-2"><MdOutline360 className="text-[#ED9B40]" /> 360° Virtual Tours</span>
            <span className="flex items-center gap-2"><FaVideo className="text-[#ED9B40]" /> 4K Videography</span>
          </div>

          {/* Contact Options */}
          <div className="mt-8 flex justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:photo@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
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

export default PhotographyVideography;