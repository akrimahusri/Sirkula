import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { MessageSquare, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardMitra = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSpinner />;

  const pendingRequests = transaksi.filter(t => t.status === 'pending');
  const activePickups = transaksi.filter(t => t.status === 'diterima' || t.status === 'dijemput');

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
                    <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14}/> {t.lokasiPenjemputan?.address}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Item:</p>
                  {t.items.map((item, idx) => (
                    <p key={idx} className="text-gray-600 capitalize">• {item.jenisSampah} - {item.beratEstimasi} kg</p>
                  ))}
                </div>

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
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={() => initChat(t._id)} className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium text-sm hover:bg-gray-200">
                    <MessageSquare size={16} /> Hubungi
                  </button>
                  {t.status === 'diterima' && (
                    <button onClick={() => handleUpdateStatus(t._id, 'dijemput')} className="flex-1 flex justify-center items-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg font-bold text-sm hover:bg-blue-200">
                      <Truck size={16} /> Mulai Jalan
                    </button>
                  )}
                  {t.status === 'dijemput' && (
                    <button onClick={() => navigate(`/admin`)} className="flex-1 flex justify-center items-center gap-2 bg-brand-light text-brand-green border border-brand-green py-2 rounded-lg font-bold text-sm hover:bg-brand-green hover:text-white transition-all">
                      <CheckCircle2 size={16} /> Konfirmasi Selesai
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMitra;
