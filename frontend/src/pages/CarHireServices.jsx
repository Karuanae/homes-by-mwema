import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaCar,
  FaUsers,
  FaShieldAlt,
  FaClock,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaAward,
  FaRegClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPhone,
  FaWhatsapp,
  FaUserTie,
  FaPlaneArrival,
  FaBuilding,
  FaBriefcase,
  FaSuitcase,
  FaRoute,
  FaCarSide
} from 'react-icons/fa';

const CarHireServices = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  const whatsappNumber = "254720108914";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const chauffeurServices = [
    {
      icon: FaPlaneArrival,
      title: "Airport Transfers",
      description: "Your driver meets you at arrivals with a name sign. No waiting, no haggling—straight to your destination. Available from JKIA and Wilson Airport.",
    },
    {
      icon: FaBriefcase,
      title: "Corporate Travel",
      description: "Professional drivers for business meetings, client pickups, and daily office commutes. Presentable, punctual, and discreet.",
    },
    {
      icon: FaBuilding,
      title: "Property Viewings",
      description: "Need to show properties to clients? We provide drivers who know Nairobi well—getting you and your clients to multiple locations efficiently.",
    },
    {
      icon: FaCalendarAlt,
      title: "Hourly & Daily Hire",
      description: "Book a driver for a few hours or the full day. Great for errands, events, shopping trips, or exploring the city at your own pace.",
    },
    {
      icon: FaSuitcase,
      title: "Long Distance Travel",
      description: "Comfortable rides to Naivasha, Nakuru, Mombasa, or wherever your journey takes you. Your driver handles the road while you relax.",
    },
    {
      icon: FaUserTie,
      title: "Event & Wedding Chauffeurs",
      description: "Make an entrance. Professional, well-dressed drivers for weddings, galas, corporate events, and special occasions.",
    }
  ];

  const whyChooseUs = [
    {
      title: "Professional, Vetted Drivers",
      description: "Every driver in our network is thoroughly vetted, experienced, and trained in customer service. They know Nairobi's routes and traffic patterns inside out."
    },
    {
      title: "You Set the Schedule",
      description: "Need a driver for 2 hours or the whole day? Multiple stops? Your plans, your timeline. We adapt to you, not the other way around."
    },
    {
      title: "No Driving Stress",
      description: "Skip the Nairobi traffic stress, parking hassles, and navigation worries. Sit back, take calls, answer emails, or just enjoy the ride."
    },
    {
      title: "Transparent Pricing",
      description: "Clear rates discussed upfront. No surge pricing, no hidden fees—just honest service at agreed prices."
    }
  ];

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "5+ Years Experience",
      description: "Providing reliable chauffeur services across Nairobi with a growing base of repeat clients."
    },
    {
      icon: FaStar,
      title: "Trusted by Regulars",
      description: "From business executives to families, our clients keep coming back because they know what to expect."
    },
    {
      icon: FaRegClock,
      title: "Available When You Need Us",
      description: "Early morning flights, late night pickups, or full-day bookings—we're here when you need a driver."
    }
  ];

  const testimonials = [
    {
      name: "David M.",
      location: "Nairobi",
      quote: "I use their chauffeur service weekly for client meetings. The driver is always early, the car is clean, and I can prepare for meetings on the way instead of fighting traffic.",
    },
    {
      name: "Sarah K.",
      location: "Karen",
      quote: "Booked a driver for my parents visiting from overseas. They were picked up from the airport, taken around Nairobi, and dropped back—all without me worrying.",
    },
    {
      name: "James O.",
      location: "Westlands",
      quote: "Needed a driver for a full day of property viewings with my clients. The driver knew all the shortcuts and made us look professional. Will definitely book again."
    }
  ];

  const faqs = [
    {
      q: "How does the chauffeur service work?",
      a: "You tell us where and when you need a driver. We send a professional driver to your location. You set the schedule and destinations—we handle the driving."
    },
    {
      q: "How much does it cost?",
      a: "Pricing depends on duration and distance. We give you a clear quote before you book—no surprises. Send us your requirements on WhatsApp for a quick quote."
    },
    {
      q: "Can I book a driver for multiple stops?",
      a: "Absolutely. Whether it's airport pickup, then a meeting, then lunch, then back home—your driver follows your schedule for as long as you've booked them."
    },
    {
      q: "How far in advance should I book?",
      a: "We recommend booking at least 24 hours ahead, especially for airport transfers. But we can often accommodate same-day requests—just ask on WhatsApp."
    },
    {
      q: "What areas do you cover?",
      a: "Primarily Nairobi and surrounding areas. We also cover long-distance trips to places like Naivasha, Nakuru, and Mombasa upon request."
    }
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
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Professional chauffeur service"
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
              <FaUserTie /> Chauffeur Services
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              We Drive.<br /><span className="italic text-[#ED9B40]">You Relax.</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Professional drivers for airport transfers, corporate travel, property viewings, and anywhere else you need to go in Nairobi.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink("Hello! I need a chauffeur. Here are my requirements: [date/time, pickup location, destination, number of hours needed]")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Book a Driver on WhatsApp
              </a>
              <a
                href="tel:+254720108914"
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <FaPhone /> Call Us
              </a>
            </div>
            <p className="text-white/60 text-sm mt-4">
              ✓ Professional drivers • ✓ Clear pricing • ✓ Available 7 days a week
            </p>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp Quick Booking */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Book a Driver in Minutes</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Send us a message with your requirements—pickup location, destination, date and time. We'll confirm your driver and send you the details.
          </p>
          <a
            href={getWhatsAppLink("Hello! I'd like to book a chauffeur. Details:%0A%0A• Date: [DD/MM/YYYY]%0A• Time: [e.g., 10:00 AM]%0A• Pickup: [location]%0A• Destination: [where you're going]%0A• Duration: [e.g., 3 hours / full day]%0A• Purpose: [airport transfer / meetings / etc]")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
          >
            <FaWhatsapp size={18} /> Request a Driver Now
          </a>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Where Can We <span className="italic">Drive You?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              From airport pickups to full-day bookings—your driver, your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chauffeurServices.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200"
              >
                <service.icon className="text-3xl text-[#ED9B40] mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-3">{service.title}</h3>
                <p className="text-sm text-stone-600 mb-4">{service.description}</p>
                <a
                  href={getWhatsAppLink(`Hello! I'm interested in your ${service.title.toLowerCase()} service. Can you share more details and pricing?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                >
                  <FaWhatsapp size={14} /> Inquire on WhatsApp
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose <span className="italic">Our Drivers?</span>
            </h2>
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
                className="bg-white p-8 rounded-sm border border-stone-200"
              >
                <h3 className="text-lg font-bold text-[#0F4C55] mb-3">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simple */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[900px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-10 font-serif">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Tell Us Your Plans", desc: "Message us on WhatsApp with your pickup location, destination, date, and time." },
              { step: "2", title: "Get Confirmation", desc: "We confirm your driver and share their details before the pickup time." },
              { step: "3", title: "Enjoy the Ride", desc: "Your driver arrives on time. You sit back and let them handle the road." }
            ].map((item, i) => (
              <div key={i} className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200">
                <div className="w-10 h-10 bg-[#ED9B40] text-[#093A3E] rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-[#0F4C55] mb-2">{item.title}</h3>
                <p className="text-sm text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif">What Our Clients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-sm border border-stone-200"
              >
                <FaQuoteLeft className="text-[#ED9B40] opacity-30 mb-2" />
                <p className="text-stone-700 text-sm mb-4 italic">"{testimonial.quote}"</p>
                <p className="font-bold text-[#0F4C55] text-sm">{testimonial.name}</p>
                <p className="text-xs text-stone-500">{testimonial.location}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl text-center text-[#0F4C55] mb-10 font-serif">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-stone-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 bg-[#f5f2ee] flex justify-between items-center hover:bg-stone-100 transition-colors"
                >
                  <span className="font-bold text-[#0F4C55] text-sm">{faq.q}</span>
                  <span className="text-[#ED9B40]">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white border-t border-stone-200">
                    <p className="text-stone-600 text-sm">{faq.a}</p>
                    <a
                      href={getWhatsAppLink(`Hello! I have a question about your chauffeur service: ${faq.q}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                    >
                      <FaWhatsapp size={14} /> Ask on WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Need a Driver?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Tell us where you need to go. We'll handle the driving.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink("Hello! I need a chauffeur. Please share your rates and availability.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> Book a Driver Now
            </a>
            <a
              href="tel:+254720108914"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call to Book
            </a>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm">
            <span className="flex items-center gap-2"><FaUserTie className="text-[#ED9B40]" /> Professional Drivers</span>
            <span className="flex items-center gap-2"><FaRoute className="text-[#ED9B40]" /> Your Schedule</span>
            <span className="flex items-center gap-2"><FaClock className="text-[#ED9B40]" /> On Time, Every Time</span>
            <span className="flex items-center gap-2"><FaWhatsapp className="text-[#ED9B40]" /> Easy Booking</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CarHireServices;