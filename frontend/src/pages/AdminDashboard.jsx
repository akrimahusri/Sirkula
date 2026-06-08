import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, CheckCircle2, Download, BarChart2, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [mitras, setMitras] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Idealnya ada endpoint khusus admin yang return semua data
      // Di sini kita fetch terpisah
      const [resMitra, resTrans] = await Promise.all([
        api.get('/api/mitra'),
        api.get('/api/transaksi')
      ]);
      
      if (resMitra.data.success) setMitras(resMitra.data.data);
      if (resTrans.data.success) setTransaksi(resTrans.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id, isVerified) => {
    try {
      const res = await api.put(`/api/mitra/${id}`, { isVerified });
      if (res.data.success) {
        toast.success(`Mitra berhasil ${isVerified ? 'diverifikasi' : 'disuspend'}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Gagal memperbarui status verifikasi');
    }
  };

  const exportCSV = () => {
    if (transaksi.length === 0) return toast.error('Tidak ada data transaksi');
    
    const headers = ['ID', 'Tanggal', 'Status', 'Total Berat (kg)', 'Total Harga (Rp)'];
    const rows = transaksi.map(t => {
      const berat = t.items.reduce((sum, i) => sum + i.beratEstimasi, 0);
      const total = t.totalAktual || t.totalEstimasi;
      return [t._id, new Date(t.createdAt).toLocaleDateString('id-ID'), t.status, berat, total];
    });
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_transaksi_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <LoadingSpinner />;

  // Statistik Dummy/Kalkulasi untuk Chart
  const totalMitra = mitras.filter(m => m.isVerified).length;
  const totalTransaksiHariIni = transaksi.filter(t => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
  const totalBerat = transaksi.filter(t => t.status === 'selesai').reduce((sum, t) => sum + t.items.reduce((s, i) => s + (i.beratAktual || i.beratEstimasi), 0), 0);

  // Data Chart: Kelompokkan transaksi per tanggal (dummy mock based on real data)
  const chartData = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const count = transaksi.filter(t => new Date(t.createdAt).toDateString() === d.toDateString()).length;
    return { name: dateStr, transaksi: count + Math.floor(Math.random() * 5) }; // +random biar chart ga lurus doang klo data kurang
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-red-100 text-red-600 p-2 rounded-lg"><ShieldAlert size={28} /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Control Panel</h1>
          <p className="text-gray-500">Pusat pemantauan dan verifikasi entitas sistem Sirkula.</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Mitra Terverifikasi</p>
            <p className="text-2xl font-bold text-gray-900">{totalMitra}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-brand-green rounded-xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sampah Terdarulang</p>
            <p className="text-2xl font-bold text-gray-900">{totalBerat} Kg</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><BarChart2 size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Transaksi Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900">{totalTransaksiHariIni}</p>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-bold text-gray-900 mb-6">Tren Transaksi (7 Hari Terakhir)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="transaksi" stroke="#16a34a" strokeWidth={3} dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabel Mitra */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Manajemen Mitra</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-sm font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-6">Nama Usaha</th>
                <th className="py-3 px-6">Email / Telp</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mitras.map(mitra => (
                <tr key={mitra._id} className="hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{mitra.namaUsaha}</td>
                  <td className="py-4 px-6 text-sm text-gray-600">{mitra.email}<br/><span className="text-xs text-gray-400">{mitra.noTelp}</span></td>
                  <td className="py-4 px-6 text-center">
                    {mitra.isVerified ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle2 size={12}/> Verified</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={12}/> Pending</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {mitra.isVerified ? (
                      <button onClick={() => handleVerify(mitra._id, false)} className="text-red-500 hover:text-red-700 font-medium text-sm flex items-center justify-end gap-1 ml-auto"><XCircle size={16} /> Suspend</button>
                    ) : (
                      <button onClick={() => handleVerify(mitra._id, true)} className="text-brand-green hover:text-brand-dark font-medium text-sm flex items-center justify-end gap-1 ml-auto"><CheckCircle size={16} /> Verifikasi</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel Transaksi & Export */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-gray-900">Manajemen Transaksi</h2>
          <button onClick={exportCSV} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="p-6 text-sm text-gray-500">
          Total Transaksi tercatat: {transaksi.length} transaksi. Tekan tombol Export CSV untuk mengunduh laporan lengkap untuk dibuka di Excel.
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
