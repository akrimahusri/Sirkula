import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { io } from 'socket.io-client';

const TrackingMap = ({ transaksiId, token, initialMitraPos, userPos }) => {
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const mitraMarkerRef = useRef(null);
  
  const [map, setMap] = useState(null);
  const [mitraPos, setMitraPos] = useState(initialMitraPos);
  const [eta, setEta] = useState('');
  const [distance, setDistance] = useState('');

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['routes']
      });

      try {
        const { Map } = await loader.importLibrary('maps');
        const { DirectionsService, DirectionsRenderer } = await loader.importLibrary('routes');
        const { Marker } = await loader.importLibrary('marker');

        const mapInstance = new Map(mapRef.current, {
          center: userPos,
          zoom: 15,
          mapTypeControl: false,
        });

        const dirService = new DirectionsService();
        const dirRenderer = new DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true, // Kita gambar marker secara manual
          polylineOptions: { strokeColor: '#16a34a', strokeWeight: 5 }
        });

        // Marker User
        new Marker({
          position: userPos,
          map: mapInstance,
          title: 'Lokasi Anda',
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });

        // Marker Mitra
        const mMarker = new Marker({
          position: initialMitraPos,
          map: mapInstance,
          title: 'Mitra',
          icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        });

        setMap(mapInstance);
        directionsServiceRef.current = dirService;
        directionsRendererRef.current = dirRenderer;
        mitraMarkerRef.current = mMarker;

        calculateRoute(initialMitraPos, userPos);
      } catch (error) {
        console.error('Gagal memuat peta:', error);
      }
    };

    if (userPos && initialMitraPos) {
      initMap();
    }
  }, [userPos]); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateRoute = (origin, destination) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(response);
          const route = response.routes[0].legs[0];
          setEta(route.duration.text);
          setDistance(route.distance.text);
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  };

  // Setup Socket.IO untuk Real-time Tracking
  useEffect(() => {
    if (!token || !transaksiId) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_tracking', { transaksiId });
    });

    socketRef.current.on('mitra_location_updated', (data) => {
      if (data.transaksiId === transaksiId) {
        const newPos = { lat: data.lat, lng: data.lng };
        setMitraPos(newPos);
        
        // Update marker dan rute
        if (mitraMarkerRef.current) {
          mitraMarkerRef.current.setPosition(newPos);
        }
        calculateRoute(newPos, userPos);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [transaksiId, token, userPos]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center border border-gray-100">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase">Estimasi Tiba</p>
          <p className="text-xl font-bold text-brand-green">{eta || 'Menghitung...'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 font-bold uppercase">Sisa Jarak</p>
          <p className="text-lg font-bold text-gray-800">{distance || '-'}</p>
        </div>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg shadow-inner border border-gray-200"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default TrackingMap;
