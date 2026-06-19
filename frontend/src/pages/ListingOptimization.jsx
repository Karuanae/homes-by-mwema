import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaSearch,
  FaChartLine,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaAward,
  FaUsers,
  FaRegClock,
  FaPen,
  FaCamera,
  FaMagic,
  FaRocket,
  FaPercent,
  FaHome,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaPhone,
  FaEnvelope,
  FaWhatsapp
} from 'react-icons/fa';
import { MdOutlineAnalytics, MdRateReview, MdTrendingUp } from 'react-icons/md';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const ListingOptimization = () => {
  const [activeTab, setActiveTab] = useState('descriptions');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "254759170780";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message template for listing optimization inquiries
  const whatsappMessage = "Hello! I'm interested in your listing optimization services for my Airbnb property in Nairobi. I'd like to know more about your packages and how you can help improve my listing's performance.";

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "5+ Years Experience",
      description: "Specialized in optimizing Nairobi's finest Airbnb listings for maximum visibility and bookings."
    },
    {
      icon: FaUsers,
      title: "200+ Listings Optimized",
      description: "From studio apartments to luxury homes, we've helped hosts across Nairobi transform their listings."
    },
    {
      icon: FaRegClock,
      title: "72hr Turnaround",
      description: "Quick optimization service to get your listing performing at its best in no time."
    }
  ];

  const whyChooseUs = [
    {
      title: "Data-Driven Approach",
      description: "We analyze market trends, competitor listings, and guest behavior to optimize your listing for maximum bookings."
    },
    {
      title: "SEO Masters",
      description: "Our descriptions are crafted to rank high in Airbnb's search algorithm, making your property more discoverable."
    },
    {
      title: "Pricing Strategy Experts",
      description: "Dynamic pricing recommendations based on seasonality, local events, and market demand."
    },
    {
      title: "Proven Results",
      description: "Our optimized listings see an average of 50% increase in bookings within the first 60 days."
    }
  ];

  const optimizationServices = [
    {
      icon: FaPen,
      title: "Compelling Descriptions",
      description: "SEO-optimized, emotionally resonant descriptions that highlight your property's unique story and amenities."
    },
    {
      icon: FaCamera,
      title: "Photo Selection Guidance",
      description: "Expert advice on which photos to feature first and how to arrange them for maximum impact."
    },
    {
      icon: FaChartLine,
      title: "Dynamic Pricing",
      description: "Strategic pricing recommendations based on real-time market data and local demand patterns."
    },
    {
      icon: FaMagic,
      title: "Title Optimization",
      description: "Attention-grabbing titles that include high-search keywords while remaining authentic and appealing."
    },
    {
      icon: MdOutlineAnalytics,
      title: "Competitor Analysis",
      description: "In-depth analysis of similar properties in your area to identify opportunities and gaps."
    },
    {
      icon: MdRateReview,
      title: "Review Management",
      description: "Strategies to encourage positive reviews and professionally handle any negative feedback."
    }
  ];

  const successStories = [
    {
      name: "David M.",
      location: "Kilimani",
      property: "2-Bedroom Apartment",
      increase: "+156%",
      bookings: "from 8 to 22 bookings/month",
      quote: "My listing was getting lost in the crowd. After optimization, I'm fully booked months in advance!"
    },
    {
      name: "Grace W.",
      location: "Westlands",
      property: "Studio Apartment",
      increase: "+89%",
      bookings: "from 18 to 34 bookings/month",
      quote: "The pricing strategy alone paid for itself in the first week. Now I'm earning almost double!"
    },
    {
      name: "Peter K.",
      location: "Karen",
      property: "4-Bedroom House",
      increase: "+112%",
      bookings: "from 9 to 19 bookings/month",
      quote: "They transformed my listing completely. The new description perfectly captures what makes my home special."
    }
  ];

  const stats = [
    { icon: FaHome, value: "200+", label: "Listings Optimized" },
    { icon: FaStar, value: "4.9", label: "Client Rating" },
    { icon: FaRocket, value: "50%", label: "Avg. Booking Increase" },
    { icon: FaClock, value: "72hr", label: "Turnaround Time" }
  ];

  const optimizationTips = [
    {
      title: "Title That Captures Attention",
      before: "Cozy 2BR in Kilimani",
      after: "✨ Modern 2BR Haven with Skyline Views & Fast WiFi ✨",
      impact: "65% more clicks"
    },
    {
      title: "Description That Sells",
      before: "Nice apartment near shops. Has WiFi and parking.",
      after: "Wake up to breathtaking city views in this thoughtfully designed sanctuary. Steps away from Nairobi's best cafes and restaurants.",
      impact: "43% more bookings"
    },
    {
      title: "Strategic Photo Order",
      before: "Bathroom photo first",
      after: "Living room with natural light first, then bedroom, then amenities",
      impact: "78% longer view duration"
    }
  ];

  const packages = [
    {
      name: "Essential Optimization",
      price: "12K",
      features: [
        "Professional description rewrite",
        "Title optimization",
        "Photo selection guidance",
        "Basic keyword research",
        "5-day turnaround"
      ]
    },
    {
      name: "Premium Growth Package",
      price: "25K",
      features: [
        "Complete listing overhaul",
        "SEO-optimized description",
        "Dynamic pricing strategy",
        "Competitor analysis",
        "Amenity highlighting",
        "Guest communication templates",
        "48hr turnaround"
      ],
      popular: true
    },
    {
      name: "Ultimate Success Package",
      price: "45K",
      features: [
        "Everything in Premium",
        "Professional photography review",
        "6-month pricing calendar",
        "Review management strategy",
        "Monthly performance reports",
        "Priority support",
        "24hr turnaround"
      ]
    }
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
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Laptop with property listing"
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
              <FaSearch /> Listing Optimization
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Turn Views Into <br /><span className="italic text-[#ED9B40]">Bookings</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Your property deserves to be found. Our expert optimization services help you rank higher, attract more guests, and maximize your rental income.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Inquire on WhatsApp
              </a>
              <button 
                onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                View Packages
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp CTA - Prominent */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready to Boost Your Bookings?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp to discuss your listing and find the perfect optimization package for your property.
          </p>
          <a
            href={getWhatsAppLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
          >
            <FaWhatsapp size={18} /> Send Inquiry
          </a>
        </div>
      </section>

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Trust <span className="italic">Our Expertise?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              With years of experience optimizing Nairobi's most successful Airbnb listings, we know exactly what works.
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

      {/* Before & After Examples */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              The <span className="italic">Difference</span> We Make
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              See how small changes can lead to massive improvements in your listing's performance.
            </p>
          </div>

          <div className="space-y-8">
            {optimizationTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-sm border border-stone-200"
              >
                <h3 className="text-xl font-bold text-[#0F4C55] mb-4">{tip.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-stone-50 p-4 rounded-sm">
                    <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Before</p>
                    <p className="text-stone-600 italic">"{tip.before}"</p>
                  </div>
                  <div className="bg-[#0F4C55]/5 p-4 rounded-sm border border-[#ED9B40]/30">
                    <p className="text-xs uppercase tracking-widest text-[#ED9B40] mb-2">After</p>
                    <p className="text-[#0F4C55] font-medium">"{tip.after}"</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 text-xs font-bold rounded-full">
                    Impact: {tip.impact}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our <span className="italic">Optimization Services</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Comprehensive solutions to make your listing impossible to ignore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {optimizationServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200 hover:shadow-xl transition-all"
              >
                <service.icon className="text-3xl text-[#ED9B40] mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{service.title}</h3>
                <p className="text-stone-600 text-sm">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Real <span className="text-[#ED9B40] italic">Success Stories</span>
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              See how we've helped hosts across Nairobi transform their Airbnb businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm p-8 rounded-sm border border-white/20"
              >
                <FaQuoteLeft className="text-[#ED9B40] text-2xl mb-4 opacity-50" />
                <p className="text-white/90 mb-6 italic">"{story.quote}"</p>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-[#ED9B40]">{story.increase}</div>
                  <p className="text-sm text-white/70">{story.bookings}</p>
                </div>
                <div>
                  <p className="font-bold text-white">{story.name}</p>
                  <p className="text-sm text-white/60">{story.property} · {story.location}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Preview */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <MdTrendingUp className="text-5xl text-[#ED9B40] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Calculate Your <span className="italic">Potential</span>
          </h2>
          <p className="text-stone-600 text-lg mb-8 max-w-2xl mx-auto">
            Our optimized listings see an average of 50% more bookings. See what that could mean for your property.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="p-6 bg-[#f5f2ee] rounded-sm">
              <div className="text-sm uppercase tracking-widest text-stone-500 mb-2">Current Monthly</div>
              <div className="text-3xl font-bold text-[#0F4C55]">Ksh 80K</div>
            </div>
            <div className="p-6 bg-[#ED9B40] text-white rounded-sm">
              <div className="text-sm uppercase tracking-widest mb-2">After Optimization</div>
              <div className="text-3xl font-bold">Ksh 120K</div>
            </div>
            <div className="p-6 bg-[#0F4C55] text-white rounded-sm">
              <div className="text-sm uppercase tracking-widest mb-2">Increase</div>
              <div className="text-3xl font-bold">+50%</div>
            </div>
          </div>
          
          <a
            href={getWhatsAppLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-12 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-[#0F4C55] hover:text-white transition-colors"
          >
            <FaWhatsapp /> Get Your Custom Quote
          </a>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Investment <span className="italic">Packages</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Choose the optimization package that matches your goals and budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white p-8 rounded-sm border ${
                  pkg.popular ? 'border-[#ED9B40] shadow-xl scale-105' : 'border-stone-200'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#ED9B40] text-[#093A3E] px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-[#0F4C55] mb-2">{pkg.name}</h3>
                <div className="text-3xl font-bold text-[#0F4C55] mb-6">
                  Ksh {pkg.price}
                  <span className="text-sm font-normal text-stone-500 ml-2">/ package</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FaCheckCircle className="text-[#ED9B40] mt-0.5 flex-shrink-0" />
                      <span className="text-stone-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={getWhatsAppLink(`Hello! I'm interested in the ${pkg.name} for my listing. Can you provide more details?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block text-center py-3 px-6 text-xs uppercase tracking-widest font-bold transition-colors ${
                    pkg.popular
                      ? 'bg-[#ED9B40] text-[#093A3E] hover:bg-[#0F4C55] hover:text-white'
                      : 'bg-transparent border border-[#0F4C55] text-[#0F4C55] hover:bg-[#0F4C55] hover:text-white'
                  }`}
                >
                  <FaWhatsapp className="inline mr-2" /> Inquire About This Package
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center text-[#0F4C55] mb-12 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked <span className="italic">Questions</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How long does optimization take?",
                a: "Our Essential package is completed within 5 days, while Premium and Ultimate packages are delivered in 48 hours or less."
              },
              {
                q: "Will I see immediate results?",
                a: "Most hosts see an increase in views and inquiries within the first week, with booking improvements typically showing within 30 days."
              },
              {
                q: "Do you work with existing listings?",
                a: "Yes! We optimize both new and existing listings. In fact, established listings often see the most dramatic improvements."
              },
              {
                q: "Can you help with pricing strategy?",
                a: "Absolutely. All our packages include pricing recommendations, with Premium and Ultimate packages including dynamic pricing calendars."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200">
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{faq.q}</h3>
                <p className="text-stone-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaQuoteLeft className="text-4xl text-[#ED9B40] mx-auto mb-8 opacity-50" />
          <p className="text-2xl md:text-3xl font-serif italic text-[#0F4C55] mb-8">
            "My listing was invisible before. Now I'm consistently booked and earning more than ever. Worth every shilling!"
          </p>
          <div>
            <p className="font-bold text-[#0F4C55]">— Michael O., Lavington</p>
            <p className="text-sm text-stone-500">Premium Package Client</p>
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

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to <span className="text-[#ED9B40]">Dominate</span> Search Results?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join 200+ successful hosts who've transformed their Airbnb business with our optimization expertise.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> Optimize My Listing on WhatsApp
            </a>
            <a
              href="tel:+254759170780"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call to Discuss
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaCheckCircle className="text-[#ED9B40]" /> SEO-Optimized</span>
            <span className="flex items-center gap-2"><FaChartLine className="text-[#ED9B40]" /> Data-Driven</span>
            <span className="flex items-center gap-2"><FaStar className="text-[#ED9B40]" /> Proven Results</span>
          </div>

          {/* Contact Options */}
          <div className="mt-8 flex justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:optimize@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
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

export default ListingOptimization;