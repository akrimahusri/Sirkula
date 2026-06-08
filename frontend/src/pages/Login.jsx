import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', formData);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        toast.success('Login berhasil!');
        
        // Redirect berdasarkan role
        const role = res.data.data.role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'mitra') navigate('/dashboard/mitra');
        else navigate('/dashboard/user');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Masuk ke Sirkula</h2>
          <p className="mt-2 text-sm text-gray-600">Lanjutkan kontribusi lingkungan Anda.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green" />
          </div>
          <button type="submit" className="w-full bg-brand-green text-white font-bold py-3 rounded-lg hover:bg-brand-dark transition-colors">
            Masuk
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Belum punya akun? <Link to="/register" className="text-brand-green font-bold hover:underline">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
