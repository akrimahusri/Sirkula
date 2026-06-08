import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Pilih Peran Anda</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">Sirkula menyediakan dua jenis pendaftaran, apakah Anda ingin menjual sampah atau menjadi pengepul?</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Link to="/register/user" className="bg-white border-2 border-brand-green p-8 rounded-2xl hover:bg-brand-light transition-colors group">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-brand-green">Pengguna (User)</h3>
          <p className="text-gray-600 text-sm">Saya ingin menjual sampah dari rumah/usaha saya untuk didaur ulang.</p>
        </Link>
        <Link to="/register/mitra" className="bg-white border-2 border-blue-500 p-8 rounded-2xl hover:bg-blue-50 transition-colors group">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600">Mitra (Pengepul)</h3>
          <p className="text-gray-600 text-sm">Saya adalah pengepul yang ingin mencari dan menjemput sampah.</p>
        </Link>
      </div>
    </div>
  );
};

export default Register;
