import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../components/maps/MapPicker';
import MitraNearbyList from '../components/maps/MitraNearbyList';

const Marketplace = () => {
  const navigate = useNavigate();
  const [nearbyMitra, setNearbyMitra] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  // Fungsi callback dari MapPicker saat lokasi atau mitra diperbarui
  // MapPicker memanggil ini jika kita passing props, tapi MapPicker saat ini menangani state-nya sendiri.
  // Untuk mempermudah, kita biarkan komponen map bekerja secara otonom, tapi kita dapat memodifikasinya
  // agar me-lempar data mitra ke atas jika diperlukan.

  // Namun karena MapPicker yang kita buat tadi melakukan fetch API sendiri tapi tidak mengembalikannya via props,
  // kita perlu menambahkan hook fetch di Marketplace jika kita mau mengirimnya ke MitraNearbyList.
  // Tapi tunggu, instruksi: "Komponen MitraNearbyList + MapPicker side-by-side di desktop"
  // Solusi: Kita fetch di Marketplace, lalu passing ke MapPicker (sebagai dummy/render) & MitraNearbyList.

  // Perbarui useEffect di Marketplace untuk fetch data:
  
  const handleLocationSelect = async (lat, lng, address) => {
    setUserLocation({ lat, lng, address });
    // Idealnya, Marketplace memanggil API /api/pickup/mitra/nearby
    try {
      // Mocking fetch or real fetch
      const api = (await import('../services/api')).default;
      const res = await api.get(`/api/pickup/mitra/nearby?lat=${lat}&lng=${lng}&radius=20`);
      if (res.data.success) {
        setNearbyMitra(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleMitraSelect = (mitra) => {
    navigate(`/mitra/${mitra._id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Marketplace Mitra</h1>
        <p className="text-gray-600">Temukan pengepul dan pendaur ulang di sekitar Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4">Peta Lokasi</h2>
            <div className="h-[500px]">
              <MapPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: List */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <MitraNearbyList mitraList={nearbyMitra} onSelectMitra={handleMitraSelect} />
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
