import { useLoadScript, GoogleMap as GoogleMapComponent, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useMemo, useCallback } from 'react';
import { MapPin, Navigation, Maximize2 } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '16px',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export default function GoogleMap({ location, propertyTitle, coordinates }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [map, setMap] = useState(null);

  const center = useMemo(() => {
    if (coordinates && coordinates.lat && coordinates.lng) {
      return { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    return { lat: -1.286389, lng: 36.817223 };
  }, [coordinates]);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          if (map) {
            map.panTo(pos);
            map.setZoom(14);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [map]);

  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  if (loadError) {
    return (
      <div className="h-64 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-500">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="text-sm">Error loading map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-64 bg-stone-100 rounded-2xl flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden">
      <GoogleMapComponent
        mapContainerStyle={mapContainerStyle}
        zoom={14}
        center={center}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        <Marker
          position={center}
          onClick={() => setSelectedMarker({ position: center, title: propertyTitle })}
          icon={{
            url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231c1917"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
            scaledSize: new window.google.maps.Size(32, 32),
            origin: new window.google.maps.Point(0, 0),
            anchor: new window.google.maps.Point(16, 32),
          }}
        />

        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%233b82f6"%3E%3Ccircle cx="12" cy="12" r="10" fill="white" stroke="%233b82f6" stroke-width="2"/%3E%3Ccircle cx="12" cy="12" r="4" fill="%233b82f6"/%3E%3C/svg%3E',
              scaledSize: new window.google.maps.Size(24, 24),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(12, 12),
            }}
          />
        )}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h4 className="font-semibold text-stone-900 text-sm mb-1">
                {selectedMarker.title}
              </h4>
              <p className="text-xs text-stone-600 mb-2">{location}</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${center.lat},${center.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stone-900 font-medium hover:underline"
              >
                <Navigation className="w-3 h-3" />
                Get Directions
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMapComponent>

      <div className="absolute bottom-4 right-4 z-10 flex gap-2">
        <button
          onClick={getUserLocation}
          className="bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          title="My location"
        >
          <Navigation className="w-4 h-4 text-stone-700" />
        </button>
        <button
          onClick={() => {
            if (map) {
              const fullscreenElement = map.getDiv();
              if (fullscreenElement.requestFullscreen) {
                fullscreenElement.requestFullscreen();
              }
            }
          }}
          className="bg-white rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-stone-700" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-stone-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-xs font-medium text-stone-900">{location}</span>
        </div>
      </div>
    </div>
  );
}