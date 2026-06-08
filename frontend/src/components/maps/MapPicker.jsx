import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import api from '../../services/api';

// Custom icons to avoid Leaflet marker image loading issues in build tools
const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const mitraIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const mitraLayerGroupRef = useRef(null);

  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const defaultLocation = initialLocation || { lat: -6.200000, lng: 106.816666 }; // Default Jakarta

    // Initialize Leaflet Map
    const map = L.map(mapRef.current).setView([defaultLocation.lat, defaultLocation.lng], 14);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Draggable User Marker
    const marker = L.marker([defaultLocation.lat, defaultLocation.lng], {
      draggable: true,
      icon: userIcon
    }).addTo(map);
    markerInstanceRef.current = marker;

    // Layer Group for Mitra Markers
    const mitraLayerGroup = L.layerGroup().addTo(map);
    mitraLayerGroupRef.current = mitraLayerGroup;

    setIsLoading(false);

    // Jika browser mendukung Geolocation, ambil lokasi terkini
    if (!initialLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          map.setView([currentPos.lat, currentPos.lng], 14);
          marker.setLatLng([currentPos.lat, currentPos.lng]);
          handleLocationChange(currentPos.lat, currentPos.lng);
        },
        (error) => {
          console.warn('Geolocation error, falling back to default:', error);
          handleLocationChange(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      handleLocationChange(defaultLocation.lat, defaultLocation.lng);
    }

    // Event listener saat marker di-drag
    marker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      handleLocationChange(position.lat, position.lng);
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationChange = async (lat, lng) => {
    try {
      // Nominatim reverse geocoding
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      const formattedAddress = data.display_name || `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(formattedAddress);
      
      if (onLocationSelect) {
        onLocationSelect(lat, lng, formattedAddress);
      }

      // Fetch mitra terdekat
      fetchNearbyMitra(lat, lng);
    } catch (error) {
      console.error('Geocoder failed:', error);
      const fallbackAddress = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallbackAddress);
      if (onLocationSelect) {
        onLocationSelect(lat, lng, fallbackAddress);
      }
      fetchNearbyMitra(lat, lng);
    }
  };

  const fetchNearbyMitra = async (lat, lng) => {
    try {
      const res = await api.get(`/api/pickup/mitra/nearby?lat=${lat}&lng=${lng}&radius=10`);
      if (res.data.success) {
        renderMitraMarkers(res.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat mitra terdekat', error);
    }
  };

  const renderMitraMarkers = (mitras) => {
    if (!mapInstanceRef.current || !mitraLayerGroupRef.current) return;
    
    // Hapus marker lama
    mitraLayerGroupRef.current.clearLayers();
    
    mitras.forEach(mitra => {
      const popupContent = `
        <div style="padding: 4px; font-family: sans-serif; min-width: 140px;">
          <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px; color: #111827;">${mitra.namaUsaha}</h3>
          <p style="font-size: 12px; color: #4B5563; margin: 0 0 8px 0;">⭐ ${mitra.rating} | Jarak: ${mitra.jarak.toFixed(2)} km</p>
          <button id="btn-select-mitra-${mitra._id}" style="background: #16a34a; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold; width: 100%; transition: background 0.2s;">Pilih Mitra</button>
        </div>
      `;

      const mMarker = L.marker([mitra.areaCoverage.pusat.lat, mitra.areaCoverage.pusat.lng], {
        icon: mitraIcon
      }).addTo(mitraLayerGroupRef.current);

      mMarker.bindPopup(popupContent);

      mMarker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-mitra-${mitra._id}`);
        if (btn) {
          btn.onclick = () => {
            window.location.href = `/mitra/${mitra._id}`;
          };
        }
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
        className="w-full h-full rounded-lg shadow-inner overflow-hidden border border-gray-200 z-10" 
        style={{ minHeight: '350px' }}
      />
    </div>
  );
};

export default MapPicker;
