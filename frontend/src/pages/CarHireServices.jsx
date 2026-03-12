import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaCar,
  FaGasPump,
  FaCogs,
  FaUsers,
  FaSnowflake,
  FaShieldAlt,
  FaClock,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaAward,
  FaRegClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaRoad,
  FaBolt,
  FaChair,
  FaWifi,
  FaBluetooth,
  FaPhone,
  FaWhatsapp
} from 'react-icons/fa';
import { MdOutlineSpeed, MdAirlineSeatReclineNormal } from 'react-icons/md';
import { BiSolidCar, BiSolidTaxi } from 'react-icons/bi';

const CarHireServices = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "254720108914"; // Updated WhatsApp number
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "5+ Years Experience",
      description: "Trusted car hire service in Nairobi with a proven track record of customer satisfaction."
    },
    {
      icon: FaUsers,
      title: "1,500+ Happy Clients",
      description: "From business travelers to families, we've served thousands of satisfied customers."
    },
    {
      icon: FaRegClock,
      title: "24/7 Support",
      description: "Round-the-clock customer service and roadside assistance for peace of mind."
    }
  ];

  const whyChooseUs = [
    {
      title: "Modern, Well-Maintained Fleet",
      description: "All vehicles are regularly serviced and thoroughly cleaned between rentals, ensuring safety, reliability, and comfort for every journey."
    },
    {
      title: "Flexible Rental Options",
      description: "Choose from daily, weekly, or monthly rentals with transparent pricing and no hidden fees. Perfect for any duration of stay."
    },
    {
      title: "Airport Shuttle Service",
      description: "Complimentary airport pickup and drop-off at major Nairobi airports—skip the wait and hassle of rideshare surge pricing."
    },
    {
      title: "Comprehensive Insurance",
      description: "Every rental includes comprehensive insurance coverage, with options to reduce your liability for complete peace of mind."
    }
  ];

  const carCategories = [
    {
      type: "Economy Cars",
      description: "Perfect for solo travelers and couples - Toyota Corolla, Suzuki Swift, and similar models",
      icon: FaCar
    },
    {
      type: "SUVs & Crossovers",
      description: "Ideal for families and groups - Honda CR-V, Toyota RAV4, Nissan X-Trail",
      icon: BiSolidCar
    },
    {
      type: "Luxury Vehicles",
      description: "For those special occasions - Mercedes-Benz, BMW, Range Rover",
      icon: FaStar
    },
    {
      type: "Minivans & Buses",
      description: "Perfect for large groups and airport transfers - Toyota Hiace, Nissan Caravan",
      icon: BiSolidTaxi
    },
    {
      type: "Pickups & Utility",
      description: "For work and adventure - Isuzu D-Max, Toyota Hilux",
      icon: FaBolt
    }
  ];

  const rentalOptions = [
    {
      period: "Daily Rentals",
      description: "Perfect for short trips, airport transfers, and weekend getaways",
      icon: FaCalendarAlt
    },
    {
      period: "Weekly Rentals",
      description: "Ideal for business trips, family holidays, and extended stays",
      icon: FaClock
    },
    {
      period: "Monthly Subscriptions",
      description: "The freedom of a car without the commitment of ownership",
      icon: FaMoneyBillWave,
      popular: true
    }
  ];

  const stats = [
    { icon: FaCar, value: "25+", label: "Vehicles in Fleet" },
    { icon: FaStar, value: "4.8", label: "Customer Rating" },
    { icon: FaUsers, value: "1,500+", label: "Happy Clients" },
    { icon: FaRoad, value: "1M+", label: "KM Driven" }
  ];

  const testimonials = [
    {
      name: "David M.",
      location: "Nairobi",
      quote: "The monthly subscription was perfect for my work assignment. One bill covered everything, and they even swapped my car when my needs changed.",
      rating: 5
    },
    {
      name: "Sarah K.",
      location: "Mombasa",
      quote: "We rented for our family safari. The car was immaculate, and the airport pickup made everything so smooth after our flight.",
      rating: 5
    },
    {
      name: "James O.",
      location: "Kisumu",
      quote: "Needed a luxury car for a client visit. Impeccable service, clean car, professional handover. My client was impressed!",
      rating: 5
    }
  ];

  const faqs = [
    {
      q: "What vehicles do you offer?",
      a: "We offer a wide range of vehicles including economy cars, SUVs, luxury vehicles, minivans, and pickup trucks. All our vehicles are well-maintained and regularly serviced."
    },
    {
      q: "Do you offer airport pickup and drop-off?",
      a: "Yes! We provide complimentary shuttle service from Jomo Kenyatta International Airport (JKIA) and Wilson Airport to our depot."
    },
    {
      q: "What insurance is included?",
      a: "All rentals include comprehensive third-party insurance. Monthly subscriptions include full comprehensive insurance in the weekly payment."
    },
    {
      q: "Is there a mileage limit?",
      a: "No! All our rentals come with unlimited kilometers. We want you to explore Kenya without worrying about extra charges."
    },
    {
      q: "How do I book a car?",
      a: "Simply click the 'Book on WhatsApp' button and send us a message with your requirements. Our team will respond within minutes to confirm your booking."
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
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-4px);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury car fleet"
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
              <BiSolidCar /> Premium Car Hire Services
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Drive Your Way, <br /><span className="italic text-[#ED9B40]">Any Way You Want</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              From daily rentals to flexible monthly subscriptions—experience the freedom of the open road with Nairobi's most trusted car hire service.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink("Hello! I'm interested in booking a car. Can you please share your available vehicles and rates?")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Book on WhatsApp
              </a>
              <a
                href="tel:+254720108914"
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              >
                <FaPhone /> Call Us
              </a>
            </div>
            <p className="text-white/60 text-sm mt-4">
              ✓ Instant response on WhatsApp • ✓ 24/7 support • ✓ Free airport pickup
            </p>
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
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Quick & Easy Booking on WhatsApp</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Send us a message with your requirements and we'll respond within minutes with available vehicles and rates.
          </p>
          <a
            href={getWhatsAppLink("Hello! I'd like to book a car. Here are my details:%0A%0A• Rental period: [e.g., 3 days]%0A• Pickup date: [DD/MM/YYYY]%0A• Return date: [DD/MM/YYYY]%0A• Vehicle type: [e.g., SUV]%0A• Number of passengers: [e.g., 4]%0A• Special requests: [optional]")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
          >
            <FaWhatsapp size={18} /> Send Booking Request
          </a>
        </div>
      </section>

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose <span className="italic">Homes by Mwema Car Hire?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We combine local expertise with premium service to deliver the best car rental experience in Nairobi.
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

      {/* Vehicle Categories - Simplified */}
      <section className="py-16 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif">Our Vehicle Categories</h2>
            <p className="text-stone-600">We have a diverse fleet to meet all your travel needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carCategories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-sm border border-stone-200 hover-lift"
              >
                <category.icon className="text-2xl text-[#ED9B40] mb-3" />
                <h3 className="font-bold text-[#0F4C55] mb-2">{category.type}</h3>
                <p className="text-sm text-stone-600">{category.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rental Options */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif">Flexible Rental Options</h2>
            <p className="text-stone-600">Choose what works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rentalOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-sm border ${option.popular ? 'border-[#ED9B40] bg-[#f5f2ee]' : 'border-stone-200 bg-white'}`}
              >
                {option.popular && <span className="text-xs text-[#ED9B40] font-bold uppercase tracking-widest mb-2 block">Most Popular</span>}
                <option.icon className="text-2xl text-[#ED9B40] mb-3" />
                <h3 className="font-bold text-[#0F4C55] mb-2">{option.period}</h3>
                <p className="text-sm text-stone-600">{option.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription Spotlight */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#0F4C55] to-[#093A3E] text-white">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Monthly Car Subscriptions</h2>
          <p className="text-white/80 mb-6">The modern alternative to car ownership. One simple payment covers everything.</p>
          <a
            href={getWhatsAppLink("Hello! I'm interested in your monthly car subscription. Can you share details about available vehicles and pricing?")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
          >
            <FaWhatsapp /> Inquire About Subscriptions
          </a>
        </div>
      </section>

      {/* Airport Transfer Advantage */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[800px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif">Free Airport Shuttle</h2>
            <p className="text-stone-600">Skip the wait and surge pricing</p>
          </div>
          
          <div className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200">
            <p className="text-stone-700 mb-4">
              We provide complimentary pickup from JKIA and Wilson Airport. Your car will be ready and waiting when you arrive.
            </p>
            <a
              href={getWhatsAppLink("Hello! I need an airport pickup. My flight details: [Flight number] arriving on [date] at [time]. I'd like to rent a [vehicle type].")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
            >
              <FaWhatsapp /> Arrange Airport Pickup on WhatsApp
            </a>
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
                  className="w-full text-left p-4 bg-[#f5f2ee] flex justify-between items-center hover:bg-[#e5dfd9] transition-colors"
                >
                  <span className="font-bold text-[#0F4C55] text-sm">{faq.q}</span>
                  <span className="text-[#ED9B40]">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white border-t border-stone-200">
                    <p className="text-stone-600 text-sm">{faq.a}</p>
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
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready to Hit the Road?</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Book your car in under 2 minutes on WhatsApp. Instant confirmation, no waiting.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink("Hello! I'd like to book a car. Please send me your available vehicles and rates.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> Book Now on WhatsApp
            </a>
            <a
              href="tel:+254720108914"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call to Book
            </a>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 justify-center text-sm">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-[#ED9B40]" /> Fully Insured</span>
            <span className="flex items-center gap-2"><FaRoad className="text-[#ED9B40]" /> Unlimited Mileage</span>
            <span className="flex items-center gap-2"><FaClock className="text-[#ED9B40]" /> 24/7 Support</span>
            <span className="flex items-center gap-2"><FaWhatsapp className="text-[#ED9B40]" /> Instant Booking</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CarHireServices;