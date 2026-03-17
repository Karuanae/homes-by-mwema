import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaStar, 
  FaQuoteLeft, 
  FaChevronDown, 
  FaChevronUp,
  FaCamera,
  FaHome,
  FaChartLine,
  FaHeadset,
  FaWhatsapp,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaKey,
  FaChartPie
} from 'react-icons/fa';

export default function Management() {
  const [expandedReviews, setExpandedReviews] = useState({});
  const [activeProperty, setActiveProperty] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "254720108914";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message templates for different purposes
  const whatsappMessages = {
    general: "Hello! I'm interested in your property management services in Nairobi. I'd like to know more about how you can help maximize my rental income.",
    consultation: "Hello! I'd like to schedule a consultation to discuss managing my property with Homes by Mwema. Please let me know your availability.",
    pricing: "Hello! I'm interested in learning more about your management pricing structure. Can you share details about your rates and packages?",
    property: (propertyName) => `Hello! I'm interested in learning more about how you manage properties like ${propertyName}. Can you tell me more about your management services?`
  };

  // Sample properties managed
  const managedProperties = [
    {
      id: 1,
      name: "Almasi Interiors",
      location: "Thika Road",
      image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      rating: 4.9,
      bookings: 124,
      revenue: "1.2M",
      host: "Benny (@Almasi_interiors)"
    },
    {
      id: 2,
      name: "Jaymilla Homes",
      location: "Thika Road",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      rating: 5.0,
      bookings: 89,
      revenue: "850K",
      host: "Cess"
    },
    {
      id: 3,
      name: "Christine's Property",
      location: "Kilimani",
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      rating: 4.8,
      bookings: 156,
      revenue: "1.5M",
      host: "Christine"
    },
    {
      id: 4,
      name: "Curtis Luxury Unit",
      location: "Kileleshwa",
      image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      rating: 4.9,
      bookings: 67,
      revenue: "980K",
      host: "Curtis"
    }
  ];

  const reviews = [
    {
      id: 1,
      name: "Benny (@Almasi_interiors)",
      location: "Diaspora/Thika Road",
      date: "January 2026",
      rating: 5,
      content: `My interaction with Homes by Mwema started in early January 2026 after I discovered the page on social media. Our first conversation happened while I was in the diaspora, and that's where my Airbnb journey began. 

Working with Ann (Homes by Mwema) has been an eye-opener—she helped me identify and correct common mistakes many hosts make. Through her content and our one-on-one calls, I gained a deeper understanding of the Airbnb business, especially while managing it from abroad.

Right now the business is stable, scaling, and running smoothly even while I'm abroad. I highly recommend Homes by Mwema to anyone looking to start or grow in the Airbnb space. 

Looking forward to more collaboration ahead. 🤝✨ ~Benny (@Almasi_interiors) Benny,Thika Road`,
      shortContent: `My interaction with Homes by Mwema started in early January 2026... Working with Ann has been an eye-opener—she helped me identify and correct common mistakes many hosts make.`,
      properties: [1]
    },
    {
      id: 2,
      name: "Cess",
      location: "Thika Road",
      date: "February 2026",
      rating: 5,
      content: `Four months ago I started my Airbnb business "Jaymilla Homes". I knew no one in the industry, but I trusted that it would work out since it was the festive season and hosting seemed quite demanding. I managed to host a few clients as I slowly learnt a few strategies on hosting, which was very motivating. However, when January came, things changed. Clients reduced and everything seemed to be at a standstill.

As a host, I kept wondering how I would get more clients like other hosts. One of the toughest things I experienced was trying to receive genuine guidance from someone in the same space. Most people would say, "What worked for me might not work for you, find clients your own way," which was very disorienting as a beginner. That changed when I came across "Homes By Muema" on TikTok where she shared tips on hosting. I reached out to her and we set up a few guidance sessions. Since then, hosting has shifted from feeling like a burden to becoming much easier. From her I learnt how to handle and treat both new and existing clients, as well as the do's and don'ts of hosting, which helped improve my income even during the stagnant months. 

Going forward, I look forward to working more with Muema and would definitely refer anyone who intends to venture into hosting. Cess,Thika road.`,
      shortContent: `Four months ago I started my Airbnb business "Jaymilla Homes"... When January came, things changed. Clients reduced and everything seemed to be at a standstill. That changed when I came across "Homes By Muema" on TikTok.`,
      properties: [2]
    },
    {
      id: 3,
      name: "Christine",
      location: "Kilimani",
      date: "February 2026",
      rating: 5,
      content: `When I started my Airbnb business, I believed that with the right agent the business would thrive. Unfortunately, the first two months were very challenging. I only managed to get two clients and had to keep going back to my own pocket to sustain the business. Eventually, I parted ways with my previous agent and was ready to sell the business.

Then I came across Homes by Mwema on TikTok and decided to reach out. From the first conversation, Ann was very responsive and even offered to meet me the same day so we could discuss how to turn things around. That meeting marked the beginning of a new chapter for my Airbnb journey.

Since partnering with Homes by Mwema, I've received great support and guidance. I've learned the importance of listing optimization, strategic marketing, professional photos, and being part of a community of hosts and agents. Most importantly, they have significantly reduced the stress that comes with managing the business because I now have the right support and direction.

I'm truly grateful for the professionalism and support from Homes by Mwema, I look forward to partnering together on many more opportunities in the future. Christine,Kilimani`,
      shortContent: `When I started my Airbnb business, I believed that with the right agent the business would thrive. Unfortunately, the first two months were very challenging... Since partnering with Homes by Mwema, I've received great support and guidance.`,
      properties: [3]
    },
    {
      id: 4,
      name: "Curtis",
      location: "Kileleshwa",
      date: "January 2026",
      rating: 5,
      content: `Before partnering with Homes By Mwema, I was struggling as a solo Airbnb host in Nairobi—double bookings were a nightmare, eating into my profits and stressing me out with guest complaints and rescheduling chaos. My listings barely got noticed amid the competition, and I felt stuck, barely covering costs let alone scaling up. That's when Mwema stepped in as my co-host; we connected through a virtual call where she shared her savvy tips on optimization. From day one, she dove in, sorting my calendar messes, preventing overlaps with smart blocking tools, and revamping my listings for killer visibility—boosting my search rankings and inquiries overnight.

Now, thanks to Homes By Mwema, my properties are booked solid 80% of the time, revenue's up 3x, and I finally have breathing room to focus on growth. Mwema's not just a co-host; she's the game-changer who turned my side hustle into a thriving business. Looking ahead, I'm eyeing maximum expansion—adding one more luxury unit by mid-year, and with her help on dynamic pricing and pro photos, I know we'll smash occupancy targets and hit 7 figures annually. Curtis,Kileleshwa.`,
      shortContent: `Before partnering with Homes By Mwema, I was struggling as a solo Airbnb host in Nairobi—double bookings were a nightmare... Now, thanks to Homes By Mwema, my properties are booked solid 80% of the time, revenue's up 3x.`,
      properties: [4]
    },
    {
      id: 5,
      name: "Lisa",
      location: "Machakos",
      date: "December 2025",
      rating: 5,
      content: `"A Big Thumb up to Homes By Mwema". As my Co-Host, has brought incredible expertise and dedication to our Airbnb Venture. Her keen eye for detail and responsiveness have been instrumental in my success. A+ Service, highly recommend. Lisa,Machakos`,
      shortContent: `"A Big Thumb up to Homes By Mwema". As my Co-Host, has brought incredible expertise and dedication to our Airbnb Venture. A+ Service, highly recommend.`,
      properties: []
    }
  ];

  const stats = [
    { label: "Properties Managed", value: "50+" },
    { label: "Active Hosts", value: "42" },
    { label: "Bookings Processed", value: "1,200+" },
    { label: "Revenue Generated", value: "Ksh 45M+" },
    { label: "Avg. Occupancy Rate", value: "87%" },
    { label: "Years Experience", value: "3+" }
  ];

  const services = [
    { icon: FaCamera, title: "Professional Photography", description: "High-quality photos that make your property stand out and attract more bookings." },
    { icon: FaHome, title: "Listing Optimization", description: "SEO-optimized listings with compelling descriptions that convert views into bookings." },
    { icon: FaChartLine, title: "Dynamic Pricing", description: "Smart pricing strategies to maximize your revenue during peak seasons." },
    { icon: FaHeadset, title: "24/7 Guest Support", description: "Round-the-clock support for your guests, handling inquiries and issues promptly." }
  ];

  const faqs = [
    { q: "How much does management cost?", a: "We offer flexible pricing tailored to your specific needs. Our rates typically range from 15-25% of booking revenue, depending on the level of service required and property location." },
    { q: "Do you handle properties outside Nairobi?", a: "Currently, we primarily operate in Nairobi, but we're expanding to other major cities like Thika Road, Machakos, and Kitengela. Contact us for a consultation about your specific location." },
    { q: "How quickly can you start managing my property?", a: "We can typically begin within 3-5 days after our initial consultation, including photography, listing creation, and pricing strategy setup." },
    { q: "What makes Homes by Mwema different?", a: "We combine local expertise with professional hospitality standards. Our team personally inspects every property and provides dedicated support to both hosts and guests. We specialize in helping diaspora hosts manage their properties remotely." }
  ];

  const toggleReview = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden selection:bg-stone-200">

      {/* Global styles */}
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .dropdown-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: rgba(237, 155, 64, 0.5);
          border-radius: 4px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(237, 155, 64, 0.8);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] bg-cover bg-center flex items-center" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#093A3E]/95 to-[#0F4C55]/80" />
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="text-[#ED9B40] text-sm uppercase tracking-[0.3em] mb-4">Premium Management Services</p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Property, <br /><span className="italic text-[#ED9B40]">Our Expertise</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Transform your Airbnb into a thriving business with professional management. 
              From diaspora hosts to local investors, we've helped 50+ property owners maximize their returns.
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
                onClick={() => document.getElementById('properties').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                View Managed Properties
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-stone-200 py-8">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#0F4C55]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA - Prominent */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready to Maximize Your Rental Income?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp to discuss your property and learn how our management services can help you earn more with less stress.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.consultation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
            >
              <FaWhatsapp size={18} /> Schedule Consultation
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.pricing)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaChartPie /> Request Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What We <span className="italic">Offer</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Comprehensive management solutions designed to maximize your property's potential
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 bg-[#f5f2ee] hover:bg-white transition-all duration-300 rounded-sm border border-stone-200 hover:shadow-xl"
              >
                <service.icon className="text-3xl text-[#ED9B40] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{service.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Showcase */}
      <section id="properties" className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Success <span className="italic">Stories</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Properties we currently manage and the hosts who trust us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {managedProperties.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                className="group cursor-pointer"
                onMouseEnter={() => setActiveProperty(property.id)}
                onMouseLeave={() => setActiveProperty(null)}
              >
                <div className="relative overflow-hidden rounded-sm aspect-[4/5] mb-4">
                  <img 
                    src={property.image} 
                    alt={property.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-xs uppercase tracking-widest mb-1">Managed for</p>
                    <p className="text-sm font-medium">{property.host}</p>
                  </div>
                  {activeProperty === property.id && (
                    <div className="absolute top-4 right-4 bg-[#ED9B40] text-[#093A3E] px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                      Featured
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#0F4C55]">{property.name}</h3>
                <p className="text-stone-500 text-xs uppercase tracking-wider mt-1">{property.location}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <FaStar className="text-[#ED9B40] text-xs" />
                    <span className="text-sm font-medium">{property.rating}</span>
                  </div>
                  <span className="text-stone-400 text-xs">{property.bookings} bookings</span>
                  <span className="text-[#0F4C55] font-bold text-sm">Ksh {property.revenue}</span>
                </div>
                
                {/* WhatsApp Inquiry Button for Property */}
                <a
                  href={getWhatsAppLink(whatsappMessages.property(property.name))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaWhatsapp /> Inquire about this property type
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section with Expandable Cards */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <FaQuoteLeft className="text-4xl text-[#ED9B40] mx-auto mb-4 opacity-50" />
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Host <span className="italic">Experiences</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Real stories from property owners who transformed their Airbnb business with us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < review.rating ? "text-[#ED9B40]" : "text-stone-300"} />
                  ))}
                </div>

                {/* Review Content */}
                <div className="relative">
                  <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                    {expandedReviews[review.id] ? review.content : review.shortContent}
                  </p>
                  
                  {/* Expand/Collapse Button */}
                  {review.content.length > review.shortContent.length && (
                    <button
                      onClick={() => toggleReview(review.id)}
                      className="flex items-center gap-1 text-[#ED9B40] text-xs uppercase tracking-widest font-bold mt-3 hover:text-[#0F4C55] transition-colors"
                    >
                      {expandedReviews[review.id] ? (
                        <>Read Less <FaChevronUp size={10} /></>
                      ) : (
                        <>Read Full Story <FaChevronDown size={10} /></>
                      )}
                    </button>
                  )}
                </div>

                {/* Associated Properties */}
                {review.properties.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-stone-200">
                    <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-2">
                      Properties featured in this review:
                    </p>
                    <div className="flex gap-2">
                      {review.properties.map(propId => {
                        const prop = managedProperties.find(p => p.id === propId);
                        return prop ? (
                          <div key={propId} className="relative w-12 h-12 rounded-sm overflow-hidden group">
                            <img src={prop.image} alt={prop.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[8px] uppercase tracking-widest">View</span>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Reviewer Info */}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0F4C55]">{review.name}</p>
                    <p className="text-xs text-stone-500">{review.location} · {review.date}</p>
                  </div>
                </div>

                {/* WhatsApp inquiry for this review */}
                <a
                  href={getWhatsAppLink(`Hello! I read ${review.name}'s review and I'm interested in learning more about your management services for properties in ${review.location}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                >
                  <FaWhatsapp /> Get similar results for your property
                </a>
              </motion.div>
            ))}
          </div>

          {/* Overall Rating */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-4 bg-[#f5f2ee] px-6 py-3 rounded-full">
              <div className="flex items-center gap-1">
                <FaStar className="text-[#ED9B40]" />
                <FaStar className="text-[#ED9B40]" />
                <FaStar className="text-[#ED9B40]" />
                <FaStar className="text-[#ED9B40]" />
                <FaStar className="text-[#ED9B40]" />
              </div>
              <span className="text-sm font-bold text-[#0F4C55]">5.0</span>
              <span className="text-stone-400 text-xs">(Based on 42 host reviews)</span>
            </div>
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
              <div key={index} className="bg-white p-6 rounded-sm border border-stone-200">
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{faq.q}</h3>
                <p className="text-stone-600 leading-relaxed">{faq.a}</p>
                
                {/* WhatsApp inquiry for each FAQ */}
                <a
                  href={getWhatsAppLink(`Hello! I have a question about your management services: ${faq.q}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                >
                  <FaWhatsapp /> Ask about this on WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to Maximize Your <span className="text-[#ED9B40]">Returns?</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Join 50+ successful hosts like Benny, Cess, Christine, Curtis, and Lisa who've transformed their Airbnb business with our management expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.consultation)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
            >
              <FaWhatsapp /> Free Consultation on WhatsApp
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.pricing)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <FaChartPie /> Request Pricing
            </a>
          </div>
          
          {/* Contact Options */}
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-6 justify-center">
            <a href={`https://wa.me/${whatsappNumber}`} className="flex items-center gap-2 text-white/70 hover:text-[#ED9B40] transition-colors text-sm">
              <FaWhatsapp /> WhatsApp
            </a>
            <a href="mailto:homesbymwema@gmail.com" className="flex items-center gap-2 text-white/70 hover:text-[#ED9B40] transition-colors text-sm">
              <FaEnvelope /> homesbymwema@gmail.com
            </a>
            <a href="tel:+254720108914" className="flex items-center gap-2 text-white/70 hover:text-[#ED9B40] transition-colors text-sm">
              <FaPhone /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}