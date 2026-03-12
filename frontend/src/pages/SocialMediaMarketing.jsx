import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaYoutube,
  FaLinkedinIn,
  FaTwitter,
  FaHashtag,
  FaCamera,
  FaVideo,
  FaChartLine,
  FaUsers,
  FaBullseye,
  FaClock,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaShareAlt,
  FaHeart,
  FaComment,
  FaCalendarAlt,
  FaRocket,
  FaMagic,
  FaPalette,
  FaBrain,
  FaMobile,
  FaThumbsUp,
  FaPhone,
  FaEnvelope,
  FaWhatsapp
} from 'react-icons/fa';
import { 
  MdOutlineAnalytics, 
  MdTrendingUp, 
  MdOutlineSchedule,
  MdOutlineContentCopy,
  MdAdsClick,
  MdPeopleOutline,
  MdOutlineInsights
} from 'react-icons/md';
import { BiLike, BiComment, BiShare } from 'react-icons/bi';

const SocialMediaMarketing = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "254720108914";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message templates for different purposes
  const whatsappMessages = {
    general: "Hello! I'm interested in your social media marketing services for my property. I'd like to know more about how you can help grow my online presence and drive bookings.",
    instagram: "Hello! I'm interested in your Instagram management services. Can you tell me more about your content strategy and how you can help grow my following?",
    tiktok: "Hello! I'm interested in your TikTok marketing services. I'd love to create viral content for my property. Can you share more details?",
    ads: "Hello! I'm interested in running social media ads for my property. Can you tell me about your Facebook/Instagram ad management services?",
    consultation: "Hello! I'd like to schedule a consultation to discuss social media marketing for my property. Please let me know your availability."
  };

  const experienceHighlights = [
    {
      icon: FaUsers,
      title: "50K+ Followers Grown",
      description: "Collectively grew our clients' social media audiences by over 50,000 engaged followers."
    },
    {
      icon: FaChartLine,
      title: "200% Avg. Engagement Increase",
      description: "Our strategies consistently deliver 2-3x higher engagement rates across all platforms."
    },
    {
      icon: FaCalendarAlt,
      title: "4+ Years Experience",
      description: "Specialized in social media marketing for Nairobi's real estate and hospitality sectors."
    }
  ];

  const whyChooseUs = [
    {
      title: "Real Estate Specialists",
      description: "We understand what makes property content shine—from stunning interior shots to neighborhood highlights that attract buyers and guests."
    },
    {
      title: "Platform-Specific Strategies",
      description: "What works on Instagram won't necessarily work on TikTok. We tailor content for each platform's unique audience and algorithm."
    },
    {
      title: "Data-Driven Approach",
      description: "We don't guess—we analyze performance metrics to continuously optimize your content for maximum reach and engagement."
    },
    {
      title: "Consistent Brand Voice",
      description: "Your social media presence will feel cohesive and professional, building trust and recognition with your audience."
    }
  ];

  const services = [
    {
      icon: FaInstagram,
      title: "Instagram Management",
      features: [
        "Daily posts & stories",
        "Reels creation",
        "Hashtag strategy",
        "Engagement tracking"
      ],
      platforms: ["Instagram"]
    },
    {
      icon: FaTiktok,
      title: "TikTok Marketing",
      features: [
        "Trend-based content",
        "Viral challenge participation",
        "Music & effect selection",
        "Weekly performance reports"
      ],
      platforms: ["TikTok"]
    },
    {
      icon: FaFacebookF,
      title: "Facebook & Meta Ads",
      features: [
        "Targeted ad campaigns",
        "Audience segmentation",
        "Budget optimization",
        "Conversion tracking"
      ],
      platforms: ["Facebook", "Instagram"]
    },
    {
      icon: FaYoutube,
      title: "YouTube & Video Content",
      features: [
        "Property video optimization",
        "YouTube SEO",
        "Thumbnail design",
        "Analytics reporting"
      ],
      platforms: ["YouTube"]
    },
    {
      icon: MdOutlineContentCopy,
      title: "Content Creation",
      features: [
        "Professional photography",
        "Video editing",
        "Graphic design",
        "Caption writing"
      ],
      platforms: ["All Platforms"]
    },
    {
      icon: MdOutlineAnalytics,
      title: "Analytics & Strategy",
      features: [
        "Monthly performance reviews",
        "Competitor analysis",
        "Growth strategy planning",
        "ROI measurement"
      ],
      platforms: ["All Platforms"]
    }
  ];

  const contentPillars = [
    {
      title: "Property Showcases",
      description: "Stunning visual tours of available properties, highlighting unique features and neighborhood benefits.",
      examples: ["Photo carousels", "Video walkthroughs", "Before/after renovations"],
      icon: FaCamera
    },
    {
      title: "Educational Content",
      description: "Tips for hosts, real estate insights, and guides to help your audience succeed in short-term rentals.",
      examples: ["Host tips", "Market updates", "FAQ responses"],
      icon: FaBrain
    },
    {
      title: "Behind the Scenes",
      description: "Humanize your brand by showing the people and processes behind Homes by Mwema.",
      examples: ["Team spotlights", "Photography shoots", "Client meetings"],
      icon: FaUsers
    },
    {
      title: "Client Success Stories",
      description: "Real testimonials and results from hosts and guests who've worked with us.",
      examples: ["Video testimonials", "Booking stats", "Before/after income"],
      icon: FaStar
    }
  ];

  const successMetrics = [
    { platform: "Instagram", metric: "15K+", label: "Followers Grown" },
    { platform: "TikTok", metric: "2.5M+", label: "Video Views" },
    { platform: "Facebook", metric: "8K+", label: "Page Likes" },
    { platform: "YouTube", metric: "100K+", label: "Watch Hours" }
  ];

  const successStories = [
    {
      name: "Margaret W.",
      portfolio: "3 Properties in Kilimani",
      result: "+245%",
      metric: "Instagram followers in 6 months",
      quote: "My bookings have doubled since they took over my social media. The content they create makes my properties look incredible!"
    },
    {
      name: "David M.",
      portfolio: "Luxury Villa in Karen",
      result: "2.1M",
      metric: "TikTok views on property video",
      quote: "One viral TikTok from their team brought me bookings for the next 8 months. Absolutely worth every shilling."
    },
    {
      name: "Sarah & James",
      portfolio: "4 Airbnb Properties",
      result: "+180%",
      metric: "Direct booking inquiries",
      quote: "We used to rely entirely on Airbnb. Now guests find us on Instagram and book direct—saving us 15% in fees!"
    }
  ];

  const faqs = [
    {
      q: "How long until I see results?",
      a: "Most clients see increased engagement within the first month, with booking growth typically following within 60-90 days as your content builds momentum."
    },
    {
      q: "Do I need to provide content?",
      a: "We handle all content creation—from photography to captions. We'll schedule shoots at your properties and create a full content calendar."
    },
    {
      q: "Which platforms should I focus on?",
      a: "For real estate in Nairobi, we typically recommend Instagram and TikTok as primary platforms, with Facebook for targeted ads and YouTube for long-form video."
    },
    {
      q: "Can you help with paid advertising?",
      a: "Absolutely! Our services include paid ad management to target potential guests and buyers with precision."
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
        .social-gradient {
          background: linear-gradient(135deg, #ED9B40 0%, #F5B56B 100%);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Social media marketing"
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
              <FaShareAlt /> Social Media Marketing
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Turn Followers Into <br /><span className="italic text-[#ED9B40]">Bookings</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Your properties deserve to be seen. Our social media experts create compelling content that showcases your spaces, builds your brand, and drives direct bookings.
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
                onClick={() => document.getElementById('success-stories').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                View Success Stories
              </button>
            </div>

            {/* Social Platform Icons */}
            <div className="flex gap-4 mt-12">
              <FaInstagram className="text-2xl text-white/60 hover:text-[#ED9B40] transition-colors cursor-pointer" />
              <FaTiktok className="text-2xl text-white/60 hover:text-[#ED9B40] transition-colors cursor-pointer" />
              <FaFacebookF className="text-2xl text-white/60 hover:text-[#ED9B40] transition-colors cursor-pointer" />
              <FaYoutube className="text-2xl text-white/60 hover:text-[#ED9B40] transition-colors cursor-pointer" />
              <FaTwitter className="text-2xl text-white/60 hover:text-[#ED9B40] transition-colors cursor-pointer" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 border-y border-stone-200">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {successMetrics.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-[#0F4C55]">{stat.platform}</div>
                <div className="text-3xl md:text-4xl font-bold text-[#ED9B40] mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {stat.metric}
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
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready to Grow Your Social Presence?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp to discuss your social media goals. Our experts will help you choose the right strategy for your property.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
            >
              <FaInstagram /> Ask About Instagram
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.tiktok)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaTiktok /> Ask About TikTok
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.ads)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaFacebookF /> Ask About Ads
            </a>
          </div>
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
              We combine real estate knowledge with social media mastery to deliver measurable results.
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

      {/* Content Pillars */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Content <span className="italic">Pillars</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We build your brand around proven content themes that resonate with your audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentPillars.map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-sm border border-stone-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4">
                  <pillar.icon className="text-3xl text-[#ED9B40] flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-[#0F4C55] mb-2">{pillar.title}</h3>
                    <p className="text-stone-600 mb-4">{pillar.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {pillar.examples.map((example, i) => (
                        <span key={i} className="text-xs bg-[#f5f2ee] px-3 py-1 rounded-full text-stone-600">
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
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
              Our <span className="italic">Services</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Comprehensive social media solutions tailored to your property portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-6 rounded-sm border border-stone-200 hover:shadow-xl transition-all"
              >
                <service.icon className="text-3xl text-[#ED9B40] mb-4" />
                <h3 className="text-lg font-bold text-[#0F4C55] mb-3">{service.title}</h3>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <FaCheckCircle className="text-[#ED9B40] mt-0.5 flex-shrink-0" />
                      <span className="text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-4">
                  {service.platforms.map((platform, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-widest bg-white px-2 py-1 rounded-sm text-stone-500">
                      {platform}
                    </span>
                  ))}
                </div>
                
                {/* WhatsApp inquiry for each service */}
                <a
                  href={getWhatsAppLink(`Hello! I'm interested in your ${service.title} services. Can you tell me more about how you can help with my property?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                >
                  <FaWhatsapp /> Inquire about {service.title}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Post Anatomy */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What Makes a <span className="italic">Great Post?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Every element is crafted to maximize engagement and drive action.
            </p>
          </div>

          <div className="bg-white p-8 rounded-sm border border-stone-200 shadow-xl">
            {/* Mock Instagram Post */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#ED9B40] to-[#F5B56B] rounded-full flex items-center justify-center text-white font-bold">
                H
              </div>
              <div>
                <p className="font-bold text-[#0F4C55]">homes_by_mwema</p>
                <p className="text-xs text-stone-500">Nairobi, Kenya</p>
              </div>
            </div>

            {/* Post Image Placeholder */}
            <div className="aspect-square bg-stone-200 mb-4 flex items-center justify-center">
              <FaCamera className="text-4xl text-stone-400" />
            </div>

            {/* Post Actions */}
            <div className="flex gap-4 mb-3">
              <FaHeart className="text-2xl text-stone-600 hover:text-[#ED9B40] transition-colors" />
              <FaComment className="text-2xl text-stone-600 hover:text-[#ED9B40] transition-colors" />
              <BiShare className="text-2xl text-stone-600 hover:text-[#ED9B40] transition-colors" />
            </div>

            {/* Post Caption with Annotations */}
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <span className="bg-[#ED9B40] text-white text-xs px-2 py-1 rounded-sm">Caption</span>
                <p className="text-stone-700 flex-1">
                  <span className="font-bold">homes_by_mwema</span> Wake up to breathtaking city views in this stunning 2-bedroom in Kilimani ✨
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-[#0F4C55] text-white text-xs px-2 py-1 rounded-sm">CTA</span>
                <p className="text-stone-700 flex-1">
                  Tap the link in bio to book your stay this weekend! 🔗
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-stone-700 text-white text-xs px-2 py-1 rounded-sm">Hashtags</span>
                <p className="text-[#ED9B40] flex-1">
                  #NairobiAirbnb #KilimaniLiving #LuxuryStays #HomesByMwema
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-stone-500 text-white text-xs px-2 py-1 rounded-sm">Emoji</span>
                <p className="text-stone-700 flex-1">
                  Adds personality and visual interest ✨ 🏠 🔑
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 text-center mt-6">
              Each element is strategically chosen to maximize engagement and conversions
            </p>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Real <span className="italic">Results</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              See how we've helped hosts and property owners grow their businesses through social media.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200 relative"
              >
                <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
                <div className="text-3xl font-bold text-[#ED9B40] mb-2">{story.result}</div>
                <p className="text-sm text-stone-500 mb-4">{story.metric}</p>
                <p className="text-stone-700 mb-6 italic">"{story.quote}"</p>
                <div>
                  <p className="font-bold text-[#0F4C55]">{story.name}</p>
                  <p className="text-xs text-stone-500">{story.portfolio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform-Specific Strategy */}
      <section className="py-24 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Platform-Specific <span className="text-[#ED9B40] italic">Strategies</span>
          </h2>
          <p className="text-white/80 mb-12 max-w-2xl mx-auto">
            Each platform requires a unique approach. We tailor your content to perform optimally everywhere.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4">
              <FaInstagram className="text-4xl text-[#ED9B40] mx-auto mb-3" />
              <h3 className="font-bold mb-2">Instagram</h3>
              <p className="text-sm text-white/70">Visual storytelling, Reels, Stories, and aesthetic feeds</p>
            </div>
            <div className="p-4">
              <FaTiktok className="text-4xl text-[#ED9B40] mx-auto mb-3" />
              <h3 className="font-bold mb-2">TikTok</h3>
              <p className="text-sm text-white/70">Trend-driven, entertaining, viral-ready short videos</p>
            </div>
            <div className="p-4">
              <FaFacebookF className="text-4xl text-[#ED9B40] mx-auto mb-3" />
              <h3 className="font-bold mb-2">Facebook</h3>
              <p className="text-sm text-white/70">Community building, targeted ads, event promotion</p>
            </div>
            <div className="p-4">
              <FaYoutube className="text-4xl text-[#ED9B40] mx-auto mb-3" />
              <h3 className="font-bold mb-2">YouTube</h3>
              <p className="text-sm text-white/70">In-depth property tours, SEO-optimized content</p>
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
                    
                    {/* WhatsApp inquiry for FAQ */}
                    <a
                      href={getWhatsAppLink(`Hello! I have a question about your social media services: ${faq.q}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                    >
                      <FaWhatsapp /> Ask about this on WhatsApp
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
            Ready to <span className="text-[#ED9B40]">Grow</span> Your Reach?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Let's create a social media strategy that turns followers into guests and builds your brand.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.consultation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> Start Your Social Growth
            </a>
            <a
              href="tel:+254720108914"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call to Discuss
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaThumbsUp className="text-[#ED9B40]" /> Daily Engagement</span>
            <span className="flex items-center gap-2"><FaHashtag className="text-[#ED9B40]" /> Smart Hashtag Strategy</span>
            <span className="flex items-center gap-2"><MdOutlineAnalytics className="text-[#ED9B40]" /> Performance Tracking</span>
          </div>

          {/* Contact Options */}
          <div className="mt-8 flex justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:social@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaEnvelope size={20} />
            </a>
            <a href="#" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaInstagram size={20} />
            </a>
            <a href="#" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaTiktok size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SocialMediaMarketing;