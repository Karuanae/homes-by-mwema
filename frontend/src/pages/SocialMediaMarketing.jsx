import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaInstagram,
  FaFacebookF,
  FaTiktok,
  FaYoutube,
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
  FaWhatsapp,
  FaEye,
  FaHome,
  FaPlay
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
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const SocialMediaMarketing = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activePlatform, setActivePlatform] = useState('instagram');

  const whatsappNumber = "254720108914";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  const whatsappMessages = {
    general: "Hello! I've seen your social media presence and I'm interested in listing my property with Homes by Mwema. Can you tell me more about how your social media audience can help drive bookings for my property?",
    listing: "Hello! I'd like to discuss listing my property with Homes by Mwema. I'm interested in how you can feature my property on your social platforms."
  };

  const platformDetails = {
    instagram: {
      icon: FaInstagram,
      color: SOCIAL_BRAND_COLORS.instagram,
      handle: "@homes_by_mwema",
      description: "We share property photos, short video tours, and updates about available listings. Our Instagram gives potential guests a real look at what staying in your property feels like.",
      whatWePost: [
        "Professional photos of managed properties",
        "Short walkthrough videos and Reels",
        "Updates on newly available listings",
        "Neighborhood features and local tips",
        "Guest reviews and experiences"
      ],
      whyItWorks: "Instagram is where many travelers look for accommodation inspiration. When your property appears on our feed, it reaches people already interested in Nairobi stays."
    },
    tiktok: {
      icon: FaTiktok,
      color: SOCIAL_BRAND_COLORS.tiktok,
      handle: "@homes_by_mwema",
      description: "We create short, engaging property tours that show your space in a genuine way. TikTok helps us reach new audiences who might not find us elsewhere.",
      whatWePost: [
        "Quick property walkthroughs",
        "Room-by-room highlights",
        "Nairobi travel tips",
        "Property transformations and setups",
        "Guest arrival experiences"
      ],
      whyItWorks: "TikTok shows our content to people interested in travel and lifestyle. It's a great way to introduce your property to potential guests who are actively planning trips."
    },
    facebook: {
      icon: FaFacebookF,
      color: SOCIAL_BRAND_COLORS.facebook,
      handle: "Homes by Mwema",
      description: "We share detailed property listings, connect with community groups, and engage with people looking for longer stays or relocation accommodation in Nairobi.",
      whatWePost: [
        "Detailed property listings with photos",
        "Long-form video tours",
        "Neighborhood guides and information",
        "Guest testimonials and reviews",
        "Updates on availability and special offers"
      ],
      whyItWorks: "Facebook helps us reach families, professionals, and expats planning extended stays in Nairobi—people who value detailed information before booking."
    },
    youtube: {
      icon: FaYoutube,
      color: SOCIAL_BRAND_COLORS.youtube,
      handle: "Homes by Mwema",
      description: "We post full property walkthroughs and neighborhood tours. These longer videos help potential guests get a complete picture before they decide to book.",
      whatWePost: [
        "Complete property tour videos",
        "Neighborhood walkthroughs",
        "Host stories and experiences",
        "Nairobi accommodation guides",
        "Property management insights"
      ],
      whyItWorks: "When people research where to stay, they often check YouTube for real tours. Our videos give your property visibility during that research phase."
    }
  };

  const contentPillars = [
    {
      title: "Property Showcases",
      description: "We take professional photos and videos that highlight what makes your property unique—from well-designed interiors to outdoor spaces and views.",
      icon: FaCamera
    },
    {
      title: "Neighborhood Stories",
      description: "We show what's nearby—cafes, parks, shopping, and attractions that help guests picture themselves staying in your area.",
      icon: FaHome
    },
    {
      title: "Guest Experiences",
      description: "We share real feedback and moments from guests who've enjoyed staying at properties we manage. It helps build trust with future guests.",
      icon: FaHeart
    },
    {
      title: "Behind the Management",
      description: "We give a look at how we maintain and prepare properties, so property owners and guests know their spaces are in good hands.",
      icon: FaStar
    }
  ];

  const successStories = [
    {
      name: "Margaret W.",
      property: "3-Bedroom in Kilimani",
      result: "Consistent bookings through social media",
      story: "Since featuring her property on our platforms, she's received steady booking inquiries from guests who discovered her listing through our Instagram and TikTok.",
      platform: "Instagram & TikTok"
    },
    {
      name: "David & Sarah K.",
      property: "Villa in Karen",
      result: "Guests found us through TikTok",
      story: "A video tour we posted of their property brought in bookings from travelers who hadn't heard of their listing before seeing it on our TikTok page.",
      platform: "TikTok"
    },
    {
      name: "James O.",
      property: "Apartments in Westlands",
      result: "Growing direct bookings",
      story: "Regular features on our social media pages have helped reduce his reliance on third-party booking platforms. More guests now book directly.",
      platform: "Cross-platform"
    }
  ];

  const faqs = [
    {
      q: "How does your social media help my property get bookings?",
      a: "Our social media pages have an audience of people interested in Nairobi stays. When we feature your property, it gets seen by potential guests who might not find it through regular booking platforms. We create content that shows your space honestly and attractively."
    },
    {
      q: "Is social media promotion included in your management fee?",
      a: "Yes. We include social media promotion as part of our property management service. When you list with us, we photograph and film your property, then share it across our platforms at no extra cost."
    },
    {
      q: "How often will my property be posted?",
      a: "New properties get featured more frequently during their launch. After that, we feature each property periodically—typically a few times per month across different platforms, with more frequent Stories updates."
    },
    {
      q: "Can I see how you've promoted other properties?",
      a: "Yes—visit our social media pages linked on this page. You'll see exactly how we showcase properties, the quality of our photos and videos, and the kind of engagement our posts receive."
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
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1683721003111-070bcc053d8b?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
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
              <FaShareAlt /> Our Social Media
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              We Feature Your Property<br /><span className="italic text-[#ED9B40]">On Our Platforms</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              When you list with Homes by Mwema, we create professional content and share it across our social media pages—putting your property in front of people looking for Nairobi accommodation.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <a
                href={getWhatsAppLink(whatsappMessages.listing)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> List Your Property With Us
              </a>
              <button 
                onClick={() => document.getElementById('our-platforms').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                How We Promote Properties
              </button>
            </div>

            <div className="flex gap-4">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
                <FaInstagram className="text-2xl" />
              </a>
              <a href={SOCIAL_LINKS.tiktokMarketing} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.tiktok }}>
                <FaTiktok className="text-2xl" />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.facebook }}>
                <FaFacebookF className="text-2xl" />
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.youtube }}>
                <FaYoutube className="text-2xl" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How We Use Our Platforms */}
      <section id="our-platforms" className="py-16 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Social Media <span className="italic">Platforms</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Here's where we share your property and how each platform helps reach potential guests.
            </p>
          </div>

          {/* Platform Tabs */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {Object.entries(platformDetails).map(([key, data]) => {
              const TabIcon = data.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActivePlatform(key)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    activePlatform === key
                      ? 'bg-[#0F4C55] text-white shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <TabIcon style={{ color: activePlatform === key ? data.color : undefined }} />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              );
            })}
          </div>

          {/* Active Platform Details */}
          {platformDetails[activePlatform] && (
            <motion.div
              key={activePlatform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-[#f5f2ee] rounded-sm border border-stone-200 overflow-hidden"
            >
              {(() => {
                const ActiveIcon = platformDetails[activePlatform].icon;
                const activeData = platformDetails[activePlatform];
                
                return (
                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-6">
                      <ActiveIcon className="text-5xl" style={{ color: activeData.color }} />
                      <div>
                        <h3 className="text-2xl font-bold text-[#0F4C55]">{activeData.handle}</h3>
                        <p className="text-stone-500">
                          {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                        </p>
                      </div>
                    </div>

                    <p className="text-stone-700 mb-8 text-lg leading-relaxed">
                      {activeData.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white p-6 rounded-sm">
                        <h4 className="font-bold text-[#0F4C55] mb-4 flex items-center gap-2">
                          <FaCamera className="text-[#ED9B40]" /> What We Share
                        </h4>
                        <ul className="space-y-3">
                          {activeData.whatWePost.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                              <FaCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-white p-6 rounded-sm">
                        <h4 className="font-bold text-[#0F4C55] mb-4 flex items-center gap-2">
                          <FaBullseye className="text-[#ED9B40]" /> How It Helps Your Property
                        </h4>
                        <p className="text-sm text-stone-600 leading-relaxed">
                          {activeData.whyItWorks}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <a
                        href={SOCIAL_LINKS[activePlatform === 'facebook' ? 'facebook' : activePlatform === 'youtube' ? 'youtube' : activePlatform === 'tiktok' ? 'tiktokMarketing' : 'instagram']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium transition-all"
                        style={{ backgroundColor: activeData.color, color: 'white' }}
                      >
                        <ActiveIcon />
                        Visit Our {activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)}
                      </a>
                      <a
                        href={getWhatsAppLink(whatsappMessages.listing)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-[#ED9B40] text-[#093A3E] rounded-full text-sm font-bold hover:bg-[#F5B56B] transition-colors"
                      >
                        <FaWhatsapp /> List Your Property
                      </a>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      </section>

      {/* Content Pillars */}
      <section className="py-20 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              How We <span className="italic">Promote</span> Properties
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We focus on creating genuine content that helps potential guests picture themselves in your space.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentPillars.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-8 rounded-sm border border-stone-200"
                >
                  <PillarIcon className="text-3xl text-[#ED9B40] mb-4" />
                  <h3 className="text-xl font-bold text-[#0F4C55] mb-3">{pillar.title}</h3>
                  <p className="text-stone-600">{pillar.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Want Your Property Featured?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp about listing your property. We'll explain how we can promote it on our social media pages.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
            >
              <FaHome /> List Your Property
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaWhatsapp /> Ask Us Anything
            </a>
          </div>
        </div>
      </section>

      {/* Property Owner Stories */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Property Owners <span className="italic">We Work With</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Some of the property owners who've benefited from social media exposure through our platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="bg-[#f5f2ee] p-8 rounded-sm border border-stone-200 relative"
              >
                <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
                <div className="flex items-center gap-2 mb-4">
                  {story.platform === "Instagram & TikTok" ? (
                    <div className="flex gap-1">
                      <FaInstagram className="text-[#E4405F]" />
                      <FaTiktok className="text-black" />
                    </div>
                  ) : story.platform === "TikTok" ? (
                    <FaTiktok className="text-black" />
                  ) : (
                    <FaShareAlt className="text-[#ED9B40]" />
                  )}
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Via {story.platform}
                  </span>
                </div>
                <div className="text-lg font-bold text-[#ED9B40] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {story.result}
                </div>
                <p className="text-stone-600 mb-6 text-sm italic">"{story.story}"</p>
                <div className="border-t border-stone-200 pt-4">
                  <p className="font-bold text-[#0F4C55]">{story.name}</p>
                  <p className="text-xs text-stone-500">{story.property}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[#f5f2ee]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center text-[#0F4C55] mb-12 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked <span className="italic">Questions</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-stone-200 rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 flex justify-between items-center hover:bg-stone-50 transition-colors"
                >
                  <span className="font-bold text-[#0F4C55]">{faq.q}</span>
                  <span className="text-[#ED9B40] text-xl">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 border-t border-stone-200 bg-[#f5f2ee]">
                    <p className="text-stone-700">{faq.a}</p>
                    <a
                      href={getWhatsAppLink(`Hello! I have a question: ${faq.q}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-xs text-[#ED9B40] hover:text-[#0F4C55] transition-colors"
                    >
                      <FaWhatsapp /> Ask us about this
                    </a>
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
            Let's Get Your Property <span className="text-[#ED9B40]">Featured</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            List with Homes by Mwema and we'll create content that showcases your property on our social media platforms.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.listing)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp /> List Your Property Now
            </a>
            <a
              href="tel:+254720108914"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              <FaPhone /> Call Us
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10">
            <p className="text-white/60 mb-6">See our platforms and how we showcase properties:</p>
            <div className="flex justify-center gap-6">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
                <FaInstagram size={24} />
              </a>
              <a href={SOCIAL_LINKS.tiktokMarketing} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.tiktok }}>
                <FaTiktok size={24} />
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.facebook }}>
                <FaFacebookF size={24} />
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.youtube }}>
                <FaYoutube size={24} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SocialMediaMarketing;