import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaCamera,
  FaUsers,
  FaStar,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCompass,
  FaLeaf,
  FaHeart,
  FaCat,
  FaDog,
  FaPaw,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaClock,
  FaSun,
  FaInstagram,
  FaTiktok,
  FaYoutube
} from 'react-icons/fa';
import { RiSunFoggyLine } from 'react-icons/ri';
import { SOCIAL_LINKS, SOCIAL_BRAND_COLORS } from '../constants/socialLinks';

const SafariTours = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "25459170780";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message templates for different purposes
  const whatsappMessages = {
    general: "Hello! I'm interested in booking a safari tour with Homes by Mwema. I'd like to know more about your available tours and packages.",
    tour: (tourName) => `Hello! I'm interested in the ${tourName} safari. Can you provide more details about availability, what's included, and how to book?`,
    migration: "Hello! I'm interested in witnessing the Great Migration. Can you tell me more about your Maasai Mara tours during July-October?",
    custom: "Hello! I'd like to customize a safari experience. Can we discuss creating a personalized itinerary for my group?",
    consultation: "Hello! I'd like to schedule a consultation to discuss safari options. Please let me know your availability."
  };

  const experienceHighlights = [
    {
      icon: FaSun,
      title: "20+ Years Safari Expertise",
      description: "Decades of experience leading unforgettable adventures across Kenya's most spectacular landscapes."
    },
    {
      icon: FaUsers,
      title: "5,000+ Happy Travelers",
      description: "From solo adventurers to family groups, we've created lasting memories for visitors from around the globe."
    },
    {
      icon: FaClock,
      title: "24/7 Concierge Support",
      description: "Round-the-clock assistance throughout your safari journey—because wildlife doesn't keep office hours."
    }
  ];

  const whyChooseUs = [
    {
      title: "Authentic Kenyan Experience",
      description: "Led by native guides who grew up in the shadow of Kilimanjaro and know the savanna like the back of their hands."
    },
    {
      title: "Exclusive Wildlife Corridors",
      description: "Access to private conservancies and hidden watering holes where vehicles are few and animals roam freely."
    },
    {
      title: "Sustainable Tourism",
      description: "We partner with local communities to ensure tourism benefits the people and wildlife."
    },
    {
      title: "Photographer's Paradise",
      description: "Our guides know exactly where to position vehicles for that golden-hour shot."
    }
  ];

  const tours = [
    {
      id: 1,
      name: "The Great Maasai Mara Migration",
      location: "Maasai Mara National Reserve",
      duration: "5 Days / 4 Nights",
      groupSize: "6-8 travelers",
      image: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Witness the Great Wildebeest Migration (July-October)",
        "Hot air balloon safari over the Mara at sunrise",
        "Maasai village visit with traditional dancing"
      ],
      wildlife: ["Lion", "Elephant", "Rhino", "Giraffe", "Zebra", "Wildebeest"],
      bestTime: "July to October",
      difficulty: "Easy",
      featured: true
    },
    {
      id: 2,
      name: "Amboseli: Kilimanjaro's Majesty",
      location: "Amboseli National Park",
      duration: "3 Days / 2 Nights",
      groupSize: "4-6 travelers",
      image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Elephant herds against Mount Kilimanjaro backdrop",
        "Observation Hill for panoramic park views",
        "Maasai cultural experience"
      ],
      wildlife: ["Elephant", "Lion", "Giraffe", "Hippo", "Flamingo"],
      bestTime: "June to October",
      difficulty: "Easy",
      featured: false
    },
    {
      id: 3,
      name: "Samburu: The Northern Frontier",
      location: "Samburu National Reserve",
      duration: "4 Days / 3 Nights",
      groupSize: "4-6 travelers",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Rare northern species: Grevy's zebra, reticulated giraffe",
        "Ewaso Nyiro River wildlife concentrations",
        "Samburu village visit and cultural exchange"
      ],
      wildlife: ["Elephant", "Lion", "Giraffe", "Zebra", "Cheetah"],
      bestTime: "Year-round",
      difficulty: "Moderate",
      featured: false
    },
    {
      id: 4,
      name: "Lake Nakuru & Naivasha Escape",
      location: "Great Rift Valley Lakes",
      duration: "3 Days / 2 Nights",
      groupSize: "4-6 travelers",
      image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Millions of flamingos on Lake Nakuru (seasonal)",
        "Rhino sanctuary visit",
        "Boat safari on Lake Naivasha"
      ],
      wildlife: ["Rhino", "Flamingo", "Hippo", "Giraffe", "Lion"],
      bestTime: "Year-round",
      difficulty: "Easy",
      featured: true
    },
    {
      id: 5,
      name: "Tsavo: Land of Giants",
      location: "Tsavo East & West",
      duration: "5 Days / 4 Nights",
      groupSize: "4-6 travelers",
      image: "https://images.unsplash.com/photo-1549366021-9f761d450615?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Red elephants of Tsavo - dusted in red earth",
        "Mzima Springs underwater hippo observation",
        "Lugard Falls on the Galana River"
      ],
      wildlife: ["Elephant", "Lion", "Giraffe", "Hippo", "Cheetah"],
      bestTime: "June-October",
      difficulty: "Moderate",
      featured: false
    },
    {
      id: 6,
      name: "The Great Kenyan Safari Circuit",
      location: "Mara, Nakuru, Amboseli",
      duration: "8 Days / 7 Nights",
      groupSize: "4-6 travelers",
      image: "https://images.unsplash.com/photo-1518709766631-a6c7f7853c2e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      highlights: [
        "Complete Kenyan safari experience - 3 premier parks",
        "Mara River crossing (July-October)",
        "Hot air balloon with champagne breakfast"
      ],
      wildlife: ["Lion", "Elephant", "Rhino", "Giraffe", "Flamingo"],
      bestTime: "July-October",
      difficulty: "Moderate",
      featured: true
    }
  ];

  const culturalExperiences = [
    {
      title: "Maasai Village Visit",
      description: "Step into a traditional Manyatta and learn the ways of the Maasai warriors.",
      image: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "Bush Dinner with Warriors",
      description: "Join Maasai warriors for a traditional meal cooked over an open fire under the stars.",
      image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    },
    {
      title: "Samburu Beading Workshop",
      description: "Learn the art of Samburu beadwork from village women.",
      image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
    }
  ];

  const testimonials = [
    {
      name: "Sarah & David Thompson",
      location: "United Kingdom",
      quote: "Kenya stole our hearts. Our guide grew up in a Maasai village and knew things no textbook could teach.",
      rating: 5
    },
    {
      name: "Michael Omondi",
      location: "Nairobi",
      quote: "Seeing Samburu through the eyes of a Samburu warrior was transformative. Proud to be Kenyan.",
      rating: 5
    },
    {
      name: "Dr. Elena Petrova",
      location: "Russia",
      quote: "Amboseli at sunrise with elephants against Kilimanjaro—there's nothing else like it on Earth.",
      rating: 5
    }
  ];

  const faqs = [
    {
      q: "When is the best time to see the Great Migration?",
      a: "The famous Mara River crossings typically occur between July and October."
    },
    {
      q: "What should I pack for a Kenyan safari?",
      a: "Neutral-colored clothing, warm layers, sun protection, camera, binoculars, and insect repellent."
    },
    {
      q: "Is safari safe for children?",
      a: "Absolutely! We offer family-friendly safaris with activities designed for young explorers."
    },
    {
      q: "Do I need vaccinations before traveling?",
      a: "Yellow fever vaccination is required for entry into Kenya. Consult your travel doctor."
    }
  ];

  const filteredTours = activeTab === 'all' 
    ? tours 
    : tours.filter(t => t.featured);

  // Simple function to get an appropriate icon for each animal using only confirmed working icons
  const getAnimalIcon = (animal) => {
    // Group animals by icon type
    if (["Lion", "Cheetah", "Cat"].includes(animal)) {
      return <FaCat className="text-white text-sm" title={animal} />;
    } else if (["Elephant", "Rhino", "Hippo"].includes(animal)) {
      return <FaDog className="text-white text-sm" title={animal} />;
    } else if (["Giraffe", "Zebra", "Wildebeest"].includes(animal)) {
      return <FaPaw className="text-white text-sm" title={animal} />;
    } else if (["Flamingo", "Bird"].includes(animal)) {
      return <FaCamera className="text-white text-sm" title={animal} />;
    } else {
      return <FaStar className="text-white text-sm" title={animal} />;
    }
  };

  const getWildlifeIcons = (wildlifeList) => {
    const icons = [];
    wildlifeList.slice(0, 3).forEach(animal => {
      icons.push(
        <div key={animal} className="bg-black/50 backdrop-blur-sm p-1.5 rounded-full" title={animal}>
          {getAnimalIcon(animal)}
        </div>
      );
    });
    return icons;
  };

  return (
    <div className="bg-[#f5f2ee] font-sans text-black overflow-x-hidden">
      
      <style>{`
        .bg-noise {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 50; opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        .tour-card:hover {
          transform: translateY(-8px);
          transition: all 0.3s ease;
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Kenyan sunset"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B5A2B]/90 via-[#D9A066]/70 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-24 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="text-[#F4A460] text-sm uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <RiSunFoggyLine /> Karibu Kenya · Welcome to the Wild
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Hakuna Matata <br /><span className="italic text-[#F4A460]">Starts Here</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Witness the greatest wildlife spectacle on Earth. From the Maasai Mara's rolling plains to Amboseli's elephants beneath Kilimanjaro.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink(whatsappMessages.general)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#F4A460] text-[#8B5A2B] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Inquire on WhatsApp
              </a>
              <button 
                onClick={() => document.getElementById('tours').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/50 text-white uppercase tracking-widest text-xs hover:bg-white/20 transition-colors"
              >
                Explore Tours
              </button>
            </div>

            {/* Wildlife Icons Marquee */}
            <div className="flex gap-4 mt-12 text-2xl text-white/70">
              <FaCat className="hover:text-[#F4A460] transition-colors" title="Lion" />
              <FaDog className="hover:text-[#F4A460] transition-colors" title="Elephant" />
              <FaPaw className="hover:text-[#F4A460] transition-colors" title="Giraffe" />
              <FaStar className="hover:text-[#F4A460] transition-colors" title="Rhino" />
              <FaCamera className="hover:text-[#F4A460] transition-colors" title="Flamingo" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Descriptive Paragraph Section - Replaces Stats */}
      <section className="bg-white py-16 px-6 border-y border-[#D9A066]">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#0F4C55]/10 rounded-full flex items-center justify-center">
              <RiSunFoggyLine className="text-3xl text-[#0F4C55]" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl text-[#8B5A2B] mb-6 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
            The Magic of a Kenyan Safari
          </h2>
          <p className="text-stone-700 text-lg leading-relaxed max-w-3xl mx-auto">
            There's nothing quite like the first time you see a lioness stalk through the golden grass, 
            or watch a herd of elephants amble across the savanna with Kilimanjaro watching silently in the background. 
            A Kenyan safari isn't just a vacation—it's a return to something ancient and wild within yourself. 
            With over two decades of experience, we don't just show you the wildlife; we share our home, 
            our stories, and our passion for this extraordinary land. From the thundering hooves of the Great Migration 
            to the quiet moments watching a sunset paint the sky in colors you didn't know existed—every day brings 
            a new wonder. Let us guide you through the land that time forgot.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <span className="px-4 py-2 bg-[#f5f2ee] rounded-full text-sm text-[#0F4C55] font-medium">✓ Expert Guides</span>
            <span className="px-4 py-2 bg-[#f5f2ee] rounded-full text-sm text-[#0F4C55] font-medium">✓ Private Conservancies</span>
            <span className="px-4 py-2 bg-[#f5f2ee] rounded-full text-sm text-[#0F4C55] font-medium">✓ Cultural Experiences</span>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA - Prominent */}
      <section className="py-16 px-6 bg-[#0F4C55] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaWhatsapp className="text-5xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Ready for Your Kenyan Adventure?</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Chat with us on WhatsApp to plan your dream safari. Our experts will help you choose the perfect tour and customize your experience.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.migration)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
            >
              <FaCamera /> Ask About the Migration
            </a>
            <a
              href={getWhatsAppLink(whatsappMessages.custom)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-full"
            >
              <FaCompass /> Customize Your Safari
            </a>
          </div>
        </div>
      </section>

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#8B5A2B] mb-4 font-serif">
              Why Safari with <span className="italic text-[#0F4C55]">Us?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              We don't just show you wildlife—we share our home, our stories, and our passion for this extraordinary land.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {experienceHighlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 bg-[#f5f2ee] rounded-sm border border-[#D9A066] hover:shadow-xl transition-all"
              >
                <item.icon className="text-5xl text-[#0F4C55] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#8B5A2B] mb-2">{item.title}</h3>
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
                className="bg-[#f5f2ee] p-8 rounded-sm border border-[#D9A066]"
              >
                <h3 className="text-lg font-bold text-[#8B5A2B] mb-3 flex items-center gap-2">
                  <FaLeaf className="text-[#0F4C55]" /> {item.title}
                </h3>
                <p className="text-stone-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tours Section */}
      <section id="tours" className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#8B5A2B] mb-4 font-serif">
              Our Signature <span className="italic text-[#0F4C55]">Safaris</span>
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold rounded-full ${
                activeTab === 'all' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-white text-stone-500 hover:text-[#0F4C55] border border-[#D9A066]'
              }`}
            >
              All Safaris
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold rounded-full ${
                activeTab === 'featured' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-white text-stone-500 hover:text-[#0F4C55] border border-[#D9A066]'
              }`}
            >
              Featured
            </button>
          </div>

          {/* Tour Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour) => (
              <div key={tour.id} className="tour-card bg-white rounded-sm border border-[#D9A066] overflow-hidden">
                <div className="relative h-48">
                  <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-[#0F4C55] text-white px-2 py-1 text-xs rounded-full">
                    {tour.duration}
                  </div>
                  {tour.featured && (
                    <div className="absolute top-2 right-2 bg-[#F4A460] text-[#8B5A2B] px-2 py-1 text-xs rounded-full">
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#8B5A2B]">{tour.name}</h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                    <FaMapMarkerAlt className="text-[#0F4C55]" /> {tour.location}
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-[#f5f2ee] px-2 py-1 rounded-full">{tour.groupSize}</span>
                    <span className="text-xs bg-[#f5f2ee] px-2 py-1 rounded-full">{tour.difficulty}</span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-bold text-[#8B5A2B] mb-1">Highlights:</p>
                    <ul className="text-xs text-stone-600 space-y-1">
                      {tour.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <FaCheckCircle className="text-[#F4A460] mt-0.5 flex-shrink-0" size={10} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {getWildlifeIcons(tour.wildlife)}
                    </div>
                    <a
                      href={getWhatsAppLink(whatsappMessages.tour(tour.name))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-[#8B5A2B] text-white px-3 py-1 rounded-full hover:bg-[#0F4C55] transition-colors inline-flex items-center gap-1"
                    >
                      <FaWhatsapp size={10} /> Inquire
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cultural Experiences */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-4xl md:text-5xl text-[#8B5A2B] text-center mb-12 font-serif">
            Beyond Wildlife: <span className="italic text-[#0F4C55]">Maasai & Samburu</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {culturalExperiences.map((exp, index) => (
              <div key={index} className="relative h-64 overflow-hidden rounded-sm group">
                <img src={exp.image} alt={exp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 p-4 text-white">
                    <h3 className="font-bold flex items-center gap-2">
                      <FaHeart className="text-[#0F4C55]" /> {exp.title}
                    </h3>
                    <p className="text-xs">{exp.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <h2 className="text-4xl md:text-5xl text-[#8B5A2B] text-center mb-12 font-serif">
            Real <span className="italic text-[#0F4C55]">Safari Stories</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-sm border border-[#D9A066]">
                <FaQuoteLeft className="text-[#0F4C55] opacity-20 text-2xl mb-2" />
                <p className="text-sm text-stone-700 mb-4 italic">"{t.quote}"</p>
                <p className="font-bold text-[#8B5A2B] text-sm">{t.name}</p>
                <p className="text-xs text-stone-500">{t.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl text-center text-[#8B5A2B] mb-12 font-serif">
            Safari <span className="italic text-[#0F4C55]">FAQs</span>
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-[#D9A066] rounded-sm overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-4 bg-[#f5f2ee] flex justify-between items-center"
                >
                  <span className="font-bold text-[#8B5A2B] text-sm">{faq.q}</span>
                  <span className="text-[#0F4C55]">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-4 bg-white border-t border-[#D9A066]">
                    <p className="text-sm text-stone-600">{faq.a}</p>
                    
                    {/* WhatsApp inquiry for FAQ */}
                    <a
                      href={getWhatsAppLink(`Hello! I have a question about safaris: ${faq.q}`)}
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
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1516426122078-c23e76319801?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Kenyan sunset" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8B5A2B]/90 to-[#0F4C55]/80" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Tufanye Safari?</h2>
          <p className="text-white/90 mb-8">Your once-in-a-lifetime journey begins with a single step.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessages.consultation)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-[#F4A460] text-[#8B5A2B] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              <FaWhatsapp className="inline mr-2" /> Plan Your Safari on WhatsApp
            </a>
            <a
              href="tel:+25459170780"
              className="inline-block px-8 py-4 border border-white/50 text-white uppercase tracking-widest text-xs hover:bg-white/20 transition-colors"
            >
              <FaPhone className="inline mr-2" /> Call to Discuss
            </a>
          </div>
          
          {/* Contact Options */}
          <div className="mt-8 flex justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} className="text-white/60 hover:text-[#F4A460] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:safari@homesbymwema.com" className="text-white/60 hover:text-[#F4A460] transition-colors">
              <FaEnvelope size={20} />
            </a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.instagram }}>
              <FaInstagram size={20} />
            </a>
            <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="transition-opacity hover:opacity-80" style={{ color: SOCIAL_BRAND_COLORS.tiktok }}>
              <FaTiktok size={20} />
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

export default SafariTours;