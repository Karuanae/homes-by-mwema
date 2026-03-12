import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaUtensils,
  FaLeaf,
  FaFish,
  FaDrumstickBite,
  FaCarrot,
  FaWineGlassAlt,
  FaBirthdayCake,
  FaCoffee,
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
  FaUsers,
  FaHeart,
  FaFire,
  FaSnowflake,
  FaTint,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaLeaf as FaHerb,
  FaImages,
  FaHome,
  FaHotel,
  FaGlobeAfrica
} from 'react-icons/fa';
import { 
  MdOutlineRestaurantMenu, 
  MdOutlineEvent,
  MdOutlineKitchen,
  MdOutlineDinnerDining
} from 'react-icons/md';
import { GiCook, GiSaucepan, GiChefToque, GiSteak, GiShrimp, GiChickenOven, GiFruitBowl, GiWineBottle } from 'react-icons/gi';
import { BiDish, BiFoodMenu } from 'react-icons/bi';
import { RiCake2Fill, RiRestaurantFill, RiKnifeLine } from 'react-icons/ri';

const ChefServices = () => {
  const [activeTab, setActiveTab] = useState('private');
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  // WhatsApp configuration
  const whatsappNumber = "254720108914";
  const getWhatsAppLink = (message) => {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp message template for private chef inquiries
  const whatsappMessage = "Hello! I'm interested in your private chef services in Nairobi. I'd like to know more about your Kenyan-inspired menus and how to book a chef for my stay.";

  const whyChooseUs = [
    {
      title: "Farm-to-Table Freshness",
      description: "We source ingredients daily from local farmers' markets and trusted suppliers. Our vegetables are picked at dawn, our fish is caught fresh, and our herbs are grown in our own garden."
    },
    {
      title: "Customized Menus",
      description: "Every client is unique. We'll work with you to create a personalized menu that reflects your tastes, dietary needs, and cultural preferences—whether it's traditional Kenyan, contemporary fusion, or international cuisine."
    },
    {
      title: "Full-Service Experience",
      description: "We don't just cook. We handle everything—menu planning, ingredient sourcing, cooking, presentation, serving, and cleanup. You relax and enjoy."
    },
    {
      title: "Dietary Accommodations",
      description: "Vegetarian, vegan, gluten-free, halal, keto, paleo—no problem. Our chefs are experienced in all dietary requirements and will ensure every guest is delighted."
    }
  ];

  const serviceTypes = [
    {
      id: 'private',
      name: 'Private Chef',
      description: 'A personal chef for your home—perfect for date nights, family dinners, or when you simply want to relax.',
      icon: GiChefToque,
      features: [
        'In-home meal preparation',
        'Custom menu design',
        'Ingredient sourcing',
        'Professional cooking & presentation',
        'Serving & cleanup included',
        'Available for single meals or weekly service'
      ],
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
      popular: true
    }
  ];

  const menuCategories = [
    {
      name: "Kenyan Classics",
      items: [
        { name: "Nyama Choma", description: "Slow-roasted goat or beef served with kachumbari and ugali" },
        { name: "Coastal Fish Curry", description: "Fresh catch simmered in coconut milk with tamarind and local spices" },
        { name: "Sukuma Wiki & Ugali", description: "Sautéed collard greens with tomatoes and onions, served with maize meal" },
        { name: "Pilau", description: "Fragrant spiced rice with beef or chicken, served with kachumbari" },
        { name: "Mukimo", description: "Mashed potatoes with pumpkin leaves, maize, and onions" }
      ],
      icon: FaFire,
      color: "from-orange-500 to-red-500"
    },
    {
      name: "Swahili Coast",
      items: [
        { name: "Biriani", description: "Layered rice dish with meat, potatoes, and aromatic Swahili spices" },
        { name: "Mishkaki", description: "Grilled marinated beef skewers with mango salsa" },
        { name: "Viazi Karai", description: "Spiced potato bites in gram flour batter, fried to perfection" },
        { name: "Samaki wa Kupaka", description: "Grilled fish in coconut sauce with tamarind" },
        { name: "Mahamri", description: "Swahili coconut doughnuts, perfect for breakfast or dessert" }
      ],
      icon: FaFish,
      color: "from-blue-500 to-teal-500"
    },
    {
      name: "International Fusion",
      items: [
        { name: "Kenyan-BBQ Ribs", description: "Slow-cooked pork ribs in coffee-molasses glaze" },
        { name: "Masala Grilled Lobster", description: "Lobster tail with Kenyan coastal masala butter" },
        { name: "Avocado & Mango Salad", description: "Fresh Kenyan avocados with mango, lime, and chili" },
        { name: "Coffee-Rubbed Steak", description: "Kenyan AA coffee-rubbed beef tenderloin" },
        { name: "Plantain & Coconut Dessert", description: "Caramelized plantains with coconut cream" }
      ],
      icon: GiSteak,
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "Vegetarian Delights",
      items: [
        { name: "Githeri", description: "Traditional maize and beans, elevated with herbs and spices" },
        { name: "Kunde & Matoke", description: "Cowpeas with green bananas in coconut sauce" },
        { name: "Pumpkin & Peanut Stew", description: "Creamy pumpkin stew with groundnuts and greens" },
        { name: "Cassava & Plantain Chips", description: "Crispy fried cassava and plantain with chili salt" },
        { name: "Moroccan-Inspired Vegetables", description: "Spiced vegetable tagine with couscous" }
      ],
      icon: FaCarrot,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { icon: FaUsers, value: "5,000+", label: "Happy Clients" },
    { icon: MdOutlineRestaurantMenu, value: "200+", label: "Unique Menus" },
    { icon: FaStar, value: "4.9", label: "Customer Rating" },
    { icon: FaHeart, value: "100%", label: "Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Wanjiku M.",
      location: "Karen, Nairobi",
      service: "Private Chef - Anniversary Dinner",
      quote: "Our 10th anniversary deserved something special. Chef Anne arrived with fresh ingredients, created a stunning 5-course meal in our home, and left the kitchen spotless. The food was better than any restaurant in Nairobi. We'll definitely book again.",
      rating: 5
    },
    {
      name: "David & Sarah O.",
      location: "Westlands",
      service: "Private Chef - Family Dinner",
      quote: "We wanted a special family dinner without the hassle of cooking. The chef prepared an incredible meal that everyone loved—from the kids to the grandparents. The cleanup service was the cherry on top!",
      rating: 5
    },
    {
      name: "James Kipchoge",
      location: "Eldoret",
      service: "Private Chef - Cultural Feast",
      quote: "I wanted to introduce my international business partners to real Kenyan cuisine. Chef Michael prepared a traditional feast with stories behind each dish. My guests still talk about the mukimo and the coastal fish curry. Asante sana!",
      rating: 5
    }
  ];

  const specialDietary = [
    "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Halal", "Keto", "Paleo", "Low-Carb", "Diabetic-Friendly", "Nut-Free", "Shellfish-Free", "Kid-Friendly"
  ];

  const faqs = [
    {
      q: "How does a private chef service work?",
      a: "It's simple! You book a date, we discuss your preferences (cuisine type, dietary needs, number of guests), and our chef arrives at your home with all the fresh ingredients. They prepare and cook everything in your kitchen, serve the meal, and clean up completely before leaving. You just relax and enjoy."
    },
    {
      q: "Do I need to provide any equipment?",
      a: "We bring most of our own equipment—knives, pots, pans, and specialty tools. We just need access to your stove, oven, sink, and refrigerator. If you have specific equipment you'd prefer we use, just let us know."
    },
    {
      q: "What if I have food allergies or dietary restrictions?",
      a: "No problem! Just let us know when booking. Our chefs are experienced with all dietary requirements and will create a delicious menu that works for everyone. We also handle cross-contamination carefully."
    },
    {
      q: "How far in advance should I book?",
      a: "For private dinners, we recommend at least 3-5 days advance booking. For larger events, 2-3 weeks is ideal to ensure we can accommodate your preferences."
    },
    {
      q: "What types of cuisine do you offer?",
      a: "Our chefs specialize in a wide range of cuisines including traditional Kenyan, Swahili coastal, international fusion, and vegetarian/vegan options. We'll work with you to create the perfect menu for your occasion."
    }
  ];

  // Meal showcase images
  const mealShowcase = [
    {
      url: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Grilled Catch of the Day",
      description: "Fresh seafood with coastal spices"
    },
    {
      url: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Nyama Choma Feast",
      description: "Traditional Kenyan roasted meat with kachumbari"
    },
    {
      url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Swahili Biriani",
      description: "Aromatic spiced rice with tender meat"
    },
    {
      url: "https://images.unsplash.com/photo-1551218808-94e220e084d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      title: "Vegetarian Delight",
      description: "Fresh farm vegetables with authentic spices"
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
        .chef-card {
          transition: all 0.3s ease;
        }
        .chef-card:hover {
          transform: translateY(-4px);
        }
        .meal-image {
          transition: all 0.5s ease;
        }
        .meal-image:hover {
          transform: scale(1.05);
        }
        .menu-card {
          transition: all 0.3s ease;
        }
        .menu-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Chef preparing gourmet meal"
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
              <GiChefToque /> Nairobi's Finest Private Chefs
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Savor Kenya's <br /><span className="italic text-[#ED9B40]">Finest Flavors</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Whether you're staying at a luxury Airbnb or in your own home, let Nairobi's most celebrated chefs create an unforgettable dining experience. From sizzling nyama choma to exquisite coastal curries—we bring the taste of Kenya to your table.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={getWhatsAppLink(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors inline-flex items-center gap-2"
              >
                <FaWhatsapp /> Book a Chef on WhatsApp
              </a>
              <button 
                onClick={() => document.getElementById('menus').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                Explore Our Menus
              </button>
            </div>

            {/* Culinary Highlights */}
            <div className="flex gap-6 mt-12">
              <div className="flex items-center gap-2">
                <FaLeaf className="text-[#ED9B40]" />
                <span className="text-sm">Farm Fresh</span>
              </div>
              <div className="flex items-center gap-2">
                <GiChefToque className="text-[#ED9B40]" />
                <span className="text-sm">Award-Winning Chefs</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUtensils className="text-[#ED9B40]" />
                <span className="text-sm">Custom Menus</span>
              </div>
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
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Savor Kenya's Best, Right Where You Are</h2>
          <p className="text-white/80 mb-6 max-w-2xl mx-auto">
            Whether you're in a luxury Airbnb in Kilimani or your home in Karen—our chefs bring restaurant-quality dining to you. Chat with us on WhatsApp to start planning your menu.
          </p>
          <a
            href={getWhatsAppLink(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-full"
          >
            <FaWhatsapp size={18} /> Inquire Now
          </a>
        </div>
      </section>

      {/* Signature Menus - MOVED TO TOP */}
      <section id="menus" className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Signature <span className="italic">Menus</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-lg">
              Created by Nairobi's most celebrated chefs—each dish tells a story of Kenya's rich culinary heritage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {menuCategories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="menu-card bg-white rounded-xl overflow-hidden shadow-lg border border-stone-100"
              >
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <category.icon className="text-3xl text-[#ED9B40]" />
                    <span className="text-xs uppercase tracking-widest text-stone-400 bg-stone-100 px-3 py-1 rounded-full">
                      {category.name.split(' ')[0]} Special
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#0F4C55] mb-4">{category.name}</h3>
                  <ul className="space-y-4">
                    {category.items.map((item, i) => (
                      <li key={i} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                        <p className="font-medium text-[#0F4C55] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#ED9B40] rounded-full" />
                          {item.name}
                        </p>
                        <p className="text-xs text-stone-500 mt-1 ml-3">{item.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-stone-500 text-sm italic bg-stone-50 inline-block px-6 py-3 rounded-full">
              *All menus can be customized to your preferences and dietary needs
            </p>
          </div>
        </div>
      </section>

      {/* About Our Private Chef Service - Brief Kenyan-focused paragraph */}
      <section className="py-16 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
                alt="Private chef preparing Kenyan cuisine"
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-[#ED9B40] text-[#093A3E] p-5 rounded-lg shadow-xl">
                <GiChefToque className="text-3xl mb-1" />
                <p className="text-sm font-bold">Nairobi's Best Chefs</p>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaGlobeAfrica className="text-3xl text-[#ED9B40]" />
                <span className="text-sm uppercase tracking-widest text-stone-500">Karibu - Welcome</span>
              </div>
              <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-6 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
                The Taste of Kenya, <span className="italic">Wherever You Are</span>
              </h2>
              <p className="text-stone-700 text-lg mb-6 leading-relaxed">
                Whether you're staying at a luxurious Airbnb in Kilimani, a beachfront villa in Diani, or relaxing in your own home—Nairobi's finest chefs come to you. From sizzling nyama choma prepared over an open flame to fragrant coastal biriani, we bring authentic Kenyan flavors to your table.
              </p>
              <p className="text-stone-600 leading-relaxed">
                Our chefs have trained in Kenya's top kitchens and are celebrated for their mastery of both traditional and contemporary cuisine. Let us turn your dining experience into a celebration of Kenya's rich culinary heritage.
              </p>
              <div className="mt-8 flex gap-4">
                <a
                  href={getWhatsAppLink(whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C55] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#ED9B40] hover:text-[#093A3E] transition-colors rounded-lg"
                >
                  <FaWhatsapp /> Book a Chef
                </a>
                <button 
                  onClick={() => document.getElementById('menus').scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#0F4C55] text-[#0F4C55] text-xs uppercase tracking-widest font-bold hover:bg-[#0F4C55] hover:text-white transition-colors rounded-lg"
                >
                  <MdOutlineRestaurantMenu /> View Menus
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meal Showcase Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl text-[#0F4C55] mb-4 font-serif">A Taste of What Awaits</h2>
            <p className="text-stone-600">Fresh ingredients, authentic recipes, presented with elegance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mealShowcase.map((meal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group overflow-hidden rounded-lg h-64 cursor-pointer"
              >
                <img 
                  src={meal.url} 
                  alt={meal.title}
                  className="w-full h-full object-cover meal-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-5 text-white">
                    <h4 className="font-bold text-lg">{meal.title}</h4>
                    <p className="text-sm text-white/80">{meal.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose <span className="italic">Our Private Chefs?</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-xl border border-stone-200 shadow-md hover:shadow-xl transition-shadow"
              >
                <h3 className="text-lg font-bold text-[#0F4C55] mb-3">{item.title}</h3>
                <p className="text-stone-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Type - Private Chef Only */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              The <span className="italic">Experience</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              A personal chef for your home or Airbnb—perfect for date nights, family dinners, or when you simply want to relax.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {serviceTypes.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="chef-card bg-[#f5f2ee] rounded-xl border border-stone-200 overflow-hidden flex flex-col md:flex-row shadow-xl"
              >
                <div className="md:w-2/5 h-64 md:h-auto overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="md:w-3/5 p-8">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <service.icon className="text-3xl text-[#ED9B40]" />
                        <h3 className="text-2xl font-bold text-[#0F4C55]">{service.name}</h3>
                      </div>
                      {service.popular && (
                        <span className="inline-block bg-[#ED9B40] text-[#0F4C55] text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest">
                          Most Popular
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-stone-600 text-base mb-6">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <FaCheckCircle className="text-[#ED9B40] mt-0.5 flex-shrink-0" />
                        <span className="text-stone-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={getWhatsAppLink(whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C55] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#ED9B40] hover:text-[#093A3E] transition-colors rounded-lg"
                    >
                      <FaWhatsapp /> Inquire on WhatsApp
                    </a>
                    <a
                      href="tel:+254720108914"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-[#0F4C55] text-[#0F4C55] text-xs uppercase tracking-widest font-bold hover:bg-[#0F4C55] hover:text-white transition-colors rounded-lg"
                    >
                      <FaPhone /> Call Us
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dietary Accommodations */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#0F4C55] to-[#093A3E] text-white">
        <div className="max-w-[1000px] mx-auto text-center">
          <FaLeaf className="text-4xl text-[#ED9B40] mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            We Accommodate <span className="text-[#ED9B40]">All Diets</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {specialDietary.map((diet, index) => (
              <span key={index} className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20">
                {diet}
              </span>
            ))}
          </div>
          <p className="text-white/80 text-sm mt-6 max-w-2xl mx-auto">
            Just let us know your requirements when booking—our chefs will create a delicious menu that works for everyone.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What Our <span className="italic">Guests Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#f5f2ee] p-8 rounded-xl border border-stone-200 relative shadow-md"
              >
                <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < testimonial.rating ? "text-[#ED9B40]" : "text-stone-300"} />
                  ))}
                </div>
                <p className="text-stone-700 mb-6 italic text-sm">"{testimonial.quote}"</p>
                <div>
                  <p className="font-bold text-[#0F4C55]">{testimonial.name}</p>
                  <p className="text-xs text-stone-500">{testimonial.location} · {testimonial.service}</p>
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
              <div key={index} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-md">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-5 bg-white flex justify-between items-center hover:bg-[#f5f2ee] transition-colors"
                >
                  <span className="font-bold text-[#0F4C55]">{faq.q}</span>
                  <span className="text-[#ED9B40] text-xl">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="p-5 bg-[#f5f2ee] border-t border-stone-200">
                    <p className="text-stone-700">{faq.a}</p>
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
            Ready to <span className="text-[#ED9B40]">Savor Kenya?</span>
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Whether you're in an Airbnb or at home, let Nairobi's finest chefs create an unforgettable Kenyan dining experience just for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={getWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors rounded-lg"
            >
              <FaWhatsapp /> Book on WhatsApp
            </a>
            <a
              href="tel:+254720108914"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-lg"
            >
              <FaPhone /> Call to Discuss
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaLeaf className="text-[#ED9B40]" /> Farm Fresh</span>
            <span className="flex items-center gap-2"><GiChefToque className="text-[#ED9B40]" /> Nairobi's Best Chefs</span>
            <span className="flex items-center gap-2"><FaUtensils className="text-[#ED9B40]" /> Custom Menus</span>
          </div>

          {/* Social & Contact */}
          <div className="mt-8 flex justify-center gap-4">
            <a href={`https://wa.me/${whatsappNumber}`} className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaWhatsapp size={20} />
            </a>
            <a href="mailto:chef@homesbymwema.com" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaEnvelope size={20} />
            </a>
            <a href="#" className="text-white/60 hover:text-[#ED9B40] transition-colors">
              <FaInstagram size={20} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ChefServices;