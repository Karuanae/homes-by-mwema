import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useState, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

// ✅ FIX: Move libraries OUTSIDE the component
const GOOGLE_MAPS_LIBRARIES = ['places'];

export default function LocationAutocomplete({ onSelect, initialValue, placeholder = "Search for location..." }) {
  // ✅ FIX: Use the stable constant reference
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,  // ← stable reference, never changes
  });

  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'ke' }, // Restrict to Kenya
    },
    debounce: 300,
  });

  useEffect(() => {
    if (initialValue && !value) {
      setValue(initialValue, false);
    }
  }, [initialValue, setValue]);

  const handleSelect = async (address, placeId) => {
    setValue(address, false);
    clearSuggestions();

    // Get geocode from the place ID
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        onSelect({
          address: results[0].formatted_address,
          coordinates: {
            lat: location.lat(),
            lng: location.lng(),
          },
          placeId: results[0].place_id,
        });
      }
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 p-3 border border-stone-200 rounded-xl bg-stone-50">
        <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
        <span className="text-sm text-stone-400">Loading maps...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition-colors text-sm"
        />
      </div>
      
      {status === 'OK' && data.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white border border-stone-200 rounded-xl mt-1 shadow-lg z-50 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description, place_id)}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-stone-50 cursor-pointer transition-colors border-b border-stone-100 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <span className="text-sm text-stone-700">{description}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}