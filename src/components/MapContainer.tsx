import React, { useEffect, useRef } from 'react';

interface MapContainerProps {
  lat: number;
  lng: number;
  onMapLoad: (map: google.maps.Map) => void;
}

const MapContainer: React.FC<MapContainerProps> = ({ lat, lng, onMapLoad }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error("Google Maps API Key is missing");
      return;
    }

    const loadScript = () => {
      if (window.google) {
        initMap();
        return;
      }
      
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        existingScript.addEventListener('load', initMap);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (mapRef.current && !googleMap.current) {
        googleMap.current = new window.google.maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 20,
          mapTypeId: 'satellite',
          tilt: 45,
          heading: 0,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: true,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });
        onMapLoad(googleMap.current);
      }
    };

    loadScript();
  }, []);

  useEffect(() => {
    if (googleMap.current) {
      googleMap.current.setCenter({ lat, lng });
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white p-8 text-center z-10">
          <div>
            <p className="text-xl font-bold mb-2">Google Maps API Key Required</p>
            <p className="text-sm opacity-70">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to see the satellite view.</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
};

export default MapContainer;
