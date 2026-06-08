import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin } from 'lucide-react';
import api from '../../services/api';

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [address, setAddress] = useState('');
  const [nearbyMitra, setNearbyMitra] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places']
      });

      try {
        const { Map } = await loader.importLibrary('maps');
        const { Marker } = await loader.importLibrary('marker');

        const defaultLocation = initialLocation || { lat: -6.200000, lng: 106.816666 }; // Default Jakarta

        const mapInstance = new Map(mapRef.current, {
          center: defaultLocation,
          zoom: 14,
          mapTypeControl: false,
        });

        const markerInstance = new Marker({
          position: defaultLocation,
          map: mapInstance,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setIsLoading(false);

        // Jika browser mensupport Geolocation, ambil lokasi terkini
        if (!initialLocation && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude };
            mapInstance.setCenter(currentPos);
            markerInstance.setPosition(currentPos);
            handleLocationChange(currentPos);
          });
        } else {
          handleLocationChange(defaultLocation);
        }

        // Event listener saat marker di-drag
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          handleLocationChange({ lat: position.lat(), lng: position.lng() });
        });

      } catch (error) {
        console.error('Error memuat Google Maps:', error);
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  const handleLocationChange = async (latLng) => {
    // Reverse Geocoding
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: latLng });
      
      let formattedAddress = 'Lokasi tidak diketahui';
      if (response.results[0]) {
        formattedAddress = response.results[0].formatted_address;
      }
      setAddress(formattedAddress);
      onLocationSelect(latLng.lat, latLng.lng, formattedAddress);

      // Fetch mitra terdekat
      fetchNearbyMitra(latLng.lat, latLng.lng);
    } catch (error) {
      console.error('Geocoder failed:', error);
    }
  };

  const fetchNearbyMitra = async (lat, lng) => {
    try {
      const res = await api.get(`/api/pickup/mitra/nearby?lat=${lat}&lng=${lng}&radius=10`);
      if (res.data.success) {
        setNearbyMitra(res.data.data);
        renderMitraMarkers(res.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat mitra terdekat', error);
    }
  };

  const renderMitraMarkers = (mitras) => {
    if (!map) return;
    
    mitras.forEach(mitra => {
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${mitra.namaUsaha}</h3>
            <p style="font-size: 12px; color: #666;">⭐ ${mitra.rating} | Jarak: ${mitra.jarak.toFixed(2)} km</p>
            <button onclick="alert('Memilih ${mitra.namaUsaha}')" style="margin-top: 8px; background: #16a34a; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Pilih Mitra</button>
          </div>
        `
      });

      const mMarker = new window.google.maps.Marker({
        position: { lat: mitra.areaCoverage.pusat.lat, lng: mitra.areaCoverage.pusat.lng },
        map: map,
        icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        title: mitra.namaUsaha
      });

      mMarker.addListener('click', () => {
        infoWindow.open({
          anchor: mMarker,
          map,
        });
      });
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[400px]">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3">
        <MapPin className="text-brand-green" />
        <div className="flex-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Lokasi Penjemputan</p>
          <p className="text-sm text-gray-800 line-clamp-1">{isLoading ? 'Memuat lokasi...' : address}</p>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-inner overflow-hidden border border-gray-200" 
        style={{ minHeight: '350px' }}
      />
    </div>
  );
};

export default MapPicker;
