import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Upload, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import MapPicker from '../components/maps/MapPicker';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const TransaksiBaru = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mitraId = location.state?.mitraId;

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    items: [{ jenisSampah: '', beratEstimasi: '', hargaPerKg: 0 }],
    foto: null,
    lokasiPenjemputan: null, // {lat, lng, alamat}
    jadwalPenjemputan: ''
  });
  const [loading, setLoading] = useState(false);
  const [mitra, setMitra] = useState(null);
  const [fetchingMitra, setFetchingMitra] = useState(true);

  useEffect(() => {
    if (!mitraId) {
      setFetchingMitra(false);
      return;
    }
    const fetchMitra = async () => {
      try {
        const res = await api.get(`/api/mitra/${mitraId}`);
        if (res.data.success) {
          setMitra(res.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil data mitra", error);
      } finally {
        setFetchingMitra(false);
      }
    };
    fetchMitra();
  }, [mitraId]);

  if (fetchingMitra) return <LoadingSpinner />;

  if (!mitraId || !mitra) {
    return <div className="p-8 text-center text-red-500">Akses tidak valid atau mitra tidak ditemukan. Pilih mitra terlebih dahulu dari Marketplace.</div>;
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Automatically set hargaPerKg if jenisSampah changes
    if (field === 'jenisSampah') {
      const selectedKatalog = mitra.katalog.find(k => k.jenisSampah === value);
      newItems[index].hargaPerKg = selectedKatalog ? selectedKatalog.hargaPerKg : 0;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => setFormData({ ...formData, items: [...formData.items, { jenisSampah: '', beratEstimasi: '', hargaPerKg: 0 }] });

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Filter out incomplete items
      const validItems = formData.items.filter(item => item.jenisSampah && item.beratEstimasi);
      
      if (validItems.length === 0) {
        toast.error('Mohon lengkapi minimal satu jenis sampah dan estimasi beratnya');
        setLoading(false);
        return;
      }

      if (!formData.lokasiPenjemputan || !formData.lokasiPenjemputan.lat || !formData.lokasiPenjemputan.alamat) {
        toast.error('Mohon tunggu lokasi didapatkan atau pilih dari peta');
        setLoading(false);
        return;
      }

      if (!formData.jadwalPenjemputan) {
        toast.error('Mohon tentukan jadwal penjemputan');
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('mitraId', mitraId);
      data.append('items', JSON.stringify(validItems));
      data.append('lokasiPenjemputan', JSON.stringify(formData.lokasiPenjemputan));
      data.append('jadwalPenjemputan', formData.jadwalPenjemputan);
      
      if (formData.foto) {
        for (let i = 0; i < formData.foto.length; i++) {
          data.append('foto', formData.foto[i]);
        }
      }

      const res = await api.post('/api/transaksi', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Permintaan penjemputan berhasil diajukan!');
        navigate('/dashboard/user');
      }
    } catch (error) {
      const errRes = error.response?.data;
      if (errRes?.errors && errRes.errors.length > 0) {
        toast.error(errRes.errors[0].message || 'Validasi gagal');
      } else {
        toast.error(errRes?.message || 'Gagal mengajukan transaksi');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate total estimasi for confirmation step
  const totalEstimasi = formData.items.reduce((sum, item) => sum + (Number(item.beratEstimasi) * item.hargaPerKg), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Ajukan Penjualan ke {mitra.namaUsaha}</h1>
        <p className="text-gray-500">Lengkapi formulir di bawah untuk mengatur jadwal penjemputan.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 z-0"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-green z-0 transition-all" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
        {[1, 2, 3, 4].map(num => (
          <div key={num} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= num ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-500'}`}>
            {step > num ? <CheckCircle2 size={16} /> : num}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold">1. Detail Sampah</h2>
            {mitra.katalog && mitra.katalog.length === 0 && (
              <p className="text-red-500 text-sm">Mitra ini belum memiliki katalog harga. Anda tidak bisa melanjutkan.</p>
            )}
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Sampah</label>
                  <select 
                    value={item.jenisSampah} 
                    onChange={e => handleItemChange(idx, 'jenisSampah', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                  >
                    <option value="">Pilih dari katalog mitra...</option>
                    {mitra.katalog?.map((k, i) => (
                      <option key={i} value={k.jenisSampah}>{k.jenisSampah} - Rp{k.hargaPerKg.toLocaleString('id-ID')}/kg</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi (kg)</label>
                  <input 
                    type="number" 
                    value={item.beratEstimasi} 
                    onChange={e => handleItemChange(idx, 'beratEstimasi', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
                    placeholder="misal: 2"
                    min="1"
                  />
                </div>
              </div>
            ))}
            <button onClick={addItem} className="text-brand-green font-medium text-sm hover:underline">+ Tambah Jenis Lain</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold">2. Unggah Foto</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">Pilih atau tarik foto sampah ke sini</p>
              <input 
                type="file" 
                multiple 
                accept="image/jpeg, image/png, image/webp"
                onChange={e => setFormData({ ...formData, foto: e.target.files })}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-brand-green hover:file:bg-brand-light/80 cursor-pointer"
              />
            </div>
            {formData.foto && <p className="text-sm text-brand-green">{formData.foto.length} file dipilih</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold">3. Lokasi & Jadwal Penjemputan</h2>
            <div className="h-64 border border-gray-200 rounded-xl overflow-hidden">
              <MapPicker onLocationSelect={(lat, lng, address) => setFormData({ ...formData, lokasiPenjemputan: { lat, lng, alamat: address }})} />
            </div>
            {formData.lokasiPenjemputan && (
              <p className="text-sm text-gray-600 flex items-center gap-2"><MapPin size={16} className="text-brand-green"/> {formData.lokasiPenjemputan.alamat}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jadwal</label>
              <input 
                type="datetime-local" 
                value={formData.jadwalPenjemputan}
                onChange={e => setFormData({...formData, jadwalPenjemputan: e.target.value})}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xl font-bold">4. Konfirmasi</h2>
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-3">
              <p><strong>Item:</strong> {formData.items.length} jenis</p>
              <p><strong>Estimasi Pendapatan:</strong> Rp{totalEstimasi.toLocaleString('id-ID')}</p>
              <p><strong>Jadwal:</strong> {new Date(formData.jadwalPenjemputan).toLocaleString('id-ID')}</p>
              <p><strong>Alamat:</strong> {formData.lokasiPenjemputan?.alamat}</p>
            </div>
            <p className="text-sm text-gray-500">Mitra akan menerima notifikasi ini. Setelah diterima, Anda bisa melacak rute penjemputan mereka.</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button 
            onClick={handlePrev} 
            disabled={step === 1}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${step === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
          >
            Kembali
          </button>
          
          {step < 4 ? (
            <button 
              onClick={handleNext} 
              disabled={step === 1 && (!formData.items[0].jenisSampah || !formData.items[0].beratEstimasi)}
              className="px-6 py-2.5 bg-brand-green text-white rounded-lg font-bold text-sm hover:bg-brand-dark flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Lanjut <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="px-6 py-2.5 bg-brand-green text-white rounded-lg font-bold text-sm hover:bg-brand-dark flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'Memproses...' : 'Kirim Permintaan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransaksiBaru;

