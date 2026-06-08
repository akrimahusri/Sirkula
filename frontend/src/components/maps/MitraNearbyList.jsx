import React, { useState } from 'react';
import { MapPin, Star, Trash2 } from 'lucide-react';

const MitraNearbyList = ({ mitraList, onSelectMitra }) => {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const filters = ['Semua', 'Plastik', 'Kertas', 'Logam', 'Elektronik', 'Organik'];

  const filteredList = activeFilter === 'Semua' 
    ? mitraList 
    : mitraList.filter(mitra => 
        mitra.katalog.some(k => k.jenisSampah.toLowerCase().includes(activeFilter.toLowerCase()))
      );

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Mitra Terdekat</h2>
      
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              activeFilter === filter 
                ? 'bg-brand-green text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Tidak ada mitra terdekat dengan filter ini.</p>
        ) : (
          filteredList.map(mitra => (
            <div 
              key={mitra._id} 
              className="border border-gray-100 rounded-lg p-3 flex flex-col gap-2 hover:border-brand-green/30 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => onSelectMitra && onSelectMitra(mitra)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-gray-800">{mitra.namaUsaha}</h3>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 text-xs font-bold">
                  <Star size={12} fill="currentColor" />
                  <span>{mitra.rating}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin size={12} /> {mitra.jarak.toFixed(2)} km</span>
                <span className="flex items-center gap-1"><Trash2 size={12} /> {mitra.katalog.length} Jenis Sampah</span>
              </div>
              
              <div className="mt-1">
                <p className="text-xs text-gray-400">Harga Tertinggi:</p>
                <p className="text-sm font-bold text-brand-green">
                  Rp{Math.max(...mitra.katalog.map(k => k.hargaPerKg)).toLocaleString('id-ID')} /kg
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MitraNearbyList;
