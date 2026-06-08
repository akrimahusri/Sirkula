import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Recycle, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'mitra') return '/dashboard/mitra';
    return '/dashboard/user';
  };

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-brand-green text-white p-2 rounded-lg">
                <Recycle size={24} />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">Sirkula</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-gray-500 hover:text-brand-green px-3 py-2 text-sm font-medium transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to={getDashboardLink()}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-green transition-colors"
                >
                  <User size={18} />
                  <span>{user.nama || user.namaUsaha}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Keluar"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-brand-green px-3 py-2 text-sm font-medium">
                  Masuk
                </Link>
                <Link to="/register" className="bg-brand-green hover:bg-brand-dark text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all">
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-green hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 rounded-md text-base font-medium text-brand-green bg-brand-light"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard Saya
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-4 px-3">
                <Link to="/login" className="w-full text-center py-2 text-brand-green font-medium border border-brand-green rounded-lg" onClick={() => setIsOpen(false)}>
                  Masuk
                </Link>
                <Link to="/register" className="w-full text-center py-2 bg-brand-green text-white font-medium rounded-lg" onClick={() => setIsOpen(false)}>
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
