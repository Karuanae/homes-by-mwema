// PropertyCard.jsx
// Shared card used by Home.jsx and Properties.jsx
// - Images load lazily (no blocking)
// - Shows a skeleton placeholder while the image fetches
// - Graceful fallback on error

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { Heart } from "lucide-react";
import { API_BASE_URL, userAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Derive the host from API_BASE_URL — strip the /api suffix
const API_HOST = API_BASE_URL
  ? API_BASE_URL.replace(/\/api\/?$/, "").replace(/\/$/, "")
  : "";

const getImageSrc = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_HOST}${path}`;
};

// ── Skeleton shown while the card image is fetching ──────────────────────────
export const PropertyCardSkeleton = () => (
  <div className="block animate-pulse">
    <div className="relative aspect-[3/4] overflow-hidden bg-stone-200 mb-4 rounded-sm" />
    <div className="p-3 space-y-2">
      <div className="h-5 bg-stone-200 rounded w-3/4" />
      <div className="h-3 bg-stone-100 rounded w-1/2" />
      <div className="h-4 bg-stone-100 rounded w-1/3 ml-auto mt-1" />
    </div>
  </div>
);

// ── The actual card ───────────────────────────────────────────────────────────
const PropertyCard = ({ property, idx = 0 }) => {
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [imgError, setImgError]     = useState(false);
  const [isSaved, setIsSaved]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const src = getImageSrc(property.cover_image || property.images?.[0]);

  useEffect(() => {
    if (isAuthenticated && property.id) {
      userAPI.checkFavorite(property.id)
        .then(res => setIsSaved(res.data?.is_favorited || false))
        .catch(() => {});
    }
  }, [isAuthenticated, property.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      localStorage.setItem('wishlistIntent', property.id);
      navigate('/login', { state: { message: 'Please log in to save properties' } });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await userAPI.removeFavorite(property.id);
        setIsSaved(false);
      } else {
        await userAPI.addFavorite(property.id);
        setIsSaved(true);
        navigate('/dashboard?tab=saved');
      }
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4) }}
    >
      <Link
        to={`/booking/${property.id}`}
        className="block group cursor-pointer"
      >
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4">
          {/* Skeleton shown until image loads */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-stone-200 animate-pulse" />
          )}

          {/* Fallback when image fails or src is missing */}
          {(imgError || !src) && (
            <div className="absolute inset-0 bg-stone-100 flex items-center justify-center">
              <span className="text-stone-300 text-4xl">🏠</span>
            </div>
          )}

          {/* Actual image — lazy loaded, hidden until ready */}
          {src && !imgError && (
            <motion.img
              src={src}
              alt={property.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              style={{ opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s ease" }}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          )}

          {/* Hover overlay — only visible once image is loaded */}
          {imgLoaded && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-widest text-black">
                View Details
              </span>
            </div>
          )}

          {/* Tag badge */}
          {property.tag && (
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] uppercase tracking-widest font-bold text-black">
              {property.tag}
            </div>
          )}

          {/* Save / Heart button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
          >
            <Heart
              className={`w-4 h-4 transition-all ${isSaved ? 'fill-rose-500 stroke-rose-500' : 'stroke-stone-600'}`}
            />
          </button>
        </div>

        {/* Text info */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="text-black text-lg font-serif leading-tight group-hover:text-stone-700 transition-colors truncate">
                {property.name}
              </h3>
              <p className="text-stone-500 text-xs mt-1 uppercase tracking-wide flex items-center gap-1">
                <FaMapMarkerAlt className="text-[10px] flex-shrink-0" />
                <span className="truncate">{property.location}</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-black text-sm font-medium">
                Ksh {property.price?.toLocaleString()}
              </p>
              <p className="text-stone-400 text-[10px] mt-1 uppercase">per night</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;