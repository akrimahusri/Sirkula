import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const RegisterUser = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nama: '', email: '', password: '', noTelp: '', alamat: '', role: 'user'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Panggil API Register
      const res = await api.post('/api/auth/register', formData);
      if (res.data.success) {
        // Setelah berhasil daftar, langsung login menggunakan data yg sama
        const loginRes = await api.post('/api/auth/login', { email: formData.email, password: formData.password });
        if (loginRes.data.success) {
          login(loginRes.data.data.token, loginRes.data.data.user);
          toast.success('Pendaftaran berhasil! Selamat datang.');
          navigate('/dashboard/user');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || 'Gagal mendaftar';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Daftar sebagai Pengguna</h2>
          <p className="mt-2 text-sm text-gray-600">Jual sampah Anda dan mulai hasilkan uang.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input type="text" required value={formData.noTelp} onChange={e => setFormData({...formData, noTelp: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat</label>
            <textarea required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} rows={3} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <button type="submit" className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-dark transition-colors mt-4">
            Daftar Sekarang
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
