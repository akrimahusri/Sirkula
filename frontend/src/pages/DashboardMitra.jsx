import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { MessageSquare, MapPin, Truck, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import TrackingMap from '../components/maps/TrackingMap';

const DashboardMitra = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackingTransaksi, setSelectedTrackingTransaksi] = useState(null);
  const [selectedKonfirmasi, setSelectedKonfirmasi] = useState(null);
  const [beratAktualData, setBeratAktualData] = useState({});
  const [konfirmasiLoading, setKonfirmasiLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/transaksi');
      if (res.data.success) {
        setTransaksi(res.data.data);
      }
    } catch (error) {
      console.error('Gagal memuat transaksi mitra:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await api.patch(`/api/transaksi/${id}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Status berhasil diperbarui ke ${newStatus}`);
        fetchDashboard();
      }
    } catch (error) {
      toast.error('Gagal memperbarui status');
    }
  };

  const initChat = async (transaksiId) => {
    try {
      const res = await api.post('/api/chat/init', { transaksiId });
      if (res.data.success) {
        navigate(`/chat/${res.data.data._id}`);
      }
    } catch (error) {
      toast.error('Gagal memulai chat');
    }
  };

  const handleOpenKonfirmasi = (trx) => {
    const initialData = {};
    trx.items.forEach(item => {
      initialData[item._id] = item.beratEstimasi;
    });
    setBeratAktualData(initialData);
    setSelectedKonfirmasi(trx);
  };

  const handleSubmitKonfirmasi = async () => {
    try {
      setKonfirmasiLoading(true);
      const itemsData = Object.keys(beratAktualData).map(itemId => ({
        itemId,
        beratAktual: Number(beratAktualData[itemId])
      }));

      const res = await api.post(`/api/transaksi/${selectedKonfirmasi._id}/konfirmasi`, { itemsData });
      if (res.data.success) {
        toast.success('Transaksi berhasil diselesaikan');
        setSelectedKonfirmasi(null);
        fetchDashboard();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyelesaikan transaksi');
    } finally {
      setKonfirmasiLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingRequests = transaksi.filter(t => t.status === 'pending');
  const activePickups = transaksi.filter(t => t.status === 'diterima' || t.status === 'dijemput');
  const historyRequests = transaksi.filter(t => t.status === 'selesai' || t.status === 'dibatalkan');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">{user?.namaUsaha}</h1>
        <p className="text-gray-500">Kelola permintaan penjemputan sampah hari ini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Permintaan Baru */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Permintaan Baru ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-500">Tidak ada permintaan baru.</div>
          ) : (
            pendingRequests.map(t => (
              <div key={t._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.userId?.nama}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14}/> {t.lokasiPenjemputan?.alamat}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Item:</p>
                  {t.items.map((item, idx) => (
                    <p key={idx} className="text-gray-600 capitalize">• {item.jenisSampah} - {item.beratEstimasi} kg</p>
                  ))}
                </div>

                {t.foto && t.foto.length > 0 && (
                  <div className="flex gap-2 mt-1 overflow-x-auto pb-1">
                    {t.foto.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Foto Sampah" className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleUpdateStatus(t._id, 'diterima')} className="flex-1 bg-brand-green text-white py-2 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors">Terima</button>
                  <button onClick={() => handleUpdateStatus(t._id, 'dibatalkan')} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors">Tolak</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Jadwal Aktif */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">Penjemputan Aktif ({activePickups.length})</h2>
          {activePickups.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-500">Tidak ada jadwal aktif.</div>
          ) : (
            activePickups.map(t => (
              <div key={t._id} className="bg-white p-5 rounded-2xl border border-brand-green/30 shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.userId?.nama}</h3>
                    <p className="text-sm text-brand-green font-medium">{new Date(t.jadwalPenjemputan).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 line-clamp-1"><MapPin size={12}/> {t.lokasiPenjemputan?.alamat}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                {t.foto && t.foto.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {t.foto.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="Foto Sampah" className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2 w-full">
                  {t.status === 'diterima' && (
                    <>
                      <button onClick={() => initChat(t._id)} className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-200">
                        <MessageSquare size={16} /> Hubungi
                      </button>
                      <button onClick={() => handleUpdateStatus(t._id, 'dijemput')} className="flex-1 flex justify-center items-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-200">
                        <Truck size={16} /> Mulai Jalan
                      </button>
                    </>
                  )}
                  {t.status === 'dijemput' && (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                        <button onClick={() => initChat(t._id)} className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-200">
                          <MessageSquare size={16} /> Hubungi
                        </button>
                        <button onClick={() => handleOpenKonfirmasi(t)} className="flex-1 flex justify-center items-center gap-2 bg-brand-light text-brand-green border border-brand-green py-2 rounded-lg font-bold text-sm hover:bg-brand-green hover:text-white transition-all">
                          <CheckCircle2 size={16} /> Konfirmasi Selesai
                        </button>
                      </div>
                      <button 
                        onClick={() => setSelectedTrackingTransaksi(t)}
                        className="w-full flex justify-center items-center gap-2 bg-blue-100 text-blue-700 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-200 transition-all"
                      >
                        <MapPin size={16} /> Buka Peta Tracking & Simulasi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Riwayat Transaksi</h2>
        {historyRequests.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center text-gray-500">Belum ada riwayat transaksi.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historyRequests.map(t => (
              <div key={t._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3 opacity-80">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{t.userId?.nama}</h3>
                    <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm mt-1">
                  <p className="font-medium mb-1">Total {t.status === 'selesai' ? 'Dibayarkan' : 'Estimasi'}: Rp{(t.status === 'selesai' ? t.totalAktual : t.totalEstimasi).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-500">{t.items.length} jenis barang</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Peta Tracking & Simulasi */}
      {selectedTrackingTransaksi && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full flex flex-col gap-4 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedTrackingTransaksi(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all animate-none"
            >
              <X size={20} />
            </button>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Peta Pelacakan & Simulasi Penjemputan
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pelanggan: <span className="font-semibold text-gray-700">{selectedTrackingTransaksi.userId?.nama}</span>
              </p>
            </div>

            <div className="w-full">
              <TrackingMap 
                transaksiId={selectedTrackingTransaksi._id}
                token={token}
                initialMitraPos={{ 
                  lat: user?.areaCoverage?.pusat?.lat || -6.200000, 
                  lng: user?.areaCoverage?.pusat?.lng || 106.816666 
                }}
                userPos={{ 
                  lat: selectedTrackingTransaksi.lokasiPenjemputan?.lat, 
                  lng: selectedTrackingTransaksi.lokasiPenjemputan?.lng 
                }}
              />
            </div>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Selesai */}
      {selectedKonfirmasi && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedKonfirmasi(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
            >
              <X size={20} />
            </button>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">Konfirmasi Timbangan</h3>
              <p className="text-sm text-gray-500 mt-1">
                Masukkan berat aktual setelah ditimbang di lokasi pelanggan.
              </p>
            </div>

            <div className="flex flex-col gap-3 my-2">
              {selectedKonfirmasi.items.map(item => (
                <div key={item._id} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 capitalize">{item.jenisSampah}</p>
                      <p className="text-xs text-gray-500">Estimasi User: {item.beratEstimasi} kg @ Rp{item.hargaPerKg.toLocaleString('id-ID')}/kg</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        className="w-20 p-2 border border-gray-300 rounded-lg text-right font-bold text-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green"
                        value={beratAktualData[item._id] || ''}
                        onChange={(e) => setBeratAktualData({...beratAktualData, [item._id]: e.target.value})}
                      />
                      <span className="text-sm font-medium text-gray-600">kg</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-1">
                    <span className="text-xs font-medium text-gray-500">Subtotal:</span>
                    <span className="text-sm font-bold text-gray-800">
                      Rp{((Number(beratAktualData[item._id]) || 0) * item.hargaPerKg).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-brand-light/30 border border-brand-green/20 p-4 rounded-xl flex justify-between items-center mt-2 mb-2">
              <span className="font-bold text-gray-700">Total Bayar Tunai</span>
              <span className="text-xl font-black text-brand-green">
                Rp{selectedKonfirmasi.items.reduce((sum, item) => sum + ((Number(beratAktualData[item._id]) || 0) * item.hargaPerKg), 0).toLocaleString('id-ID')}
              </span>
            </div>

            <button 
              onClick={handleSubmitKonfirmasi}
              disabled={konfirmasiLoading}
              className="w-full bg-brand-green hover:bg-brand-dark text-white py-3 rounded-xl font-bold transition-colors mt-2 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {konfirmasiLoading ? 'Menyimpan...' : <><CheckCircle2 size={18} /> Selesaikan Transaksi</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardMitra;
