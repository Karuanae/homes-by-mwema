import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, Star, Trash2, Loader2 } from 'lucide-react';
import { userAPI, IMAGE_BASE_URL } from '../services/api';

export default function SavedProperties() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getFavorites();
      setFavorites(res.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (propertyId) => {
    setRemoving(propertyId);
    try {
      await userAPI.removeFavorite(propertyId);
      setFavorites(prev => prev.filter(f => f.property_id !== propertyId));
    } catch {
      /* ignore */
    } finally {
      setRemoving(null);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800';
    return url.startsWith('http') ? url : `${IMAGE_BASE_URL}${url}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#093A3E] animate-spin mx-auto mb-3" />
          <p className="text-sm text-stone-400 uppercase tracking-widest">Loading saved properties…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900 flex items-center gap-3">
          <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
          Saved Properties
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-stone-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-700 mb-2">No saved properties yet</h2>
          <p className="text-stone-400 mb-6 max-w-md mx-auto text-sm">
            Tap the heart icon on any property to save it here for easy access later.
          </p>
          <Link
            to="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#093A3E] text-white rounded-xl text-sm font-medium hover:bg-[#0c4e52] transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {favorites.map((fav) => {
              const prop = fav.property;
              return (
                <motion.div
                  key={fav.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Image */}
                  <Link to={`/booking/${prop.id}`} className="block relative aspect-[4/3] overflow-hidden">
                    <img
                      src={getImageSrc(prop.cover_image)}
                      alt={prop.title || prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'; }}
                    />
                    {/* Remove button */}
                    <button
                      onClick={(e) => { e.preventDefault(); handleRemove(prop.id); }}
                      disabled={removing === prop.id}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
                    >
                      {removing === prop.id ? (
                        <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-stone-500 hover:text-rose-500 transition-colors" />
                      )}
                    </button>
                    {/* Heart badge */}
                    <div className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    </div>
                  </Link>

                  {/* Details */}
                  <Link to={`/booking/${prop.id}`} className="block p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-stone-900 text-sm truncate">{prop.title || prop.name}</h3>
                      {prop.rating > 0 && (
                        <span className="flex items-center gap-1 text-xs text-stone-600 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-[#ED9B40] text-[#ED9B40]" />
                          {Number(prop.rating).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-xs text-stone-400 mb-2">
                      <MapPin className="w-3 h-3" />
                      {prop.location}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900">
                        Ksh {Number(prop.price).toLocaleString()}
                        <span className="text-xs font-normal text-stone-400"> / night</span>
                      </span>
                      <span className="text-xs text-stone-400">
                        {prop.rooms} bed · {prop.bathrooms} bath
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
