import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Info, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const MitraProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mitra, setMitra] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMitra = async () => {
      try {
        const res = await api.get(`/api/mitra/${id}`);
        if (res.data.success) {
          setMitra(res.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMitra();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!mitra) return <div className="p-8 text-center text-gray-500">Mitra tidak ditemukan.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-32 bg-brand-green/20 w-full"></div>
        <div className="px-8 pb-8 relative">
          <div className="w-24 h-24 bg-brand-green text-white rounded-xl flex items-center justify-center text-4xl font-bold border-4 border-white shadow-md absolute -top-12">
            {mitra.namaUsaha.charAt(0)}
          </div>
          
          <div className="pt-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-extrabold text-gray-900">{mitra.namaUsaha}</h1>
                {mitra.isVerified && <CheckCircle2 className="text-blue-500" size={20} />}
              </div>
              <p className="text-gray-500 flex items-center gap-1 text-sm mb-2"><MapPin size={14}/> {mitra.alamatUsaha}</p>
              <div className="flex items-center gap-4 text-sm font-medium">
                <span className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded"><Star size={14} fill="currentColor"/> {mitra.rating} Rating</span>
                <span className="flex items-center gap-1 text-gray-600"><CheckCircle2 size={14}/> {mitra.totalTransaksi} Transaksi Selesai</span>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(`/transaksi/baru`, { state: { mitraId: mitra._id } })}
              className="w-full md:w-auto bg-brand-green hover:bg-brand-dark text-white px-6 py-3 rounded-lg font-bold shadow transition-colors"
            >
              Ajukan Penjualan
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom Info */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Info size={18}/> Informasi</h3>
            <p className="text-sm text-gray-600 mb-4">{mitra.deskripsi || 'Mitra pendaur ulang bersertifikat yang siap menjemput sampah Anda.'}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock size={16} className="text-gray-400"/>
              <span>Buka: 08:00 - 17:00</span>
            </div>
          </div>
        </div>

        {/* Kolom Katalog */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 text-lg">Daftar Harga Sampah (Katalog)</h3>
            
            {mitra.katalog && mitra.katalog.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-sm font-bold text-gray-700">Jenis Sampah</th>
                      <th className="py-3 px-4 text-sm font-bold text-gray-700">Min. Satuan</th>
                      <th className="py-3 px-4 text-sm font-bold text-gray-700 text-right">Harga per Kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mitra.katalog.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 capitalize">{item.jenisSampah}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{item.satuanMinimum} kg</td>
                        <td className="py-3 px-4 text-sm font-bold text-brand-green text-right">Rp{item.hargaPerKg.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Mitra ini belum menambahkan harga katalog.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MitraProfile;
