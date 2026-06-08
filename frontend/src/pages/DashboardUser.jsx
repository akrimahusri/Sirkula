import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/shared/StatusBadge';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import { Wallet, Package, Gift, ChevronRight, MessageSquare, X } from 'lucide-react';
import TrackingMap from '../components/maps/TrackingMap';

const DashboardUser = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrackingTransaksi, setSelectedTrackingTransaksi] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/transaksi');
        if (res.data.success) {
          setTransaksi(res.data.data);
        }
      } catch (error) {
        console.error('Gagal memuat transaksi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSpinner />;

  // Kalkulasi Ringkasan
  const totalSelesai = transaksi.filter(t => t.status === 'selesai');
  const totalPendapatan = totalSelesai.reduce((sum, t) => sum + (t.totalAktual || t.totalEstimasi), 0);
  const totalBerat = totalSelesai.reduce((sum, t) => {
    return sum + t.items.reduce((s, item) => s + (item.beratAktual || item.beratEstimasi), 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Halo, {user?.nama}!</h1>
          <p className="text-gray-500">Selamat datang kembali di dashboard Anda.</p>
        </div>
        <Link to="/marketplace" className="bg-brand-green text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-dark transition-colors">
          Jual Sampah Lagi
        </Link>
      </div>

      {/* Ringkasan Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-brand-green rounded-xl flex items-center justify-center"><Wallet size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-gray-900">Rp{totalPendapatan.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Package size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sampah Tersetor</p>
            <p className="text-2xl font-bold text-gray-900">{totalBerat.toFixed(1)} Kg</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center"><Gift size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sirkula Poin</p>
            <p className="text-2xl font-bold text-gray-900">{user?.poin || 0} Pts</p>
          </div>
        </div>
      </div>

      {/* Riwayat Transaksi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Penjualan Anda</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {transaksi.length === 0 ? (
            <p className="p-6 text-center text-gray-500">Belum ada transaksi.</p>
          ) : (
            transaksi.map((t) => (
              <div key={t._id} className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-gray-900">{t.mitraId?.namaUsaha}</h3>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {t.items.length} jenis sampah
                  </p>
                  <p className="text-sm font-medium text-brand-green mt-1">Estimasi: Rp{t.totalEstimasi.toLocaleString('id-ID')}</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {t.chatId && (
                    <button onClick={() => navigate(`/chat/${t.chatId}`)} className="flex-1 md:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                      <MessageSquare size={16} /> Chat
                    </button>
                  )}
                  {t.status === 'dijemput' && (
                    <button 
                      onClick={() => setSelectedTrackingTransaksi(t)}
                      className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold tracking-wide hover:bg-blue-200 transition-colors"
                    >
                      Lihat Peta Tracking
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Peta Tracking */}
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
                Peta Pelacakan Penjemputan
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Mitra: <span className="font-semibold text-gray-700">{selectedTrackingTransaksi.mitraId?.namaUsaha}</span>
              </p>
            </div>

            <div className="w-full">
              <TrackingMap 
                transaksiId={selectedTrackingTransaksi._id}
                token={token}
                initialMitraPos={{ 
                  lat: selectedTrackingTransaksi.mitraId?.areaCoverage?.pusat?.lat, 
                  lng: selectedTrackingTransaksi.mitraId?.areaCoverage?.pusat?.lng 
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
    </div>
  );
};

export default DashboardUser;
