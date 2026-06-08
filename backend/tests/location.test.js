const { hitungJarak } = require('../src/services/locationService');

describe('Location Service - Haversine Formula', () => {
  it('menghitung jarak antara Banda Aceh dan Jakarta dengan benar (toleransi 10%)', () => {
    // Koordinat Banda Aceh
    const aceh = { lat: 5.5483, lng: 95.3238 };
    // Koordinat Jakarta
    const jakarta = { lat: -6.2088, lng: 106.8456 };

    const jarak = hitungJarak(aceh.lat, aceh.lng, jakarta.lat, jakarta.lng);
    
    // Jarak aktual sekitar 1800-1900 km tergantung akurasi koordinat
    expect(jarak).toBeGreaterThan(1700);
    expect(jarak).toBeLessThan(2000);
  });

  it('mengembalikan jarak 0 untuk titik yang sama', () => {
    const titik = { lat: 5.5483, lng: 95.3238 };
    const jarak = hitungJarak(titik.lat, titik.lng, titik.lat, titik.lng);
    expect(jarak).toEqual(0);
  });

  it('menghitung jarak dekat (< 5km) secara akurat', () => {
    // Ulee Lheue ke Simpang 5 Banda Aceh
    const p1 = { lat: 5.5562, lng: 95.2891 }; 
    const p2 = { lat: 5.5577, lng: 95.3222 };
    
    const jarak = hitungJarak(p1.lat, p1.lng, p2.lat, p2.lng);
    // Sekitar 3.6 - 3.8 km
    expect(jarak).toBeGreaterThan(3);
    expect(jarak).toBeLessThan(4);
  });
});
