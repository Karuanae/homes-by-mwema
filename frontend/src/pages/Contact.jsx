import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaFacebookF,
  FaClock,
  FaUserTie,
  FaHeadset,
  FaCheckCircle,
  FaArrowRight,
  FaStar,
  FaQuoteLeft,
  FaBuilding,
  FaGlobeAfrica
} from 'react-icons/fa';
import { MdOutlineEmail, MdOutlineLocationOn, MdOutlinePhone, MdOutlineWatchLater } from 'react-icons/md';
import { BiSend } from 'react-icons/bi';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    success: false,
    message: ''
  });

  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    // For now, we'll simulate a successful submission
    setFormStatus({
      submitted: true,
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24 hours.'
    });
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormStatus({ submitted: false, success: false, message: '' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 5000);
  };

  const officeLocations = [
    {
      city: "Nairobi",
      address: "Kilimani Business Centre, 5th Floor",
      street: "Argwings Kodhek Road",
      area: "Kilimani, Nairobi",
      phone: "+254 700 123 456",
      email: "nairobi@homesbymwema.com",
      hours: "Mon-Fri: 8:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM"
    },
    {
      city: "Mombasa",
      address: "Nyali Centre, Suite 12",
      street: "Malindi Road",
      area: "Nyali, Mombasa",
      phone: "+254 700 123 457",
      email: "mombasa@homesbymwema.com",
      hours: "Mon-Fri: 8:00 AM - 5:00 PM, Sat: 9:00 AM - 1:00 PM"
    }
  ];

  const contactReasons = [
    {
      icon: FaBuilding,
      title: "Property Booking",
      description: "Interested in booking one of our premium residences? Our team is ready to assist you."
    },
    {
      icon: FaUserTie,
      title: "Management Services",
      description: "Want to list your property with us? Learn how we can help maximize your returns."
    },
    {
      icon: FaHeadset,
      title: "Customer Support",
      description: "Need help with an existing booking or have questions about your stay?"
    },
    {
      icon: FaGlobeAfrica,
      title: "Partnerships",
      description: "Interested in partnering with Homes by Mwema? Let's explore opportunities together."
    }
  ];

  const faqs = [
    {
      q: "How quickly do you respond to inquiries?",
      a: "We aim to respond to all inquiries within 2-4 hours during business hours. For urgent matters, we recommend calling us directly or sending a WhatsApp message for the fastest response."
    },
    {
      q: "Can I book a property through WhatsApp?",
      a: "Yes! You can start your booking process through WhatsApp. Our team will guide you through available properties, answer questions, and help you secure your reservation."
    },
    {
      q: "What information do I need to provide when contacting you?",
      a: "For booking inquiries, please let us know your preferred property (if any), dates of stay, number of guests, and any special requirements. For management services, share your property location and type."
    },
    {
      q: "Do you have 24/7 emergency support?",
      a: "Yes! Current guests can reach our emergency line at any time. The number is provided in your booking confirmation and posted in the property."
    }
  ];

  const stats = [
    { value: "24/7", label: "Support Available" },
    { value: "< 2hrs", label: "Avg. Response Time" },
    { value: "5,000+", label: "Happy Clients" },
    { value: "15+", label: "Locations" }
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
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Contact Homes by Mwema"
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
              <FaHeadset /> Get in Touch
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              We're Here to <br /><span className="italic text-[#ED9B40]">Help You</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Whether you're looking to book your dream stay, list your property, or just have a question—our team is ready to assist you.
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

      {/* Contact Reasons */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              How Can We <span className="italic">Help You?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Select the reason for your inquiry and we'll connect you with the right team member.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactReasons.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200 hover-lift cursor-pointer"
              >
                <reason.icon className="text-3xl text-[#ED9B40] mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{reason.title}</h3>
                <p className="text-sm text-stone-600">{reason.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA - Prominent Section */}
      <section className="py-24 px-6 bg-[#0F4C55] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <FaWhatsapp className="text-[200px] absolute -bottom-10 -right-10" />
        </div>
        <div className="max-w-[1000px] mx-auto text-center relative z-10">
          <FaWhatsapp className="text-6xl text-[#ED9B40] mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-serif mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Chat with Us on <span className="text-[#ED9B40]">WhatsApp</span>
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Get instant responses from our team. We're just a message away!
          </p>
          <a 
            href="https://wa.me/254700000000?text=Hello%20Homes%20by%20Mwema!%20I'd%20like%20to%20inquire%20about%20your%20services." 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-sm hover:bg-white transition-colors rounded-full"
          >
            <FaWhatsapp size={20} /> Start WhatsApp Chat
          </a>
          <p className="text-white/60 text-sm mt-4">
            Typically responds within 5-10 minutes during business hours
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Send Us a <span className="italic">Message</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Fill out the form below and we'll get back to you within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200"
            >
              {formStatus.submitted && formStatus.success ? (
                <div className="text-center py-12">
                  <FaCheckCircle className="text-5xl text-[#ED9B40] mx-auto mb-4" />
                  <h3 className="text-2xl font-serif text-[#0F4C55] mb-2">Thank You!</h3>
                  <p className="text-stone-600">{formStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#ED9B40] text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Your Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#ED9B40] text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#ED9B40] text-sm"
                        placeholder="+254 700 000 000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#ED9B40] text-sm"
                        placeholder="Booking Inquiry"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs uppercase tracking-widest text-stone-500 mb-2">
                      Your Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-3 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#ED9B40] text-sm resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0F4C55] text-white uppercase tracking-widest text-xs font-bold hover:bg-[#ED9B40] hover:text-[#093A3E] transition-colors flex items-center justify-center gap-2"
                  >
                    Send Message <BiSend />
                  </button>

                  <p className="text-[10px] text-stone-400 text-center mt-4">
                    * Required fields. We'll never share your information.
                  </p>
                </form>
              )}
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
            >
              {/* Quick Contacts */}
              <div className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200 mb-6">
                <h3 className="text-xl font-serif text-[#0F4C55] mb-4">Quick Contacts</h3>
                
                <a href="tel:+254700000000" className="flex items-center gap-3 mb-4 group">
                  <div className="w-10 h-10 bg-[#ED9B40]/10 rounded-full flex items-center justify-center group-hover:bg-[#ED9B40] transition-colors">
                    <FaPhone className="text-[#ED9B40] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400">Call Us</p>
                    <p className="text-[#0F4C55] font-medium">+254 700 000 000</p>
                  </div>
                </a>

                <a href="mailto:info@homesbymwema.com" className="flex items-center gap-3 mb-4 group">
                  <div className="w-10 h-10 bg-[#ED9B40]/10 rounded-full flex items-center justify-center group-hover:bg-[#ED9B40] transition-colors">
                    <FaEnvelope className="text-[#ED9B40] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400">Email Us</p>
                    <p className="text-[#0F4C55] font-medium">info@homesbymwema.com</p>
                  </div>
                </a>

                <a href="https://wa.me/254700000000" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-[#ED9B40]/10 rounded-full flex items-center justify-center group-hover:bg-[#ED9B40] transition-colors">
                    <FaWhatsapp className="text-[#ED9B40] group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-stone-400">WhatsApp</p>
                    <p className="text-[#0F4C55] font-medium">+254 700 000 000</p>
                  </div>
                </a>
              </div>

              {/* Office Hours */}
              <div className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaClock className="text-[#ED9B40]" />
                  <h3 className="text-xl font-serif text-[#0F4C55]">Office Hours</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Monday - Friday</span>
                    <span className="text-[#0F4C55] font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Saturday</span>
                    <span className="text-[#0F4C55] font-medium">9:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Sunday</span>
                    <span className="text-[#0F4C55] font-medium">Closed</span>
                  </div>
                </div>
                <p className="text-xs text-stone-400 mt-4">
                  *Emergency support available 24/7 for current guests
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200">
                <h3 className="text-xl font-serif text-[#0F4C55] mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: SOCIAL_BRAND_COLORS.instagram }}>
                    <FaInstagram />
                  </a>
                  <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: SOCIAL_BRAND_COLORS.tiktok }}>
                    <FaTiktok />
                  </a>
                  <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: SOCIAL_BRAND_COLORS.youtube }}>
                    <FaYoutube />
                  </a>
                  <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-10 h-10 text-white rounded-full flex items-center justify-center transition-opacity hover:opacity-80" style={{ backgroundColor: SOCIAL_BRAND_COLORS.facebook }}>
                    <FaFacebookF />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our <span className="italic">Locations</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Visit us at our offices in Nairobi and Mombasa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {officeLocations.map((office, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-sm border border-stone-200 hover-lift"
              >
                <h3 className="text-2xl font-serif text-[#0F4C55] mb-2">{office.city}</h3>
                <p className="text-stone-700 mb-4">{office.address}</p>
                <p className="text-stone-600 text-sm mb-2">{office.street}</p>
                <p className="text-stone-600 text-sm mb-4">{office.area}</p>
                
                <div className="space-y-2 mb-4">
                  <a href={`tel:${office.phone}`} className="flex items-center gap-2 text-sm text-stone-600 hover:text-[#ED9B40] transition-colors">
                    <FaPhone className="text-[#ED9B40] text-xs" /> {office.phone}
                  </a>
                  <a href={`mailto:${office.email}`} className="flex items-center gap-2 text-sm text-stone-600 hover:text-[#ED9B40] transition-colors">
                    <FaEnvelope className="text-[#ED9B40] text-xs" /> {office.email}
                  </a>
                </div>
                
                <div className="border-t border-stone-200 pt-4">
                  <p className="text-xs uppercase tracking-widest text-stone-400 mb-2">Office Hours</p>
                  <p className="text-sm text-stone-700">{office.hours}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section className="h-96 w-full relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d255282.35832881024!2d36.68257995!3d-1.302055!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1172d84d49a7%3A0xf7cf0254b297924c!2sNairobi!5e0!3m2!1sen!2ske!4v1620000000000!5m2!1sen!2ske"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          title="Homes by Mwema Locations"
          className="filter grayscale contrast-125"
        ></iframe>
        <div className="absolute bottom-8 right-8 bg-white p-4 rounded-sm shadow-xl">
          <p className="text-sm font-bold text-[#0F4C55]">Visit Our Offices</p>
          <p className="text-xs text-stone-500">Nairobi · Mombasa</p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center text-[#0F4C55] mb-12 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked <span className="italic">Questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-[#f5f2ee] border border-stone-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 bg-[#f5f2ee] flex justify-between items-center hover:bg-[#e5dfd9] transition-colors"
                >
                  <span className="font-bold text-[#0F4C55]">{faq.q}</span>
                  <span className="text-[#ED9B40] text-xl">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white border-t border-stone-200">
                    <p className="text-stone-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ready to <span className="text-[#ED9B40]">Connect?</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Whether you're ready to book, have questions, or want to list your property—we're here for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://wa.me/254700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> WhatsApp Us Now
            </a>
            <a
              href="tel:+254700000000"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;