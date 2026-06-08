const axios = require('axios');

/**
 * Menghitung jarak antara dua koordinat menggunakan Haversine Formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Jarak dalam satuan Kilometer
 */
const hitungJarak = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Memfilter daftar mitra yang berada dalam radius tertentu dari lokasi pengguna
 * @param {Array} mitraList - Array of Mitra documents
 * @param {number} userLat - Latitude pengguna
 * @param {number} userLng - Longitude pengguna
 * @param {number} radiusKm - Batas maksimal jarak (km)
 * @returns {Array} Mitra yang lolos filter beserta properti jaraknya
 */
const filterMitraByRadius = (mitraList, userLat, userLng, radiusKm) => {
  const nearbyMitra = mitraList.map(mitra => {
    const jarak = hitungJarak(
      userLat, userLng,
      mitra.areaCoverage.pusat.lat, mitra.areaCoverage.pusat.lng
    );
    return { ...mitra.toObject(), jarak };
  }).filter(mitra => mitra.jarak <= (radiusKm || mitra.areaCoverage.radius));

  // Sort dari yang terdekat
  return nearbyMitra.sort((a, b) => a.jarak - b.jarak);
};

/**
 * Mendapatkan koordinat dari teks alamat menggunakan Google Maps Geocoding API.
 * Jika API Key belum dikonfigurasi, akan mengembalikan nilai dummy/error.
 * @param {string} address 
 */
const getCoordinatesFromAddress = async (address) => {
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  if (!API_KEY || API_KEY === 'your_google_maps_api_key_here') {
    console.warn("⚠️ GOOGLE_MAPS_API_KEY belum diset. Menggunakan mock coordinates.");
    return { lat: -6.200000, lng: 106.816666 }; // Jakarta Pusat mock
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: API_KEY }
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      return response.data.results[0].geometry.location;
    }
    throw new Error('Alamat tidak ditemukan');
  } catch (error) {
    throw new Error('Gagal mendapatkan koordinat dari layanan peta');
  }
};

module.exports = {
  hitungJarak,
  filterMitraByRadius,
  getCoordinatesFromAddress
};
