import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FaHome,
  FaCouch,
  FaBed,
  FaLightbulb,
  FaPalette,
  FaRulerCombined,
  FaSwatchbook,
  FaDraftingCompass,
  FaHandPaper,
  FaUsers,
  FaStar,
  FaClock,
  FaShieldAlt,
  FaQuoteLeft,
  FaInstagram,
  FaWhatsapp,
  FaEnvelope,
  FaCheckCircle,
  FaArrowRight,
  FaRegClock,
  FaAward,
  FaTiktok,
  FaYoutube,
  FaFacebookF,
  FaBuilding,
  FaKey,
  FaChartLine,
  FaCamera,
  FaTree,
  FaPaintBrush,
  FaStore,
  FaUtensils,
  FaBath,
  FaWifi,
  FaTv,
  FaSnowflake,
  FaPlug,
  FaLock,
  FaSmile,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClipboardList,
  FaPen,
  FaMapPin,
  FaBorderAll,
  FaPhone
} from 'react-icons/fa';
import { BiPaint, BiWindowAlt, BiCar, BiArch } from 'react-icons/bi';
import { TbPlant } from 'react-icons/tb';
import { GiFloorPolisher } from 'react-icons/gi';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const InteriorDesignSetup = () => {
  const [activeTab, setActiveTab] = useState('homes');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "25459170780";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const portfolioProjects = [
    {
      title: "Serenity Villa - Karen",
      type: "Luxury Home",
      image: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?w=800&auto=compress",
      description: "Modern organic design with natural materials and abundant natural light."
    },
    {
      title: "The Urban Nest - Westlands",
      type: "Airbnb",
      image: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?w=800&auto=compress",
      description: "Contemporary apartment designed for maximum guest comfort and social media appeal."
    },
    {
      title: "Haven Retreat - Diani",
      type: "Holiday Home",
      image: "https://images.pexels.com/photos/2587054/pexels-photo-2587054.jpeg?w=800&auto=compress",
      description: "Coastal-inspired interiors with Swahili influences and indoor-outdoor flow."
    },
    {
      title: "Executive Suite - Runda",
      type: "Executive Home",
      image: "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?w=800&auto=compress",
      description: "Sophisticated design blending African art with contemporary elegance."
    },
    {
      title: "The Cozy Corner - Kilimani",
      type: "Apartment",
      image: "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?w=800&auto=compress",
      description: "Warm, inviting space with carefully curated vintage and modern pieces."
    },
    {
      title: "Beachfront Bliss - Nyali",
      type: "Holiday Home",
      image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?w=800&auto=compress",
      description: "Light, airy interiors that capture the essence of coastal living."
    }
  ];

  const airbnbSpecificServices = [
    {
      icon: FaKey,
      title: "Smart Check-In Setup",
      description: "Keyless entry systems, smart lock integration, and automated guest access codes."
    },
    {
      icon: FaCamera,
      title: "Photo-Ready Spaces",
      description: "Design that photographs beautifully—increasing booking rates and attracting premium guests."
    },
    {
      icon: FaChartLine,
      title: "Revenue-Optimized Layout",
      description: "Strategic furniture placement and amenities that justify higher nightly rates."
    },
    {
      icon: FaStore,
      title: "Consumables Curation",
      description: "Picking the right sheets, towels, toiletries, and welcome amenities that guests rave about."
    },
    {
      icon: FaWifi,
      title: "WorkStation Ready",
      description: "Dedicated workspaces with proper lighting & ergonomic seating for remote workers."
    },
    {
      icon: FaTv,
      title: "Entertainment Setup",
      description: "Smart TV setup, streaming account integration, and speaker placement."
    }
  ];

  const homeServices = [
    {
      icon: FaCouch,
      title: "Furniture Selection",
      description: "We source, deliver, and arrange all furniture pieces that fit your space and style."
    },
    {
      icon: FaPaintBrush,
      title: "Color Consultation",
      description: "Expert color palette selection that creates mood, flow, and visual harmony throughout your home."
    },
    {
      icon: FaLightbulb,
      title: "Lighting Design",
      description: "Layered lighting plans with ambient, task, and accent fixtures for every room."
    },
    {
      icon: BiWindowAlt,
      title: "Window Treatments",
      description: "Custom curtains, blinds, and shades for privacy, light control, and style."
    },
    {
      icon: FaBorderAll,
      title: "Flooring & Rugs",
      description: "Selection of carpets, hardwood, tile, or luxury vinyl with coordinating area rugs."
    },
    {
      icon: FaSwatchbook,
      title: "Material Selection",
      description: "Guidance on fabrics, finishes, countertops, and hardware that balance beauty and durability."
    }
  ];

  const whyChooseUs = [
    {
      icon: FaAward,
      title: "7+ Years Experience",
      description: "Hundreds of homes transformed across Nairobi and the coast."
    },
    {
      icon: FaUsers,
      title: "White-Glove Service",
      description: "We handle everything—sourcing, delivery, installation—so you just enjoy the reveal."
    },
    {
      icon: FaRegClock,
      title: "On-Time Delivery",
      description: "We respect your timeline and communicate every step of the way."
    },
    {
      icon: FaShieldAlt,
      title: "Quality Guarantee",
      description: "All furnishings and installations come with warranties and after-service support."
    }
  ];

  const stats = [
    { icon: FaHome, value: "150+", label: "Homes Styled" },
    { icon: FaKey, value: "45+", label: "Airbnbs Optimized" },
    { icon: FaStar, value: "4.9", label: "Client Rating" },
    { icon: FaChartLine, value: "35%", label: "Avg Airbnb Income Increase" }
  ];

  const testimonials = [
    {
      name: "Michael K.",
      project: "Airbnb in Kilimani",
      quote: "Homes by Mwema transformed my tired apartment into a space that books nearly every weekend. My booking rate doubled in the first month after their redesign. Worth every shilling.",
      rating: 5,
      type: "airbnb"
    },
    {
      name: "Dr. Ann Wanjiku",
      project: "Family Home - Runda",
      quote: "From consultation to final reveal, the team was professional, creative, and respectful of our budget. Our home finally feels like 'us'—warm, functional, and beautiful.",
      rating: 5,
      type: "home"
    },
    {
      name: "James & Sarah M.",
      project: "Holiday Home - Diani",
      quote: "As out-of-town owners, we needed someone we could trust completely. They furnished our beach house remotely, sent photo updates, and delivered a stunning result that our guests love.",
      rating: 5,
      type: "airbnb"
    }
  ];

  const faqs = [
    {
      q: "How does the process work?",
      a: "We start with a consultation to understand your needs, style preferences, and budget. We then create a design proposal with mood boards and a furniture plan. Once approved, we source all items, handle delivery, and professionally install everything. You walk into a completely finished, styled home."
    },
    {
      q: "Do you work with clients outside Nairobi?",
      a: "Absolutely! We've completed projects in Mombasa, Diani, Naivasha, Nakuru, and Eldoret. We coordinate remotely with virtual walkthroughs and have trusted installation partners across Kenya."
    },
    {
      q: "How much does your service cost?",
      a: "Our services are tailored to each project. We provide detailed quotes based on your specific needs—no surprises, just transparent pricing."
    },
    {
      q: "Do you provide furniture or do we buy it?",
      a: "We handle everything. We source furniture, decor, and accessories from our vetted suppliers, manage procurement, and handle delivery. You receive a single invoice covering all items plus our design and project management fee."
    },
    {
      q: "How long does a typical project take?",
      a: "Timelines vary by project scope, but most residential projects take 2-4 weeks from consultation to completion. We communicate proactively about any delays."
    },
    {
      q: "Do you only design for Airbnb or also personal homes?",
      a: "Both! We design for homeowners who want beautiful, functional living spaces, and for investors who want to maximize their Airbnb returns. Each approach is tailored to different priorities."
    }
  ];

  const process = [
    { step: "01", title: "Consultation", desc: "We discuss your vision, budget, and timeline." },
    { step: "02", title: "Design Concept", desc: "We create mood boards, layouts, and material selections." },
    { step: "03", title: "Sourcing", desc: "We procure all furniture, decor, and fixtures." },
    { step: "04", title: "Installation", desc: "Our team delivers, assembles, and styles everything." },
    { step: "05", title: "Reveal", desc: "You walk into a completed, photo-ready space." }
  ];

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden selection:bg-stone-200">
      
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?w=1600&auto=compress"
            alt="Elegant living room interior design"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#093A3E] via-[#093A3E]/85 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="text-[#ED9B40] text-sm uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <FaPalette /> Interior Design & Setup
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Turn Your Space Into a <br /><span className="italic text-[#ED9B40]">Masterpiece</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Whether it's your dream home or a high-performing Airbnb—we design, source, and style spaces that look beautiful and live perfectly.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink("Hello! I'm interested in interior design/setup services for my home or Airbnb. Can you share more details?")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> WhatsApp Consultation
              </a>
              <a
                href="tel:+25459170780"
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <FaPhone /> Call Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Contact Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[900px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#ED9B40]/10 text-[#ED9B40] px-4 py-2 rounded-full text-sm font-medium mb-4">
            <FaWhatsapp /> Quick & Easy
          </div>
          <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start Your <span className="italic">Design Journey</span>
          </h2>
          <p className="text-stone-600 max-w-2xl mx-auto mb-8">
            Tell us about your space, style preferences, and budget—we'll get back to you within minutes on WhatsApp.
          </p>

          <div className="bg-[#f5f2ee] p-12 rounded-sm border border-stone-200 max-w-md mx-auto">
            <FaWhatsapp className="text-6xl text-[#25D366] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#0F4C55] mb-3 font-serif">WhatsApp Consultation</h3>
            <p className="text-stone-600 mb-6">
              Chat with our design team directly. Share photos of your space and get expert advice.
            </p>
            <a
              href={getWhatsAppLink("Hello! I'm interested in interior design/setup services for my home or Airbnb. Can you share more details?")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#25D366] text-white font-bold rounded-full hover:bg-[#20bd5a] transition-colors"
            >
              <FaWhatsapp size={20} /> Start WhatsApp Chat
            </a>
            <p className="text-xs text-stone-400 mt-4">
              Or call us directly: <a href="tel:+25459170780" className="text-[#0F4C55]">+25459170780</a>
            </p>
          </div>
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

      {/* Service Tabs - Home vs Airbnb */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Design Services for <span className="italic">Every Space</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Whether you're creating your forever home or optimizing for rental income—we've got a solution.
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('homes')}
              className={`px-8 py-4 text-sm uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'homes' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-[#f5f2ee] text-stone-600 hover:text-[#0F4C55]'
              }`}
            >
              <FaHome /> For Homeowners
            </button>
            <button
              onClick={() => setActiveTab('airbnb')}
              className={`px-8 py-4 text-sm uppercase tracking-widest font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'airbnb' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-[#f5f2ee] text-stone-600 hover:text-[#0F4C55]'
              }`}
            >
              <FaKey /> For Airbnb Investors
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'homes' ? homeServices : airbnbSpecificServices).map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200"
              >
                <service.icon className="text-3xl text-[#ED9B40] mb-4" />
                <h3 className="text-xl font-bold text-[#0F4C55] mb-2">{service.title}</h3>
                <p className="text-stone-600">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Recent <span className="italic">Projects</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              A glimpse of spaces we've transformed across Kenya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioProjects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative overflow-hidden h-64">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm uppercase tracking-widest border border-white px-4 py-2">View Project</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-[#0F4C55] text-lg">{project.title}</h3>
                  <p className="text-xs text-[#ED9B40] uppercase tracking-wider mb-2">{project.type}</p>
                  <p className="text-sm text-stone-600">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-stone-500 text-sm">
              More projects available upon request. Contact us for a full portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Clients Choose <span className="italic">Us</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6"
              >
                <item.icon className="text-4xl text-[#ED9B40] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{item.title}</h3>
                <p className="text-stone-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Design <span className="italic">Process</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              A simple, transparent journey from idea to reveal.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#ED9B40]/30 -translate-y-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {process.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center bg-white p-6 rounded-sm shadow-sm relative z-10"
                >
                  <div className="w-16 h-16 bg-[#0F4C55] rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-bold text-[#0F4C55] mb-2">{step.title}</h3>
                  <p className="text-sm text-stone-500">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What Our <span className="italic">Clients Say</span>
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
                <p className="text-stone-700 mb-4 italic text-sm">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-[#0F4C55]">{testimonial.name}</p>
                  <p className="text-xs text-stone-500">{testimonial.project}</p>
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
                    <a
                      href={getWhatsAppLink(`Hello! I have a question: ${faq.q}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                    >
                      <FaWhatsapp /> Ask us about this on WhatsApp
                    </a>
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
            Ready to Transform <span className="text-[#ED9B40]">Your Space?</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Let's create a home or Airbnb that wows at every turn. Message us on WhatsApp to get started.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink("Hello! I'm interested in interior design/setup services for my home or Airbnb. Can you share more details?")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> WhatsApp Consultation
            </a>
            <a
              href="tel:+25459170780"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call Us
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-[#ED9B40]" /> Quality Guarantee</span>
            <span className="flex items-center gap-2"><FaRegClock className="text-[#ED9B40]" /> On Time Delivery</span>
            <span className="flex items-center gap-2"><FaHome className="text-[#ED9B40]" /> 150+ Homes Styled</span>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <a href="https://wa.me/25459170780" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:design@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaEnvelope size={20} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
              <FaInstagram size={20} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.tiktok }}>
              <FaTiktok size={20} />
            </a>
            <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.facebook }}>
              <FaFacebookF size={20} />
            </a>
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.youtube }}>
              <FaYoutube size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InteriorDesignSetup;