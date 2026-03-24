// BookingPage.jsx - UPDATED with requested features
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL, IMAGE_BASE_URL } from '../services/api';
import {
  MapPin, ChevronLeft, ChevronRight, Check,
  AlertCircle, Shield, ArrowLeft, ChevronDown,
  MessageCircle, User, Info, HelpCircle, Calendar,
  Users, Home, Wifi, Coffee, Heart, Star, Phone, Mail
} from 'lucide-react';

// ── normalise image data ──────────────────────────────────────────────────────
function normaliseImages(raw = []) {
  return raw.map((img, i) => {
    if (typeof img === 'string') return { id: null, url: img, is_cover: i === 0, category: null };
    return { id: img.id ?? null, url: img.url ?? img, is_cover: img.is_cover ?? false, category: img.category ?? null };
  });
}

// ── CategorizedGallery ────────────────────────────────────────────────────────
function CategorizedGallery({ images, categories, getImageSrc, onError }) {
  const [activeSlug, setActiveSlug]   = useState('all');
  const [selectedIdx, setSelectedIdx] = useState(0);

  const usedSlugs = new Set(images.map(img => img.category).filter(Boolean));

  const tabs = [
    { slug: 'all', name: 'All Photos', count: images.length },
    ...categories
      .filter(c => usedSlugs.has(c.slug))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(c => ({ slug: c.slug, name: c.name, count: images.filter(img => img.category === c.slug).length })),
  ];

  const filtered = activeSlug === 'all' ? images : images.filter(img => img.category === activeSlug);
  const safeIdx  = Math.min(selectedIdx, Math.max(filtered.length - 1, 0));
  const current  = filtered[safeIdx];

  const prev = () => setSelectedIdx(i => (i - 1 + filtered.length) % filtered.length);
  const next = () => setSelectedIdx(i => (i + 1) % filtered.length);

  return (
    <div className="space-y-3">
      {tabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.slug}
              onClick={() => { setActiveSlug(tab.slug); setSelectedIdx(0); }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide transition-all border whitespace-nowrap ${
                activeSlug === tab.slug
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
              }`}
            >
              {tab.name}
              <span className={`text-[10px] ${activeSlug === tab.slug ? 'text-stone-300' : 'text-stone-400'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative h-[250px] sm:h-[350px] md:h-[450px] rounded-lg overflow-hidden bg-stone-100">
        <AnimatePresence mode="wait">
          {current && (
            <motion.img
              key={current.url + safeIdx}
              src={getImageSrc(current.url)}
              alt={`Property image ${safeIdx + 1}`}
              className="w-full h-full object-cover"
              onError={onError}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {filtered.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 md:p-2 shadow-lg transition-colors">
              <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 md:p-2 shadow-lg transition-colors">
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between pointer-events-none">
          {current?.category && (
            <span className="bg-black/60 text-white text-[11px] px-2 py-0.5 rounded capitalize">
              {categories.find(c => c.slug === current.category)?.name ?? current.category}
            </span>
          )}
          <span className="ml-auto bg-black/60 text-white text-xs px-2 py-0.5 rounded">
            {safeIdx + 1} / {filtered.length}
          </span>
        </div>
      </div>

      {filtered.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {filtered.map((img, i) => (
            <button key={img.url + i} onClick={() => setSelectedIdx(i)}
              className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${safeIdx === i ? 'ring-2 ring-stone-900 opacity-100' : 'opacity-60 hover:opacity-100'}`}>
              <img src={getImageSrc(img.url)} alt="" className="w-full h-full object-cover" onError={onError} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FAQ Component ─────────────────────────────────────────────────────────────
function FAQ({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-stone-200 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center py-4 text-left"
      >
        <span className="font-medium text-stone-800">{question}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-stone-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Host Message Modal ───────────────────────────────────────────────────────
function HostMessageModal({ isOpen, onClose, hostName, propertyName, onSendMessage }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await onSendMessage(message);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-serif text-xl mb-2">Message {hostName}</h3>
        <p className="text-sm text-stone-500 mb-4">Ask about {propertyName}</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Hi, I have a question about..."
          rows={4}
          className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── BookingPage ───────────────────────────────────────────────────────────────
export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [property, setProperty]   = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [checkInDate, setCheckInDate]   = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests]             = useState({ adults: 1, children: 0, infants: 0 });
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [isAvailable, setIsAvailable]   = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Host information
  const hostInfo = {
    name: 'Ann Mwema',
    title: 'Superhost & Interior Design Enthusiast',
    joined: '2020',
    responseTime: 'Within an hour',
    responseRate: 100,
    about: "Hello! I'm Ann Mwema, an interior design enthusiast and proud host with Homes by Mwema. I've carefully curated each space to blend modern comfort with timeless elegance. As a Nairobi local, I love sharing the beauty of our city with guests from around the world. I'm passionate about creating memorable experiences and ensuring every stay feels like a home away from home. Whether you're here for business or leisure, I'm dedicated to making your stay exceptional.",
    languages: ['English', 'Swahili'],
    hobbies: ['Interior Design', 'Travel', 'Coffee Tasting', 'Reading'],
  };

  // FAQ data
  const faqs = [
    {
      question: 'What time is check-in and check-out?',
      answer: 'Check-in is from 3:00 PM onwards, and check-out is by 11:00 AM. Early check-in or late check-out may be available upon request, subject to availability.'
    },
    {
      question: 'Is parking available?',
      answer: 'Yes, free secure parking is available on the premises. The property has a dedicated parking spot for guests.'
    },
    {
      question: 'Can I host events or parties?',
      answer: 'This property is not suitable for parties or events. We aim to maintain a peaceful environment for all guests and neighbors.'
    },
    {
      question: 'What amenities are provided?',
      answer: 'The property comes fully equipped with high-speed WiFi, fresh linens and towels, toiletries, a fully equipped kitchen, smart TV, and complimentary coffee/tea.'
    },
    {
      question: 'What is the cancellation policy?',
      answer: 'Free cancellation up to 30 days before check-in. For cancellations between 14-29 days, you receive a 50% refund. Cancellations within 14 days are non-refundable.'
    }
  ];

  // Things to know
  const thingsToKnow = {
    houseRules: [
      'Check-in after 3:00 PM',
      'Check-out before 11:00 AM',
      'No parties or events',
      'No smoking inside',
      'Quiet hours after 10:00 PM'
    ],
    healthSafety: [
      'Carbon monoxide alarm installed',
      'Smoke alarm installed',
      'First aid kit available',
      'Fire extinguisher on premises'
    ],
    cancellationPolicy: 'Free cancellation for 48 hours. After that, cancel up to 30 days before check-in for a full refund.'
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [propRes, catRes] = await Promise.allSettled([
          api.properties.getById(id),
          api.properties.getCategories(id),
        ]);
        
        if (propRes.status === 'rejected') throw new Error('Failed to load property');

        const d = propRes.value.data;
        setProperty({
          ...d,
          title: d.title || d.name || 'Untitled Residence',
          location: d.location || 'Nairobi, Kenya',
          description: d.description || 'A luxurious residence curated for exceptional living.',
          price: d.price || 5000,
          rating: d.rating || 4.9,
          specs: { guests: d.max_guests || 2, bedrooms: d.rooms || 1, bathrooms: d.bathrooms || 1, ...d.specs },
          host: d.host || hostInfo,
          amenities: Array.isArray(d.amenities) ? d.amenities.map(a => typeof a === 'string' ? { name: a } : a) : [],
          images: normaliseImages(d.images || []),
        });
        setCategories(catRes.status === 'fulfilled' ? catRes.value.data || [] : []);

        const tom = new Date(); tom.setDate(tom.getDate() + 1);
        const co  = new Date(tom); co.setDate(co.getDate() + 3);
        setCheckInDate(tom.toISOString().split('T')[0]);
        setCheckOutDate(co.toISOString().split('T')[0]);
      } catch (e) {
        console.error('Error loading property:', e);
        setError('Unable to load residence details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    const pending = localStorage.getItem('pendingBookingData');
    if (pending && isAuthenticated) {
      try {
        const data = JSON.parse(pending);
        if (data.propertyId === id) {
          setCheckInDate(data.checkInDate); setCheckOutDate(data.checkOutDate); setGuests(data.guests);
          localStorage.removeItem('pendingBookingData');
          setTimeout(() => createBookingAndGoToPayment(), 500);
        } else { localStorage.removeItem('pendingBookingData'); }
      } catch { localStorage.removeItem('pendingBookingData'); }
    }
  }, [isAuthenticated, id]);

  const getImageSrc = (url) => !url ? '' : url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`;
  const handleImageError = (e) => { e.target.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'; };

  useEffect(() => {
    if (!checkInDate || !checkOutDate) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/check-availability`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id: id, check_in: checkInDate, check_out: checkOutDate }),
        });
        const data = await res.json();
        setIsAvailable(data.available);
        if (!data.available) { setAvailabilityMessage(data.message || 'These dates are not available'); setShowAvailabilityWarning(true); }
        else { setAvailabilityMessage(''); setShowAvailabilityWarning(false); }
      } catch { /* non-fatal */ }
    }, 500);
    return () => clearTimeout(t);
  }, [checkInDate, checkOutDate]);

  const calculateTotal = () => {
    if (!checkInDate || !checkOutDate || !property) return { nights: 0, basePrice: 0, cleaningFee: 0, serviceFee: 0, total: 0 };
    const nights = Math.max(1, Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / 86400000));
    const basePrice = property.price * nights, cleaningFee = 1500, serviceFee = basePrice * 0.12;
    return { nights, basePrice, cleaningFee, serviceFee, total: basePrice + cleaningFee + serviceFee };
  };
  const totals = calculateTotal();

  const createBookingAndGoToPayment = async () => {
    setCreatingBooking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, 'Idempotency-Key': `${id}_${checkInDate}_${checkOutDate}_${Date.now()}` },
        body: JSON.stringify({ property_id: id, check_in: checkInDate, check_out: checkOutDate, guests, payment_type: 'full', message_to_host: '' }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.setItem('pendingBookingData', JSON.stringify({ checkInDate, checkOutDate, guests, propertyId: id })); navigate('/login', { state: { from: `/payment/${id}`, message: 'Session expired.' } }); return; }
        if (res.status === 409) { setIsAvailable(false); setAvailabilityMessage(data.message || 'Dates just booked'); setShowAvailabilityWarning(true); throw new Error('Dates no longer available'); }
        throw new Error(data.error || 'Failed to create booking');
      }
      navigate(`/payment/${id}`, { state: { bookingDetails: data.booking, expiresAt: data.booking.expires_at } });
    } catch (e) { alert(e.message || 'Failed to create booking. Please try again.'); }
    finally { setCreatingBooking(false); }
  };

  const handleCreateBooking = async () => {
    if (!property || !checkInDate || !checkOutDate) { alert('Please select dates'); return; }
    const ci = new Date(checkInDate), co = new Date(checkOutDate), today = new Date(); today.setHours(0,0,0,0);
    if (ci >= co) { alert('Check-out must be after check-in'); return; }
    if (ci < today) { alert('Check-in cannot be in the past'); return; }
    if (!isAvailable) { alert('These dates are not available.'); return; }
    if (!isAuthenticated) {
      localStorage.setItem('pendingBookingData', JSON.stringify({ propertyId: id, checkInDate, checkOutDate, guests, action: 'create-booking' }));
      navigate('/login', { state: { from: `/payment/${id}`, message: 'Please log in to complete your booking' } });
      return;
    }
    await createBookingAndGoToPayment();
  };

  const handleSendMessage = async (message) => {
    // This would integrate with your messaging API
    console.log('Sending message to host:', message);
    alert('Message sent! The host will respond shortly.');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
      <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4" /><p className="text-xs uppercase tracking-widest text-stone-600">Loading Residence...</p></div>
    </div>
  );

  if (error || !property) return (
    <div className="min-h-screen bg-[#f5f2ee] flex items-center justify-center p-4">
      <div className="text-center max-w-md"><AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-4" /><p className="text-stone-600 font-light mb-6">{error || 'Property not found'}</p><button onClick={() => navigate('/')} className="text-xs uppercase tracking-widest border-b border-stone-900 pb-1">Return Home</button></div>
    </div>
  );

  return (
    <div className="bg-[#f5f2ee] font-sans text-stone-900 min-h-screen">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-stone-200 z-40 px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-serif text-lg truncate max-w-[200px]">{property.title}</h1>
        <button onClick={() => setShowMobileSummary(s => !s)} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><ChevronDown className={`w-5 h-5 transition-transform ${showMobileSummary ? 'rotate-180' : ''}`} /></button>
      </div>

      {/* Mobile summary */}
      <AnimatePresence>
        {showMobileSummary && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden fixed top-[57px] left-0 right-0 bg-white border-b border-stone-200 z-40 overflow-hidden shadow-lg">
            <div className="p-4 space-y-3">
              <div className="flex justify-between"><span className="text-xs text-stone-500">Per night</span><span className="font-serif">Ksh {property.price.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-xs text-stone-500">Total ({totals.nights}n)</span><span className="font-serif font-bold">Ksh {Math.round(totals.total).toLocaleString()}</span></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 pb-16 md:pb-24">
        <div className="mb-6 md:mb-12">
          <h1 className="text-2xl md:text-4xl lg:text-6xl text-stone-900 mb-2 md:mb-4 leading-tight font-serif">{property.title}</h1>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-stone-600">
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3 md:w-4 md:h-4" /><span className="font-medium text-stone-900">{property.location}</span></div>
            <span className="w-px h-3 bg-stone-300 hidden sm:block" />
            <span>{property.specs.guests} Guests · {property.specs.bedrooms} Bedrooms · {property.specs.bathrooms} Baths</span>
            <span className="w-px h-3 bg-stone-300 hidden sm:block" />
            <div className="flex items-center gap-1"><span className="text-amber-500">★</span><span className="font-medium text-stone-900">{property.rating}</span></div>
          </div>
        </div>

        {/* Mobile: Booking form appears after content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {/* Left column - Property details (shows first on mobile) */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-1">

            {/* Gallery */}
            <CategorizedGallery images={property.images} categories={categories} getImageSrc={getImageSrc} onError={handleImageError} />

            {/* Description */}
            <div className="border-b border-stone-200 pb-6">
              <h3 className="text-xl md:text-2xl font-serif mb-4">About this residence</h3>
              <p className="text-stone-600 leading-relaxed text-sm md:text-base">{property.description}</p>
            </div>

            {/* Host Section */}
            <div className="border-b border-stone-200 pb-6">
              <h3 className="text-xl md:text-2xl font-serif mb-4">Meet your host</h3>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-stone-200 flex items-center justify-center overflow-hidden">
                  <User className="w-8 h-8 text-stone-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif text-lg">{hostInfo.name}</h4>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Superhost</span>
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{hostInfo.title}</p>
                  <div className="flex gap-4 mt-2 text-xs text-stone-500">
                    <span>Joined {hostInfo.joined}</span>
                    <span>⭐ {hostInfo.responseRate}% response rate</span>
                    <span>⚡ {hostInfo.responseTime}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-stone-600 mt-4 leading-relaxed">{hostInfo.about}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {hostInfo.languages.map(lang => (
                  <span key={lang} className="text-xs bg-stone-100 px-3 py-1 rounded-full text-stone-600">{lang}</span>
                ))}
              </div>
            </div>

            {/* Message Host Section */}
            <div className="border-b border-stone-200 pb-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-stone-500 mt-1" />
                <div>
                  <h3 className="font-serif text-lg mb-1">Still have questions?</h3>
                  <p className="text-sm text-stone-600 mb-3">Message {hostInfo.name} directly and get answers within {hostInfo.responseTime}</p>
                  <button
                    onClick={() => setShowMessageModal(true)}
                    className="px-4 py-2 border border-stone-300 rounded-lg text-sm hover:border-stone-900 transition-colors"
                  >
                    Message Host
                  </button>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="border-b border-stone-200 pb-6">
                <h3 className="text-xl md:text-2xl font-serif mb-4">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {property.amenities.slice(0, showAllAmenities ? undefined : 6).map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-stone-900/5 flex items-center justify-center flex-shrink-0"><Check className="w-2 h-2 text-stone-900" /></div>
                      <span className="text-xs md:text-sm">{a.name}</span>
                    </div>
                  ))}
                </div>
                {property.amenities.length > 6 && (
                  <button onClick={() => setShowAllAmenities(s => !s)} className="mt-4 text-xs uppercase tracking-widest border-b border-stone-900 pb-1 hover:text-stone-600">
                    {showAllAmenities ? 'Show Less' : `View All (${property.amenities.length})`}
                  </button>
                )}
              </div>
            )}

            {/* Things to Know */}
            <div className="border-b border-stone-200 pb-6">
              <h3 className="text-xl md:text-2xl font-serif mb-4">Things to know</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Home className="w-4 h-4" /> House Rules</h4>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {thingsToKnow.houseRules.map((rule, i) => (
                      <li key={i}>• {rule}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2"><Shield className="w-4 h-4" /> Health & Safety</h4>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {thingsToKnow.healthSafety.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-stone-100">
                <h4 className="font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" /> Cancellation Policy</h4>
                <p className="text-sm text-stone-600">{thingsToKnow.cancellationPolicy}</p>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h3 className="text-xl md:text-2xl font-serif mb-4">Frequently asked questions</h3>
              <div>
                {faqs.map((faq, index) => (
                  <FAQ
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaqIndex === index}
                    onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Booking form (shows after content on mobile) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="sticky top-20 md:top-24">
              <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-stone-200 flex justify-between items-center">
                  <div><span className="text-xl md:text-2xl font-serif">Ksh {property.price.toLocaleString()}</span><span className="text-stone-400 text-xs"> / night</span></div>
                  <div className="flex items-center gap-1 text-sm"><span className="text-amber-500">★</span><span className="font-medium">{property.rating}</span></div>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                  <AnimatePresence>
                    {showAvailabilityWarning && !isAvailable && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /><p className="text-red-700 text-xs">{availabilityMessage}</p></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <div><label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-in</label><input type="date" value={checkInDate} min={new Date().toISOString().split('T')[0]} onChange={e => setCheckInDate(e.target.value)} className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 focus:border-stone-900 outline-none transition-colors" /></div>
                    <div><label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Check-out</label><input type="date" value={checkOutDate} min={checkInDate} onChange={e => setCheckOutDate(e.target.value)} className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 focus:border-stone-900 outline-none transition-colors" /></div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Guests</label>
                    <button onClick={() => setShowGuestSelector(s => !s)} className="w-full p-2 md:p-3 bg-stone-50 rounded-lg text-xs md:text-sm border border-stone-200 flex justify-between items-center">
                      <span>{guests.adults + guests.children} Guest{guests.adults + guests.children !== 1 ? 's' : ''}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showGuestSelector ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {showGuestSelector && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-lg shadow-xl z-20 mt-1 p-3 md:p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div><span className="text-xs md:text-sm">Adults</span><p className="text-[10px] text-stone-400">Age 13+</p></div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setGuests(g => ({ ...g, adults: Math.max(1, g.adults - 1) }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">−</button>
                              <span className="text-xs w-5 text-center">{guests.adults}</span>
                              <button onClick={() => setGuests(g => ({ ...g, adults: g.adults + 1 }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">+</button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mb-3">
                            <div><span className="text-xs md:text-sm">Children</span><p className="text-[10px] text-stone-400">Ages 2-12</p></div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setGuests(g => ({ ...g, children: Math.max(0, g.children - 1) }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">−</button>
                              <span className="text-xs w-5 text-center">{guests.children}</span>
                              <button onClick={() => setGuests(g => ({ ...g, children: g.children + 1 }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">+</button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div><span className="text-xs md:text-sm">Infants</span><p className="text-[10px] text-stone-400">Under 2 years</p></div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setGuests(g => ({ ...g, infants: Math.max(0, g.infants - 1) }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">−</button>
                              <span className="text-xs w-5 text-center">{guests.infants}</span>
                              <button onClick={() => setGuests(g => ({ ...g, infants: g.infants + 1 }))} className="w-7 h-7 rounded-full border border-stone-200 flex items-center justify-center hover:border-stone-900 transition-colors">+</button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {totals.nights > 0 && (
                    <div className="space-y-2 pt-2 text-xs md:text-sm">
                      <div className="flex justify-between"><span className="text-stone-600">Ksh {property.price} × {totals.nights} nights</span><span>Ksh {totals.basePrice.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-stone-600">Cleaning fee</span><span>Ksh {totals.cleaningFee.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-stone-600">Service fee</span><span>Ksh {Math.round(totals.serviceFee).toLocaleString()}</span></div>
                      <div className="flex justify-between pt-2 border-t border-stone-200 font-bold"><span>Total</span><span>Ksh {Math.round(totals.total).toLocaleString()}</span></div>
                    </div>
                  )}

                  <button onClick={handleCreateBooking} disabled={creatingBooking || !isAvailable || !checkInDate || !checkOutDate}
                    className="w-full mt-4 py-3 md:py-4 bg-stone-900 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-stone-800 transition-all disabled:bg-stone-300 disabled:cursor-not-allowed">
                    {creatingBooking ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</span> : 'Book Now'}
                  </button>

                  {!isAuthenticated && <p className="text-[10px] text-amber-600 text-center mt-2">You'll be redirected to login to complete your booking</p>}

                  <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 pt-2">
                    <Shield className="w-3 h-3" /><span>Secure transaction · 15-minute hold</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Host Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <HostMessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            hostName={hostInfo.name}
            propertyName={property.title}
            onSendMessage={handleSendMessage}
          />
        )}
      </AnimatePresence>

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  );
}