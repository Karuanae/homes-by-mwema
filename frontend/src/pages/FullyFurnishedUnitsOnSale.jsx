import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaHome,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMapMarkerAlt,
  FaCamera,
  FaHeart,
  FaShare,
  FaCheckCircle,
  FaArrowRight,
  FaQuoteLeft,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaAward,
  FaUsers,
  FaRegClock,
  FaMoneyBillWave,
  FaChartLine,
  FaParking,
  FaSwimmingPool,
  FaDumbbell,
  FaShieldAlt,
  FaWifi,
  FaSnowflake,
  FaLock
} from 'react-icons/fa';
import { MdOutlineBalcony, MdOutlineElevator, MdOutlineSecurity } from 'react-icons/md';
import { BiArea } from 'react-icons/bi';

const FullyFurnishedUnitsOnSale = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const experienceHighlights = [
    {
      icon: FaAward,
      title: "5+ Years Experience",
      description: "Trusted real estate partner in Nairobi with a proven track record of successful property sales."
    },
    {
      icon: FaUsers,
      title: "200+ Happy Homeowners",
      description: "We've helped over 200 families find their dream fully furnished homes in Nairobi."
    },
    {
      icon: FaRegClock,
      title: "7-Day Viewing",
      description: "Flexible viewing schedules including weekends to accommodate your busy lifestyle."
    }
  ];

  const whyChooseUs = [
    {
      title: "Turnkey Living",
      description: "Move straight into your new home—every unit comes fully furnished with premium furniture, appliances, and decor. No waiting, no shopping, no stress."
    },
    {
      title: "Prime Nairobi Locations",
      description: "Our properties are strategically located in Nairobi's most desirable neighborhoods—Kilimani, Westlands, Karen, Lavington, and Runda."
    },
    {
      title: "Investment Ready",
      description: "Perfect for investors seeking rental-ready properties. Our furnished units command premium rents from day one."
    },
    {
      title: "Quality Assurance",
      description: "Every property is personally inspected by our team to ensure the highest standards of construction, finish, and furnishing."
    }
  ];

  const properties = [
    {
      id: 1,
      name: "The Kilimani Haven",
      location: "Kilimani, Nairobi",
      price: 18500000,
      bedrooms: 3,
      bathrooms: 3,
      size: "1,850 sq ft",
      floor: "12th Floor",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Modern Italian kitchen with granite countertops",
        "Built-in wardrobes in all bedrooms",
        "Smart home automation",
        "High-speed fiber internet ready",
        "Backup generator",
        "Secure parking (2 spaces)"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Swimming Pool" },
        { icon: FaDumbbell, name: "Gym" },
        { icon: FaParking, name: "2 Parking Slots" },
        { icon: MdOutlineBalcony, name: "Private Balcony" },
        { icon: MdOutlineElevator, name: "High-speed Elevators" },
        { icon: MdOutlineSecurity, name: "24/7 Security" }
      ],
      furnishing: [
        "Full living room set",
        "King-size beds with memory foam mattresses",
        "Dining table for 6",
        "Washer/dryer combo",
        "Smart TV in living room",
        "All kitchen appliances (fridge, oven, microwave, dishwasher)"
      ],
      roi: {
        monthlyRent: 180000,
        annualRoi: "11.7%",
        breakEven: "8.5 years"
      },
      status: "available",
      type: "apartment"
    },
    {
      id: 2,
      name: "Westlands Executive Suite",
      location: "Westlands, Nairobi",
      price: 22500000,
      bedrooms: 4,
      bathrooms: 4,
      size: "2,200 sq ft",
      floor: "8th Floor",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Floor-to-ceiling windows with city views",
        "Italian marble flooring",
        "Central air conditioning",
        "Home office setup",
        "Staff quarters",
        "3 parking spaces"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Infinity Pool" },
        { icon: FaDumbbell, name: "Fully Equipped Gym" },
        { icon: FaParking, name: "3 Parking Slots" },
        { icon: MdOutlineBalcony, name: "Panoramic Balcony" },
        { icon: MdOutlineElevator, name: "Private Elevator Access" },
        { icon: FaWifi, name: "Smart Building WiFi" }
      ],
      furnishing: [
        "Designer Italian furniture",
        "California king beds",
        "Smart home system",
        "Miele kitchen appliances",
        "Home theater system",
        "Imported light fixtures"
      ],
      roi: {
        monthlyRent: 240000,
        annualRoi: "12.8%",
        breakEven: "7.8 years"
      },
      status: "available",
      type: "apartment"
    },
    {
      id: 3,
      name: "Karen Serenity House",
      location: "Karen, Nairobi",
      price: 42000000,
      bedrooms: 5,
      bathrooms: 5,
      size: "4,500 sq ft",
      landSize: "0.5 acres",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Private garden with indigenous trees",
        "Staff quarters with separate entrance",
        "Solar water heating",
        "Borehole",
        "Double garage",
        "Guest cottage"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Private Pool" },
        { icon: FaDumbbell, name: "Home Gym" },
        { icon: FaParking, name: "4 Car Garage" },
        { icon: FaShieldAlt, name: "Electric Fence" },
        { icon: FaSnowflake, name: "Central AC" },
        { icon: FaLock, name: "Smart Security" }
      ],
      furnishing: [
        "Antique and contemporary fusion",
        "Custom-made furniture",
        "Professional kitchen equipment",
        "Outdoor entertainment area",
        "Home cinema room",
        "Wine cellar"
      ],
      roi: {
        monthlyRent: 450000,
        annualRoi: "12.9%",
        breakEven: "7.8 years"
      },
      status: "available",
      type: "house"
    },
    {
      id: 4,
      name: "Lavington Green Residence",
      location: "Lavington, Nairobi",
      price: 28500000,
      bedrooms: 4,
      bathrooms: 4,
      size: "2,800 sq ft",
      floor: "3rd Floor",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Private terrace with city views",
        "Walk-in closets in master suite",
        "His and hers bathrooms",
        "Study/library",
        "Wine storage",
        "2 parking spaces"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Resort Pool" },
        { icon: FaDumbbell, name: "Fitness Center" },
        { icon: FaParking, name: "2 Parking Slots" },
        { icon: MdOutlineBalcony, name: "Private Terrace" },
        { icon: FaWifi, name: "Smart Home Ready" },
        { icon: MdOutlineSecurity, name: "Chat Support" }
      ],
      furnishing: [
        "Contemporary African art collection",
        "Designer lighting throughout",
        "High-end appliances",
        "Custom window treatments",
        "Outdoor furniture on terrace",
        "Professional cleaning equipment included"
      ],
      roi: {
        monthlyRent: 280000,
        annualRoi: "11.8%",
        breakEven: "8.5 years"
      },
      status: "available",
      type: "apartment"
    },
    {
      id: 5,
      name: "Runda Executive Mansion",
      location: "Runda, Nairobi",
      price: 65000000,
      bedrooms: 6,
      bathrooms: 7,
      size: "6,200 sq ft",
      landSize: "1.2 acres",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1600607687644-c7171b42498b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Gated community with 24/7 security",
        "Tennis court",
        "Swimming pool with pool house",
        "Staff quarters (3 rooms)",
        "Borehole with treatment system",
        "Backup generator (85 KVA)"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Olympic Pool" },
        { icon: FaDumbbell, name: "Professional Gym" },
        { icon: FaParking, name: "6 Car Garage" },
        { icon: FaShieldAlt, name: "CCTV & Electric Fence" },
        { icon: FaSnowflake, name: "Central AC Throughout" },
        { icon: FaWifi, name: "Starlink Ready" }
      ],
      furnishing: [
        "Luxury European furnishings",
        "Professional kitchen with island",
        "Home spa and sauna",
        "Wine cellar with tasting room",
        "Outdoor kitchen and bar",
        "Landscaped gardens with irrigation"
      ],
      roi: {
        monthlyRent: 750000,
        annualRoi: "13.8%",
        breakEven: "7.2 years"
      },
      status: "available",
      type: "house"
    },
    {
      id: 6,
      name: "Kilimani Urban Loft",
      location: "Kilimani, Nairobi",
      price: 14500000,
      bedrooms: 2,
      bathrooms: 2,
      size: "1,200 sq ft",
      floor: "5th Floor",
      completion: "Ready for Occupation",
      image: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
      images: [
        "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
      ],
      features: [
        "Open plan living",
        "Industrial-chic design",
        "High ceilings (4.5m)",
        "Private rooftop terrace",
        "1 parking space",
        "Pet-friendly building"
      ],
      amenities: [
        { icon: FaSwimmingPool, name: "Rooftop Pool" },
        { icon: FaDumbbell, name: "Compact Gym" },
        { icon: FaParking, name: "1 Parking Slot" },
        { icon: MdOutlineBalcony, name: "Rooftop Terrace" },
        { icon: FaWifi, name: "Fiber Optic" },
        { icon: FaLock, name: "Smart Lock Entry" }
      ],
      furnishing: [
        "Modern minimalist furniture",
        "Convertible sofa bed",
        "Smart TV and sound system",
        "Compact kitchen with appliances",
        "Work-from-home desk setup",
        "Custom storage solutions"
      ],
      roi: {
        monthlyRent: 140000,
        annualRoi: "11.6%",
        breakEven: "8.6 years"
      },
      status: "available",
      type: "apartment"
    }
  ];

  const stats = [
    { icon: FaHome, value: "50+", label: "Units Available" },
    { icon: FaStar, value: "4.9", label: "Client Rating" },
    { icon: FaUsers, value: "200+", label: "Happy Homeowners" },
    { icon: FaMoneyBillWave, value: "12.5%", label: "Avg. ROI" }
  ];

  const investmentHighlights = [
    {
      title: "Rental-Ready from Day One",
      description: "Our furnished units can be listed on Airbnb or traditional rentals immediately—no waiting, no additional investment."
    },
    {
      title: "Premium Rental Income",
      description: "Furnished properties command 30-50% higher rents than unfurnished equivalents in the same neighborhood."
    },
    {
      title: "Depreciation Benefits",
      description: "Furniture and appliances qualify for capital allowances, reducing your tax burden as an investor."
    },
    {
      title: "Professional Management Available",
      description: "Let us handle your rental—tenant screening, maintenance, guest communication—for a stress-free investment."
    }
  ];

  const faqs = [
    {
      q: "What does 'fully furnished' include?",
      a: "Every unit comes complete with living room furniture, bedroom sets (beds, mattresses, wardrobes), dining furniture, all kitchen appliances (fridge, oven, microwave, dishwasher), window treatments, and light fixtures. Most units also include smart TVs, home automation systems, and decor items."
    },
    {
      q: "Can I see the property before purchase?",
      a: "Absolutely! We offer flexible viewing schedules, including weekends. Our team will walk you through the property and answer all your questions."
    },
    {
      q: "What is the payment process?",
      a: "We work with trusted financial institutions to offer flexible payment plans. Typically, we require 10% deposit, with the balance payable over 60-90 days. Mortgage financing is also available through our partner banks."
    },
    {
      q: "Is the furniture warranty transferred?",
      a: "Yes! All furniture and appliances come with manufacturer warranties that are fully transferable to you as the new owner. We provide all documentation at closing."
    },
    {
      q: "Can I rent out the unit immediately?",
      a: "Yes, you can start renting immediately. Many of our investors begin generating income within days of closing. We can also connect you with our property management team if you prefer a hands-off approach."
    },
    {
      q: "What are the ongoing costs?",
      a: "Monthly service charges vary by building (typically Ksh 15,000-35,000) and cover security, common area maintenance, amenities, and building insurance. You'll also be responsible for utilities and any optional services."
    }
  ];

  const filteredProperties = activeFilter === 'all' 
    ? properties 
    : properties.filter(p => p.type === activeFilter);

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
        .property-card {
          transition: all 0.3s ease;
        }
        .property-card:hover {
          transform: translateY(-8px);
        }
      `}</style>
      <div className="bg-noise" />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury furnished apartment"
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
              <FaHome /> Fully Furnished Units For Sale
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Move-In Ready <br /><span className="italic text-[#ED9B40]">Luxury Living</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
              Discover Nairobi's finest collection of turnkey properties. Each home comes complete with premium furnishings, ready for you to move in or start generating rental income immediately.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard?tab=new-consultation" className="px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors">
                Schedule a Viewing
              </Link>
              <button 
                onClick={() => document.getElementById('properties').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                Browse Properties
              </button>
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

      {/* Experience Highlights */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Why Choose <span className="italic">Homes by Mwema?</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Your trusted partner for finding the perfect fully furnished home in Nairobi.
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

      {/* Investment Highlights */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Smart <span className="italic">Investment</span> Opportunity
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Our furnished units offer exceptional returns for savvy investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {investmentHighlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-sm border border-stone-200 flex gap-4"
              >
                <FaChartLine className="text-3xl text-[#ED9B40] flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-[#0F4C55] mb-2">{item.title}</h3>
                  <p className="text-stone-600">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ROI Calculator Preview */}
          <div className="mt-12 bg-[#0F4C55] text-white p-8 rounded-sm">
            <h3 className="text-2xl font-serif mb-4">Sample Investment Return</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-white/70 mb-1">Purchase Price</p>
                <p className="text-2xl font-bold">Ksh 18.5M</p>
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Monthly Rental Income</p>
                <p className="text-2xl font-bold">Ksh 180K</p>
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Annual ROI</p>
                <p className="text-2xl font-bold text-[#ED9B40]">11.7%</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mt-4">
              *Based on average rental rates for furnished 3-bedroom in Kilimani. Actual returns may vary.
            </p>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section id="properties" className="py-24 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              Available <span className="italic">Properties</span>
            </h2>
            <p className="text-stone-600 max-w-2xl mx-auto">
              Browse our curated collection of fully furnished homes in Nairobi's premier locations.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-transparent text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              All Properties
            </button>
            <button
              onClick={() => setActiveFilter('apartment')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeFilter === 'apartment' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-transparent text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              Apartments
            </button>
            <button
              onClick={() => setActiveFilter('house')}
              className={`px-6 py-2 text-xs uppercase tracking-widest font-bold transition-colors ${
                activeFilter === 'house' 
                  ? 'bg-[#0F4C55] text-white' 
                  : 'bg-transparent text-stone-500 hover:text-[#0F4C55]'
              }`}
            >
              Houses
            </button>
          </div>

          {/* Property Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredProperties.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="property-card bg-[#f5f2ee] rounded-sm border border-stone-200 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Image Section */}
                  <div className="relative h-64 md:h-full overflow-hidden">
                    <img 
                      src={property.image} 
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-[#ED9B40] text-[#093A3E] px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      For Sale
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <button className="bg-white/90 p-2 rounded-full hover:bg-[#ED9B40] transition-colors">
                        <FaHeart className="text-sm" />
                      </button>
                      <button className="bg-white/90 p-2 rounded-full hover:bg-[#ED9B40] transition-colors">
                        <FaShare className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-[#0F4C55]">{property.name}</h3>
                        <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
                          <FaMapMarkerAlt className="text-[#ED9B40]" /> {property.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#ED9B40]">
                          Ksh {property.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Key Specs */}
                    <div className="grid grid-cols-4 gap-2 my-4 py-4 border-y border-stone-200">
                      <div className="text-center">
                        <FaBed className="text-[#ED9B40] mx-auto mb-1" />
                        <span className="text-xs text-stone-600">{property.bedrooms} Beds</span>
                      </div>
                      <div className="text-center">
                        <FaBath className="text-[#ED9B40] mx-auto mb-1" />
                        <span className="text-xs text-stone-600">{property.bathrooms} Baths</span>
                      </div>
                      <div className="text-center">
                        <BiArea className="text-[#ED9B40] mx-auto mb-1 text-lg" />
                        <span className="text-xs text-stone-600">{property.size}</span>
                      </div>
                      <div className="text-center">
                        <FaChartLine className="text-[#ED9B40] mx-auto mb-1" />
                        <span className="text-xs text-stone-600">{property.roi.annualRoi} ROI</span>
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {property.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] bg-white px-2 py-1 rounded-sm text-stone-600">
                          <amenity.icon className="text-[#ED9B40]" /> {amenity.name}
                        </span>
                      ))}
                    </div>

                    {/* Furnishing Highlight */}
                    <div className="bg-white p-3 rounded-sm mb-4">
                      <p className="text-xs font-bold text-[#0F4C55] mb-1">✨ Furnished with:</p>
                      <p className="text-xs text-stone-600 line-clamp-2">
                        {property.furnishing.slice(0, 3).join(" • ")}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Link
                        to={`/property/${property.id}`}
                        className="flex-1 text-center py-3 bg-[#0F4C55] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#ED9B40] hover:text-[#093A3E] transition-colors"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/booking/viewing/${property.id}`}
                        className="flex-1 text-center py-3 border border-[#0F4C55] text-[#0F4C55] text-xs uppercase tracking-widest font-bold hover:bg-[#0F4C55] hover:text-white transition-colors"
                      >
                        Schedule Viewing
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[#f5f2ee]">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-[#0F4C55] mb-4 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>
              What Our <span className="italic">Homeowners Say</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-sm border border-stone-200 relative">
              <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
              <p className="text-stone-700 mb-6 italic">
                "I was moving from London and needed a home immediately. The team at Homes by Mwema showed me three fully furnished options, and I moved into my Kilimani apartment within a week. Everything was perfect—down to the kitchen utensils and bedding."
              </p>
              <div>
                <p className="font-bold text-[#0F4C55]">Jennifer A.</p>
                <p className="text-xs text-stone-500">Kilimani · 3-Bedroom Apartment</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-sm border border-stone-200 relative">
              <FaQuoteLeft className="text-3xl text-[#ED9B40] absolute top-4 right-4 opacity-20" />
              <p className="text-stone-700 mb-6 italic">
                "As an investor, I was looking for rental-ready properties. The furnished unit in Westlands was rented out on Airbnb within 3 days of closing. The ROI projections were accurate, and the property management team handles everything."
              </p>
              <div>
                <p className="font-bold text-[#0F4C55]">Michael O.</p>
                <p className="text-xs text-stone-500">Investor · 2 Properties</p>
              </div>
            </div>
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

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#093A3E] to-[#0F4C55] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            Find Your <span className="text-[#ED9B40]">Dream Home</span> Today
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Whether you're looking for a personal residence or a high-yield investment property, we have the perfect fully furnished unit waiting for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/dashboard?tab=new-consultation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#ED9B40] text-[#093A3E] font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
            >
              Schedule a Viewing <FaArrowRight />
            </Link>
            <a
              href="tel:+254700000000"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
            >
              Call Us: +254 700 000 000
            </a>
          </div>
          
          <div className="mt-12 pt-12 border-t border-white/10 flex flex-wrap gap-8 justify-center text-sm">
            <span className="flex items-center gap-2"><FaShieldAlt className="text-[#ED9B40]" /> Title Deed Guaranteed</span>
            <span className="flex items-center gap-2"><FaCheckCircle className="text-[#ED9B40]" /> Quality Assured</span>
            <span className="flex items-center gap-2"><FaMoneyBillWave className="text-[#ED9B40]" /> Flexible Payment Plans</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FullyFurnishedUnitsOnSale;