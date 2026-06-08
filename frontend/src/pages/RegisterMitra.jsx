import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const RegisterMitra = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    namaUsaha: '', email: '', password: '', noTelp: '', alamatUsaha: '', role: 'mitra'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        namaUsaha: formData.namaUsaha,
        email: formData.email,
        password: formData.password,
        noTelp: formData.noTelp,
        alamatUsaha: formData.alamatUsaha,
        role: formData.role
      };
      
      const res = await api.post('/api/auth/register', payload);
      if (res.data.success) {
        const loginRes = await api.post('/api/auth/login', { email: formData.email, password: formData.password });
        if (loginRes.data.success) {
          login(loginRes.data.data.token, loginRes.data.data.user);
          toast.success('Pendaftaran mitra berhasil! Silakan lengkapi profil Anda nanti.');
          navigate('/dashboard/mitra');
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
          <h2 className="text-3xl font-extrabold text-gray-900">Daftar sebagai Mitra</h2>
          <p className="mt-2 text-sm text-gray-600">Bergabung sebagai pengepul dan kembangkan usaha Anda.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama Usaha / Gudang</label>
            <input type="text" required value={formData.namaUsaha} onChange={e => setFormData({...formData, namaUsaha: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Usaha</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input type="text" required value={formData.noTelp} onChange={e => setFormData({...formData, noTelp: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alamat Usaha</label>
            <textarea required value={formData.alamatUsaha} onChange={e => setFormData({...formData, alamatUsaha: e.target.value})} rows={3} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors mt-4">
            Daftar Mitra
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterMitra;
