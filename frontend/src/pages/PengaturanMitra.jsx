import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import MapPicker from '../components/maps/MapPicker';

const PengaturanMitra = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State untuk Profil
  const [deskripsi, setDeskripsi] = useState('');
  const [jamOperasional, setJamOperasional] = useState('');
  const [lokasi, setLokasi] = useState(null);
  
  // State untuk Katalog
  const [katalog, setKatalog] = useState([]);

  useEffect(() => {
    const fetchMitraData = async () => {
      try {
        const res = await api.get(`/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const data = res.data.data.user;
          setDeskripsi(data.deskripsi || '');
          setJamOperasional(data.jamOperasional || '');
          setKatalog(data.katalog || []);
          if (data.areaCoverage && data.areaCoverage.pusat) {
            setLokasi(data.areaCoverage.pusat);
          }
        }
      } catch (error) {
        toast.error('Gagal memuat data profil');
      } finally {
        setLoading(false);
      }
    };

    fetchMitraData();
  }, [token]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const userId = user.id || user._id;
      
      const updates = { deskripsi, jamOperasional };
      if (lokasi) {
        updates.areaCoverage = { pusat: { lat: lokasi.lat, lng: lokasi.lng }, radius: 10 };
      }

      const res = await api.put(`/api/mitra/${userId}`, updates);
      if (res.data.success) {
        toast.success('Profil berhasil diperbarui');
      }
    } catch (error) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKatalog = async () => {
    try {
      setSaving(true);
      const userId = user.id || user._id;
      const res = await api.put(`/api/mitra/${userId}/katalog`, { katalog });
      if (res.data.success) {
        toast.success('Katalog berhasil diperbarui');
      }
    } catch (error) {
      toast.error('Gagal memperbarui katalog');
    } finally {
      setSaving(false);
    }
  };

  const addKatalogItem = () => {
    setKatalog([...katalog, { jenisSampah: '', hargaPerKg: 0, satuanMinimum: 1 }]);
  };

  const removeKatalogItem = (index) => {
    const newKatalog = [...katalog];
    newKatalog.splice(index, 1);
    setKatalog(newKatalog);
  };

  const handleKatalogChange = (index, field, value) => {
    const newKatalog = [...katalog];
    newKatalog[index][field] = value;
    setKatalog(newKatalog);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/dashboard/mitra')}
          className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors border border-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pengaturan Mitra</h1>
          <p className="text-gray-500 text-sm">Lengkapi profil dan atur harga sampah Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bagian Profil */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Detail Profil</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
              <input 
                type="text" 
                placeholder="Contoh: Senin - Sabtu (08:00 - 17:00)"
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-sm"
                value={jamOperasional}
                onChange={(e) => setJamOperasional(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Layanan</label>
              <textarea 
                rows="4"
                placeholder="Ceritakan sedikit tentang layanan pengepul Anda..."
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green text-sm resize-none"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titik Lokasi Gudang/Usaha</label>
              <p className="text-xs text-gray-500 mb-2">Geser pin pada peta untuk menentukan lokasi Anda agar dapat ditemukan oleh pengguna di sekitar Anda.</p>
              <div className="h-[250px] w-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
                <MapPicker 
                  initialLocation={lokasi} 
                  onLocationSelect={(lat, lng) => setLokasi({ lat, lng })} 
                />
              </div>
            </div>

            <button 
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-brand-green hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <Save size={18} /> Simpan Profil
            </button>
          </div>
        </div>

        {/* Bagian Katalog */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-bold text-gray-900">Katalog Harga Sampah</h2>
            <button 
              onClick={addKatalogItem}
              className="text-brand-green hover:bg-brand-green/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm font-bold"
            >
              <Plus size={16} /> Tambah
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {katalog.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                Belum ada katalog. Silakan tambah jenis sampah yang Anda terima.
              </div>
            ) : (
              katalog.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-3 relative">
                  <button 
                    onClick={() => removeKatalogItem(index)}
                    className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Sampah</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Plastik Botol"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-brand-green"
                      value={item.jenisSampah}
                      onChange={(e) => handleKatalogChange(index, 'jenisSampah', e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp) per Kg</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-brand-green"
                        value={item.hargaPerKg}
                        onChange={(e) => handleKatalogChange(index, 'hargaPerKg', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Min. Berat (Kg)</label>
                      <input 
                        type="number" 
                        min="0.1"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-brand-green"
                        value={item.satuanMinimum}
                        onChange={(e) => handleKatalogChange(index, 'satuanMinimum', parseFloat(e.target.value) || 0.1)}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={handleSaveKatalog}
            disabled={saving}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <Save size={18} /> Simpan Katalog
          </button>
        </div>
      </div>
    </div>
  );
};

export default PengaturanMitra;
