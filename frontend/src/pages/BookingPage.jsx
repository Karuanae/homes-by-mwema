// BookingPage.jsx — Rebuilt with premium design
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL, IMAGE_BASE_URL } from '../services/api';
import {
  MapPin, ChevronLeft, ChevronRight, Check, AlertCircle,
  Shield, ArrowLeft, ChevronDown, MessageCircle, User, Calendar,
  Star, Heart, Share2, X, Grid3X3, ZoomIn, Wifi, Coffee,
  Home, Phone, Mail, Flag, ChevronUp, Camera
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normaliseImages(raw = []) {
  return raw.map((img, i) => {
    if (typeof img === 'string') return { id: null, url: img, is_cover: i === 0, category: null };
    return { id: img.id ?? null, url: img.url ?? img, is_cover: img.is_cover ?? false, category: img.category ?? null };
  });
}

// ─── Photo Tour — Airbnb-style full-page scrollable layout ───────────────────
//
//  Layout:
//    • White full-screen page (not a dark modal)
//    • Sticky top bar:  ← Back  |  title  |  Share  Save
//    • Sticky left sidebar: category nav pills that highlight on scroll
//    • Right scrollable column: category sections, each with a heading and
//      a responsive masonry-ish grid of images
//    • Clicking any image opens a lightbox (arrow nav + close + counter)
//

function PhotoTourLightbox({ images, startIndex, getImageSrc, onError, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const total = images.length;
  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [total]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'rgba(0,0,0,0.96)' }}
    >
      {/* Lightbox top bar */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button onClick={onClose}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          style={{ fontFamily: 'system-ui', fontSize: 13 }}>
          <X className="w-4 h-4" /> Close
        </button>
        <span className="text-white/40 text-sm" style={{ fontFamily: 'system-ui' }}>
          {idx + 1} / {total}
        </span>
        <div className="w-16" />
      </div>

      {/* Image */}
      <div className="flex-1 relative flex items-center justify-center px-14 min-h-0">
        <AnimatePresence mode="wait">
          <motion.img
            key={idx}
            src={getImageSrc(images[idx]?.url)}
            alt={`Photo ${idx + 1}`}
            onError={onError}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="max-h-full max-w-full object-contain"
            style={{ borderRadius: 8, userSelect: 'none' }}
          />
        </AnimatePresence>

        {/* Prev / Next */}
        {total > 1 && <>
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <ChevronLeft className="w-5 h-5 text-stone-900" />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
            <ChevronRight className="w-5 h-5 text-stone-900" />
          </button>
        </>}
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {images.map((img, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all"
            style={{ opacity: i === idx ? 1 : 0.38, outline: i === idx ? '2px solid #fff' : 'none', outlineOffset: 2 }}>
            <img src={getImageSrc(img.url)} alt="" className="w-full h-full object-cover" onError={onError} />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function PhotoTour({ images, categories, getImageSrc, onError, onClose, initialIndex = 0, propertyTitle = '' }) {
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [activeSlug, setActiveSlug] = useState('all');
  const [lightbox, setLightbox] = useState(null); // { images, startIndex }

  const usedSlugs = new Set(images.map(img => img.category).filter(Boolean));

  // Build sections: "all" first, then each category
  const allSection = { slug: 'all', name: 'All photos', images };
  const catSections = categories
    .filter(c => usedSlugs.has(c.slug))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(c => ({
      slug: c.slug,
      name: c.name,
      images: images.filter(img => img.category === c.slug),
    }));

  // If we have categories, skip the "All" section and show per-category
  const sections = catSections.length > 0 ? catSections : [allSection];

  // Sidebar nav tabs
  const navTabs = sections.map(s => ({ slug: s.slug, name: s.name, count: s.images.length }));

  // Lock body scroll while tour is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Scroll-spy: which section is most in view?
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handler = () => {
      let best = sections[0].slug;
      let bestTop = Infinity;
      sections.forEach(s => {
        const el = sectionRefs.current[s.slug];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const distFromTop = Math.abs(rect.top - 120);
        if (distFromTop < bestTop) { bestTop = distFromTop; best = s.slug; }
      });
      setActiveSlug(best);
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [sections.length]);

  // Jump to section when sidebar tab is clicked
  const scrollToSection = (slug) => {
    const el = sectionRefs.current[slug];
    if (!el && scrollRef.current) { scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (el) {
      const offset = el.offsetTop - 80;
      scrollRef.current?.scrollTo({ top: offset, behavior: 'smooth' });
    }
  };

  // Scroll to initial image on mount
  useEffect(() => {
    if (initialIndex === 0 || !scrollRef.current) return;
    // find which section + index it lands in
    let count = 0;
    for (const s of sections) {
      if (count + s.images.length > initialIndex) {
        const targetSlug = s.slug;
        setTimeout(() => scrollToSection(targetSlug), 100);
        break;
      }
      count += s.images.length;
    }
  }, []);

  // Build flat image list for lightbox navigation across all shown sections
  const flatImages = sections.flatMap(s => s.images);

  const openLightbox = (sectionImages, localIdx) => {
    // Map local index to flat index for cross-section nav
    setLightbox({ images: flatImages, startIndex: flatImages.indexOf(sectionImages[localIdx]) });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-white"
      style={{ fontFamily: 'system-ui' }}
    >
      {/* ── Sticky top bar (like Airbnb) ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-stone-200 bg-white z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 font-medium text-stone-900 hover:text-stone-600 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:block">{propertyTitle || 'Back to listing'}</span>
        </button>
        <div className="flex-1" />
        <span className="text-stone-400 text-sm hidden sm:block">{images.length} photos</span>
      </div>

      {/* ── Body: sidebar + scrollable content ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left sidebar — sticky category nav */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-stone-100 py-8 px-5 gap-1 overflow-y-auto"
          style={{ scrollbarWidth: 'none' }}>
          <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold mb-3 px-1">Photo tour</p>
          {navTabs.map(tab => (
            <button
              key={tab.slug}
              onClick={() => scrollToSection(tab.slug)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all group"
              style={{
                background: activeSlug === tab.slug ? '#f5f5f4' : 'transparent',
                fontWeight: activeSlug === tab.slug ? 600 : 400,
                color: activeSlug === tab.slug ? '#1c1917' : '#78716c',
              }}
            >
              <span className="truncate">{tab.name}</span>
              <span className="text-xs text-stone-400 ml-2 flex-shrink-0">{tab.count}</span>
            </button>
          ))}
        </aside>

        {/* Right scrollable photo area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div className="max-w-4xl mx-auto px-4 md:px-10 py-8 space-y-14">
            {sections.map(section => (
              <div key={section.slug} ref={el => sectionRefs.current[section.slug] = el}>
                {/* Section heading */}
                <h2 className="text-xl font-semibold text-stone-900 mb-5">{section.name}
                  <span className="text-sm font-normal text-stone-400 ml-2">{section.images.length} photos</span>
                </h2>

                {/* Photo grid — alternating layouts like Airbnb */}
                <PhotoGrid
                  images={section.images}
                  getImageSrc={getImageSrc}
                  onError={onError}
                  onClickImage={(localIdx) => openLightbox(section.images, localIdx)}
                />
              </div>
            ))}
            <div className="h-16" />
          </div>
        </div>
      </div>

      {/* Mobile category strip */}
      <div className="md:hidden flex gap-2 px-4 py-3 overflow-x-auto border-t border-stone-100 bg-white flex-shrink-0"
        style={{ scrollbarWidth: 'none' }}>
        {navTabs.map(tab => (
          <button key={tab.slug} onClick={() => scrollToSection(tab.slug)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
            style={{
              background: activeSlug === tab.slug ? '#1c1917' : '#f5f5f4',
              color: activeSlug === tab.slug ? '#fff' : '#57534e',
            }}>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <PhotoTourLightbox
            images={lightbox.images}
            startIndex={lightbox.startIndex}
            getImageSrc={getImageSrc}
            onError={onError}
            onClose={() => setLightbox(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PhotoGrid — Airbnb-style alternating layouts ─────────────────────────────
//   1 image  → full-width
//   2 images → 50/50 side by side
//   3 images → 1 large left + 2 stacked right
//   4 images → 2×2 grid
//   5+       → first image full-width, rest in 2-col rows
//
function PhotoGrid({ images, getImageSrc, onError, onClickImage }) {
  if (!images.length) return null;

  const n = images.length;

  // Helper: render a single image cell
  const Cell = ({ img, idx, className = '', style = {} }) => (
    <div
      className={`relative overflow-hidden rounded-xl bg-stone-100 cursor-zoom-in group ${className}`}
      style={style}
      onClick={() => onClickImage(idx)}
    >
      <img
        src={getImageSrc(img.url)}
        alt={`Photo ${idx + 1}`}
        onError={onError}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/08 transition-colors duration-300" />
    </div>
  );

  if (n === 1) {
    return <Cell img={images[0]} idx={0} style={{ height: 420 }} />;
  }

  if (n === 2) {
    return (
      <div className="grid grid-cols-2 gap-2" style={{ height: 340 }}>
        <Cell img={images[0]} idx={0} />
        <Cell img={images[1]} idx={1} />
      </div>
    );
  }

  if (n === 3) {
    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px', height: 408 }}>
        <Cell img={images[0]} idx={0} style={{ gridRow: '1 / 3', height: '100%' }} />
        <Cell img={images[1]} idx={1} />
        <Cell img={images[2]} idx={2} />
      </div>
    );
  }

  if (n === 4) {
    return (
      <div className="grid grid-cols-2 gap-2" style={{ height: 420 }}>
        {images.map((img, i) => <Cell key={i} img={img} idx={i} />)}
      </div>
    );
  }

  // 5+ images: chunk into rows of varying layout
  // Row 0: 1 wide image
  // Row 1: 2 images
  // Row 2+: 2 or 3 images, alternating
  const rows = [];
  let i = 0;
  let rowNum = 0;
  while (i < images.length) {
    if (rowNum === 0) { rows.push({ type: '1', items: images.slice(i, i + 1) }); i += 1; }
    else if (rowNum === 1) { rows.push({ type: '2', items: images.slice(i, i + 2) }); i += 2; }
    else {
      const remaining = images.length - i;
      if (remaining >= 3) { rows.push({ type: '3', items: images.slice(i, i + 3) }); i += 3; }
      else if (remaining === 2) { rows.push({ type: '2', items: images.slice(i, i + 2) }); i += 2; }
      else { rows.push({ type: '1', items: images.slice(i, i + 1) }); i += 1; }
    }
    rowNum++;
  }

  // Map back to flat indices
  let flatIdx = 0;
  const indexedRows = rows.map(row => {
    const items = row.items.map(img => ({ img, idx: flatIdx++ }));
    return { type: row.type, items };
  });

  return (
    <div className="space-y-2">
      {indexedRows.map((row, ri) => {
        if (row.type === '1') {
          return (
            <div key={ri} style={{ height: 380 }}>
              <Cell img={row.items[0].img} idx={row.items[0].idx} style={{ height: '100%', borderRadius: 12 }} />
            </div>
          );
        }
        if (row.type === '2') {
          return (
            <div key={ri} className="grid grid-cols-2 gap-2" style={{ height: 270 }}>
              {row.items.map(({ img, idx }) => <Cell key={idx} img={img} idx={idx} />)}
            </div>
          );
        }
        // type === '3'
        return (
          <div key={ri} className="grid grid-cols-3 gap-2" style={{ height: 220 }}>
            {row.items.map(({ img, idx }) => <Cell key={idx} img={img} idx={idx} />)}
          </div>
        );
      })}
    </div>
  );
}

// ─── Hero Gallery (compact strip on page) ────────────────────────────────────
function HeroGallery({ images, getImageSrc, onError, onOpenTour }) {
  const cover = images.find(i => i.is_cover) || images[0];
  const others = images.filter(i => i !== cover).slice(0, 4);

  if (!cover) return null;

  return (
    <div className="relative">
      <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-[420px] md:h-[520px] rounded-2xl overflow-hidden">
        {/* Cover - large */}
        <div className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden" onClick={() => onOpenTour(0)}>
          <img src={getImageSrc(cover.url)} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={onError} />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
        </div>
        {/* Others */}
        {[0,1,2,3].map(i => (
          <div key={i} className="relative group cursor-pointer overflow-hidden" onClick={() => onOpenTour(i + 1)}>
            {others[i] ? (
              <>
                <img src={getImageSrc(others[i].url)} alt={`Photo ${i+2}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={onError} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              </>
            ) : (
              <div className="w-full h-full bg-stone-200" />
            )}
          </div>
        ))}
      </div>

      {/* View All Photos button */}
      <button
        onClick={() => onOpenTour(0)}
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-white text-stone-900 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
        style={{ fontFamily: 'system-ui', letterSpacing: '0.05em' }}
      >
        <Grid3X3 className="w-3.5 h-3.5" />
        View all {images.length} photos
      </button>
    </div>
  );
}

// ─── Star Rating Display ──────────────────────────────────────────────────────
function StarRating({ rating, count = 0 }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? '#d97706' : 'none'} stroke={s <= Math.round(rating) ? '#d97706' : '#d1d5db'} />
      ))}
      <span className="font-semibold text-stone-900 text-sm ml-1">{rating.toFixed(1)}</span>
      {count > 0 && <span className="text-stone-400 text-sm">({count} reviews)</span>}
    </div>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────
const SAMPLE_REVIEWS = [
  { id: 1, name: 'Amara K.', avatar: 'AK', date: 'March 2025', rating: 5, text: 'Absolutely stunning property. The attention to detail in the interior design is second to none. Ann was incredibly responsive and the space was exactly as advertised — probably even better in person.', location: 'Lagos, Nigeria' },
  { id: 2, name: 'David O.', avatar: 'DO', date: 'February 2025', rating: 5, text: 'One of the best short-stay experiences I\'ve had in Nairobi. The neighborhood is quiet, the unit is spotless, and the morning light through those windows is gorgeous. Will be back.', location: 'London, UK' },
  { id: 3, name: 'Priya M.', avatar: 'PM', date: 'January 2025', rating: 4, text: 'Beautiful space with great amenities. WiFi was fast, the kitchen had everything we needed, and the host responded quickly to our questions. Only minor note: parking can be a little tight.', location: 'Nairobi, Kenya' },
  { id: 4, name: 'James T.', avatar: 'JT', date: 'December 2024', rating: 5, text: 'Hosted a small work trip here and it was perfect for focused work and relaxing evenings. The curated details — the coffee setup, the linens — show real care and effort.', location: 'Cape Town, SA' },
];

const RATING_BREAKDOWN = [
  { label: 'Cleanliness', score: 4.9 },
  { label: 'Accuracy', score: 4.8 },
  { label: 'Check-in', score: 5.0 },
  { label: 'Communication', score: 5.0 },
  { label: 'Location', score: 4.7 },
  { label: 'Value', score: 4.6 },
];

function ReviewCard({ review }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-5 rounded-2xl border border-stone-100 bg-white space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ fontFamily: 'system-ui' }}>
          {review.avatar}
        </div>
        <div>
          <div className="font-semibold text-stone-900 text-sm" style={{ fontFamily: 'system-ui' }}>{review.name}</div>
          <div className="text-xs text-stone-400" style={{ fontFamily: 'system-ui' }}>{review.location} · {review.date}</div>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {Array.from({length: review.rating}).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 stroke-amber-400" />)}
        </div>
      </div>
      <p className="text-sm text-stone-600 leading-relaxed">{review.text}</p>
    </motion.div>
  );
}

// ─── Map Placeholder ──────────────────────────────────────────────────────────
function MapPlaceholder({ location }) {
  return (
    <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden border border-stone-200">
      {/* Stylised static map look */}
      <div className="absolute inset-0 bg-[#e8e0d8]">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#a09080" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Fake roads */}
          <line x1="0" y1="30%" x2="100%" y2="35%" stroke="#c8b8a8" strokeWidth="8" />
          <line x1="0" y1="60%" x2="100%" y2="58%" stroke="#c8b8a8" strokeWidth="12" />
          <line x1="40%" y1="0" x2="38%" y2="100%" stroke="#c8b8a8" strokeWidth="8" />
          <line x1="70%" y1="0" x2="72%" y2="100%" stroke="#c8b8a8" strokeWidth="6" />
          {/* Fake blocks */}
          <rect x="10%" y="10%" width="25%" height="15%" rx="2" fill="#d4c8b8" opacity="0.6" />
          <rect x="45%" y="5%" width="20%" height="20%" rx="2" fill="#d4c8b8" opacity="0.6" />
          <rect x="10%" y="42%" width="22%" height="12%" rx="2" fill="#d4c8b8" opacity="0.6" />
          <rect x="45%" y="65%" width="25%" height="18%" rx="2" fill="#d4c8b8" opacity="0.6" />
          <rect x="75%" y="40%" width="15%" height="25%" rx="2" fill="#d4c8b8" opacity="0.6" />
        </svg>
      </div>

      {/* Pin */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center shadow-2xl">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45" />
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 animate-ping opacity-60" />
        </div>
      </div>

      {/* Location label */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-white rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-medium text-stone-900" style={{ fontFamily: 'system-ui' }}>{location}</span>
        </div>
        <button className="bg-stone-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg flex items-center gap-1.5 hover:bg-stone-700 transition-colors"
          style={{ fontFamily: 'system-ui' }}>
          Open map
        </button>
      </div>

      {/* "Coming soon" overlay */}
      <div className="absolute top-3 right-3 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-1 rounded-full uppercase tracking-wide"
        style={{ fontFamily: 'system-ui' }}>
        Interactive map coming soon
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-stone-100 last:border-0">
      <button onClick={onToggle} className="w-full flex justify-between items-center py-4 text-left gap-4">
        <span className="font-medium text-stone-800 text-sm">{question}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="pb-4 text-sm text-stone-500 leading-relaxed">{answer}</p>
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
    try { await onSendMessage(message); setMessage(''); onClose(); }
    catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={onClose}>
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-stone-900">Message {hostName}</h3>
                <p className="text-xs text-stone-400 mt-0.5">{propertyName}</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-stone-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Hi, I have a question about..." rows={4}
              className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-900 resize-none transition-colors" />
            <div className="flex gap-3 mt-4">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm hover:bg-stone-50 transition-colors">Cancel</button>
              <button onClick={handleSend} disabled={sending || !message.trim()} className="flex-1 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors">
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Wishlist / Share Toast ───────────────────────────────────────────────────
function Toast({ message, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-full text-sm shadow-xl"
          style={{ fontFamily: 'system-ui' }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Booking Sidebar ──────────────────────────────────────────────────────────
function BookingSidebar({ property, checkInDate, setCheckInDate, checkOutDate, setCheckOutDate, guests, setGuests, totals, isAvailable, availabilityMessage, showAvailabilityWarning, creatingBooking, isAuthenticated, onBook }) {
  const [showGuests, setShowGuests] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-stone-100 flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-stone-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Ksh {property.price.toLocaleString()}
          </span>
          <span className="text-stone-400 text-sm ml-1">/ night</span>
        </div>
        <StarRating rating={property.rating} />
      </div>

      <div className="p-5 space-y-3">
        {/* Availability warning */}
        <AnimatePresence>
          {showAvailabilityWarning && !isAvailable && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-xs">{availabilityMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dates */}
        <div className="rounded-xl border border-stone-200 overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="p-3 border-r border-stone-200">
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1" style={{ fontFamily: 'system-ui' }}>Check-in</label>
              <input type="date" value={checkInDate} min={new Date().toISOString().split('T')[0]}
                onChange={e => setCheckInDate(e.target.value)}
                className="w-full text-xs text-stone-900 bg-transparent focus:outline-none" />
            </div>
            <div className="p-3">
              <label className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block mb-1" style={{ fontFamily: 'system-ui' }}>Check-out</label>
              <input type="date" value={checkOutDate} min={checkInDate}
                onChange={e => setCheckOutDate(e.target.value)}
                className="w-full text-xs text-stone-900 bg-transparent focus:outline-none" />
            </div>
          </div>
          <div className="border-t border-stone-200 relative">
            <button onClick={() => setShowGuests(s => !s)} className="w-full p-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400 block" style={{ fontFamily: 'system-ui' }}>Guests</span>
                <span className="text-xs text-stone-900">{guests.adults + guests.children} guest{guests.adults + guests.children !== 1 ? 's' : ''}{guests.infants ? `, ${guests.infants} infant${guests.infants > 1 ? 's' : ''}` : ''}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showGuests ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showGuests && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-xl z-20 p-4 space-y-4"
                  style={{ marginTop: 4 }}>
                  {[
                    { key: 'adults', label: 'Adults', sub: 'Age 13+', min: 1 },
                    { key: 'children', label: 'Children', sub: 'Ages 2–12', min: 0 },
                    { key: 'infants', label: 'Infants', sub: 'Under 2', min: 0 },
                  ].map(({ key, label, sub, min }) => (
                    <div key={key} className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-stone-900" style={{ fontFamily: 'system-ui' }}>{label}</div>
                        <div className="text-xs text-stone-400">{sub}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setGuests(g => ({ ...g, [key]: Math.max(min, g[key] - 1) }))}
                          className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-colors text-sm">−</button>
                        <span className="w-4 text-center text-sm">{guests[key]}</span>
                        <button onClick={() => setGuests(g => ({ ...g, [key]: g[key] + 1 }))}
                          className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-900 transition-colors text-sm">+</button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setShowGuests(false)} className="w-full text-xs underline text-stone-900 pt-1 text-center" style={{ fontFamily: 'system-ui' }}>Done</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Price breakdown */}
        {totals.nights > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-1 text-sm" style={{ fontFamily: 'system-ui' }}>
            <div className="flex justify-between text-stone-500">
              <span>Ksh {property.price.toLocaleString()} × {totals.nights} night{totals.nights > 1 ? 's' : ''}</span>
              <span className="text-stone-900">Ksh {totals.basePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Cleaning fee</span>
              <span className="text-stone-900">Ksh {totals.cleaningFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Service fee</span>
              <span className="text-stone-900">Ksh {Math.round(totals.serviceFee).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-3 border-t border-stone-100 text-stone-900">
              <span>Total</span>
              <span>Ksh {Math.round(totals.total).toLocaleString()}</span>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <button
          onClick={onBook}
          disabled={creatingBooking || !isAvailable || !checkInDate || !checkOutDate}
          className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
          style={{
            fontFamily: 'system-ui',
            background: creatingBooking || !isAvailable ? '#d6d3d1' : 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)',
            color: '#fff',
            cursor: creatingBooking || !isAvailable ? 'not-allowed' : 'pointer',
          }}
        >
          {creatingBooking
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</span>
            : 'Reserve Now'}
        </button>

        {!isAuthenticated && (
          <p className="text-[11px] text-amber-600 text-center" style={{ fontFamily: 'system-ui' }}>
            You'll be asked to sign in to complete your booking
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 pt-1" style={{ fontFamily: 'system-ui' }}>
          <Shield className="w-3 h-3" />
          <span>Secure · 15-min hold · No charge yet</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main BookingPage ─────────────────────────────────────────────────────────
export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [property, setProperty] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTour, setShowTour] = useState(false);
  const [tourStartIdx, setTourStartIdx] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [showAvailabilityWarning, setShowAvailabilityWarning] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showMobileBooking, setShowMobileBooking] = useState(false);

  const mobileBookingRef = useRef(null);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const hostInfo = {
    name: 'Ann Mwema', title: 'Superhost & Interior Design Enthusiast', joined: '2020',
    responseTime: 'Within an hour', responseRate: 100,
    about: "Hello! I'm Ann Mwema, an interior design enthusiast and proud host with Homes by Mwema. I've carefully curated each space to blend modern comfort with timeless elegance. As a Nairobi local, I love sharing the beauty of our city with guests from around the world.",
    languages: ['English', 'Swahili'],
  };

  const faqs = [
    { question: 'What time is check-in and check-out?', answer: 'Check-in is from 3:00 PM onwards, and check-out is by 11:00 AM. Early check-in or late check-out may be available upon request.' },
    { question: 'Is parking available?', answer: 'Yes, free secure parking is available on the premises with a dedicated spot for guests.' },
    { question: 'Can I host events or parties?', answer: 'This property is not suitable for parties or events. We aim to maintain a peaceful environment for all guests and neighbors.' },
    { question: 'What amenities are provided?', answer: 'High-speed WiFi, fresh linens and towels, toiletries, a fully equipped kitchen, smart TV, and complimentary coffee/tea.' },
    { question: 'What is the cancellation policy?', answer: 'Free cancellation up to 30 days before check-in. 50% refund for cancellations 14–29 days out. Non-refundable within 14 days.' },
  ];

  const thingsToKnow = {
    houseRules: ['Check-in after 3:00 PM', 'Check-out before 11:00 AM', 'No parties or events', 'No smoking inside', 'Quiet hours after 10:00 PM'],
    healthSafety: ['Carbon monoxide alarm', 'Smoke alarm', 'First aid kit available', 'Fire extinguisher on premises'],
    cancellationPolicy: 'Free cancellation for 48 hours. After that, cancel up to 30 days before check-in for a full refund.',
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const [propRes, catRes] = await Promise.allSettled([api.properties.getById(id), api.properties.getCategories(id)]);
        if (propRes.status === 'rejected') throw new Error('Failed to load property');
        const d = propRes.value.data;
        setProperty({
          ...d,
          title: d.title || d.name || 'Untitled Residence',
          location: d.location || 'Nairobi, Kenya',
          description: d.description || 'A luxurious residence curated for exceptional living.',
          price: d.price || 5000, rating: d.rating || 4.9,
          specs: { guests: d.max_guests || 2, bedrooms: d.rooms || 1, bathrooms: d.bathrooms || 1, ...d.specs },
          host: d.host || hostInfo,
          amenities: Array.isArray(d.amenities) ? d.amenities.map(a => typeof a === 'string' ? { name: a } : a) : [],
          images: normaliseImages(d.images || []),
        });
        setCategories(catRes.status === 'fulfilled' ? catRes.value.data || [] : []);
        const tom = new Date(); tom.setDate(tom.getDate() + 1);
        const co = new Date(tom); co.setDate(co.getDate() + 3);
        setCheckInDate(tom.toISOString().split('T')[0]);
        setCheckOutDate(co.toISOString().split('T')[0]);
      } catch (e) {
        setError('Unable to load residence details. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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
        if (res.status === 401) { localStorage.removeItem('token'); navigate('/login', { state: { from: `/payment/${id}` } }); return; }
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard');
      }
    } catch { showToast('Link copied to clipboard'); }
  };

  const handleWishlist = () => {
    setIsWishlisted(w => !w);
    showToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist ♡');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-stone-400 text-sm uppercase tracking-widest" style={{ fontFamily: 'system-ui' }}>Loading…</p>
      </div>
    </div>
  );

  if (error || !property) return (
    <div className="min-h-screen bg-[#f7f5f2] flex items-center justify-center p-4">
      <div className="text-center"><AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" /><p className="text-stone-600 mb-6">{error || 'Property not found'}</p><button onClick={() => navigate('/')} className="text-sm underline">Return Home</button></div>
    </div>
  );

  const reviewsToShow = showAllReviews ? SAMPLE_REVIEWS : SAMPLE_REVIEWS.slice(0, 2);

  return (
    <div style={{ background: '#f7f5f2', minHeight: '100vh', fontFamily: "'Cormorant Garamond', serif" }}>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet" />

      {/* Photo Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <PhotoTour
            images={property.images}
            categories={categories}
            getImageSrc={getImageSrc}
            onError={handleImageError}
            onClose={() => setShowTour(false)}
            initialIndex={tourStartIdx}
            propertyTitle={property.title}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast message={toast.message} isVisible={toast.visible} />

      {/* Host Message Modal */}
      <HostMessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        hostName={hostInfo.name}
        propertyName={property.title}
        onSendMessage={async (msg) => { console.log('Message:', msg); showToast('Message sent!'); }}
      />

      {/* Mobile booking sheet */}
      <AnimatePresence>
        {showMobileBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowMobileBooking(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="bg-white rounded-t-3xl overflow-y-auto max-h-[90vh]"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-stone-100">
                <span className="font-semibold text-stone-900">Book this property</span>
                <button onClick={() => setShowMobileBooking(false)}><X className="w-5 h-5 text-stone-500" /></button>
              </div>
              <div className="p-5">
                <BookingSidebar
                  property={property} checkInDate={checkInDate} setCheckInDate={setCheckInDate}
                  checkOutDate={checkOutDate} setCheckOutDate={setCheckOutDate}
                  guests={guests} setGuests={setGuests} totals={totals}
                  isAvailable={isAvailable} availabilityMessage={availabilityMessage}
                  showAvailabilityWarning={showAvailabilityWarning}
                  creatingBooking={creatingBooking} isAuthenticated={isAuthenticated}
                  onBook={handleCreateBooking}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(247,245,242,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm hidden sm:block" style={{ fontFamily: 'system-ui', letterSpacing: '0.05em' }}>Back</span>
        </button>
        <h1 className="text-base md:text-lg font-medium text-stone-900 truncate max-w-[200px] md:max-w-[400px]">{property.title}</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-stone-700 hover:bg-white transition-all border border-transparent hover:border-stone-200 hover:shadow-sm"
            style={{ fontFamily: 'system-ui' }}>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:block">Share</span>
          </button>
          <button onClick={handleWishlist}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all border border-transparent hover:border-stone-200 hover:shadow-sm"
            style={{ fontFamily: 'system-ui', color: isWishlisted ? '#e11d48' : '#57534e', background: isWishlisted ? '#fff1f2' : 'transparent' }}>
            <Heart className={`w-4 h-4 transition-all ${isWishlisted ? 'fill-rose-500 stroke-rose-500 scale-110' : ''}`} />
            <span className="hidden sm:block">{isWishlisted ? 'Saved' : 'Save'}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-36 lg:pb-24">
        {/* Property Title Block */}
        <div className="mb-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl lg:text-6xl text-stone-900 leading-tight mb-3">
            {property.title}
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <StarRating rating={property.rating} count={SAMPLE_REVIEWS.length} />
            <span className="text-stone-300 hidden sm:block">·</span>
            <div className="flex items-center gap-1.5 text-sm text-stone-600" style={{ fontFamily: 'system-ui' }}>
              <MapPin className="w-3.5 h-3.5" />
              <span>{property.location}</span>
            </div>
            <span className="text-stone-300 hidden sm:block">·</span>
            <span className="text-sm text-stone-500" style={{ fontFamily: 'system-ui' }}>
              {property.specs.guests} guests · {property.specs.bedrooms} bed{property.specs.bedrooms > 1 ? 's' : ''} · {property.specs.bathrooms} bath{property.specs.bathrooms > 1 ? 's' : ''}
            </span>
          </motion.div>
        </div>

        {/* Hero Gallery */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-10 md:mb-14">
          {property.images.length > 0 ? (
            <HeroGallery
              images={property.images}
              getImageSrc={getImageSrc}
              onError={handleImageError}
              onOpenTour={(idx) => { setTourStartIdx(idx); setShowTour(true); }}
            />
          ) : (
            <div className="h-96 rounded-2xl bg-stone-200 flex items-center justify-center">
              <Camera className="w-12 h-12 text-stone-400" />
            </div>
          )}
        </motion.div>

        {/* Content + Sidebar grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">

          {/* ── LEFT: Content ── */}
          <div className="lg:col-span-2 space-y-12">

            {/* Description */}
            <section>
              <h2 className="text-2xl md:text-3xl text-stone-900 mb-4">About this residence</h2>
              <p className="text-stone-600 leading-relaxed text-base md:text-lg" style={{ fontFamily: 'system-ui', fontWeight: 300, lineHeight: 1.8 }}>
                {property.description}
              </p>
            </section>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <section className="border-t border-stone-200 pt-10">
                <h2 className="text-2xl md:text-3xl text-stone-900 mb-6">What's included</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.slice(0, showAllAmenities ? undefined : 9).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-100 text-sm text-stone-700" style={{ fontFamily: 'system-ui' }}>
                      <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-stone-600" />
                      </div>
                      {a.name}
                    </div>
                  ))}
                </div>
                {property.amenities.length > 9 && (
                  <button onClick={() => setShowAllAmenities(s => !s)} className="mt-5 text-sm underline text-stone-900" style={{ fontFamily: 'system-ui' }}>
                    {showAllAmenities ? 'Show fewer amenities' : `Show all ${property.amenities.length} amenities`}
                  </button>
                )}
              </section>
            )}

            {/* Ratings & Reviews */}
            <section className="border-t border-stone-200 pt-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl text-stone-900">
                  <span className="text-amber-500">★</span> {property.rating} · {SAMPLE_REVIEWS.length} reviews
                </h2>
              </div>

              {/* Rating breakdown */}
              <div className="grid grid-cols-2 gap-x-10 gap-y-3 mb-8">
                {RATING_BREAKDOWN.map(({ label, score }) => (
                  <div key={label} className="flex items-center gap-3" style={{ fontFamily: 'system-ui' }}>
                    <span className="text-xs text-stone-500 w-28 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
                      <div className="h-full rounded-full bg-stone-900" style={{ width: `${(score / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-stone-900 w-6">{score}</span>
                  </div>
                ))}
              </div>

              {/* Review cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reviewsToShow.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>

              {SAMPLE_REVIEWS.length > 2 && (
                <button onClick={() => setShowAllReviews(s => !s)} className="mt-6 px-5 py-2.5 border border-stone-300 rounded-xl text-sm hover:border-stone-900 transition-colors" style={{ fontFamily: 'system-ui' }}>
                  {showAllReviews ? 'Show fewer reviews' : `Show all ${SAMPLE_REVIEWS.length} reviews`}
                </button>
              )}
            </section>

            {/* Map */}
            <section className="border-t border-stone-200 pt-10">
              <h2 className="text-2xl md:text-3xl text-stone-900 mb-2">Where you'll be</h2>
              <p className="text-sm text-stone-500 mb-5" style={{ fontFamily: 'system-ui' }}>{property.location}</p>
              <MapPlaceholder location={property.location} />
            </section>

            {/* Host */}
            <section className="border-t border-stone-200 pt-10">
              <h2 className="text-2xl md:text-3xl text-stone-900 mb-6">Meet your host</h2>
              <div className="bg-white rounded-2xl p-6 border border-stone-100">
                <div className="flex items-start gap-5 mb-4">
                  <div className="w-16 h-16 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 text-white text-xl font-light">
                    AM
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-xl text-stone-900">{hostInfo.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium" style={{ fontFamily: 'system-ui' }}>Superhost</span>
                    </div>
                    <p className="text-sm text-stone-500" style={{ fontFamily: 'system-ui' }}>{hostInfo.title}</p>
                    <div className="flex gap-4 mt-2 text-xs text-stone-400" style={{ fontFamily: 'system-ui' }}>
                      <span>Member since {hostInfo.joined}</span>
                      <span>·</span>
                      <span>{hostInfo.responseRate}% response rate</span>
                      <span>·</span>
                      <span>Replies {hostInfo.responseTime.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed mb-5" style={{ fontFamily: 'system-ui', lineHeight: 1.8 }}>{hostInfo.about}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {hostInfo.languages.map(l => (
                    <span key={l} className="text-xs px-3 py-1 bg-stone-100 rounded-full text-stone-600" style={{ fontFamily: 'system-ui' }}>{l}</span>
                  ))}
                </div>
                <button onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                  style={{ fontFamily: 'system-ui' }}>
                  <MessageCircle className="w-4 h-4" />
                  Message {hostInfo.name}
                </button>
              </div>
            </section>

            {/* Things to Know */}
            <section className="border-t border-stone-200 pt-10">
              <h2 className="text-2xl md:text-3xl text-stone-900 mb-6">Things to know</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'system-ui' }}><Home className="w-4 h-4" /> House Rules</h4>
                  <ul className="space-y-1.5">
                    {thingsToKnow.houseRules.map((r, i) => <li key={i} className="text-sm text-stone-500" style={{ fontFamily: 'system-ui' }}>• {r}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'system-ui' }}><Shield className="w-4 h-4" /> Health & Safety</h4>
                  <ul className="space-y-1.5">
                    {thingsToKnow.healthSafety.map((r, i) => <li key={i} className="text-sm text-stone-500" style={{ fontFamily: 'system-ui' }}>• {r}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-stone-800 mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'system-ui' }}><Calendar className="w-4 h-4" /> Cancellation</h4>
                  <p className="text-sm text-stone-500" style={{ fontFamily: 'system-ui' }}>{thingsToKnow.cancellationPolicy}</p>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-stone-200 pt-10">
              <h2 className="text-2xl md:text-3xl text-stone-900 mb-4">Frequently asked</h2>
              <div className="bg-white rounded-2xl border border-stone-100 px-5 divide-y divide-stone-100">
                {faqs.map((f, i) => (
                  <FAQ key={i} question={f.question} answer={f.answer} isOpen={openFaqIndex === i} onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} />
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT: Sticky Booking Sidebar (desktop) ── */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <BookingSidebar
                property={property} checkInDate={checkInDate} setCheckInDate={setCheckInDate}
                checkOutDate={checkOutDate} setCheckOutDate={setCheckOutDate}
                guests={guests} setGuests={setGuests} totals={totals}
                isAvailable={isAvailable} availabilityMessage={availabilityMessage}
                showAvailabilityWarning={showAvailabilityWarning}
                creatingBooking={creatingBooking} isAuthenticated={isAuthenticated}
                onBook={handleCreateBooking}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-between shadow-2xl">
        <div>
          <div className="text-lg font-semibold text-stone-900">
            Ksh {property.price.toLocaleString()}<span className="text-xs text-stone-400 font-normal"> / night</span>
          </div>
          {totals.nights > 0 && (
            <div className="text-xs text-stone-500" style={{ fontFamily: 'system-ui' }}>
              Ksh {Math.round(totals.total).toLocaleString()} total · {totals.nights} night{totals.nights > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowMobileBooking(true)}
          className="px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-white transition-all"
          style={{ fontFamily: 'system-ui', background: 'linear-gradient(135deg, #1c1917 0%, #44403c 100%)' }}
        >
          Reserve
        </button>
      </div>
    </div>
  );
}