import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

// Custom icons to avoid Vite asset resolution issues with Leaflet default icons
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

// Helper to calculate straight distance in km as fallback
const getDistanceBetweenCoords = (p1, p2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const TrackingMap = ({ transaksiId, token, initialMitraPos, userPos }) => {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const mitraMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  
  const isValidLatLng = (pos) => pos && typeof pos.lat === 'number' && typeof pos.lng === 'number' && !isNaN(pos.lat) && !isNaN(pos.lng);

  const getInitialMitraPos = () => {
    if (isValidLatLng(initialMitraPos)) {
      return initialMitraPos;
    }
    const up = isValidLatLng(userPos) ? userPos : { lat: -6.200000, lng: 106.816666 };
    return { lat: up.lat + 0.015, lng: up.lng + 0.015 };
  };

  const [mitraPos, setMitraPos] = useState(getInitialMitraPos());
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);

  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Function to fetch and draw the driving route
  const calculateRoute = async (origin, destination) => {
    if (!origin || !destination || !mapInstanceRef.current) return;
    
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        // Update ETA and Distance
        const durationMin = Math.round(route.duration / 60);
        const distanceKm = (route.distance / 1000).toFixed(2);
        
        setEta(durationMin > 0 ? `${durationMin} menit` : 'Tiba');
        setDistance(`${distanceKm} km`);

        // Convert coordinates from [lng, lat] to [lat, lng]
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
        
        // Draw/Update Polyline
        if (routeLineRef.current) {
          routeLineRef.current.setLatLngs(coordinates);
        } else {
          routeLineRef.current = L.polyline(coordinates, { 
            color: '#16a34a', 
            weight: 5,
            opacity: 0.8
          }).addTo(mapInstanceRef.current);
        }
      } else {
        throw new Error('No routes returned from OSRM');
      }
    } catch (error) {
      console.error('OSRM Routing error, falling back to straight line:', error);
      
      // Fallback: Straight dashed line
      const fallbackCoords = [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng]
      ];
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs(fallbackCoords);
      } else {
        routeLineRef.current = L.polyline(fallbackCoords, { 
          color: '#16a34a', 
          weight: 4, 
          dashArray: '5, 10',
          opacity: 0.6
        }).addTo(mapInstanceRef.current);
      }
      
      const dist = getDistanceBetweenCoords(origin, destination);
      setDistance(`${dist.toFixed(2)} km`);
      setEta(`${Math.round(dist * 3)} menit`); // rough estimate (20 km/h)
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    const validUserPos = isValidLatLng(userPos) ? userPos : { lat: -6.200000, lng: 106.816666 };
    const startMitraPos = getInitialMitraPos();
    setMitraPos(startMitraPos);

    // Init Leaflet map
    const map = L.map(mapRef.current).setView([validUserPos.lat, validUserPos.lng], 14);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // User marker
    userMarkerRef.current = L.marker([validUserPos.lat, validUserPos.lng], { 
      icon: userIcon 
    }).addTo(map).bindPopup('Lokasi Anda (Pickup)');

    // Mitra marker
    mitraMarkerRef.current = L.marker([startMitraPos.lat, startMitraPos.lng], { 
      icon: mitraIcon 
    }).addTo(map).bindPopup('Posisi Kurir/Mitra');

    // Initial route calculation
    calculateRoute(startMitraPos, validUserPos);

    // Fit map bounds to show both markers
    const bounds = L.latLngBounds([
      [validUserPos.lat, validUserPos.lng],
      [startMitraPos.lat, startMitraPos.lng]
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userPos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket setup
  useEffect(() => {
    if (!token || !transaksiId) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_tracking', { transaksiId });
      console.log('Joined tracking room:', transaksiId);
    });

    // Listen to partner location updates
    socketRef.current.on('mitra_location_updated', (data) => {
      if (data.transaksiId === transaksiId) {
        const newPos = { lat: data.lat, lng: data.lng };
        setMitraPos(newPos);
        
        // Update Marker on Map
        if (mitraMarkerRef.current) {
          mitraMarkerRef.current.setLatLng([newPos.lat, newPos.lng]);
        }
        
        // Recalculate Route
        calculateRoute(newPos, userPos);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [transaksiId, token, userPos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Simulator helper for Mitra role to test real-time location update
  const startSimulation = () => {
    if (isSimulating || !userPos) return;
    setIsSimulating(true);

    const startLat = mitraPos.lat;
    const startLng = mitraPos.lng;
    const destLat = userPos.lat;
    const destLng = userPos.lng;

    let step = 0;
    const totalSteps = 30;

    simulationIntervalRef.current = setInterval(() => {
      step++;
      if (step > totalSteps) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
        return;
      }

      // Interpolate coordinates
      const currentLat = startLat + (destLat - startLat) * (step / totalSteps);
      const currentLng = startLng + (destLng - startLng) * (step / totalSteps);
      const currentPos = { lat: currentLat, lng: currentLng };

      setMitraPos(currentPos);

      // Move marker
      if (mitraMarkerRef.current) {
        mitraMarkerRef.current.setLatLng([currentLat, currentLng]);
      }

      // Calculate path and ETA locally
      calculateRoute(currentPos, userPos);

      // Emit to server so the User dashboard gets real-time update
      if (socketRef.current) {
        socketRef.current.emit('update_location', {
          transaksiId,
          lat: currentLat,
          lng: currentLng
        });
      }
    }, 1500);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Estimasi Tiba</p>
          <p className="text-xl font-bold text-brand-green">{eta || 'Menghitung...'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Sisa Jarak</p>
          <p className="text-lg font-bold text-gray-800">{distance || '-'}</p>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg shadow-inner border border-gray-200 z-10"
        style={{ minHeight: '400px' }}
      />

      {/* Show Simulation Button for Mitra (or in development/testing mode) */}
      {user?.role === 'mitra' && (
        <div className="flex gap-2">
          {!isSimulating ? (
            <button 
              onClick={startSimulation}
              className="w-full bg-brand-green hover:bg-brand-dark text-white py-2.5 rounded-xl font-bold text-sm shadow transition-all flex justify-center items-center gap-2"
            >
              🚀 Simulasikan Perjalanan
            </button>
          ) : (
            <button 
              onClick={stopSimulation}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-sm shadow transition-all flex justify-center items-center gap-2"
            >
              🛑 Hentikan Simulasi
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingMap;
